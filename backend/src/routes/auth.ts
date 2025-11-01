import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../services/database';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    console.log('🔐 Login attempt for username:', username);

    // Find user by username
    const user = await db.getUserByUsername(username);

    if (!user) {
      console.log('❌ User not found:', username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password for user:', username);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('✅ Login successful:', username);

    // Generate JWT token (7 days expiry)
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify old token (even if expired)
    const decoded = jwt.verify(token, config.jwt.secret, { ignoreExpiration: true }) as any;
    
    // Check if user still exists
    const user = await db.getUserById(decoded.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate new token (7 days)
    const newToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info with profile data
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    const user = await db.getUserById(decoded.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name || null,
      role: user.role,
      hasPin: !!user.pin,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * PUT /api/v1/auth/pin
 * Update user PIN
 */
router.put('/pin', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const { pin } = req.body;
    
    if (!pin || pin.length < 4) {
      res.status(400).json({ error: 'PIN must be at least 4 digits' });
      return;
    }
    
    // Hash PIN for security
    const hashedPin = await bcrypt.hash(pin, 10);
    
    const updatedUser = await db.updateUser(decoded.userId, { pin: hashedPin });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log('✅ PIN updated for user:', updatedUser.username);
    res.json({ message: 'PIN updated successfully' });
  } catch (error: any) {
    console.error('❌ Update PIN error:', error);
    res.status(500).json({ error: 'Failed to update PIN' });
  }
});

/**
 * PUT /api/v1/auth/profile
 * Update user profile (name, etc)
 */
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const updatedUser = await db.updateUser(decoded.userId, { name: name.trim() });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log('✅ Profile updated for user:', updatedUser.username, '- Name:', name);
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
      }
    });
  } catch (error: any) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post('/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'Old password and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    // Get user
    const user = await db.getUserById(decoded.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Old password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const updatedUser = await db.updateUserPassword(decoded.userId, hashedPassword);

    if (!updatedUser) {
      res.status(500).json({ error: 'Failed to update password' });
      return;
    }

    console.log('✅ Password changed for user:', user.username);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
