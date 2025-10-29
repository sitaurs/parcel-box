import express, { Request, Response } from 'express';
import { db } from '../services/database';
import { upload } from '../middleware/upload';
import { authenticateDevice, optionalAuth } from '../middleware/auth';
import { generateThumbnail, pathToUrl } from '../utils/thumbnail';
import { config } from '../config';
import path from 'path';
import fs from 'fs/promises';
import { emitPackageNew } from '../services/socket';
import { sendPackagePushNotification } from '../services/push';
import { notificationQueue } from '../services/notificationQueue';

const router = express.Router();

/**
 * POST /api/v1/packages
 * Upload a package photo with metadata
 */
router.post(
  '/',
  authenticateDevice,
  upload.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Photo file is required' });
        return;
      }

      // Parse metadata
      const meta = req.body.meta ? JSON.parse(req.body.meta) : {};
      const { deviceId, ts, distanceCm, firmware } = meta;

      if (!deviceId) {
        res.status(400).json({ error: 'deviceId is required in metadata' });
        return;
      }

      // Generate thumbnail
      const thumbPath = await generateThumbnail(req.file.path);

      // Convert paths to URLs
      const photoUrl = pathToUrl(req.file.path, path.resolve(config.storage.dir));
      const thumbUrl = pathToUrl(thumbPath, path.resolve(config.storage.dir));

      // Update device status
      let device = await db.getDeviceById(deviceId);
      if (device) {
        await db.updateDevice(deviceId, {
          lastSeen: new Date().toISOString(),
          status: 'online',
          fwVersion: firmware,
        });
      } else {
        await db.createDevice({
          id: deviceId,
          name: `Device ${deviceId}`,
          mqttTopic: `smartparcel/${deviceId}`,
          status: 'online',
          lastSeen: new Date().toISOString(),
          fwVersion: firmware,
        });
      }

      // Create package record
      const pkg = await db.createPackage({
        deviceId,
        tsDetected: ts ? new Date(ts).toISOString() : new Date().toISOString(),
        tsPhoto: new Date().toISOString(),
        photoUrl,
        thumbUrl,
        distanceCm,
        status: 'captured',
        tsDelivered: null,
        tsCollected: null,
        recipientName: null,
        recipientPhone: null,
        waNotified: false,
      });

      // Emit Socket.IO event
      emitPackageNew({
        id: pkg.id,
        deviceId: pkg.deviceId,
        ts: pkg.tsDetected,
        photoUrl: pkg.photoUrl || '',
        thumbUrl: pkg.thumbUrl || '',
      });

      // Send push notification
      sendPackagePushNotification({
        id: pkg.id,
        deviceId: pkg.deviceId,
        photoUrl: pkg.photoUrl || undefined,
      }).catch((err) => console.error('Push notification error:', err));

      // Queue WhatsApp notification (will retry if backend not ready)
      try {
        // Load WhatsApp settings from frontend (stored by user)
        const fs2 = await import('fs/promises');
        let recipients: string[] = [];
        let notificationEnabled = false;

        try {
          // Try to read settings from a shared file
          const settingsPath = './data/whatsapp-settings.json';
          const settingsData = await fs2.readFile(settingsPath, 'utf-8');
          const settings = JSON.parse(settingsData);
          recipients = settings.recipients || [];
          notificationEnabled = settings.enabled || false;
        } catch (err) {
          // If file doesn't exist or error, skip notifications
          console.log('⚠️  No WhatsApp settings found, skipping notification');
        }

        // Only send if enabled and has recipients
        if (notificationEnabled && recipients.length > 0) {
          const photoBuffer = await fs.readFile(req.file.path);
          
          const caption = `📦 *New Package Detected!*\n\n` +
            `🆔 Package ID: ${pkg.id}\n` +
            `📍 Device: ${pkg.deviceId}\n` +
            `📅 Time: ${new Date(pkg.tsDetected).toLocaleString('id-ID')}\n` +
            `📏 Distance: ${distanceCm ? `${distanceCm} cm` : 'N/A'}`;
          
          // Enqueue notification for each recipient
          for (const recipient of recipients) {
            notificationQueue.enqueue('package', recipient, {
              caption,
              photoBase64: photoBuffer.toString('base64'),
              packageData: {
                id: pkg.id,
                deviceId: pkg.deviceId,
                timestamp: pkg.tsDetected,
              },
            });
          }
          
          console.log(`📬 WhatsApp notification queued for ${recipients.length} recipient(s)`);
        } else {
          console.log('⚠️  WhatsApp notifications disabled or no recipients configured');
        }
      } catch (waError) {
        console.error('❌ Error queuing WhatsApp notification:', waError);
        // Don't fail the request if queue fails
      }

      res.status(200).json({
        id: pkg.id,
        deviceId: pkg.deviceId,
        ts: pkg.tsDetected,
        photoUrl: pkg.photoUrl,
        thumbUrl: pkg.thumbUrl,
      });
    } catch (error) {
      console.error('Error uploading package:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/packages
 * List packages with pagination and filters
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      from,
      to,
      q,
      page = '1',
      limit = '20',
      deviceId,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get all packages
    let packages = await db.getPackages();

    // Apply filters
    if (deviceId) {
      packages = packages.filter(pkg => pkg.deviceId === deviceId);
    }

    if (from || to) {
      packages = packages.filter(pkg => {
        const pkgDate = new Date(pkg.tsDetected);
        if (from && pkgDate < new Date(from as string)) return false;
        if (to && pkgDate > new Date(to as string)) return false;
        return true;
      });
    }

    if (q) {
      const query = (q as string).toLowerCase();
      packages = packages.filter(pkg => 
        pkg.deviceId.toLowerCase().includes(query) ||
        (pkg.note && pkg.note.toLowerCase().includes(query))
      );
    }

    // Sort by date descending
    packages.sort((a, b) => new Date(b.tsDetected).getTime() - new Date(a.tsDetected).getTime());

    // Calculate pagination
    const total = packages.length;
    const paginatedPackages = packages.slice(skip, skip + limitNum);

    // Add device info
    const packagesWithDevice = await Promise.all(
      paginatedPackages.map(async (pkg) => {
        const device = await db.getDeviceById(pkg.deviceId);
        return {
          ...pkg,
          device: device ? { id: device.id, name: device.name } : null,
        };
      })
    );

    res.json({
      data: packagesWithDevice,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/packages/:id
 * Get package details
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const pkg = await db.getPackageById(id);

    if (!pkg) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }

    // Get device info
    const device = await db.getDeviceById(pkg.deviceId);

    res.json({
      ...pkg,
      device: device ? { 
        id: device.id, 
        name: device.name, 
        status: device.status 
      } : null,
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/packages/queue-status
 * Get notification queue status
 */
router.get('/queue-status', optionalAuth, (req: Request, res: Response) => {
  const status = notificationQueue.getStatus();
  res.json(status);
});

export default router;
