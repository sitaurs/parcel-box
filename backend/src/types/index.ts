// Type definitions for Smart Parcel Box backend

import { Request } from 'express';

/**
 * JWT Payload Structure
 */
export interface JWTPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  iat: number;
  exp: number;
}

/**
 * MQTT Message Types
 */
export interface MQTTStatusMessage {
  status: 'online' | 'offline';
  lamp?: boolean;
  lock?: 'open' | 'closed';
  uptime?: number;
  rssi?: number;
  ip?: string;
  firmware?: string;
}

export interface MQTTEventMessage {
  type: 'motion' | 'package_detected' | 'lock_status' | 'lamp_status';
  timestamp?: string;
  distance?: number;
  packageId?: string;
  [key: string]: unknown;
}

export interface MQTTDistanceMessage {
  distance: number;
  unit?: string;
  timestamp?: string;
}

export interface MQTTControlAckMessage {
  command: string;
  status: 'success' | 'failed';
  error?: string;
  timestamp?: string;
}

export interface MQTTSettingsAckMessage {
  success: boolean;
  settings?: Record<string, unknown>;
  error?: string;
}

export interface MQTTCurrentSettingsMessage {
  distanceThreshold?: number;
  lockDuration?: number;
  buzzerEnabled?: boolean;
  lampAutoOff?: number;
  [key: string]: unknown;
}

/**
 * WebSocket Event Payloads
 */
export interface SocketDeviceStatusPayload {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  lamp?: boolean;
  lock?: 'open' | 'closed';
  uptime?: number;
  rssi?: number;
}

export interface SocketPackageNewPayload {
  id: string;
  deviceId: string;
  name: string;
  tsDetected: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface SocketControlAckPayload {
  deviceId: string;
  command: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface SocketSettingsUpdatePayload {
  deviceId: string;
  settings: Record<string, unknown>;
}

/**
 * Notification Queue Data Types
 */
export interface PackageNotificationData {
  packageId: string;
  packageName: string;
  deviceId: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  tsDetected: string;
}

export interface StatusUpdateNotificationData {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  message?: string;
}

export type NotificationData = PackageNotificationData | StatusUpdateNotificationData;

/**
 * Push Notification Data
 */
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Extended Express Request with User
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: 'admin' | 'user';
  };
}

/**
 * Error with code property (for MQTT, etc)
 */
export interface ErrorWithCode extends Error {
  code?: string;
}

/**
 * Express Error Handler Types
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  stack?: string;
}

/**
 * Device Update Partial Type
 */
export interface DeviceUpdateData {
  status?: 'online' | 'offline';
  lastSeen?: string;
  lamp?: boolean;
  lock?: 'open' | 'closed';
  uptime?: number;
  rssi?: number;
  firmware?: string;
  ip?: string;
}

/**
 * Generic API Response
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
