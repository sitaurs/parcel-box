import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs/promises';
import { config } from './config';

interface WAStatus {
  connected: boolean;
  me?: string;
  error?: string;
  message?: string;
  blocked?: boolean;
  retryAt?: number; // epoch ms when it's safe to try again
  syncing?: boolean; // true when syncing messages/contacts
}

type StatusCallback = (status: WAStatus) => void;
type QRCallback = (qrDataUrl: string) => void;
type PairingCallback = (code: string) => void;

class BaileysService {
  private sock: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isStarting: boolean = false; // Prevent concurrent starts
  private isBlocked: boolean = false; // Prevent auto-reconnect on 405
  private blockedUntil: number | null = null; // epoch ms
  private pairingRequested: boolean = false; // Prevent multiple pairing code requests
  private pairingPhone: string | null = null; // Phone number for pairing code
  private me: string | null = null;
  private sessionDir: string;
  private logger = pino({ level: 'error' });
  
  private statusCallbacks: Set<StatusCallback> = new Set();
  private qrCallbacks: Set<QRCallback> = new Set();
  private pairingCallbacks: Set<PairingCallback> = new Set();

  constructor() {
    this.sessionDir = path.resolve(config.sessionDir);
  }

  /**
   * Register callback for status updates
   */
  onStatusUpdate(callback: StatusCallback) {
    this.statusCallbacks.add(callback);
  }

  /**
   * Register callback for QR code updates
   */
  onQRUpdate(callback: QRCallback) {
    this.qrCallbacks.add(callback);
  }

  /**
   * Register callback for pairing code updates
   */
  onPairingCode(callback: PairingCallback) {
    this.pairingCallbacks.add(callback);
  }

  /**
   * Emit status to all listeners
   */
  private emitStatus(status: WAStatus) {
    this.statusCallbacks.forEach(cb => cb(status));
  }

  /**
   * Emit QR code to all listeners
   */
  private emitQR(qrDataUrl: string) {
    this.qrCallbacks.forEach(cb => cb(qrDataUrl));
  }

  /**
   * Emit pairing code to all listeners
   */
  private emitPairing(code: string) {
    this.pairingCallbacks.forEach(cb => cb(code));
  }

  /**
   * Set phone number for pairing code (must be called BEFORE start)
   */
  setPairingPhone(phone: string) {
    this.pairingPhone = phone.replace(/\+/g, '').trim();
    console.log('📞 Phone number set for pairing:', this.pairingPhone);
  }

  /**
   * Start WhatsApp connection
   */
  async start(): Promise<void> {
    // Prevent concurrent starts - DON'T THROW, just return
    if (this.isStarting) {
      console.log('⚠️  WhatsApp is already starting, please wait...');
      return; // Graceful exit
    }
    
    // Check if already connected
    if (this.sock && this.isConnected) {
      console.log('⚠️  WhatsApp already connected');
      this.emitStatus({ 
        connected: true, 
        me: this.me || undefined,
        message: 'Already connected' 
      });
      return;
    }
    
    // Check if blocked - DON'T THROW, emit status and return
    if (this.isBlocked) {
      console.log('🚫 WhatsApp is BLOCKED (Error 405)');
      console.log('📋 Please wait 5-10 minutes before trying again');
      this.emitStatus({ 
        connected: false, 
        error: 'Blocked by WhatsApp. Wait 5-10 minutes and clear session.',
        blocked: true,
        retryAt: this.blockedUntil || undefined,
      });
      return; // Graceful exit - no throw!
    }

    this.isStarting = true;
    this.pairingRequested = false; // Reset pairing flag on new start
    console.log('🚀 Starting WhatsApp service...');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

  // Use the latest supported WhatsApp Web version (same strategy as CLI)
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log('⚡ Using WhatsApp Web version:', version.join('.'), isLatest ? '(latest)' : '');

      this.sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        logger: this.logger,
  // Use a widely-used browser fingerprint (align with CLI)
  browser: ['Windows', 'Chrome', '114.0.0.0'],
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
      });
      
      // Only emit once at start
      this.emitStatus({ 
        connected: false, 
        message: 'Connecting...' 
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // When QR is ready, generate pairing code instead if phone is set
        if (qr && !this.pairingRequested) {
          // Check if we have a phone number stored
          const pairingPhone = this.pairingPhone || config.defaultPhone?.trim() || null;
          
          if (pairingPhone) {
            // Generate pairing code
            this.pairingRequested = true;
            try {
              const phone = pairingPhone.replace(/\+/g, '');
              const code = await this.sock!.requestPairingCode(phone);
              console.log('🔐 Pairing code generated:', code);
              this.emitPairing(code);
              this.emitStatus({ connected: false, message: 'Pairing code generated - enter on your phone' });
            } catch (err) {
              console.error('❌ Failed to generate pairing code:', err);
              this.pairingRequested = false;
            }
          } else {
            console.log('⚠️ No phone number set. Cannot generate pairing code.');
            this.emitStatus({ connected: false, error: 'Phone number required for pairing code' });
          }
        }

        if (connection === 'close') {
          this.sock = null;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const errorMsg = lastDisconnect?.error?.message || '';
          
          console.log('❌ WhatsApp connection closed');
          console.log('   Status code:', statusCode);
          if (errorMsg) console.log('   Error:', errorMsg);
          
          this.isConnected = false;
          this.sock = null;

          // Handle different disconnection reasons (Baileys Documentation - Section 3.4)
          if (statusCode === 405) {
            // Error 405 = Connection BLOCKED by WhatsApp
            // Dokumentasi Baileys Section 3.4: JANGAN auto-reconnect!
            console.log('');
            console.log('🚫🚫🚫 ERROR 405: CONNECTION BLOCKED BY WHATSAPP 🚫🚫🚫');
            console.log('');
            console.log('📋 Kemungkinan penyebab:');
            console.log('   1. Terlalu banyak percobaan koneksi dalam waktu singkat');
            console.log('   2. WhatsApp mendeteksi aktivitas mencurigakan');
            console.log('   3. IP address atau nomor HP di-flag sementara');
            console.log('');
            console.log('🔧 Solusi:');
            console.log('   ✅ Session sudah AUTO-CLEARED');
            console.log('   ⏳ TUNGGU 5-10 MENIT sebelum coba lagi');
            console.log('   🔄 Jangan restart berulang kali (makin di-block!)');
            console.log('   📱 Pastikan WhatsApp Web di HP tidak sedang aktif');
            console.log('');
            
            // Set blocked flag - prevent auto-reconnect and new start attempts
            this.isBlocked = true;
            this.blockedUntil = Date.now() + 10 * 60 * 1000;
            this.isConnected = false;
            this.sock = null;
            this.isStarting = false;
            
            // Auto-clear corrupted session
            try {
              const fsSync = await import('fs');
              if (fsSync.existsSync(this.sessionDir)) {
                await fs.rm(this.sessionDir, { recursive: true, force: true });
                console.log('✅ Session folder deleted');
              }
            } catch (err) {
              console.error('❌ Failed to delete session:', err);
            }
            
            this.emitStatus({ 
              connected: false, 
              error: 'Error 405: WhatsApp BLOCKED. Wait 5-10 minutes before trying again.',
              blocked: true,
              retryAt: this.blockedUntil,
            });
            
            // Auto-unblock after 10 minutes (safety)
            setTimeout(() => {
              this.isBlocked = false;
              this.blockedUntil = null;
              console.log('✅ Block flag cleared - you can try again now');
              this.emitStatus({ connected: false, message: 'Block window ended. You can try again.' });
            }, 10 * 60 * 1000);
            
            // DO NOT reconnect!
            return;
            
          } else if (statusCode === DisconnectReason.loggedOut) {
            // User logged out from phone - clear session
            console.log('❌ Logged out from phone - session invalidated');
            this.isStarting = false;
            this.emitStatus({ 
              connected: false, 
              error: 'Logged out - Please scan QR code again' 
            });
            // DO NOT reconnect
            return;
            
          } else if (statusCode === DisconnectReason.restartRequired) {
            // Normal WhatsApp protocol - requires restart after initial QR scan
            console.log('🔄 Restart required (normal after QR scan)');
            this.isStarting = false;
            this.emitStatus({ connected: false, message: 'Restart required - Click Start again' });
            // DO NOT auto-reconnect - let user manually start
            return;
            
          } else if (errorMsg.includes('conflict') || statusCode === 409) {
            // Multiple devices conflict
            console.log('⚠️  CONFLICT: Multiple WhatsApp Web sessions detected');
            this.isStarting = false;
            this.emitStatus({ 
              connected: false, 
              error: 'Conflict: Logout from other devices first' 
            });
            // DO NOT auto-reconnect
            return;
            
          } else if (errorMsg.includes('timedOut') || errorMsg.includes('timeout')) {
            // Network timeout
            console.log('⏱️  Connection timeout');
            this.isStarting = false;
            this.emitStatus({ connected: false, error: 'Timeout - Check internet connection' });
            // DO NOT auto-reconnect
            return;
            
          } else {
            // Unknown disconnection
            console.log(`❌ Disconnected (code: ${statusCode || 'unknown'})`);
            this.isStarting = false;
            this.emitStatus({ connected: false, message: 'Disconnected' });
            // DO NOT auto-reconnect
            return;
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connected!');
          this.isConnected = true;
          this.isStarting = false; // Connection successful
          this.qrCode = null;

          if (this.sock?.user?.id) {
            this.me = this.sock.user.id.split(':')[0] || null;
            console.log('📡 User ID:', this.me);
          }

          // Emit connecting status with syncing message
          this.emitStatus({ 
            connected: false, 
            message: 'Syncing messages and contacts...',
            syncing: true 
          });

          // Fallback: If receivedPendingNotifications doesn't fire within 10s, mark as connected
          setTimeout(() => {
            if (this.isConnected && !this.sock) return; // Already disconnected
            if (this.isConnected) {
              console.log('✅ Sync completed (timeout fallback)');
              this.emitStatus({ 
                connected: true, 
                me: this.me || undefined,
                message: 'Connected!' 
              });
            }
          }, 10000);
        } else if (connection === 'connecting') {
          console.log('🔄 Connecting to WhatsApp...');
          this.emitStatus({ 
            connected: false, 
            message: 'Connecting...' 
          });
        }

        // Handle sync completion (primary method)
        if (update.receivedPendingNotifications) {
          console.log('✅ Sync completed (receivedPendingNotifications)!');
          this.emitStatus({ 
            connected: true, 
            me: this.me || undefined,
            message: 'Connected and synced!' 
          });
        }
      });

      // Save credentials on update
      this.sock.ev.on('creds.update', saveCreds);

      console.log('🚀 WhatsApp service started');
    } catch (error) {
      console.error('❌ Error starting WhatsApp:', error);
      this.sock = null;
      this.isStarting = false; // Reset on error
      throw error;
    }
  }

  /**
   * Stop WhatsApp connection (preserve session)
   */
  async stop(): Promise<void> {
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
      this.isConnected = false;
      this.qrCode = null;

      this.emitStatus({ connected: false, message: 'Connection closed (session preserved)' });
      console.log('⏹️  WhatsApp connection closed (session preserved)');
    }
  }

  /**
   * Clear session (logout + delete auth data)
   */
  async clearSession(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    
  this.isConnected = false;
  this.isStarting = false; // Allow restart after clear
  this.isBlocked = false; // Unblock after manual clear
  this.blockedUntil = null;
  this.pairingRequested = false; // Reset pairing flag
    this.qrCode = null;
    this.me = null;

    try {
      const fsSync = await import('fs');
      if (fsSync.existsSync(this.sessionDir)) {
        await fs.rm(this.sessionDir, { recursive: true, force: true });
        console.log('✅ Session cleared:', this.sessionDir);
      }
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }

  this.emitStatus({ connected: false, message: 'Session cleared', blocked: false, retryAt: undefined });
    console.log('🗑️  WhatsApp session cleared');
  }

  /**
   * Explicitly request a pairing code (if socket is ready and not registered)
   */
  async requestPairingCode(phone?: string): Promise<string> {
    if (!this.sock) {
      throw new Error('Socket not initialized. Call /api/wa/start first.');
    }
    
    this.pairingRequested = true; // Set flag to suppress QR generation
    
    const num = (phone || config.defaultPhone || '').replace(/\+/g, '').trim();
    if (!num) {
      throw new Error('Phone number is required to request pairing code');
    }
    
    // @ts-ignore - requestPairingCode exists on WASocket in recent Baileys
    const code: string = await this.sock.requestPairingCode(num);
    console.log('🔐 Pairing code generated:', code);
    this.emitPairing(code);
    this.emitStatus({ connected: false, message: 'Pairing code generated - enter on your phone' });
    return code;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      me: this.me,
      qrCode: this.qrCode,
      blocked: this.isBlocked,
      retryAt: this.blockedUntil || undefined,
    };
  }

  /**
   * Send text message
   */
  async sendMessage(to: string, text: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text });
    console.log('📤 Message sent to', jid);
  }

  /**
   * Send image with caption
   */
  async sendImage(to: string, imageBuffer: Buffer, caption?: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption || '',
    });

    console.log('📤 Image sent to', jid);
  }

  /**
   * Check if WhatsApp is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

export const baileysService = new BaileysService();
