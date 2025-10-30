import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';
import { getMQTTService } from './mqtt';

// Conditional logging based on environment
const isDev = config.nodeEnv === 'development';
const log = isDev ? console.log.bind(console) : () => {};

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
    path: '/ws/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // WhatsApp handlers removed - now handled by backend-whatsapp service

    // Handle relay control command
    socket.on('cmd_relay', (data: { deviceId: string; ch: number; on: boolean }) => {
      console.log('Relay command:', data);
      try {
        const mqttService = getMQTTService();
        // ch: 1 = Lock, 2 = Lamp
        if (data.ch === 1) {
          mqttService.controlRelay(data.deviceId, 'lock', data.on ? 'open' : 'closed');
        } else if (data.ch === 2) {
          mqttService.controlRelay(data.deviceId, 'lamp', data.on);
        }
      } catch (error) {
        console.error('MQTT control error:', error);
      }
    });

    // Handle buzzer control command
    socket.on('cmd_buzz', (data: { deviceId: string; ms: number }) => {
      console.log('Buzzer command:', data);
      try {
        const mqttService = getMQTTService();
        mqttService.triggerBuzzer(data.deviceId, data.ms);
      } catch (error) {
        console.error('MQTT buzzer error:', error);
      }
    });

    // Handle manual capture command
    socket.on('cmd_capture', (data: { deviceId: string }) => {
      console.log('Manual capture:', data);
      try {
        const mqttService = getMQTTService();
        mqttService.capturePhoto(data.deviceId);
      } catch (error) {
        console.error('MQTT capture error:', error);
      }
    });

    // Handle test camera command
    socket.on('cmd_test_camera', (data: { deviceId: string }) => {
      console.log('Test camera:', data);
      try {
        const mqttService = getMQTTService();
        mqttService.capturePhoto(data.deviceId);
        socket.emit('test_result', { test: 'camera', status: 'requested' });
      } catch (error) {
        console.error('MQTT test camera error:', error);
        socket.emit('test_result', { test: 'camera', status: 'error', error: String(error) });
      }
    });

    // Handle test flash command
    socket.on('cmd_test_flash', (data: { deviceId: string; ms: number }) => {
      console.log('Test flash:', data);
      try {
        const mqttService = getMQTTService();
        const topic = `smartparcel/${data.deviceId}/cmd/flash`;
        mqttService.publish(topic, { ms: data.ms });
        socket.emit('test_result', { test: 'flash', status: 'sent' });
      } catch (error) {
        console.error('MQTT test flash error:', error);
        socket.emit('test_result', { test: 'flash', status: 'error', error: String(error) });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit package_new event
 */
export function emitPackageNew(data: {
  id: string;
  deviceId: string;
  ts: string;
  photoUrl: string;
  thumbUrl: string;
}): void {
  if (io) {
    io.emit('package_new', data);
    log('Emitted package_new:', data.id);
  }
}

/**
 * Emit event
 */
export function emitEvent(data: {
  id?: number;
  type: string;
  deviceId: string;
  ts: string;
  data?: any;
  details?: any;
}): void {
  if (io) {
    io.emit('event', data);
    log('Emitted event:', data.type);
  }
}

/**
 * Emit device status
 */
export function emitDeviceStatus(data: {
  deviceId: string;
  online: boolean;
  lastSeen: string;
}): void {
  if (io) {
    io.emit('device_status', data);
  }
}

/**
 * Emit QR update (for Baileys)
 */
export function emitQRUpdate(dataUrl: string): void {
  if (io) {
    io.emit('qr_update', { dataUrl });
    console.log('Emitted QR update');
  }
}

/**
 * Emit WhatsApp status
 */
export function emitWAStatus(data: { 
  connected: boolean; 
  me?: string; 
  ts?: string;
  error?: string;
  message?: string;
}): void {
  if (io) {
    io.emit('wa_status', data);
    console.log('Emitted WA status:', data.connected, data.message || '');
  }
}

/**
 * Emit device update (MQTT)
 */
export function emitDeviceUpdate(data: {
  id: string;
  status: string;
  lamp?: boolean;
  lock?: string;
  uptime?: number;
  rssi?: number;
}): void {
  if (io) {
    io.emit('device_update', data);
  }
}

/**
 * Emit distance update (MQTT)
 */
export function emitDistanceUpdate(data: {
  deviceId: string;
  distance: number;
  ts: string;
}): void {
  if (io) {
    io.emit('distance_update', data);
  }
}

/**
 * Emit control acknowledgment
 */
export function emitControlAck(data: {
  deviceId: string;
  ok: boolean;
  msg?: string;
  cmd?: any;
}): void {
  if (io) {
    io.emit('control_ack', data);
    console.log('Emitted control_ack:', data);
  }
}

/**
 * Emit settings acknowledgment
 */
export function emitSettingsAck(data: {
  deviceId: string;
  ok: boolean;
  msg?: string;
  settings?: any;
}): void {
  if (io) {
    io.emit('settings_ack', data);
    console.log('Emitted settings_ack:', data);
  }
}

/**
 * Emit current settings
 */
export function emitCurrentSettings(data: {
  deviceId: string;
  ultra?: { min: number; max: number };
  lock?: { ms: number };
  buzzer?: { ms: number };
}): void {
  if (io) {
    io.emit('current_settings', data);
    console.log('Emitted current_settings:', data);
  }
}
