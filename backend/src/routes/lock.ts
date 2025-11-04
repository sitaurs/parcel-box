import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { optionalAuth } from '../middleware/auth';
import { getMQTTService } from '../services/mqtt';
import { emitEvent } from '../services/socket';
import { logger } from '../utils/logger';
import { validate, updateLockPinSchema } from '../middleware/validation';

const router = express.Router();

/**
 * POST /api/v1/devices/:id/lock
 * Lock the device door (solenoid engaged)
 */
router.post('/:id/lock', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, method = 'app' } = req.body; // method: 'app', 'keypad', 'auto'

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Send MQTT command to lock
    const mqtt = getMQTTService();
    mqtt.controlRelay(id, 'lock', true); // true = LOCK

    // Log lock event
    const event = await db.createEvent({
      type: 'LOCK',
      deviceId: id,
      packageId: null,
      ts: new Date().toISOString(),
      data: {
        userId,
        method,
        timestamp: Date.now(),
      },
    });

    // Emit real-time event
    emitEvent({
      id: parseInt(event.id) || 0,
      type: 'LOCK',
      deviceId: id,
      ts: event.ts,
      data: {
        userId,
        method,
      },
    });

    logger.info(`🔒 [LOCK] Device ${id} locked via ${method} by user ${userId || 'system'}`);
    
    res.json({
      ok: true,
      status: 'locked',
      event: {
        id: event.id,
        type: 'LOCK',
        ts: event.ts,
        method,
      },
    });
  } catch (error) {
    logger.error('❌ Lock error:', error);
    res.status(500).json({ error: 'Failed to lock device' });
  }
});

/**
 * POST /api/v1/devices/:id/unlock
 * Unlock the device door (solenoid released)
 * If PIN provided from PWA, sends unlock command to ESP8266 with PIN validation
 */
router.post('/:id/unlock', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, method = 'app', pin } = req.body; // method: 'app', 'keypad', 'remote'

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // For remote unlock from PWA, validate PIN is provided
    if (method === 'app' || method === 'remote') {
      if (!pin) {
        res.status(400).json({ error: 'PIN is required for remote unlock' });
        return;
      }

      // Get stored PIN from device data
      const devices = await db.getDevices();
      const deviceData = devices.find(d => d.id === id) as any;
      const storedPin = deviceData?.lockPin || '432432';

      // Validate PIN
      if (pin !== storedPin) {
        logger.warn(`🚫 [UNLOCK] Failed unlock attempt for device ${id} - Invalid PIN`);
        
        // Log failed unlock event
        await db.createEvent({
          type: 'UNLOCK_DENIED',
          deviceId: id,
          packageId: null,
          ts: new Date().toISOString(),
          data: {
            userId,
            method,
            reason: 'invalid_pin',
            timestamp: Date.now(),
          },
        });

        res.status(401).json({ error: 'Invalid PIN' });
        return;
      }

      // PIN valid, send unlock command to ESP8266 via MQTT
      const mqtt = getMQTTService();
      const mqttClient = (mqtt as any).client;
      
      if (mqttClient && mqttClient.connected) {
        const topic = 'smartparcel/lock/control';
        const payload = JSON.stringify({ 
          action: 'unlock', 
          pin, 
          timestamp: Date.now() 
        });
        mqttClient.publish(topic, payload);
        logger.info(`📤 [MQTT] Published unlock command to ${topic} with PIN validation`);
      } else {
        logger.warn(`⚠️ [MQTT] MQTT client not connected, unlock command not sent`);
      }
    } else {
      // Keypad unlock - PIN validation is delegated to device firmware
      // Backend logs the unlock event for audit trail
      if (method === 'keypad' && pin) {
        logger.info(`🔢 Keypad unlock with PIN: ${pin.replace(/./g, '*')}`);
      }

      // Send legacy MQTT command to unlock
      const mqtt = getMQTTService();
      mqtt.controlRelay(id, 'lock', false); // false = UNLOCK
    }

    // Log unlock event
    const event = await db.createEvent({
      type: 'UNLOCK',
      deviceId: id,
      packageId: null,
      ts: new Date().toISOString(),
      data: {
        userId,
        method,
        timestamp: Date.now(),
        pinUsed: !!pin,
      },
    });

    // Emit real-time event
    emitEvent({
      id: parseInt(event.id) || 0,
      type: 'UNLOCK',
      deviceId: id,
      ts: event.ts,
      data: {
        userId,
        method,
        pinUsed: !!pin,
      },
    });

    logger.info(`🔓 [UNLOCK] Device ${id} unlocked via ${method} by user ${userId || 'system'}`);
    
    res.json({
      ok: true,
      status: 'unlocked',
      event: {
        id: event.id,
        type: 'UNLOCK',
        ts: event.ts,
        method,
      },
    });
  } catch (error) {
    logger.error('❌ Unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock device' });
  }
});

/**
 * GET /api/v1/devices/:id/lock/status
 * Get current lock status and recent lock/unlock history
 */
router.get('/:id/lock/status', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Get recent lock/unlock events (last 20)
    const allEvents = await db.getEvents();
    const lockEvents = allEvents
      .filter(evt => evt.deviceId === id && (evt.type === 'LOCK' || evt.type === 'UNLOCK'))
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 20);

    // Determine current status from most recent event
    const lastEvent = lockEvents[0];
    const currentStatus = lastEvent?.type === 'LOCK' ? 'locked' : 'unlocked';

    res.json({
      deviceId: id,
      currentStatus,
      lastUpdate: lastEvent?.ts || null,
      history: lockEvents.map(evt => ({
        id: evt.id,
        type: evt.type,
        ts: evt.ts,
        method: evt.data?.method || 'unknown',
        userId: evt.data?.userId || null,
      })),
    });
  } catch (error) {
    logger.error('❌ Lock status error:', error);
    res.status(500).json({ error: 'Failed to get lock status' });
  }
});

/**
 * GET /api/v1/devices/:id/lock/history
 * Get detailed lock/unlock history with filters
 */
router.get('/:id/lock/history', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0, method } = req.query;

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Get all lock/unlock events
    const allEvents = await db.getEvents();
    let lockEvents = allEvents
      .filter(evt => evt.deviceId === id && (evt.type === 'LOCK' || evt.type === 'UNLOCK'))
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // Filter by method if specified
    if (method && typeof method === 'string') {
      lockEvents = lockEvents.filter(evt => evt.data?.method === method);
    }

    // Pagination
    const total = lockEvents.length;
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);
    const paginatedEvents = lockEvents.slice(offsetNum, offsetNum + limitNum);

    res.json({
      deviceId: id,
      total,
      limit: limitNum,
      offset: offsetNum,
      history: paginatedEvents.map(evt => ({
        id: evt.id,
        type: evt.type,
        ts: evt.ts,
        method: evt.data?.method || 'unknown',
        userId: evt.data?.userId || null,
        pinUsed: evt.data?.pinUsed || false,
        details: evt.details || null,
      })),
    });
  } catch (error) {
    logger.error('❌ Lock history error:', error);
    res.status(500).json({ error: 'Failed to get lock history' });
  }
});

/**
 * GET /api/v1/devices/:id/lock/pin
 * Get current lock PIN for device
 */
router.get('/:id/lock/pin', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Get PIN from device data (stored in database)
    // For security, only return masked PIN (first 2 digits visible)
    const devices = await db.getDevices();
    const deviceData = devices.find(d => d.id === id) as any;
    const pin = deviceData?.lockPin || '432432'; // Default PIN

    res.json({
      deviceId: id,
      pin: pin.substring(0, 2) + '*'.repeat(pin.length - 2), // Masked
      pinLength: pin.length,
      lastUpdated: deviceData?.pinUpdatedAt || null,
    });
  } catch (error) {
    logger.error('❌ Get lock PIN error:', error);
    res.status(500).json({ error: 'Failed to get lock PIN' });
  }
});

/**
 * PUT /api/v1/devices/:id/lock/pin
 * Update lock PIN for device
 * Syncs to ESP8266 via MQTT
 */
router.put('/:id/lock/pin', optionalAuth, validate(updateLockPinSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { pin, userId } = req.validatedData as { pin: string; userId?: string };

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Update PIN in device data
    const devices = await db.getDevices();
    const deviceIndex = devices.findIndex(d => d.id === id);
    
    if (deviceIndex !== -1) {
      (devices[deviceIndex] as any).lockPin = pin;
      (devices[deviceIndex] as any).pinUpdatedAt = new Date().toISOString();
      (devices[deviceIndex] as any).pinUpdatedBy = userId || 'system';
      
      // Save to database (note: this is a workaround, ideally use db.updateDevice)
      const fs = require('fs').promises;
      const path = require('path');
      await fs.writeFile(
        path.join(__dirname, '../../data/devices.json'),
        JSON.stringify({ devices }, null, 2)
      );
    }

    // Send PIN update to ESP8266 via MQTT
    const mqtt = getMQTTService();
    const mqttClient = (mqtt as any).client;
    
    if (mqttClient && mqttClient.connected) {
      const topic = 'smartparcel/lock/pin';
      const payload = JSON.stringify({ pin, timestamp: Date.now() });
      mqttClient.publish(topic, payload);
      logger.info(`📤 [MQTT] Published PIN update to ${topic}`);
    }

    // Log PIN change event
    const event = await db.createEvent({
      type: 'PIN_CHANGED',
      deviceId: id,
      packageId: null,
      ts: new Date().toISOString(),
      data: {
        userId: userId || 'system',
        pinLength: pin.length,
        timestamp: Date.now(),
      },
    });

    // Emit real-time event
    emitEvent({
      id: parseInt(event.id) || 0,
      type: 'PIN_CHANGED',
      deviceId: id,
      ts: event.ts,
      data: {
        userId: userId || 'system',
        pinLength: pin.length,
      },
    });

    logger.info(`🔐 [PIN] Device ${id} PIN updated by ${userId || 'system'}, length: ${pin.length}`);
    
    res.json({
      ok: true,
      deviceId: id,
      pin: pin.substring(0, 2) + '*'.repeat(pin.length - 2), // Masked
      updatedAt: new Date().toISOString(),
      synced: mqttClient && mqttClient.connected,
    });
  } catch (error) {
    logger.error('❌ Update lock PIN error:', error);
    res.status(500).json({ error: 'Failed to update lock PIN' });
  }
});

export default router;
