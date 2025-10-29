import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'file:./db.sqlite',
  },
  
  storage: {
    dir: process.env.STORAGE_DIR || './storage',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret',
    apiToken: process.env.API_TOKEN || 'device_token_change_this',
  },
  
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    email: process.env.VAPID_EMAIL || 'admin@example.com',
  },
  
  baileys: {
    dataDir: process.env.BAILEYS_DATA_DIR || './wa-session',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  },
};

// Ensure storage directory exists
const storageDir = path.resolve(config.storage.dir);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Ensure Baileys session directory exists
const baileysDir = path.resolve(config.baileys.dataDir);
if (!fs.existsSync(baileysDir)) {
  fs.mkdirSync(baileysDir, { recursive: true });
}
