import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Validation Middleware Factory
 * Creates Express middleware that validates request body/params/query using Zod schemas
 */
export function validate(schema: z.ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      logger.warn(`Validation failed on ${req.path}`, { errors, ip: req.ip });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }
    
    // Attach validated data to request
    req.validatedData = result.data;
    next();
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      validatedData?: unknown;
    }
  }
}

/**
 * Auth Schemas
 */
export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'user']).default('user'),
});

export const changePinSchema = z.object({
  oldPin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must contain only digits'),
  newPin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must contain only digits'),
});

export const verifyPinSchema = z.object({
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must contain only digits'),
});

/**
 * Device Schemas
 */
export const deviceIdSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const deviceStatusSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  status: z.enum(['online', 'offline']),
  lamp: z.boolean().optional(),
  lock: z.enum(['open', 'closed']).optional(),
  uptime: z.number().optional(),
  rssi: z.number().optional(),
});

export const deviceControlSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  action: z.enum(['lock', 'unlock', 'lamp_on', 'lamp_off', 'buzzer', 'capture', 'reboot']),
});

/**
 * Package Schemas
 */
export const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(200, 'Package name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  recipientName: z.string().max(100, 'Recipient name too long').optional(),
  recipientPhone: z.string().max(20, 'Phone number too long').optional(),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const updatePackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(200, 'Package name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  recipientName: z.string().max(100, 'Recipient name too long').optional(),
  recipientPhone: z.string().max(20, 'Phone number too long').optional(),
  status: z.enum(['pending', 'delivered', 'collected', 'returned']).optional(),
});

/**
 * WhatsApp Settings Schema
 */
export const whatsappSettingsSchema = z.object({
  notifications: z.object({
    onPackageReceived: z.boolean(),
    onBoxOpened: z.boolean(),
    onLowBattery: z.boolean(),
    onDeviceOffline: z.boolean(),
  }),
  recipients: z.array(
    z.object({
      name: z.string().min(1, 'Recipient name is required'),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)'),
      enabled: z.boolean(),
    }),
  ),
});

/**
 * Notification Schema
 */
export const createNotificationSchema = z.object({
  to: z.array(z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')).min(1, 'At least one recipient required'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

/**
 * Event Schema
 */
export const createEventSchema = z.object({
  type: z.enum(['package_received', 'box_opened', 'motion_detected', 'device_offline', 'device_online']),
  deviceId: z.string().min(1, 'Device ID is required'),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Lock Control Schema
 */
export const lockControlSchema = z.object({
  action: z.enum(['open', 'close']),
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must contain only digits').optional(),
  duration: z.number().min(1).max(60).optional(), // Duration in seconds for auto-close
});

/**
 * Lock PIN Management Schema
 */
export const updateLockPinSchema = z.object({
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(8, 'PIN must be at most 8 digits').regex(/^\d+$/, 'PIN must contain only digits'),
  userId: z.string().optional(),
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePinInput = z.infer<typeof changePinSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;
export type DeviceIdInput = z.infer<typeof deviceIdSchema>;
export type DeviceStatusInput = z.infer<typeof deviceStatusSchema>;
export type DeviceControlInput = z.infer<typeof deviceControlSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type WhatsappSettingsInput = z.infer<typeof whatsappSettingsSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type LockControlInput = z.infer<typeof lockControlSchema>;
export type UpdateLockPinInput = z.infer<typeof updateLockPinSchema>;
