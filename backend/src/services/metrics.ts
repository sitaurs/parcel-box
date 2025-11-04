import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';
import { logger } from '../utils/logger';

// Enable default metrics (CPU, memory, etc)
collectDefaultMetrics({ prefix: 'smartparcel_' });

/**
 * Custom Metrics
 */

// Device metrics
export const devicesOnline = new Gauge({
  name: 'smartparcel_devices_online',
  help: 'Number of devices currently online',
});

export const devicesTotal = new Gauge({
  name: 'smartparcel_devices_total',
  help: 'Total number of registered devices',
});

// Package metrics
export const packagesTotal = new Gauge({
  name: 'smartparcel_packages_total',
  help: 'Total number of packages in system',
});

export const packagesReceived = new Counter({
  name: 'smartparcel_packages_received_total',
  help: 'Total number of packages received',
  labelNames: ['device_id'],
});

export const packagesCollected = new Counter({
  name: 'smartparcel_packages_collected_total',
  help: 'Total number of packages collected',
  labelNames: ['device_id'],
});

// MQTT metrics
export const mqttMessagesReceived = new Counter({
  name: 'smartparcel_mqtt_messages_received_total',
  help: 'Total MQTT messages received',
  labelNames: ['topic', 'device_id'],
});

export const mqttMessagesPublished = new Counter({
  name: 'smartparcel_mqtt_messages_published_total',
  help: 'Total MQTT messages published',
  labelNames: ['topic', 'device_id'],
});

export const mqttConnected = new Gauge({
  name: 'smartparcel_mqtt_connected',
  help: 'MQTT connection status (1 = connected, 0 = disconnected)',
});

// WhatsApp metrics
export const whatsappConnected = new Gauge({
  name: 'smartparcel_whatsapp_connected',
  help: 'WhatsApp connection status (1 = connected, 0 = disconnected)',
});

export const whatsappMessagesSent = new Counter({
  name: 'smartparcel_whatsapp_messages_sent_total',
  help: 'Total WhatsApp messages sent',
  labelNames: ['status'], // success, failed
});

export const whatsappNotificationQueueSize = new Gauge({
  name: 'smartparcel_whatsapp_notification_queue_size',
  help: 'Number of pending WhatsApp notifications',
});

// API metrics
export const httpRequestDuration = new Histogram({
  name: 'smartparcel_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const apiErrors = new Counter({
  name: 'smartparcel_api_errors_total',
  help: 'Total API errors',
  labelNames: ['route', 'status_code'],
});

// Database metrics
export const databaseOperations = new Counter({
  name: 'smartparcel_database_operations_total',
  help: 'Total database operations',
  labelNames: ['operation', 'entity'], // get, create, update, delete | users, devices, packages, etc
});

export const databaseOperationDuration = new Histogram({
  name: 'smartparcel_database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'entity'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// WebSocket metrics
export const websocketConnections = new Gauge({
  name: 'smartparcel_websocket_connections',
  help: 'Number of active WebSocket connections',
});

export const websocketMessagesEmitted = new Counter({
  name: 'smartparcel_websocket_messages_emitted_total',
  help: 'Total WebSocket messages emitted',
  labelNames: ['event'],
});

/**
 * System Health Metrics
 */
export const systemHealth = new Gauge({
  name: 'smartparcel_system_health',
  help: 'Overall system health (1 = healthy, 0 = unhealthy)',
});

/**
 * Update system health based on various factors
 */
export async function updateSystemHealth() {
  try {
    // Check critical services
    const mqttMetric = await mqttConnected.get();
    const devicesMetric = await devicesOnline.get();
    
    const mqttHealthy = mqttMetric.values[0]?.value === 1;
    const hasActiveDevices = devicesMetric.values[0]?.value > 0;
    
    // System is healthy if MQTT is connected OR we have active devices
    const isHealthy = mqttHealthy || hasActiveDevices;
    
    systemHealth.set(isHealthy ? 1 : 0);
  } catch (error) {
    logger.error('Error updating system health metric:', error);
    systemHealth.set(0);
  }
}

/**
 * Export Prometheus registry
 */
export { register };

logger.info('📊 Prometheus metrics initialized');
