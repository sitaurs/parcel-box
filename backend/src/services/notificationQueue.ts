/**
 * Notification Queue Service
 * Handles queuing and retry logic for WhatsApp notifications
 */

interface QueuedNotification {
  id: string;
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
    console.log('📬 Notification queue service initialized');
  }

  /**
   * Add notification to queue
   */
  enqueue(type: 'package' | 'status_update', to: string, data: any): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: QueuedNotification = {
      id,
      type,
      to,
      data,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: new Date(),
      nextRetryAt: new Date(), // Try immediately
    };

    this.queue.push(notification);
    console.log(`📥 Queued notification: ${id} (queue size: ${this.queue.length})`);

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

    console.log(`📤 Processing ${readyNotifications.length} queued notifications...`);

    for (const notification of readyNotifications) {
      try {
        const success = await this.sendNotification(notification);

        if (success) {
          // Remove from queue
          this.queue = this.queue.filter(n => n.id !== notification.id);
          console.log(`✅ Notification sent: ${notification.id}`);
        } else {
          // Increment attempts and schedule retry
          notification.attempts++;
          
          if (notification.attempts >= notification.maxAttempts) {
            // Max attempts reached, remove from queue
            this.queue = this.queue.filter(n => n.id !== notification.id);
            console.log(`❌ Notification failed after ${notification.attempts} attempts: ${notification.id}`);
          } else {
            // Schedule next retry
            notification.nextRetryAt = new Date(Date.now() + this.retryIntervalMs);
            console.log(`⏱️  Retry scheduled for ${notification.id} (attempt ${notification.attempts + 1}/${notification.maxAttempts})`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);
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
        console.log(`⚠️  WhatsApp backend not available`);
        return false;
      }

      const status = await statusResponse.json();
      if (!(status as any).connected) {
        console.log(`⚠️  WhatsApp not connected yet`);
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
    console.log(`🗑️  Cleared ${count} notifications from queue`);
  }
}

// Singleton instance
export const notificationQueue = new NotificationQueueService();
