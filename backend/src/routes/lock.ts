import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { optionalAuth } from '../middleware/auth';
import { getMQTTService } from '../services/mqtt';
import { emitEvent } from '../services/socket';

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

    console.log(`🔒 [LOCK] Device ${id} locked via ${method} by user ${userId || 'system'}`);
    
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
    console.error('❌ Lock error:', error);
    res.status(500).json({ error: 'Failed to lock device' });
  }
});

/**
 * POST /api/v1/devices/:id/unlock
 * Unlock the device door (solenoid released)
 */
router.post('/:id/unlock', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, method = 'app', pin } = req.body; // method: 'app', 'keypad', 'auto'

    const device = await db.getDeviceById(id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // If method is keypad, validate PIN (future enhancement)
    if (method === 'keypad' && pin) {
      // TODO: Validate PIN against stored PIN
      // For now, accept any PIN (implement validation later)
      console.log(`🔢 Keypad unlock with PIN: ${pin.replace(/./g, '*')}`);
    }

    // Send MQTT command to unlock
    const mqtt = getMQTTService();
    mqtt.controlRelay(id, 'lock', false); // false = UNLOCK

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

    console.log(`🔓 [UNLOCK] Device ${id} unlocked via ${method} by user ${userId || 'system'}`);
    
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
    console.error('❌ Unlock error:', error);
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
    console.error('❌ Lock status error:', error);
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
    console.error('❌ Lock history error:', error);
    res.status(500).json({ error: 'Failed to get lock history' });
  }
});

export default router;
