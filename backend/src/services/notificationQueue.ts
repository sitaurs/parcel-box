/**
 * Notification Queue Service
 * Handles queuing and retry logic for WhatsApp notifications
 */

import { db } from './database';
import { logger } from '../utils/logger';

interface QueuedNotification {
  id: string;
  dbId: string | null; // Reference to database notification record
  type: 'package' | 'status_update';
  to: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  nextRetryAt: Date;
}

class NotificationQueueService {
  private queue: QueuedNotification[] = [];
  private processing: boolean = false;
  private retryIntervalMs: number = 30000; // 30 seconds
  private maxAttempts: number = 10; // Max 10 retries (5 minutes total)

  constructor() {
    // Start processing queue every 30 seconds
    setInterval(() => this.processQueue(), this.retryIntervalMs);
    logger.info('📬 Notification queue service initialized');
  }

  /**
   * Add notification to queue
   */
  async enqueue(type: 'package' | 'status_update', to: string, data: any): Promise<string> {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create database record
    const dbNotification = await db.createNotification({
      type: type === 'package' ? 'package' : 'status_update',
      recipient: to,
      packageId: data.packageId || null,
      message: data.message || `${type} notification to ${to}`,
      status: 'pending',
      attempts: 0,
      error: null,
      sentAt: null,
    });

    const notification: QueuedNotification = {
      id,
      dbId: dbNotification.id,
      type,
      to,
      data,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: new Date(),
      nextRetryAt: new Date(), // Try immediately
    };

    this.queue.push(notification);
    logger.info(`📥 Queued notification: ${id} (queue size: ${this.queue.length})`);

    // Try to process immediately
    this.processQueue();

    return id;
  }

  /**
   * Process queue - send pending notifications
   */
  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const now = new Date();

    // Filter notifications that are ready to retry
    const readyNotifications = this.queue.filter(n => n.nextRetryAt <= now);

    if (readyNotifications.length === 0) {
      this.processing = false;
      return;
    }

    logger.info(`📤 Processing ${readyNotifications.length} queued notifications...`);

    for (const notification of readyNotifications) {
      try {
        const success = await this.sendNotification(notification);

        if (success) {
          // Update database: mark as sent
          if (notification.dbId) {
            await db.updateNotification(notification.dbId, {
              status: 'sent',
              sentAt: new Date().toISOString(),
              attempts: notification.attempts + 1,
            });
          }

          // Remove from queue
          this.queue = this.queue.filter(n => n.id !== notification.id);
          logger.info(`✅ Notification sent: ${notification.id}`);
        } else {
          // Increment attempts and schedule retry
          notification.attempts++;
          
          // Update database: increment attempts
          if (notification.dbId) {
            await db.updateNotification(notification.dbId, {
              attempts: notification.attempts,
            });
          }

          if (notification.attempts >= notification.maxAttempts) {
            // Update database: mark as failed
            if (notification.dbId) {
              await db.updateNotification(notification.dbId, {
                status: 'failed',
                error: 'Max retry attempts reached',
                attempts: notification.attempts,
              });
            }

            // Max attempts reached, remove from queue
            this.queue = this.queue.filter(n => n.id !== notification.id);
            logger.info(`❌ Notification failed after ${notification.attempts} attempts: ${notification.id}`);
          } else {
            // Schedule next retry
            notification.nextRetryAt = new Date(Date.now() + this.retryIntervalMs);
            logger.info(`⏱️  Retry scheduled for ${notification.id} (attempt ${notification.attempts + 1}/${notification.maxAttempts})`);
          }
        }
      } catch (error) {
        logger.error(`❌ Error processing notification ${notification.id}:`, error);
        notification.attempts++;
        notification.nextRetryAt = new Date(Date.now() + this.retryIntervalMs);
      }
    }

    this.processing = false;
  }

  /**
   * Send notification via WhatsApp backend
   */
  private async sendNotification(notification: QueuedNotification): Promise<boolean> {
    const waApiUrl = process.env.WA_API_URL || 'http://localhost:3001';

    try {
      // Check if WhatsApp is connected first
      const statusResponse = await fetch(`${waApiUrl}/api/wa/status`, {
        method: 'GET',
      });

      if (!statusResponse.ok) {
        logger.info(`⚠️  WhatsApp backend not available`);
        return false;
      }

      const status = await statusResponse.json();
      if (!(status as any).connected) {
        logger.info(`⚠️  WhatsApp not connected yet`);
        return false;
      }

      // Send notification based on type
      let response: Response;

      if (notification.type === 'package') {
        response = await fetch(`${waApiUrl}/api/wa/send-package`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: notification.to,
            ...notification.data,
          }),
        });
      } else {
        response = await fetch(`${waApiUrl}/api/wa/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: notification.to,
            ...notification.data,
          }),
        });
      }

      return response.ok;
    } catch (error) {
      // Network error or backend down
      return false;
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      notifications: this.queue.map(n => ({
        id: n.id,
        type: n.type,
        attempts: n.attempts,
        maxAttempts: n.maxAttempts,
        nextRetryAt: n.nextRetryAt,
      })),
    };
  }

  /**
   * Clear queue (for testing)
   */
  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    logger.info(`🗑️  Cleared ${count} notifications from queue`);
  }
}

// Singleton instance
export const notificationQueue = new NotificationQueueService();
