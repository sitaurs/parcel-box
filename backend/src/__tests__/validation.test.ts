import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  changePinSchema,
  verifyPinSchema,
  deviceControlSchema,
  createPackageSchema,
  updatePackageSchema,
  whatsappSettingsSchema,
  createNotificationSchema,
  createEventSchema,
  lockControlSchema,
} from '../middleware/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const result = loginSchema.safeParse({
        username: 'admin',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject username less than 3 characters', () => {
      const result = loginSchema.safeParse({
        username: 'ab',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject password less than 8 characters', () => {
      const result = loginSchema.safeParse({
        username: 'admin',
        password: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({
        username: 'admin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        password: 'password123',
        email: 'test@example.com',
        role: 'user',
      });
      expect(result.success).toBe(true);
    });

    it('should accept registration without optional email', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        password: 'password123',
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should default role to user', () => {
      const result = registerSchema.safeParse({
        username: 'newuser',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('user');
      }
    });
  });

  describe('changePinSchema', () => {
    it('should accept valid 6-digit PINs', () => {
      const result = changePinSchema.safeParse({
        oldPin: '123456',
        newPin: '654321',
      });
      expect(result.success).toBe(true);
    });

    it('should reject PIN with less than 6 digits', () => {
      const result = changePinSchema.safeParse({
        oldPin: '12345',
        newPin: '654321',
      });
      expect(result.success).toBe(false);
    });

    it('should reject PIN with more than 6 digits', () => {
      const result = changePinSchema.safeParse({
        oldPin: '1234567',
        newPin: '654321',
      });
      expect(result.success).toBe(false);
    });

    it('should reject PIN with non-numeric characters', () => {
      const result = changePinSchema.safeParse({
        oldPin: '12345a',
        newPin: '654321',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyPinSchema', () => {
    it('should accept valid 6-digit PIN', () => {
      const result = verifyPinSchema.safeParse({
        pin: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid PIN', () => {
      const result = verifyPinSchema.safeParse({
        pin: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('deviceControlSchema', () => {
    it('should accept valid device control action', () => {
      const result = deviceControlSchema.safeParse({
        deviceId: 'box-01',
        action: 'lock',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid actions', () => {
      const actions = ['lock', 'unlock', 'lamp_on', 'lamp_off', 'buzzer', 'capture', 'reboot'];
      actions.forEach((action) => {
        const result = deviceControlSchema.safeParse({
          deviceId: 'box-01',
          action,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid action', () => {
      const result = deviceControlSchema.safeParse({
        deviceId: 'box-01',
        action: 'invalid_action',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing deviceId', () => {
      const result = deviceControlSchema.safeParse({
        action: 'lock',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createPackageSchema', () => {
    it('should accept valid package data', () => {
      const result = createPackageSchema.safeParse({
        name: 'Test Package',
        description: 'A test package',
        recipientName: 'John Doe',
        recipientPhone: '+1234567890',
        deviceId: 'box-01',
      });
      expect(result.success).toBe(true);
    });

    it('should accept package without optional fields', () => {
      const result = createPackageSchema.safeParse({
        name: 'Test Package',
        deviceId: 'box-01',
      });
      expect(result.success).toBe(true);
    });

    it('should reject package name that is too long', () => {
      const result = createPackageSchema.safeParse({
        name: 'a'.repeat(201),
        deviceId: 'box-01',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty package name', () => {
      const result = createPackageSchema.safeParse({
        name: '',
        deviceId: 'box-01',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePackageSchema', () => {
    it('should accept partial updates', () => {
      const result = updatePackageSchema.safeParse({
        name: 'Updated Package',
      });
      expect(result.success).toBe(true);
    });

    it('should accept status update', () => {
      const result = updatePackageSchema.safeParse({
        status: 'delivered',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid statuses', () => {
      const statuses = ['pending', 'delivered', 'collected', 'returned'];
      statuses.forEach((status) => {
        const result = updatePackageSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const result = updatePackageSchema.safeParse({
        status: 'invalid_status',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('whatsappSettingsSchema', () => {
    it('should accept valid WhatsApp settings', () => {
      const result = whatsappSettingsSchema.safeParse({
        notifications: {
          onPackageReceived: true,
          onBoxOpened: false,
          onLowBattery: true,
          onDeviceOffline: false,
        },
        recipients: [
          {
            name: 'John Doe',
            phone: '+1234567890',
            enabled: true,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number format', () => {
      const result = whatsappSettingsSchema.safeParse({
        notifications: {
          onPackageReceived: true,
          onBoxOpened: false,
          onLowBattery: true,
          onDeviceOffline: false,
        },
        recipients: [
          {
            name: 'John Doe',
            phone: 'invalid-phone',
            enabled: true,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should accept E.164 phone number format', () => {
      const validPhones = ['+1234567890', '+628123456789', '+447911123456'];
      validPhones.forEach((phone) => {
        const result = whatsappSettingsSchema.safeParse({
          notifications: {
            onPackageReceived: true,
            onBoxOpened: false,
            onLowBattery: true,
            onDeviceOffline: false,
          },
          recipients: [
            {
              name: 'Test User',
              phone,
              enabled: true,
            },
          ],
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('createNotificationSchema', () => {
    it('should accept valid notification data', () => {
      const result = createNotificationSchema.safeParse({
        to: ['+1234567890', '+628123456789'],
        message: 'Test notification message',
        imageUrl: 'https://example.com/image.jpg',
        priority: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('should default priority to medium', () => {
      const result = createNotificationSchema.safeParse({
        to: ['+1234567890'],
        message: 'Test message',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
      }
    });

    it('should reject empty recipients array', () => {
      const result = createNotificationSchema.safeParse({
        to: [],
        message: 'Test message',
      });
      expect(result.success).toBe(false);
    });

    it('should reject message that is too long', () => {
      const result = createNotificationSchema.safeParse({
        to: ['+1234567890'],
        message: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URL', () => {
      const result = createNotificationSchema.safeParse({
        to: ['+1234567890'],
        message: 'Test message',
        imageUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createEventSchema', () => {
    it('should accept valid event data', () => {
      const result = createEventSchema.safeParse({
        type: 'package_received',
        deviceId: 'box-01',
        data: {
          packageId: 'pkg-123',
          timestamp: new Date().toISOString(),
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid event types', () => {
      const types = ['package_received', 'box_opened', 'motion_detected', 'device_offline', 'device_online'];
      types.forEach((type) => {
        const result = createEventSchema.safeParse({
          type,
          deviceId: 'box-01',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid event type', () => {
      const result = createEventSchema.safeParse({
        type: 'invalid_event',
        deviceId: 'box-01',
      });
      expect(result.success).toBe(false);
    });

    it('should accept event without data field', () => {
      const result = createEventSchema.safeParse({
        type: 'device_online',
        deviceId: 'box-01',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('lockControlSchema', () => {
    it('should accept valid lock control with PIN', () => {
      const result = lockControlSchema.safeParse({
        action: 'open',
        pin: '123456',
        duration: 30,
      });
      expect(result.success).toBe(true);
    });

    it('should accept lock control without PIN', () => {
      const result = lockControlSchema.safeParse({
        action: 'close',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = lockControlSchema.safeParse({
        action: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject duration less than 1', () => {
      const result = lockControlSchema.safeParse({
        action: 'open',
        duration: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject duration greater than 60', () => {
      const result = lockControlSchema.safeParse({
        action: 'open',
        duration: 61,
      });
      expect(result.success).toBe(false);
    });
  });
});
