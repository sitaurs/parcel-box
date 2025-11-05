import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { optionalAuth } from '../middleware/auth';
import { getMQTTService } from '../services/mqtt';
import { logger } from '../utils/logger';
import { deviceControlLimiter } from '../middleware/rateLimiter';
import { validate, deviceControlSchema } from '../middleware/validation';

const router = express.Router();

/**
 * GET /api/v1/devices
 * List all devices
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await db.getDevices();

    // Sort by lastSeen descending
    devices.sort((a, b) => {
      if (!a.lastSeen) return 1;
      if (!b.lastSeen) return -1;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });

    res.json({ data: devices });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/devices/:id
 * Get device details
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = await db.getDeviceById(id);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Get packages for this device (last 10)
    const allPackages = await db.getPackages();
    const packages = allPackages
      .filter(pkg => pkg.deviceId === id)
      .sort((a, b) => new Date(b.tsDetected).getTime() - new Date(a.tsDetected).getTime())
      .slice(0, 10);

    // Get events for this device (last 20)
    const allEvents = await db.getEvents();
    const events = allEvents
      .filter(evt => evt.deviceId === id)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 20);

    res.json({
      ...device,
      packages,
      events,
    });
  } catch (error) {
    logger.error('Error fetching device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/devices/:id/unlock
 * Unlock door lock (ESP8266 solenoid)
 */
router.post('/:id/unlock', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, method = 'app', pin } = req.body;

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // For remote unlock, validate PIN
    if (method === 'app' || method === 'remote') {
      if (!pin) {
        res.status(400).json({ error: 'PIN required' });
        return;
      }

      const storedPin = '432432'; // Hardcoded for single box
      if (pin !== storedPin) {
        logger.warn(`🚫 [UNLOCK] Invalid PIN attempt for ${id}`);
        res.status(401).json({ error: 'Invalid PIN' });
        return;
      }

      // Send MQTT unlock command to ESP8266
      const mqtt = getMQTTService();
      mqtt.unlockDoor(pin);
      logger.info(`📤 [MQTT] Unlock command sent to ESP8266`);
    }

    // Log event
    const event = await db.createEvent({
      type: 'UNLOCK',
      deviceId: id,
      packageId: null,
      ts: new Date().toISOString(),
      data: { userId, method, pinUsed: !!pin, timestamp: Date.now() },
    });

    res.json({ ok: true, status: 'unlocked', event });
  } catch (error) {
    logger.error('❌ Unlock error:', error);
    res.status(500).json({ error: 'Unlock failed' });
  }
});

/**
 * POST /api/v1/devices/:id/control
 * Send control command to device
 */
router.post(
  '/:id/control',
  deviceControlLimiter,
  optionalAuth,
  validate(deviceControlSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const command = req.validatedData as { deviceId: string; action: string };

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // SPECIAL CASE: Door unlock via control endpoint
    if ((command as any).action === 'unlock' || req.body.action === 'unlock') {
      const { pin } = req.body;
      
      // Validate PIN
      if (!pin || pin !== '432432') {
        logger.warn(`🚫 [UNLOCK] Invalid PIN for ${id}`);
        res.status(401).json({ error: 'Invalid PIN' });
        return;
      }

      // Send MQTT unlock to ESP8266
      const mqtt = getMQTTService();
      mqtt.unlockDoor(pin);
      logger.info(`📤 [MQTT] Unlock command sent to ESP8266 via control endpoint`);

      // Log event
      const event = await db.createEvent({
        type: 'UNLOCK',
        deviceId: id,
        packageId: null,
        ts: new Date().toISOString(),
        data: { method: 'app', pinUsed: true, timestamp: Date.now() },
      });

      res.json({ ok: true, status: 'unlocked', event });
      return;
    }

    // Normal control command - Publish to MQTT
    const mqtt = getMQTTService();
    const topic = `smartparcel/${id}/control`;
    
    mqtt.publish(topic, command);
    
    logger.info(`Control command sent to ${id}:`, command);
    res.json({ ok: true, command });
  } catch (error) {
    logger.error('Error sending control command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/devices/:id/settings
 * Update device settings
 */
router.post('/:id/settings', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const settings = req.body;

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Publish to MQTT
    const mqtt = getMQTTService();
    const topic = `smartparcel/${id}/settings/set`;
    
    mqtt.publish(topic, settings);
    
    logger.info(`Settings updated for ${id}:`, settings);
    res.json({ ok: true, settings });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;