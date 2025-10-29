import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { authenticateDevice, optionalAuth } from '../middleware/auth';
import { emitEvent } from '../services/socket';

const router = express.Router();

/**
 * POST /api/v1/events
 * Log an event
 */
router.post(
  '/',
  authenticateDevice,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceId, type, ts, details } = req.body;

      if (!deviceId || !type) {
        res.status(400).json({ error: 'deviceId and type are required' });
        return;
      }

      // Update device last seen
      let device = await db.getDeviceById(deviceId);
      if (device) {
        await db.updateDevice(deviceId, {
          lastSeen: new Date().toISOString(),
          status: type === 'ONLINE' ? 'online' : type === 'OFFLINE' ? 'offline' : device.status,
        });
      } else {
        await db.createDevice({
          id: deviceId,
          name: `Device ${deviceId}`,
          mqttTopic: `smartparcel/${deviceId}`,
          status: type === 'ONLINE' ? 'online' : 'offline',
          lastSeen: new Date().toISOString(),
        });
      }

      // Create event
      const event = await db.createEvent({
        deviceId,
        type,
        ts: ts ? new Date(ts).toISOString() : new Date().toISOString(),
        details: details || {},
        data: details || {},
        packageId: null,
      });

      // Emit Socket.IO event
      emitEvent({
        type: event.type,
        deviceId: event.deviceId || deviceId,
        ts: event.ts,
        details: event.details || event.data,
      });

      res.status(201).json({
        id: event.id,
        deviceId: event.deviceId,
        type: event.type,
        ts: event.ts,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/events
 * List events with filters
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      from,
      to,
      type,
      deviceId,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get all events
    let events = await db.getEvents();

    // Apply filters
    if (deviceId) {
      events = events.filter(evt => evt.deviceId === deviceId);
    }

    if (type) {
      events = events.filter(evt => evt.type === type);
    }

    if (from || to) {
      events = events.filter(evt => {
        const evtDate = new Date(evt.ts);
        if (from && evtDate < new Date(from as string)) return false;
        if (to && evtDate > new Date(to as string)) return false;
        return true;
      });
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // Calculate pagination
    const total = events.length;
    const paginatedEvents = events.slice(skip, skip + limitNum);

    // Add device info
    const eventsWithDevice = await Promise.all(
      paginatedEvents.map(async (evt) => {
        const device = evt.deviceId ? await db.getDeviceById(evt.deviceId) : null;
        return {
          ...evt,
          device: device ? { id: device.id, name: device.name } : null,
        };
      })
    );

    res.json({
      data: eventsWithDevice,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
