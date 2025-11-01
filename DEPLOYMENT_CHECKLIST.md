# 🚀 Production Deployment Checklist

## 📋 Pre-Deployment Security Audit

### ✅ Backend Security (COMPLETED)

- [x] **MQTT Credentials Protected**
  - ✅ Hardcoded credentials removed from `backend/src/config.ts`
  - ✅ Production validation added - will throw error if MQTT_USER/MQTT_PASS not set
  - ✅ `.env.example` updated with MQTT variables
  - ⚠️ **ACTION REQUIRED**: Set `MQTT_USER` and `MQTT_PASS` in VPS `.env` file

- [x] **JWT Security**
  - ✅ Production validation enforces strong JWT_SECRET
  - ✅ 7-day expiration configured
  - ✅ Token refresh endpoint implemented

- [x] **API Token Security**
  - ✅ Device API token validation in place
  - ✅ Production requires non-default API_TOKEN

- [x] **Authentication Middleware**
  - ✅ JWT verification secure
  - ✅ Token expiration handled
  - ✅ User validation from database

- [x] **File Upload Security**
  - ✅ MIME type filtering (only JPEG/PNG)
  - ✅ File size limits (10MB max)
  - ✅ UUID-based filenames prevent path traversal

### ✅ PWA/APK Security (COMPLETED)

- [x] **Hardcoded URLs Fixed**
  - ✅ No localhost hardcoded in production code paths
  - ✅ All services use VPS IP fallback (13.213.57.228)
  - ✅ Platform detection for native vs web
  - ✅ Files fixed:
    - `pwa/src/pages/WhatsApp.tsx`
    - `pwa/src/lib/whatsapp-api.ts`
    - `pwa/src/lib/socket.ts`
    - `pwa/src/lib/api.ts`

- [x] **Environment Configuration**
  - ✅ `.env.production` properly configured
  - ✅ Build script includes VITE_WA_API_URL
  - ✅ Capacitor config allows HTTP cleartext for VPS

- [x] **Capacitor Configuration**
  - ✅ `androidScheme: 'http'` for VPS connection
  - ✅ `cleartext: true` prevents mixed content errors

### ⚠️ Known Development Artifacts (NON-CRITICAL)

- ⚠️ **Console.log Statements**
  - Backend: ~150 instances (mostly in services/MQTT, routes)
  - PWA: ~50 instances (mostly in AuthContext.tsx)
  - **Impact**: Minimal in production (helpful for debugging)
  - **Status**: Acceptable for current deployment
  - **Future**: Consider logger wrapper with production filtering

---

## 🔧 VPS Deployment Steps

### 1. Prepare VPS Environment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Mosquitto MQTT Broker
sudo apt install -y mosquitto mosquitto-clients

# Configure Mosquitto authentication
sudo mosquitto_passwd -c /etc/mosquitto/passwd smartbox
# Enter password: engganngodinginginmcu (or your custom password)

# Create Mosquitto config
sudo nano /etc/mosquitto/conf.d/default.conf
```

Add to `default.conf`:
```conf
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
```

```bash
# Restart Mosquitto
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

### 2. Deploy Backend

```bash
# Clone/upload project
cd /opt
sudo mkdir smartparcel
sudo chown $USER:$USER smartparcel
cd smartparcel

# Copy backend files
# (upload via scp, rsync, or git)

cd backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**CRITICAL - Add to backend `.env`:**
```env
NODE_ENV=production
PORT=8080

# SECURITY - Generate strong secrets!
JWT_SECRET=<generate-strong-random-string-here>
API_TOKEN=<generate-strong-random-string-here>

# MQTT Credentials - REQUIRED IN PRODUCTION
MQTT_HOST=13.213.57.228
MQTT_PORT=1883
MQTT_USER=smartbox
MQTT_PASS=engganngodinginginmcu
MQTT_ENABLED=true

# Storage
STORAGE_DIR=/opt/smartparcel/backend/storage

# Database
DATABASE_URL=file:/opt/smartparcel/backend/prisma/db.sqlite

# VAPID Keys (optional - for push notifications)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=admin@example.com

# CORS (adjust as needed)
CORS_ORIGIN=*
```

```bash
# Build TypeScript
npm run build

# Create storage directory
mkdir -p storage

# Start with PM2
pm2 start dist/index.js --name smartparcel-backend
pm2 save
pm2 startup
```

### 3. Deploy WhatsApp Service

```bash
cd /opt/smartparcel/wa

# Install dependencies
npm install --production

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name smartparcel-whatsapp -p 3001
pm2 save
```

### 4. Setup Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8080/tcp  # Backend API
sudo ufw allow 3001/tcp  # WhatsApp service
sudo ufw allow 1883/tcp  # MQTT
sudo ufw enable
```

### 5. Test Backend

```bash
# Check services
pm2 list

# Check logs
pm2 logs smartparcel-backend
pm2 logs smartparcel-whatsapp

# Test API
curl http://localhost:8080/api/v1/health

# Test from outside
curl http://13.213.57.228:8080/api/v1/health
```

---

## 📱 APK Build Steps

### 1. Build Production APK

```powershell
# On Windows development machine
cd d:\projct\projek_cdio

# Run production build script
.\build-production.ps1

# When prompted, enter VPS IP: 13.213.57.228
```

This script will:
1. Update `pwa/.env.production` with VPS IP
2. Build PWA bundle
3. Sync to Capacitor
4. Build Android APK (debug)
5. Output: `smartparcel-13.213.57.228.apk`

### 2. Manual Build (Alternative)

```powershell
cd pwa

# 1. Update .env.production
# Ensure all VITE_* vars point to VPS

# 2. Build PWA
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Build APK
cd android
.\gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Install APK on Device

**Option A: USB Debugging**
```bash
adb install -r smartparcel-13.213.57.228.apk
```

**Option B: Transfer & Install**
1. Copy APK to phone via USB/cloud
2. Enable "Install from Unknown Sources"
3. Tap APK file to install

---

## 🧪 Testing Checklist

### Backend Testing

- [ ] Backend starts without errors
- [ ] MQTT broker connects successfully
- [ ] WebSocket connections work
- [ ] API endpoints respond (use Swagger: `http://13.213.57.228:8080/api-docs`)
- [ ] File uploads work
- [ ] Authentication works (login/logout)
- [ ] Device registration works

### WhatsApp Service Testing

- [ ] WhatsApp service starts
- [ ] Can generate QR code
- [ ] Can scan and connect
- [ ] Can send test message
- [ ] Notifications queue works

### APK Testing

- [ ] APK installs without errors
- [ ] App opens (no crash on launch)
- [ ] **Login** works with VPS backend
- [ ] **Dashboard** loads packages
- [ ] **Device Control** page connects
- [ ] **Packages** page shows list
- [ ] **WhatsApp** page can scan QR
- [ ] **Lock/Unlock** commands work
- [ ] **Notifications** show in history
- [ ] **Dark Mode** toggle works
- [ ] **No force close** during normal use
- [ ] **No lag** or stuttering

### Network Testing

- [ ] MQTT: Device → Broker → Backend
- [ ] HTTP API: APK → VPS:8080
- [ ] WebSocket: APK → VPS:8080
- [ ] WhatsApp WS: APK → VPS:3001

---

## 🔐 Security Best Practices

### MUST DO Before Production

1. **Change Default Passwords**
   - ✅ Admin user password (already changed)
   - ⚠️ MQTT broker password
   - ⚠️ Generate new JWT_SECRET
   - ⚠️ Generate new API_TOKEN

2. **Generate Strong Secrets**
   ```bash
   # Generate JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Generate API_TOKEN
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Restrict CORS** (if needed)
   ```env
   CORS_ORIGIN=http://13.213.57.228
   ```

4. **Setup HTTPS** (recommended)
   - Install Nginx as reverse proxy
   - Get SSL certificate (Let's Encrypt)
   - Update APK to use `https://` URLs

### OPTIONAL but Recommended

- Setup Sentry for error tracking
- Configure VAPID keys for push notifications
- Setup database backups
- Monitor logs with PM2
- Setup log rotation

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs smartparcel-backend --lines 50

# Common issues:
# 1. Missing MQTT credentials → Check .env has MQTT_USER and MQTT_PASS
# 2. Port already in use → kill process on port 8080
# 3. Database locked → rm backend/prisma/db.sqlite-journal
```

### APK Can't Connect to VPS

1. Check VPS firewall allows port 8080/3001
2. Verify `.env.production` has correct VPS IP
3. Rebuild APK with correct IP
4. Check VPS backend is running: `pm2 list`
5. Test from browser: `http://13.213.57.228:8080/api/v1/health`

### WhatsApp Not Connecting

1. Check WhatsApp service running: `pm2 list`
2. Check logs: `pm2 logs smartparcel-whatsapp`
3. Delete old session: `rm -rf /opt/smartparcel/wa/wa-session/*`
4. Restart service: `pm2 restart smartparcel-whatsapp`

### MQTT Issues

```bash
# Test MQTT connection
mosquitto_sub -h 13.213.57.228 -t 'smartparcel/#' -u smartbox -P engganngodinginginmcu

# Check Mosquitto logs
sudo journalctl -u mosquitto -f

# Restart Mosquitto
sudo systemctl restart mosquitto
```

---

## 📊 Performance Optimization

### Backend

- [ ] Enable compression middleware
- [ ] Setup Redis for session storage (future)
- [ ] Configure database connection pooling
- [ ] Monitor memory usage: `pm2 monit`

### APK

- [ ] Current bundle size: ~317KB (excellent!)
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Service worker configured

---

## 📝 Post-Deployment

### Monitoring

```bash
# View all services
pm2 list

# Monitor resources
pm2 monit

# View logs
pm2 logs

# Restart if needed
pm2 restart all
```

### Backup Strategy

```bash
# Backup data files
tar -czf backup-$(date +%Y%m%d).tar.gz \
  backend/data/ \
  backend/prisma/db.sqlite \
  backend/storage/ \
  wa/wa-session/

# Store backups securely
```

---

## ✅ Final Checks

- [ ] All environment variables set
- [ ] Backend running and accessible
- [ ] WhatsApp service running
- [ ] MQTT broker running
- [ ] Firewall configured
- [ ] APK built and tested
- [ ] All features work end-to-end
- [ ] No crashes or force closes
- [ ] UI is professional and responsive
- [ ] Documentation updated
- [ ] Default passwords changed
- [ ] Secrets generated

---

## 📞 Support

If issues persist:
1. Check PM2 logs: `pm2 logs`
2. Check system logs: `sudo journalctl -xe`
3. Verify all services running: `pm2 list`
4. Test network connectivity
5. Review this checklist again

**Deployment Status**: ✅ Ready for VPS deployment and APK build!
