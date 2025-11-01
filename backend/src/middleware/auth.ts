import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import jwt from 'jsonwebtoken';
import { db } from '../services/database';

export interface AuthRequest extends Request {
  deviceId?: string;
  userId?: string;
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

/**
 * Middleware to verify device API token
 */
export function authenticateDevice(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }
  
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer' || token !== config.apiToken) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  next();
}

/**
 * Optional middleware - allows requests with or without auth
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const [type, token] = authHeader.split(' ');
    if (type === 'Bearer' && token === config.apiToken) {
      req.deviceId = 'authenticated';
    }
  }
  
  next();
}

/**
 * Require JWT authentication
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization type' });
      return;
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Get user from database
    const user = await db.getUserById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    // Attach user info to request
    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
}
