import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { baileysService } from './baileys';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time QR code updates
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
  path: '/socket.io',
});

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Register callbacks for baileys events
baileysService.onStatusUpdate((status) => {
  io.emit('wa_status', status);
  console.log('📡 Status update:', status);
});

baileysService.onQRUpdate((qrDataUrl) => {
  io.emit('qr_update', { dataUrl: qrDataUrl });
  console.log('📱 QR code update emitted');
});

// Pairing code events
baileysService.onPairingCode((code) => {
  io.emit('pairing_code', { code });
  console.log('🔐 Pairing code emitted:', code);
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Send current status on connect
  socket.emit('wa_status', baileysService.getStatus());

  socket.on('disconnect', () => {
    console.log('⚡ Client disconnected:', socket.id);
  });
});

// === API Routes ===

/**
 * GET /health
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'whatsapp-backend',
    uptime: process.uptime(),
  });
});

/**
 * POST /api/wa/start
 * Start WhatsApp service
 * Body: { phone?: string } - phone number for pairing code
 */
app.post('/api/wa/start', async (req: Request, res: Response) => {
  try {
    const currentStatus = baileysService.getStatus();
    
    // Check if already connected
    if (currentStatus.connected) {
      console.log('⚠️  WhatsApp already connected');
      res.json({
        message: 'WhatsApp already connected',
        status: currentStatus,
      });
      return;
    }
    
    const { phone } = req.body || {};
    
    // Set phone number if provided (for pairing code)
    if (phone) {
      baileysService.setPairingPhone(phone);
    }
    
    await baileysService.start();
    res.json({
      message: 'WhatsApp service started',
      status: baileysService.getStatus(),
    });
  } catch (error: any) {
    console.error('❌ Error starting WhatsApp:', error);
    res.status(500).json({ error: error.message || 'Failed to start' });
  }
});

/**
 * POST /api/wa/pairing-code
 * Generate pairing code (requires started socket)
 * Body: { phone?: string }
 */
app.post('/api/wa/pairing-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body || {};
    const code = await baileysService.requestPairingCode(phone);
    res.json({ code });
  } catch (error: any) {
    console.error('❌ Error generating pairing code:', error);
    res.status(400).json({ error: error.message || 'Failed to generate pairing code' });
  }
});

/**
 * POST /api/wa/stop
 * Stop WhatsApp service (preserve session)
 */
app.post('/api/wa/stop', async (req: Request, res: Response) => {
  try {
    await baileysService.stop();
    res.json({ message: 'WhatsApp connection closed (session preserved)' });
  } catch (error: any) {
    console.error('❌ Error stopping WhatsApp:', error);
    res.status(500).json({ error: error.message || 'Failed to stop' });
  }
});

/**
 * POST /api/wa/clear-session
 * Clear session (logout + delete auth)
 */
app.post('/api/wa/clear-session', async (req: Request, res: Response) => {
  try {
    await baileysService.clearSession();
    res.json({ message: 'WhatsApp session cleared' });
  } catch (error: any) {
    console.error('❌ Error clearing session:', error);
    res.status(500).json({ error: error.message || 'Failed to clear session' });
  }
});

/**
 * GET /api/wa/status
 * Get connection status
 */
app.get('/api/wa/status', (req: Request, res: Response) => {
  res.json(baileysService.getStatus());
});

/**
 * POST /api/wa/send
 * Send message or image
 */
app.post('/api/wa/send', async (req: Request, res: Response) => {
  try {
    const { to, text, image, caption } = req.body;

    if (!to) {
      res.status(400).json({ error: 'Recipient (to) is required' });
      return;
    }

    if (!baileysService.isReady()) {
      res.status(503).json({ error: 'WhatsApp not connected' });
      return;
    }

    if (image) {
      // Expect base64 image
      const imageBuffer = Buffer.from(image, 'base64');
      await baileysService.sendImage(to, imageBuffer, caption || text);
    } else if (text) {
      await baileysService.sendMessage(to, text);
    } else {
      res.status(400).json({ error: 'Either text or image is required' });
      return;
    }

    res.json({ message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: error.message || 'Failed to send' });
  }
});

/**
 * POST /api/wa/send-package
 * Send package notification with photo
 * Called by backend main when new package detected
 */
app.post('/api/wa/send-package', async (req: Request, res: Response) => {
  try {
    const { to, caption, photoBase64, packageData } = req.body;

    if (!to) {
      res.status(400).json({ error: 'Recipient (to) is required' });
      return;
    }

    if (!photoBase64) {
      res.status(400).json({ error: 'Photo (photoBase64) is required' });
      return;
    }

    if (!baileysService.isReady()) {
      console.log('⚠️  WhatsApp not connected, queuing notification...');
      res.status(503).json({ 
        error: 'WhatsApp not connected',
        queued: false,
        packageData 
      });
      return;
    }

    // Convert base64 to buffer
    const photoBuffer = Buffer.from(photoBase64, 'base64');
    
    // Send via WhatsApp with caption
    await baileysService.sendImage(to, photoBuffer, caption);
    
    console.log('✅ Package notification sent to WhatsApp:', to);
    res.json({ 
      success: true,
      message: 'Package notification sent',
      packageData 
    });
  } catch (error: any) {
    console.error('❌ Error sending package notification:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to send package notification',
      packageData: req.body.packageData
    });
  }
});

/**
 * POST /api/send-message
 * Simple endpoint to send text message (used by PWA for testing)
 */
app.post('/api/send-message', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      res.status(400).json({ error: 'phone and message are required' });
      return;
    }

    if (!baileysService.isReady()) {
      res.status(503).json({ error: 'WhatsApp not connected' });
      return;
    }

    await baileysService.sendMessage(phone, message);
    
    console.log(`✅ Test message sent to ${phone}`);
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('❌ Error sending test message:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'WhatsApp Backend Service',
    version: '1.0.0',
    status: baileysService.getStatus(),
    endpoints: {
      health: '/health',
      start: 'POST /api/wa/start',
      stop: 'POST /api/wa/stop',
      clearSession: 'POST /api/wa/clear-session',
      status: 'GET /api/wa/status',
      send: 'POST /api/wa/send',
      sendMessage: 'POST /api/send-message',
      sendPackage: 'POST /api/wa/send-package',
    },
  });
});

// Start server
server.listen(config.port, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   WhatsApp Backend Service - Standalone   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`🚀 Server: http://localhost:${config.port}`);
  console.log(`📡 Socket.IO: ws://localhost:${config.port}/socket.io`);
  console.log(`📁 Session: ${config.sessionDir}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
