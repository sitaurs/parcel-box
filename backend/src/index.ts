import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { initializeSocket } from './services/socket';
import { initMQTT } from './services/mqtt';
import { initializeDatabase } from './services/database';

// Import routes
import authRouter from './routes/auth';
import packagesRouter from './routes/packages';
import eventsRouter from './routes/events';
import devicesRouter from './routes/devices';
import pushRouter from './routes/push';
import whatsappRouter from './routes/whatsapp';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Initialize JSON Database
console.log('🗄️  Initializing JSON Database...');
initializeDatabase().then(() => {
  console.log('✅ Database ready');
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

// Initialize MQTT
if (config.mqtt.enabled) {
  console.log('🔌 Initializing MQTT service...');
  initMQTT({
    host: config.mqtt.host,
    port: config.mqtt.port,
    username: config.mqtt.username,
    password: config.mqtt.password,
  });
} else {
  console.log('⚠️  MQTT disabled in configuration');
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Static file serving for uploaded media
app.use('/media', express.static(path.resolve(config.storage.dir)));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/packages', packagesRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/api/v1/push', pushRouter);
app.use('/api/v1/wa', whatsappRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Smart Parcel Box API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      packages: '/api/v1/packages',
      events: '/api/v1/events',
      devices: '/api/v1/devices',
      whatsapp: '/api/v1/wa',
      push: '/api/v1/push',
      websocket: '/ws/socket.io',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
server.listen(config.port, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Smart Parcel Box - Backend Server       ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${config.port}/ws`);
  console.log(`📁 Storage directory: ${config.storage.dir}`);
  console.log(`🗄️  Database: ${config.database.url}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, io };
