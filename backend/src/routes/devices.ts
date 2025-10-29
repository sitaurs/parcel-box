import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { optionalAuth } from '../middleware/auth';
import { getMQTTService } from '../services/mqtt';

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
    console.error('Error fetching devices:', error);
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
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/devices/:id/control
 * Send control command to device
 */
router.post('/:id/control', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const command = req.body;

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Publish to MQTT
    const mqtt = getMQTTService();
    const topic = `smartparcel/${id}/control`;
    
    mqtt.publish(topic, command);
    
    console.log(`Control command sent to ${id}:`, command);
    res.json({ ok: true, command });
  } catch (error) {
    console.error('Error sending control command:', error);
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
    
    console.log(`Settings updated for ${id}:`, settings);
    res.json({ ok: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;