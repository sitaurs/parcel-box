import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { optionalAuth } from '../middleware/auth';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/v1/push/vapid-key
 * Get public VAPID key for subscription
 */
router.get('/vapid-key', (req: Request, res: Response): void => {
  if (!config.vapid.publicKey) {
    res.status(503).json({ error: 'Web Push not configured' });
    return;
  }

  res.json({ publicKey: config.vapid.publicKey });
});

/**
 * POST /api/v1/push/subscribe
 * Subscribe to push notifications
 */
router.post(
  '/subscribe',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId = 'default', endpoint, p256dh, auth } = req.body;

      if (!endpoint || !p256dh || !auth) {
        res.status(400).json({ error: 'Missing subscription details' });
        return;
      }

      // Ensure user exists (create if needed)
      let user = await db.getUserById(userId);
      if (!user) {
        // Create a default user for push subscriptions
        user = await db.createUser(`user_${userId}`, 'none', 'user');
      }

      // Check if subscription exists
      const existingSubscription = await db.getPushSubscriptionByEndpoint(endpoint);
      
      let subscription;
      if (existingSubscription) {
        // Update existing subscription
        subscription = await db.updatePushSubscription(endpoint, { p256dh, auth, userId: user.id });
      } else {
        // Create new subscription
        subscription = await db.createPushSubscription({
          userId: user.id,
          endpoint,
          p256dh,
          auth,
        });
      }

      res.status(201).json({
        message: 'Subscribed to push notifications',
        id: subscription!.id,
      });
    } catch (error: any) {
      logger.error('Error subscribing to push:', error);
      res.status(500).json({ error: error.message || 'Failed to subscribe' });
    }
  }
);

/**
 * POST /api/v1/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.post(
  '/unsubscribe',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        res.status(400).json({ error: 'Endpoint is required' });
        return;
      }

      await db.deletePushSubscription(endpoint);

      res.json({ message: 'Unsubscribed from push notifications' });
    } catch (error: any) {
      logger.error('Error unsubscribing from push:', error);
      res.status(500).json({ error: error.message || 'Failed to unsubscribe' });
    }
  }
);

export default router;
