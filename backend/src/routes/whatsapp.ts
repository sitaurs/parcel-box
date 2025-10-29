/**
 * WhatsApp Settings API Routes
 * Handles saving/loading WhatsApp notification settings
 */

import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const SETTINGS_FILE = path.join(__dirname, '../../data/whatsapp-settings.json');

/**
 * GET /api/v1/wa/settings
 * Get WhatsApp notification settings
 */
router.get('/settings', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return defaults
      res.json({ enabled: false, recipients: [] });
    } else {
      console.error('Error reading WhatsApp settings:', error);
      res.status(500).json({ error: 'Failed to read settings' });
    }
  }
});

/**
 * POST /api/v1/wa/settings
 * Save WhatsApp notification settings
 * Body: { enabled: boolean, recipients: string[] }
 */
router.post('/settings', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled, recipients } = req.body;

    // Validate input
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled must be a boolean' });
      return;
    }

    if (!Array.isArray(recipients)) {
      res.status(400).json({ error: 'recipients must be an array' });
      return;
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (typeof recipient !== 'string' || !/^\d{10,15}$/.test(recipient)) {
        res.status(400).json({ error: `Invalid phone number: ${recipient}` });
        return;
      }
    }

    const settings = { enabled, recipients };

    // Ensure data directory exists
    const dataDir = path.dirname(SETTINGS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');

    console.log(`✅ WhatsApp settings saved: ${recipients.length} recipient(s), enabled: ${enabled}`);

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
