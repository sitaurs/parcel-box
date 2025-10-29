import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionDir: process.env.SESSION_DIR || './wa-session',
  defaultPhone: process.env.DEFAULT_PHONE || '',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};
