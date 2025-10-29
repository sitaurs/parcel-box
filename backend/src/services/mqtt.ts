import mqtt from 'mqtt';
import { db } from './database';
import { emitDeviceUpdate, emitEvent, emitDistanceUpdate, emitControlAck, emitSettingsAck, emitCurrentSettings } from './socket';

interface MQTTConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private config: MQTTConfig;
  private isConnected: boolean = false;

  constructor(config: MQTTConfig) {
    this.config = config;
  }

  /**
   * Connect to MQTT broker
   */
  connect(): void {
    const url = `mqtt://${this.config.host}:${this.config.port}`;
    
    console.log(`[MQTT] Connecting to ${url}...`);
    
    this.client = mqtt.connect(url, {
      username: this.config.username,
      password: this.config.password,
      clientId: `backend-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      console.log('✅ [MQTT] Connected!');
      this.isConnected = true;
      
      // Subscribe to all smartparcel topics
      this.client?.subscribe('smartparcel/#', (err) => {
        if (err) {
          console.error('❌ [MQTT] Subscribe error:', err);
        } else {
          console.log('📡 [MQTT] Subscribed to: smartparcel/#');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      await this.handleMessage(topic, message.toString());
    });

    this.client.on('error', (error) => {
      console.error('❌ [MQTT] Error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️  [MQTT] Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 [MQTT] Reconnecting...');
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMessage(topic: string, payload: string): Promise<void> {
    try {
      console.log(`[MQTT] ${topic}: ${payload}`);
      
      const parts = topic.split('/');
      const deviceId = parts[1]; // smartparcel/box-01/...
      const messageType = parts[2]; // status/event/sensor/control
      const subType = parts[3]; // distance (for sensor/distance)
      
      // Try parse JSON, fallback to plain text
      let data: any;
      try {
        data = JSON.parse(payload);
      } catch {
        // Plain text payload (e.g., "online", "offline")
        data = { status: payload };
      }

      switch (messageType) {
        case 'status':
          await this.handleStatusUpdate(deviceId, data);
          break;
          
        case 'event':
          await this.handleEvent(deviceId, data);
          break;
          
        case 'sensor':
          if (subType === 'distance') {
            await this.handleDistance(deviceId, data);
          }
          break;
          
        case 'distance':
          await this.handleDistance(deviceId, data);
          break;
          
        case 'control':
          if (subType === 'ack') {
            await this.handleControlAck(deviceId, data);
          }
          break;
          
        case 'settings':
          if (subType === 'ack') {
            await this.handleSettingsAck(deviceId, data);
          } else if (subType === 'cur') {
            await this.handleCurrentSettings(deviceId, data);
          }
          break;
          
        default:
          console.log(`[MQTT] Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('[MQTT] Message handling error:', error);
    }
  }

  /**
   * Handle device status update
   */
  private async handleStatusUpdate(deviceId: string, data: any): Promise<void> {
    try {
      // Update device in database
      let device = await db.getDeviceById(deviceId);
      if (device) {
        await db.updateDevice(deviceId, {
          status: data.status || 'online',
          lastSeen: new Date().toISOString(),
        });
      } else {
        await db.createDevice({
          id: deviceId,
          name: `Device ${deviceId}`,
          mqttTopic: `smartparcel/${deviceId}`,
          status: data.status || 'online',
          lastSeen: new Date().toISOString(),
        });
      }

      // Emit to connected clients
      emitDeviceUpdate({
        id: deviceId,
        status: data.status || 'online',
        lamp: data.lamp || false,
        lock: data.lock || 'closed',
        uptime: data.uptime,
        rssi: data.rssi,
      });

      console.log(`✅ [MQTT] Device ${deviceId} status updated`);
    } catch (error) {
      console.error('[MQTT] Status update error:', error);
    }
  }

  /**
   * Handle detection event
   */
  private async handleEvent(deviceId: string, data: any): Promise<void> {
    try {
      const event = await db.createEvent({
        deviceId,
        type: data.type || data.event || 'unknown',
        data: data,
        ts: new Date().toISOString(),
        packageId: null,
      });

      // Emit to connected clients
      emitEvent({
        deviceId: event.deviceId || deviceId,
        type: event.type,
        details: data,
        ts: event.ts,
      });

      console.log(`✅ [MQTT] Event logged: ${event.type}`);
    } catch (error) {
      console.error('[MQTT] Event handling error:', error);
    }
  }

  /**
   * Handle distance reading
   */
  private async handleDistance(deviceId: string, data: any): Promise<void> {
    try {
      // Support both "cm" and "distance" field names
      const distance = data.distance || data.cm;
      
      // Emit real-time distance to connected clients
      emitDistanceUpdate({
        deviceId,
        distance,
        ts: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[MQTT] Distance handling error:', error);
    }
  }

  /**
   * Handle control acknowledgment
   */
  private async handleControlAck(deviceId: string, data: any): Promise<void> {
    try {
      emitControlAck({
        deviceId,
        ok: data.ok || false,
        msg: data.msg,
        cmd: data.cmd,
      });
      console.log(`✅ [MQTT] Control ACK from ${deviceId}:`, data);
    } catch (error) {
      console.error('[MQTT] Control ACK handling error:', error);
    }
  }

  /**
   * Handle settings acknowledgment
   */
  private async handleSettingsAck(deviceId: string, data: any): Promise<void> {
    try {
      emitSettingsAck({
        deviceId,
        ok: data.ok || false,
        msg: data.msg,
        settings: data.settings,
      });
      console.log(`✅ [MQTT] Settings ACK from ${deviceId}:`, data);
    } catch (error) {
      console.error('[MQTT] Settings ACK handling error:', error);
    }
  }

  /**
   * Handle current settings
   */
  private async handleCurrentSettings(deviceId: string, data: any): Promise<void> {
    try {
      emitCurrentSettings({
        deviceId,
        ultra: data.ultra,
        lock: data.lock,
        buzzer: data.buzzer,
      });
      console.log(`✅ [MQTT] Current settings from ${deviceId}:`, data);
    } catch (error) {
      console.error('[MQTT] Current settings handling error:', error);
    }
  }

  /**
   * Publish control command to device
   */
  publish(topic: string, message: any): void {
    if (!this.isConnected || !this.client) {
      console.error('[MQTT] Not connected, cannot publish');
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Publish error to ${topic}:`, err);
      } else {
        console.log(`📤 [MQTT] Published to ${topic}: ${payload}`);
      }
    });
  }

  /**
   * Control device relay
   */
  controlRelay(deviceId: string, relay: 'lamp' | 'lock', state: boolean | 'open' | 'closed'): void {
    if (relay === 'lamp') {
      // For lamp, use the lamp control topic
      const topic = `smartparcel/${deviceId}/lamp/set`;
      const payload = state ? 'ON' : 'OFF';
      this.publish(topic, payload);
    } else if (relay === 'lock') {
      // For lock/solenoid, use the lock control topic
      const topic = `smartparcel/${deviceId}/lock/set`;
      // Convert state to firmware expected values
      let payload: string;
      if (typeof state === 'boolean') {
        payload = state ? 'LOCK' : 'UNLOCK'; // true = LOCK (hold), false = UNLOCK (release/drop)
      } else {
        payload = state === 'open' ? 'UNLOCK' : 'LOCK';
      }
      this.publish(topic, payload);
    }
  }

  /**
   * Trigger manual capture
   */
  capturePhoto(deviceId: string): void {
    const topic = `smartparcel/${deviceId}/cmd/capture`;
    this.publish(topic, 'CAPTURE');
  }

  /**
   * Trigger buzzer
   */
  triggerBuzzer(deviceId: string, duration: number = 200): void {
    const topic = `smartparcel/${deviceId}/buzzer/trigger`;
    this.publish(topic, String(duration));
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
      console.log('⛔ [MQTT] Disconnected');
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean } {
    return { connected: this.isConnected };
  }
}

// Singleton instance
let mqttService: MQTTService | null = null;

/**
 * Initialize MQTT service
 */
export function initMQTT(config: MQTTConfig): MQTTService {
  if (!mqttService) {
    mqttService = new MQTTService(config);
    mqttService.connect();
  }
  return mqttService;
}

/**
 * Get MQTT service instance
 */
export function getMQTTService(): MQTTService {
  if (!mqttService) {
    throw new Error('MQTT service not initialized');
  }
  return mqttService;
}

export default MQTTService;
