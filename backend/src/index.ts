import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
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
import lockRouter from './routes/lock';
import notificationsRouter from './routes/notifications';
import adminRouter from './routes/admin';

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
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const users = await require('./services/database').db.getUsers();
    const dbHealthy = Array.isArray(users);

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
      database: {
        status: dbHealthy ? 'connected' : 'error',
        users: dbHealthy ? users.length : 0,
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };

    res.status(dbHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Smart Parcel Box API Docs',
}));

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/packages', packagesRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/api/v1/push', pushRouter);
app.use('/api/v1/wa', whatsappRouter);
app.use('/api/v1/devices', lockRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/admin', adminRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Smart Parcel Box API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      packages: '/api/v1/packages',
      events: '/api/v1/events',
      devices: '/api/v1/devices',
      lock: '/api/v1/devices/:id/lock',
      notifications: '/api/v1/notifications',
      whatsapp: '/api/v1/wa',
      push: '/api/v1/push',
      admin: '/api/v1/admin',
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
