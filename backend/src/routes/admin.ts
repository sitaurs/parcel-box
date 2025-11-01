/**
 * Admin User Management API Routes
 * CRUD operations for user accounts (admin only)
 */

import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * Middleware to check admin role
 */
function requireAdmin(req: Request, res: Response, next: any) {
  const user = (req as any).user;
  
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  next();
}

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin user management endpoints (admin only)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.getUsers();
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      hasPin: !!user.pin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/v1/admin/users/:id
 * Get single user details
 */
router.get('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive data
    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      hasPin: !!user.pin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 3
 *                 example: newuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 default: user
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 */
router.post('/users', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role, name } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (role && !['admin', 'user'].includes(role)) {
      res.status(400).json({ error: 'Role must be admin or user' });
      return;
    }

    // Check if username exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Create user
    const user = await db.createUser(username, password, role || 'user');

    // Update name if provided
    if (name) {
      await db.updateUser(user.id, { name });
    }

    // Remove sensitive data
    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: name || null,
      hasPin: !!user.pin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log(`✅ Admin created user: ${username} (${role || 'user'})`);

    res.status(201).json({ 
      message: 'User created successfully',
      user: safeUser 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/v1/admin/users/:id
 * Update user (admin only)
 */
router.put('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, password, role, name } = req.body;

    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prepare updates
    const updates: any = {};

    if (username !== undefined) {
      if (username.length < 3) {
        res.status(400).json({ error: 'Username must be at least 3 characters' });
        return;
      }
      
      // Check if new username is already taken by another user
      const existingUser = await db.getUserByUsername(username);
      if (existingUser && existingUser.id !== id) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }
      
      updates.username = username;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        res.status(400).json({ error: 'Role must be admin or user' });
        return;
      }
      updates.role = role;
    }

    if (name !== undefined) {
      updates.name = name;
    }

    // Update user
    const updatedUser = await db.updateUser(id, updates);

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive data
    const safeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      name: updatedUser.name,
      hasPin: !!updatedUser.pin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    console.log(`✅ Admin updated user: ${updatedUser.username}`);

    res.json({ 
      message: 'User updated successfully',
      user: safeUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/v1/admin/users/:id
 * Delete user (admin only)
 */
router.delete('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Prevent admin from deleting themselves
    if (id === currentUser.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete user
    const deleted = await db.deleteUser(id);

    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log(`✅ Admin deleted user: ${user.username}`);

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        username: user.username,
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/v1/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.getUsers();
    const packages = await db.getPackages();
    const events = await db.getEvents();
    const devices = await db.getDevices();
    const notifications = await db.getNotifications();

    const stats = {
      users: {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        regular: users.filter(u => u.role === 'user').length,
      },
      packages: {
        total: packages.length,
        captured: packages.filter(p => p.status === 'captured').length,
        delivered: packages.filter(p => p.status === 'delivered').length,
        collected: packages.filter(p => p.status === 'collected').length,
      },
      devices: {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
      },
      events: {
        total: events.length,
        today: events.filter(e => {
          const eventDate = new Date(e.ts).toDateString();
          const today = new Date().toDateString();
          return eventDate === today;
        }).length,
      },
      notifications: {
        total: notifications.length,
        sent: notifications.filter(n => n.status === 'sent').length,
        failed: notifications.filter(n => n.status === 'failed').length,
        pending: notifications.filter(n => n.status === 'pending').length,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
