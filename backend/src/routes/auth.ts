import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../services/database';

const router = express.Router();

/**
 * POST /api/v1/auth/login
 * Login user dengan username/password
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
 * Get current user info
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
      role: user.role,
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
    
    // Hash PIN for security
    const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;
    
    const updatedUser = await db.updateUserPin(decoded.userId, hashedPin);

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'PIN updated successfully' });
  } catch (error: any) {
    console.error('Update PIN error:', error);
    res.status(500).json({ error: 'Failed to update PIN' });
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
