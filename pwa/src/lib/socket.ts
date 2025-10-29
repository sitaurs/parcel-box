import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

// Auto-detect platform
const isNative = Capacitor.isNativePlatform();

// Backend Main - for API, MQTT, devices, packages
// For native: Use VITE_PROD_WS_URL from .env.production
// For web: Use proxy or localhost
const WS_URL = isNative
  ? (import.meta.env.VITE_PROD_WS_URL || 'http://13.213.57.228:8080')
  : (import.meta.env.VITE_WS_URL || 'http://localhost:8080');

// Backend WhatsApp - dedicated WhatsApp service
const WA_WS_URL = isNative
  ? (import.meta.env.VITE_PROD_WA_WS_URL || 'http://13.213.57.228:3001')
  : (import.meta.env.VITE_WA_WS_URL || 'http://localhost:3001');

export interface PackageNewEvent {
  id: string;
  deviceId: string;
  ts: string;
  photoUrl: string;
  thumbUrl: string;
}

export interface EventData {
  type: string;
  deviceId: string;
  ts: string;
  details: any;
}

export interface DeviceStatusEvent {
  deviceId: string;
  online: boolean;
  lastSeen: string;
}

export interface QRUpdateEvent {
  dataUrl: string;
}

export interface WAStatusEvent {
  connected: boolean;
  me?: string;
  ts?: string;
}

/**
 * Main Socket Client - for backend API, MQTT, devices
 */
class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Main WebSocket connected');
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️  Main WebSocket disconnected');
      this.emit('connection_status', { connected: false });
    });

    // Forward all server events to listeners
    this.socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => callback(...args));
    }
  }

  send(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  controlRelay(deviceId: string, ch: number, on: boolean) {
    this.send('cmd_relay', { deviceId, ch, on });
  }

  controlBuzzer(deviceId: string, ms: number) {
    this.send('cmd_buzz', { deviceId, ms });
  }

  testCamera(deviceId: string) {
    this.send('cmd_test_camera', { deviceId });
  }

  testFlash(deviceId: string, ms: number) {
    this.send('cmd_test_flash', { deviceId, ms });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

/**
 * WhatsApp Socket Client - dedicated for WhatsApp service
 */
class WhatsAppSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    console.log('🔌 Connecting to WhatsApp backend:', WA_WS_URL);
    
    this.socket = io(WA_WS_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WhatsApp WebSocket connected');
      this.emit('wa_connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️  WhatsApp WebSocket disconnected');
      this.emit('wa_connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WhatsApp connection error:', error.message);
    });

    // Listen for WhatsApp specific events
    this.socket.on('qr_update', (data: QRUpdateEvent) => {
      console.log('📱 QR code received');
      this.emit('qr_update', data);
    });

    this.socket.on('wa_status', (data: WAStatusEvent) => {
      console.log('📡 WhatsApp status:', data);
      this.emit('wa_status', data);
    });

    // Forward all events
    this.socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => callback(...args));
    }
  }

  send(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️  WhatsApp socket not connected');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instances
export const socket = new SocketClient();
export const waSocket = new WhatsAppSocketClient();
