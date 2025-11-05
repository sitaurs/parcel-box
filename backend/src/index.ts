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
import { apiLimiter } from './middleware/rateLimiter';
import { register as metricsRegister } from './services/metrics';

// Import routes
import authRouter from './routes/auth';
import packagesRouter from './routes/packages';
import eventsRouter from './routes/events';
import devicesRouter from './routes/devices'; // includes unlock route
import pushRouter from './routes/push';
import whatsappRouter from './routes/whatsapp';
import notificationsRouter from './routes/notifications';
import adminRouter from './routes/admin';
import { logger } from './utils/logger';

console.log('🚀 [STARTUP] Starting Smart Parcel Backend...');
console.log('🚀 [STARTUP] Node version:', process.version);
console.log('🚀 [STARTUP] ENV:', process.env.NODE_ENV);
console.log('🚀 [STARTUP] PORT:', process.env.PORT);

const app = express();
const server = http.createServer(app);

console.log('🚀 [STARTUP] Express app created');

// Initialize Socket.IO
const io = initializeSocket(server);
console.log('🚀 [STARTUP] Socket.IO initialized');

// Initialize JSON Database (async but non-blocking)
logger.info('🗄️  Initializing JSON Database...');
initializeDatabase().then(() => {
  logger.info('✅ Database ready');
}).catch(err => {
  logger.error('❌ Database initialization failed:', err);
  process.exit(1);
});

console.log('🚀 [STARTUP] Database init started');

// Initialize MQTT
if (config.mqtt.enabled) {
  logger.info('🔌 Initializing MQTT service...');
  initMQTT({
    host: config.mqtt.host,
    port: config.mqtt.port,
    username: config.mqtt.username,
    password: config.mqtt.password,
  });
  console.log('🚀 [STARTUP] MQTT init started');
} else {
  logger.info('⚠️  MQTT disabled in configuration');
}

console.log('🚀 [STARTUP] Setting up middleware...');

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

console.log('🚀 [STARTUP] Middleware configured');

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
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

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metrics = await metricsRegister.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error exporting metrics:', error);
    res.status(500).end('Error exporting metrics');
  }
});
logger.info('📊 Metrics endpoint available at /metrics');

console.log('🚀 [STARTUP] Configuring routes...');

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);
logger.info('🛡️  Rate limiting enabled: 100 req/15min per IP');

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/packages', packagesRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/push', pushRouter);
app.use('/api/v1/wa', whatsappRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/devices', devicesRouter); // includes /:id/unlock

console.log('🚀 [STARTUP] Routes configured');

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

console.log('🚀 [STARTUP] Error handlers configured');

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

console.log('🚀 [STARTUP] Calling server.listen() on port', config.port);

// Start server
server.listen(config.port, () => {
  console.log('🚀 [STARTUP] ✅ server.listen() callback executed!');
  logger.info('╔════════════════════════════════════════════╗');
  logger.info('║   Smart Parcel Box - Backend Server       ║');
  logger.info('╚════════════════════════════════════════════╝');
  logger.info(`🚀 Server running on http://localhost:${config.port}`);
  logger.info(`📡 WebSocket endpoint: ws://localhost:${config.port}/ws`);
  logger.info(`📁 Storage directory: ${config.storage.dir}`);
  logger.info(`🗄️  Database: ${config.database.url}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server, io };
