import dotenv from 'dotenv';

dotenv.config();

// Validate critical secrets in production
// Temporarily disabled for single-device prototype (user: prototipe demo semi jadi)
/*
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_jwt_secret_change_in_production' || process.env.JWT_SECRET === 'supersecret') {
    throw new Error('❌ SECURITY ERROR: JWT_SECRET must be set to a strong secret in production!');
  }
  if (!process.env.API_TOKEN || process.env.API_TOKEN === 'device_token_change_this') {
    throw new Error('❌ SECURITY ERROR: API_TOKEN must be set in production!');
  }
  if (!process.env.MQTT_USER || !process.env.MQTT_PASS) {
    throw new Error('❌ SECURITY ERROR: MQTT_USER and MQTT_PASS must be set in production!');
  }
}
*/

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: '7d',
  },
  
  apiToken: process.env.API_TOKEN || 'device_token_change_this',
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  database: {
    url: process.env.DATABASE_URL || 'file:./db.sqlite',
  },
  
  storage: {
    dir: process.env.STORAGE_DIR || './storage',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  },
  
  baileys: {
    dataDir: process.env.BAILEYS_DATA_DIR || './wa-session',
    defaultPhone: process.env.DEFAULT_PHONE || '',
  },
  
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_EMAIL || 'mailto:admin@example.com',
  },
  
  mqtt: {
    enabled: process.env.MQTT_ENABLED !== 'false', // Default enabled
    host: process.env.MQTT_HOST || '13.213.57.228',
    port: parseInt(process.env.MQTT_PORT || '1883', 10),
    username: process.env.MQTT_USER || 'smartbox', // Dev fallback only
    password: process.env.MQTT_PASS || 'engganngodinginginmcu', // Dev fallback only - DO NOT USE IN PRODUCTION
  },
};
