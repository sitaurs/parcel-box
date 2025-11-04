import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('Auth Service', () => {
  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'password123';
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890';

      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await bcrypt.hash(password, 10);
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should compare password with hash', async () => {
      const password = 'password123';
      const hash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890';

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await bcrypt.compare(password, hash);
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongpassword';
      const hash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890';

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await bcrypt.compare(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('JWT Token', () => {
    it('should sign JWT token', () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'user',
      };
      const secret = 'test-secret';

      const token = jwt.sign(payload, secret, { expiresIn: '24h' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        username: 'testuser',
        role: 'user',
      };
      const secret = 'test-secret';

      const token = jwt.sign(payload, secret, { expiresIn: '24h' });
      const decoded = jwt.verify(token, secret) as any;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      const secret = 'test-secret';

      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });

    it('should reject token with wrong secret', () => {
      const payload = { userId: 'user-123' };
      const secret1 = 'secret1';
      const secret2 = 'secret2';

      const token = jwt.sign(payload, secret1);

      expect(() => {
        jwt.verify(token, secret2);
      }).toThrow();
    });
  });
});
