import webpush from 'web-push';
import { db } from './database';
import { config } from '../config';

// Set VAPID details
if (config.vapid.publicKey && config.vapid.privateKey) {
  webpush.setVapidDetails(
    `mailto:${config.vapid.subject}`,
    config.vapid.publicKey,
    config.vapid.privateKey
  );
  console.log('Web Push configured');
} else {
  console.warn('VAPID keys not configured. Web Push notifications disabled.');
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  notification: PushNotification
): Promise<void> {
  if (!config.vapid.publicKey || !config.vapid.privateKey) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  try {
    const subscriptions = await db.getPushSubscriptionsByUserId(userId);

    const payload = JSON.stringify(notification);

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    // Remove failed subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        console.log('Push failed, removing subscription:', subscriptions[i].id);
        await db.deletePushSubscription(subscriptions[i].endpoint);
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Send push notification to all users
 */
export async function sendPushToAll(notification: PushNotification): Promise<void> {
  if (!config.vapid.publicKey || !config.vapid.privateKey) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  try {
    const subscriptions = await db.getPushSubscriptions();
    const payload = JSON.stringify(notification);

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    // Remove failed subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        console.log('Push failed, removing subscription:', subscriptions[i].id);
        await db.deletePushSubscription(subscriptions[i].endpoint);
      }
    }

    console.log(`Push notification sent to ${subscriptions.length} subscribers`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Send package notification
 */
export async function sendPackagePushNotification(data: {
  id: string;
  deviceId: string;
  photoUrl?: string;
}): Promise<void> {
  await sendPushToAll({
    title: '📦 New Package Detected',
    body: `A package was detected by ${data.deviceId}`,
    icon: data.photoUrl || '/icons/icon-192.png',
    data: {
      type: 'package_new',
      packageId: data.id,
      url: `/packages`,
    },
    tag: 'package',
  });
}

/**
 * Send jam/error notification
 */
export async function sendErrorPushNotification(data: {
  deviceId: string;
  type: string;
}): Promise<void> {
  await sendPushToAll({
    title: '⚠️ Device Error',
    body: `${data.deviceId}: ${data.type}`,
    icon: '/icons/icon-192.png',
    data: {
      type: 'error',
      deviceId: data.deviceId,
      url: `/`,
    },
    tag: 'error',
  });
}
