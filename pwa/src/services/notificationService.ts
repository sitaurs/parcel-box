import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
} from '@capacitor/push-notifications';

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
}

class NotificationService {
  private initialized = false;
  private isNative = Capacitor.isNativePlatform();

  /**
   * Initialize notification service
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    if (this.isNative) {
      await this.initNativeNotifications();
    } else {
      await this.initWebNotifications();
    }

    this.initialized = true;
    console.log('✅ Notification service initialized');
  }

  /**
   * Initialize native push notifications (Android/iOS)
   */
  private async initNativeNotifications(): Promise<void> {
    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        console.log('✅ Push notifications registered');
      } else {
        console.warn('⚠️ Push notification permission denied');
      }

      // Listen for registration
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('📱 Push registration success, token:', token.value);
        // Save token to backend if needed
        this.savePushToken(token.value);
      });

      // Listen for registration errors
      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('❌ Push registration error:', error);
      });

      // Listen for push notifications
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('📬 Push notification received:', notification);
          // Notification will be shown automatically by OS
        }
      );

      // Listen for notification actions
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          console.log('🔔 Notification action performed:', action);
          // Handle notification tap - navigate to packages page
          if (action.notification.data?.type === 'new_package') {
            window.location.hash = '#/packages';
          }
        }
      );
    } catch (error) {
      console.error('❌ Error initializing native notifications:', error);
    }
  }

  /**
   * Initialize web notifications (PWA)
   */
  private async initWebNotifications(): Promise<void> {
    try {
      if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported in this browser');
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
      }
    } catch (error) {
      console.error('❌ Error initializing web notifications:', error);
    }
  }

  /**
   * Show local notification
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    if (this.isNative) {
      await this.showNativeNotification(options);
    } else {
      await this.showWebNotification(options);
    }
  }

  /**
   * Show native notification
   */
  private async showNativeNotification(options: NotificationOptions): Promise<void> {
    try {
      await PushNotifications.createChannel({
        id: 'packages',
        name: 'Package Notifications',
        description: 'Notifications for new packages',
        importance: 5,
        visibility: 1,
        sound: options.sound || 'default',
        vibration: true,
      });

      // Note: For native, we'll use web notification API fallback
      // since local notifications need a separate plugin
      this.showWebNotification(options);
    } catch (error) {
      console.error('❌ Error showing native notification:', error);
    }
  }

  /**
   * Show web notification
   */
  private async showWebNotification(options: NotificationOptions): Promise<void> {
    try {
      if (Notification.permission !== 'granted') {
        console.warn('⚠️ Notification permission not granted');
        return;
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-96x96.png',
        data: options.data,
        tag: 'package-notification',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to packages page
        if (options.data?.type === 'new_package') {
          window.location.hash = '#/packages';
        }
      };

      console.log('✅ Notification shown:', options.title);
    } catch (error) {
      console.error('❌ Error showing web notification:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        const result = await PushNotifications.requestPermissions();
        return result.receive === 'granted';
      } else {
        if (!('Notification' in window)) {
          return false;
        }
        
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    if (this.isNative) {
      // On native, assume enabled if initialized
      return this.initialized;
    } else {
      return 'Notification' in window && Notification.permission === 'granted';
    }
  }

  /**
   * Save push token to backend (optional)
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      // Optional: Send token to backend to store in database
      console.log('💾 Push token:', token);
      // await api.savePushToken(token);
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }

  /**
   * Show package arrival notification
   */
  async notifyNewPackage(packageData: {
    trackingNumber: string;
    recipient: string;
    deviceName?: string;
  }): Promise<void> {
    await this.showNotification({
      title: '📦 Paket Baru Tiba!',
      body: `Paket untuk ${packageData.recipient}\nNo. Resi: ${packageData.trackingNumber}`,
      data: {
        type: 'new_package',
        trackingNumber: packageData.trackingNumber,
      },
      icon: '/icons/icon-192x192.png',
      sound: 'default',
    });
  }

  /**
   * Show package pickup notification
   */
  async notifyPackagePickup(packageData: {
    trackingNumber: string;
    recipient: string;
  }): Promise<void> {
    await this.showNotification({
      title: '✅ Paket Diambil',
      body: `Paket ${packageData.trackingNumber} telah diambil oleh ${packageData.recipient}`,
      data: {
        type: 'package_pickup',
        trackingNumber: packageData.trackingNumber,
      },
      icon: '/icons/icon-192x192.png',
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
