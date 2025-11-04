import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '../services/database';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

describe('Database Service', () => {
  describe('User Operations', () => {
    it('should get all users', async () => {
      const users = await db.getUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should find user by ID', async () => {
      const users = await db.getUsers();
      if (users.length > 0) {
        const firstUser = users[0];
        const foundUser = await db.getUserById(firstUser.id);
        expect(foundUser).toBeDefined();
        expect(foundUser?.id).toBe(firstUser.id);
      }
    });

    it('should find user by username', async () => {
      const users = await db.getUsers();
      if (users.length > 0) {
        const firstUser = users[0];
        const foundUser = await db.getUserByUsername(firstUser.username);
        expect(foundUser).toBeDefined();
        expect(foundUser?.username).toBe(firstUser.username);
      }
    });

    it('should return null for non-existent user ID', async () => {
      const user = await db.getUserById('non-existent-id');
      expect(user).toBeNull();
    });

    it('should return null for non-existent username', async () => {
      const user = await db.getUserByUsername('non-existent-username');
      expect(user).toBeNull();
    });

    it('should create new user', async () => {
      const username = 'testuser' + Date.now();
      const password = 'testpassword123';
      const role = 'user' as const;

      const created = await db.createUser(username, password, role);
      expect(created).toBeDefined();
      expect(created.username).toBe(username);
      expect(created.role).toBe(role);

      // Cleanup
      await db.deleteUser(created.id);
    });

    it('should update user data', async () => {
      const users = await db.getUsers();
      if (users.length > 0) {
        const userToUpdate = users[0];
        const updates = {
          name: 'Updated Name',
        };

        const updated = await db.updateUser(userToUpdate.id, updates);
        expect(updated).toBeDefined();
        expect(updated?.name).toBe(updates.name);
      }
    });
  });

  describe('Device Operations', () => {
    it('should get all devices', async () => {
      const devices = await db.getDevices();
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should find device by ID', async () => {
      const devices = await db.getDevices();
      if (devices.length > 0) {
        const firstDevice = devices[0];
        const foundDevice = await db.getDeviceById(firstDevice.id);
        expect(foundDevice).toBeDefined();
        expect(foundDevice?.id).toBe(firstDevice.id);
      }
    });

    it('should update device status', async () => {
      const devices = await db.getDevices();
      if (devices.length > 0) {
        const deviceToUpdate = devices[0];
        const updates = {
          status: 'online' as const,
          lastSeen: new Date().toISOString(),
        };

        const updated = await db.updateDevice(deviceToUpdate.id, updates);
        expect(updated).toBeDefined();
        expect(updated?.status).toBe(updates.status);
      }
    });
  });

  describe('Package Operations', () => {
    it('should get all packages', async () => {
      const packages = await db.getPackages();
      expect(Array.isArray(packages)).toBe(true);
    });

    it('should find package by ID', async () => {
      const packages = await db.getPackages();
      if (packages.length > 0) {
        const firstPackage = packages[0];
        const foundPackage = await db.getPackageById(firstPackage.id);
        expect(foundPackage).toBeDefined();
        expect(foundPackage?.id).toBe(firstPackage.id);
      }
    });

    it('should create a new package', async () => {
      const newPackage = {
        deviceId: 'box-01',
        status: 'captured' as const,
        photoUrl: null,
        thumbUrl: null,
        tsDetected: new Date().toISOString(),
        tsDelivered: null,
        tsCollected: null,
        recipientName: null,
        recipientPhone: null,
        waNotified: false,
      };

      const created = await db.createPackage(newPackage);
      expect(created).toBeDefined();
      expect(created.deviceId).toBe(newPackage.deviceId);
      expect(created.status).toBe(newPackage.status);
      
      // Cleanup
      await db.deletePackage(created.id);
    });

    it('should update package data', async () => {
      const packages = await db.getPackages();
      if (packages.length > 0) {
        const packageToUpdate = packages[0];
        const updates = {
          status: 'delivered' as const,
        };

        const updated = await db.updatePackage(packageToUpdate.id, updates);
        expect(updated).toBeDefined();
        expect(updated?.status).toBe(updates.status);
      }
    });
  });

  describe('Event Operations', () => {
    it('should get all events', async () => {
      const events = await db.getEvents();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should create a new event', async () => {
      const newEvent = {
        type: 'package_received',
        deviceId: 'box-01',
        packageId: 'pkg-123',
        ts: new Date().toISOString(),
        data: {
          packageId: 'pkg-123',
          status: 'received',
        },
      };

      const created = await db.createEvent(newEvent);
      expect(created).toBeDefined();
      expect(created.type).toBe(newEvent.type);
      expect(created.deviceId).toBe(newEvent.deviceId);
      expect(created.packageId).toBe(newEvent.packageId);
    });
  });

  describe('Notification Operations', () => {
    it('should get all notifications', async () => {
      const notifications = await db.getNotifications();
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should find notification by ID', async () => {
      const notifications = await db.getNotifications();
      if (notifications.length > 0) {
        const firstNotification = notifications[0];
        const foundNotification = await db.getNotificationById(firstNotification.id);
        expect(foundNotification).toBeDefined();
        expect(foundNotification?.id).toBe(firstNotification.id);
      }
    });

    it('should create a new notification', async () => {
      const newNotification = {
        type: 'package' as const,
        recipient: '+1234567890',
        packageId: 'pkg-123',
        message: 'Test notification',
        status: 'pending' as const,
        attempts: 0,
        error: null,
        sentAt: null,
      };

      const created = await db.createNotification(newNotification);
      expect(created).toBeDefined();
      expect(created.message).toBe(newNotification.message);
      expect(created.type).toBe(newNotification.type);
      
      // Cleanup
      await db.deleteNotification(created.id);
    });

    it('should update notification status', async () => {
      const notifications = await db.getNotifications();
      if (notifications.length > 0) {
        const notificationToUpdate = notifications[0];
        const updates = {
          status: 'sent' as const,
          tsSent: new Date().toISOString(),
        };

        const updated = await db.updateNotification(notificationToUpdate.id, updates);
        expect(updated).toBeDefined();
        expect(updated?.status).toBe(updates.status);
      }
    });
  });
});
