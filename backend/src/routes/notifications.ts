/**
 * Notification History API Routes
 * View notification logs, retry failed notifications
 */

import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { optionalAuth } from '../middleware/auth';
import { notificationQueue } from '../services/notificationQueue';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/notifications
 * Get all notifications with pagination and filters
 * Query params:
 *   - limit: number (default 50)
 *   - offset: number (default 0)
 *   - status: 'pending' | 'sent' | 'failed' | 'cancelled'
 *   - recipient: string (phone number)
 *   - type: 'package' | 'status_update' | 'custom'
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;
    const recipient = req.query.recipient as string | undefined;
    const type = req.query.type as string | undefined;

    let notifications = await db.getNotifications();

    // Apply filters
    if (status) {
      notifications = notifications.filter(n => n.status === status);
    }
    if (recipient) {
      notifications = notifications.filter(n => n.recipient === recipient);
    }
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    // Sort by newest first
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const total = notifications.length;
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/v1/notifications/stats
 * Get notification statistics
 */
router.get('/stats', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await db.getNotifications();

    const stats = {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      cancelled: notifications.filter(n => n.status === 'cancelled').length,
      byType: {
        package: notifications.filter(n => n.type === 'package').length,
        status_update: notifications.filter(n => n.type === 'status_update').length,
        custom: notifications.filter(n => n.type === 'custom').length,
      },
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/v1/notifications/:id
 * Get single notification by ID
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await db.getNotificationById(id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json(notification);
  } catch (error) {
    logger.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

/**
 * POST /api/v1/notifications/:id/retry
 * Retry a failed notification
 */
router.post('/:id/retry', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await db.getNotificationById(id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.status !== 'failed') {
      res.status(400).json({ error: 'Only failed notifications can be retried' });
      return;
    }

    // Re-queue the notification
    const queueId = await notificationQueue.enqueue(
      notification.type === 'custom' ? 'status_update' : notification.type,
      notification.recipient,
      {
        packageId: notification.packageId,
        message: notification.message,
      }
    );

    // Update old notification as cancelled (since we created a new one)
    await db.updateNotification(id, {
      status: 'cancelled',
      error: 'Retried - new notification created',
    });

    res.json({
      success: true,
      message: 'Notification re-queued',
      queueId,
    });
  } catch (error) {
    logger.error('Error retrying notification:', error);
    res.status(500).json({ error: 'Failed to retry notification' });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete/cancel a notification
 */
router.delete('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await db.getNotificationById(id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.status === 'pending') {
      // Cancel pending notification
      await db.updateNotification(id, {
        status: 'cancelled',
        error: 'Cancelled by user',
      });
    } else {
      // Delete completed notifications
      await db.deleteNotification(id);
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
