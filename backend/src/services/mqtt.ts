import mqtt from 'mqtt';
import { db } from './database';
import { emitDeviceUpdate, emitEvent, emitDistanceUpdate, emitControlAck, emitSettingsAck, emitCurrentSettings } from './socket';
import { logger } from '../utils/logger';

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
  private messageQueue: Map<string, Promise<void>> = new Map(); // Queue per device to prevent race conditions

  constructor(config: MQTTConfig) {
    this.config = config;
  }

  /**
   * Connect to MQTT broker
   */
  connect(): void {
    const url = `mqtt://${this.config.host}:${this.config.port}`;
    
    logger.info(`[MQTT] Connecting to ${url}...`);
    
    this.client = mqtt.connect(url, {
      username: this.config.username,
      password: this.config.password,
      clientId: `backend-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      logger.info('✅ [MQTT] Connected!');
      this.isConnected = true;
      
      // Subscribe to all smartparcel topics
      this.client?.subscribe('smartparcel/#', (err) => {
        if (err) {
          logger.error('❌ [MQTT] Subscribe error:', err);
        } else {
          logger.info('📡 [MQTT] Subscribed to: smartparcel/#');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      await this.handleMessageWithQueue(topic, message.toString());
    });

    this.client.on('error', (error) => {
      logger.error('❌ [MQTT] Error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.info('⚠️  [MQTT] Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      logger.info('🔄 [MQTT] Reconnecting...');
    });
  }

  /**
   * Handle message with queue to prevent race conditions
   */
  private async handleMessageWithQueue(topic: string, payload: string): Promise<void> {
    const parts = topic.split('/');
    const deviceId = parts[1]; // Extract deviceId for queueing
    
    // If there's already a message being processed for this device, queue it
    const existingPromise = this.messageQueue.get(deviceId);
    
    const processPromise = (existingPromise || Promise.resolve()).then(async () => {
      try {
        await this.handleMessage(topic, payload);
      } catch (error) {
        logger.error('[MQTT] Message processing error:', error);
      }
    });
    
    this.messageQueue.set(deviceId, processPromise);
    
    // Clean up after processing
    processPromise.finally(() => {
      if (this.messageQueue.get(deviceId) === processPromise) {
        this.messageQueue.delete(deviceId);
      }
    });
    
    await processPromise;
  }

  /**
   * Handle incoming MQTT messages
   */
  private async handleMessage(topic: string, payload: string): Promise<void> {
    try {
      logger.info(`[MQTT] ${topic}: ${payload}`);
      
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
        
        case 'lock':
          // Handle lock-specific messages
          if (subType === 'status') {
            await this.handleLockStatus(deviceId, data);
          } else if (subType === 'alert') {
            await this.handleLockAlert(deviceId, data);
          }
          break;
          
        default:
          logger.info(`[MQTT] Unknown message type: ${messageType}`);
      }
    } catch (error) {
      logger.error('[MQTT] Message handling error:', error);
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

      logger.info(`✅ [MQTT] Device ${deviceId} status updated`);
    } catch (error) {
      logger.error('[MQTT] Status update error:', error);
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

      logger.info(`✅ [MQTT] Event logged: ${event.type}`);
    } catch (error) {
      logger.error('[MQTT] Event handling error:', error);
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
      logger.error('[MQTT] Distance handling error:', error);
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
      logger.info(`✅ [MQTT] Control ACK from ${deviceId}:`, data);
    } catch (error) {
      logger.error('[MQTT] Control ACK handling error:', error);
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
      logger.info(`✅ [MQTT] Settings ACK from ${deviceId}:`, data);
    } catch (error) {
      logger.error('[MQTT] Settings ACK handling error:', error);
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
      logger.info(`✅ [MQTT] Current settings from ${deviceId}:`, data);
    } catch (error) {
      logger.error('[MQTT] Current settings handling error:', error);
    }
  }

  /**
   * Publish control command to device
   */
  publish(topic: string, message: any): void {
    if (!this.isConnected || !this.client) {
      logger.error('[MQTT] Not connected, cannot publish');
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`[MQTT] Publish error to ${topic}:`, err);
      } else {
        logger.info(`📤 [MQTT] Published to ${topic}: ${payload}`);
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
   * Send unlock command to ESP8266 door lock with PIN validation
   */
  unlockDoor(pin: string): void {
    const topic = 'smartparcel/lock/control';
    const payload = {
      action: 'unlock',
      pin: pin,
      timestamp: Date.now()
    };
    this.publish(topic, payload);
  }

  /**
   * Sync PIN to ESP8266 door lock
   */
  syncLockPin(newPin: string): void {
    const topic = 'smartparcel/lock/pin';
    const payload = {
      pin: newPin,
      timestamp: Date.now()
    };
    this.publish(topic, payload);
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
      logger.info('⛔ [MQTT] Disconnected');
    }
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean } {
    return { connected: this.isConnected };
  }

  /**
   * Handle lock status updates from ESP8266
   */
  private async handleLockStatus(deviceId: string, data: any): Promise<void> {
    try {
      const { status, method, attempts, lockout_duration } = data;
      
      // Log event
      await db.createEvent({
        type: 'LOCK_STATUS',
        deviceId,
        packageId: null,
        ts: new Date().toISOString(),
        data: {
          status,
          method,
          attempts,
          lockout_duration,
          timestamp: Date.now(),
        },
      });

      // Emit to connected clients
      emitEvent({
        id: Date.now(),
        type: 'LOCK_STATUS',
        deviceId,
        ts: new Date().toISOString(),
        data: { status, method, attempts },
      });

      logger.info(`🔐 [MQTT] Lock status from ${deviceId}: ${status} via ${method}`);

      // Handle suspicious activity
      if (method === 'keypad_failed' || method === 'keypad_lockout' || method === 'remote_denied') {
        await this.handleLockAlert(deviceId, {
          type: method,
          attempts: attempts || 1,
          lockout_duration,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('[MQTT] Lock status handling error:', error);
    }
  }

  /**
   * Handle lock security alerts and send WhatsApp notifications
   */
  private async handleLockAlert(deviceId: string, data: any): Promise<void> {
    try {
      const { type, attempts, lockout_duration } = data;
      
      // Log security event
      await db.createEvent({
        type: 'SECURITY_ALERT',
        deviceId,
        packageId: null,
        ts: new Date().toISOString(),
        data: {
          alertType: type,
          attempts,
          lockout_duration,
          timestamp: Date.now(),
        },
      });

      // Prepare WhatsApp message based on alert type
      let message = '';
      
      if (type === 'keypad_failed') {
        message = `🚨 *SECURITY ALERT*\n\n` +
                  `❌ Failed unlock attempt on ${deviceId}\n` +
                  `📍 Method: Physical Keypad\n` +
                  `🔢 Attempt #${attempts} of 3\n` +
                  `⏰ Time: ${new Date().toLocaleString('id-ID')}\n\n` +
                  `⚠️ Multiple failed attempts may indicate unauthorized access!`;
      } else if (type === 'keypad_lockout') {
        message = `🚨 *SECURITY ALERT - LOCKOUT*\n\n` +
                  `🔒 Device ${deviceId} is now LOCKED\n` +
                  `❌ Too many failed PIN attempts (${attempts})\n` +
                  `⏱️ Lockout duration: ${lockout_duration}s\n` +
                  `⏰ Time: ${new Date().toLocaleString('id-ID')}\n\n` +
                  `⚠️ Suspicious activity detected! Device locked for security.`;
      } else if (type === 'remote_denied') {
        message = `🚨 *SECURITY ALERT*\n\n` +
                  `❌ Failed remote unlock attempt\n` +
                  `📱 Method: PWA App\n` +
                  `🔑 Reason: Invalid PIN\n` +
                  `⏰ Time: ${new Date().toLocaleString('id-ID')}\n\n` +
                  `⚠️ Someone tried to unlock remotely with wrong PIN!`;
      }

      if (message) {
        // Get admin users to notify
        const users = await db.getUsers();
        const admins = users.filter(u => u.role === 'admin');

        // Send WhatsApp notification to all admins
        for (const admin of admins) {
          if (admin.name) { // name field might contain phone number
            const phone = admin.name.replace(/\D/g, ''); // Extract digits only
            if (phone.length >= 10) {
              try {
                await db.createNotification({
                  type: 'custom',
                  recipient: phone,
                  packageId: null,
                  message,
                  status: 'pending',
                  attempts: 0,
                  error: null,
                  sentAt: null,
                });
                
                logger.info(`📤 [SECURITY] Alert notification queued for ${phone}`);
              } catch (error) {
                logger.error(`❌ [SECURITY] Failed to queue notification for ${phone}:`, error);
              }
            }
          }
        }

        // Also try to get phone from WhatsApp settings
        const fs = require('fs').promises;
        const path = require('path');
        try {
          const settingsData = await fs.readFile(
            path.join(__dirname, '../../data/whatsapp-settings.json'),
            'utf-8'
          );
          const settings = JSON.parse(settingsData);
          
          if (settings.recipients && Array.isArray(settings.recipients)) {
            for (const recipient of settings.recipients) {
              await db.createNotification({
                type: 'custom',
                recipient: recipient.phone,
                packageId: null,
                message,
                status: 'pending',
                attempts: 0,
                error: null,
                sentAt: null,
              });
              
              logger.info(`📤 [SECURITY] Alert notification queued for ${recipient.phone}`);
            }
          }
        } catch (error) {
          // WhatsApp settings file might not exist, ignore
        }
      }

      logger.warn(`⚠️ [SECURITY] Lock alert: ${type} on ${deviceId}`);
    } catch (error) {
      logger.error('[MQTT] Lock alert handling error:', error);
    }
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
