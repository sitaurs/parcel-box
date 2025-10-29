import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AuthRequest extends Request {
  deviceId?: string;
  userId?: string;
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
