# 📦 Smart Parcel Box - IoT Package Management System

> **Modern IoT solution for automated package detection and management using ESP32-CAM with real-time notifications via WhatsApp**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2020.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)

---

## 🌟 Features

### 📱 Progressive Web App (PWA)
- **Cross-platform**: Works on desktop, mobile, and can be installed as native app (Android APK)
- **Real-time Dashboard**: Live package tracking with WebSocket updates
- **PIN Security**: Auto-lock with biometric-style PIN authentication (mobile only)
- **Dark Mode**: System-aware theme with manual toggle
- **Gallery View**: Browse captured package photos with thumbnails
- **Device Control**: Remote control ESP32-CAM settings (threshold, buzzer, pipeline)

### 📸 ESP32-CAM Integration
- **Automatic Detection**: Ultrasonic sensor triggers photo capture
- **Image Processing**: JPEG compression with thumbnail generation
- **MQTT Communication**: Efficient real-time data transmission
- **Settings Sync**: Remote configuration updates via WebSocket

### 💬 WhatsApp Notifications
- **Multi-recipient**: Send alerts to multiple phone numbers
- **QR/Pairing Code**: Flexible authentication methods
- **Status Monitoring**: Real-time connection status with auto-reconnect
- **Activity Logs**: Terminal-style event logging

### 🔐 Security & Authentication
- **JWT Tokens**: 7-day expiry with automatic refresh
- **bcrypt Hashing**: Secure password storage (10 rounds)
- **PIN System**: User-specific PIN with validation
- **API Token**: Device authentication for ESP32 uploads
- **Production Guards**: Enforced environment variable validation

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   ESP32-CAM     │────▶│  Backend Server  │◀────│   PWA Client    │
│   (Device)      │MQTT │   (Port 8080)    │ WS  │  (Vite + React) │
└─────────────────┘     │                  │     └─────────────────┘
                        │  - REST API      │              │
                        │  - WebSocket     │              │
                        │  - MQTT Broker   │              │
                        │  - SQLite DB     │              │
                        └──────────────────┘              │
                                 │                        │
                                 │ HTTP                  │
                                 ▼                        │
                        ┌──────────────────┐              │
                        │  WA Service      │              │
                        │  (Port 3001)     │◀─────────────┘
                        │  - Baileys       │ WebSocket
                        │  - QR/Pairing    │
                        └──────────────────┘
```

### Tech Stack

**Frontend (PWA):**
- React 18 + TypeScript
- Vite 5.4 (build tool)
- Tailwind CSS 3 (styling)
- Capacitor 6.2 (native mobile)
- Socket.IO Client (WebSocket)
- Lucide React (icons)

**Backend (Main):**
- Node.js 22+ / TypeScript
- Express 4 (REST API)
- Socket.IO (WebSocket server)
- Prisma (SQLite ORM)
- Multer (file uploads)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- mqtt (MQTT client)

**Backend (WhatsApp):**
- Node.js 22+ / TypeScript
- Express 4 (REST API)
- Socket.IO (WebSocket server)
- Baileys 6.7 (WhatsApp library)
- QRCode (QR generation)

**Hardware:**
- ESP32-CAM (AI Thinker module)
- HC-SR04 (ultrasonic sensor)
- Buzzer (notification)
- Servo motor (optional lock)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20.0.0 ([Download](https://nodejs.org/))
- **npm** ≥ 10.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Android Studio** (for APK build, optional)

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/sitaurs/parcel-box.git
cd parcel-box
```

#### 2️⃣ Setup Backend (Main Server)
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# CRITICAL: Set strong JWT_SECRET and API_TOKEN for production!
nano .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data (admin user)
npm run prisma:seed

# Build TypeScript
npm run build

# Start server
npm start
```

**Backend runs on:** `http://localhost:8080`

#### 3️⃣ Setup WhatsApp Service
```bash
cd ../wa
npm install

# Copy environment template
cp .env.example .env

# Edit .env (default port 3001)
nano .env

# Build TypeScript
npm run build

# Start service
npm start
```

**WhatsApp service runs on:** `http://localhost:3001`

#### 4️⃣ Setup PWA Frontend
```bash
cd ../pwa
npm install

# Copy environment template
cp .env.example .env

# Edit .env with backend URLs
nano .env

# Start development server
npm run dev
```

**PWA runs on:** `http://localhost:5173`

---

## 🔧 Configuration

### Backend (.env)

```bash
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=file:./db.sqlite

# Storage
STORAGE_DIR=./storage

# Security (REQUIRED IN PRODUCTION!)
JWT_SECRET=your_super_secret_jwt_key_change_this
API_TOKEN=your_device_api_token_change_this
ADMIN_PASSWORD=YourSecureAdminPassword123

# VAPID Keys (Web Push - Optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=admin@smartparcel.com

# WhatsApp Service
WA_API_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:5173
```

### WhatsApp Service (.env)

```bash
# Server
PORT=3001
NODE_ENV=development

# WhatsApp Session
SESSION_DIR=./wa-session

# Default recipients (comma-separated)
DEFAULT_RECIPIENTS=628123456789,628987654321

# CORS
CORS_ORIGIN=*
```

### PWA (.env)

```bash
# Development
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=http://localhost:8080
VITE_WA_API_URL=http://localhost:3001
VITE_WA_WS_URL=http://localhost:3001

# Production (Example)
# VITE_PROD_API_URL=http://your-vps-ip:8080/api/v1
# VITE_PROD_WS_URL=http://your-vps-ip:8080
# VITE_WA_API_URL=http://your-vps-ip:3001
# VITE_PROD_WA_WS_URL=http://your-vps-ip:3001
```

---

## 📱 Building Android APK

### Setup Android SDK

#### Windows (PowerShell)
```powershell
# Run automated installer
.\install-android-sdk.ps1
```

#### Manual Setup
1. Install [Android Studio](https://developer.android.com/studio)
2. Install SDK Platform 34 + Build Tools 34.0.0
3. Set environment variables:
   ```bash
   ANDROID_HOME=C:\Users\YourUser\AppData\Local\Android\Sdk
   ```

### Build APK

```bash
cd pwa

# Build production assets
npm run build

# Sync Capacitor
npx cap sync android

# Build APK
cd android
.\gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Install APK on Device
```bash
# Via USB debugging
adb install -r app-debug.apk

# Or copy APK to device and install manually
```

---

## 🌐 Deployment (VPS)

### Server Requirements
- Ubuntu 20.04+ / Debian 11+
- Node.js 20+
- Nginx (optional, for reverse proxy)
- PM2 (process manager)
- 2GB RAM minimum
- 10GB storage

### Setup Script (Ubuntu)
```bash
# Upload setup-vps.sh to server
scp setup-vps.sh user@your-vps-ip:/home/user/

# SSH to server
ssh user@your-vps-ip

# Run setup
chmod +x setup-vps.sh
./setup-vps.sh
```

### Manual Deployment

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/sitaurs/parcel-box.git
cd parcel-box

# Setup backend
cd backend
npm install
cp .env.example .env
nano .env  # Edit with production values!
npm run build
pm2 start dist/index.js --name smartparcel-backend

# Setup WhatsApp service
cd ../wa
npm install
cp .env.example .env
nano .env
npm run build
pm2 start dist/index.js --name smartparcel-whatsapp

# Save PM2 configuration
pm2 save
pm2 startup
```

### Environment Variables (Production)

**CRITICAL:** Set these in production `.env`:
```bash
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
API_TOKEN=$(openssl rand -hex 16)
ADMIN_PASSWORD=YourSecurePassword123!
CORS_ORIGIN=http://your-vps-ip:5173,http://your-vps-ip:8080
```

### Nginx Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/smartparcel
server {
    listen 80;
    server_name your-domain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # WhatsApp Service
    location /wa {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 📡 API Documentation

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@2025"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### Change Password
```http
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "Admin@2025",
  "newPassword": "NewSecure@2025"
}

Response: 200 OK
{
  "message": "Password changed successfully"
}
```

### Packages

#### Get Packages
```http
GET /api/v1/packages?limit=10&sort=-createdAt
Authorization: Bearer <token>

Response: 200 OK
{
  "packages": [
    {
      "id": "pkg_123",
      "deviceId": "ESP32_001",
      "photoUrl": "/media/2025/10/photo.jpg",
      "thumbUrl": "/media/2025/10/thumb.jpg",
      "tsDetected": "2025-10-30T10:30:00Z",
      "status": "captured"
    }
  ],
  "total": 50
}
```

#### Upload Package (ESP32)
```http
POST /api/v1/packages/upload
Authorization: Bearer <API_TOKEN>
Content-Type: multipart/form-data

deviceId: ESP32_001
photo: <binary file>

Response: 200 OK
{
  "id": "pkg_123",
  "photoUrl": "/media/2025/10/photo.jpg",
  "thumbUrl": "/media/2025/10/thumb.jpg"
}
```

### Devices

#### Get Devices
```http
GET /api/v1/devices
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "ESP32_001",
    "name": "Main Box",
    "online": true,
    "lastSeen": "2025-10-30T10:30:00Z"
  }
]
```

#### Send Control Command
```http
POST /api/v1/devices/:deviceId/control
Authorization: Bearer <token>
Content-Type: application/json

{
  "buzzer": { "stop": true }
}
// OR
{
  "threshold": 10
}
// OR
{
  "pipeline": { "stop": true }
}

Response: 200 OK
{
  "message": "Control sent"
}
```

### WhatsApp

#### Start WhatsApp
```http
POST http://localhost:3001/api/wa/start
Content-Type: application/json

{
  "phoneNumber": "628123456789"  // Optional, for pairing code
}

Response: 200 OK
{
  "message": "Starting WhatsApp..."
}

// Listen on WebSocket for:
// - 'qr_update' event (QR code data URL)
// - 'pairing_code' event (pairing code string)
// - 'wa_status' event (connection status)
```

#### Send Message
```http
POST http://localhost:3001/api/wa/send
Content-Type: application/json

{
  "to": "628123456789",
  "text": "📦 New package detected!",
  "imageUrl": "http://localhost:8080/media/2025/10/photo.jpg"
}

Response: 200 OK
{
  "messageId": "3EB0...",
  "status": "sent"
}
```

### WebSocket Events

#### Main Backend (Port 8080)

**Client → Server:**
- `join_room`: Join device room for updates
- `device:control`: Send control command

**Server → Client:**
- `package_new`: New package detected
- `device:status`: Device online/offline status
- `event`: General system events
- `control_ack`: Control command acknowledged
- `distance_update`: Live distance sensor data

#### WhatsApp Service (Port 3001)

**Server → Client:**
- `wa_status`: Connection status
- `qr_update`: QR code for linking
- `pairing_code`: Pairing code for phone linking
- `wa_connection_status`: Socket connection status

---

## 🔌 ESP32-CAM Integration

### Required Libraries (Arduino)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>  // MQTT
#include "esp_camera.h"
#include <ArduinoJson.h>
```

### Configuration
```cpp
// firmware/include/config.h.example
const char* WIFI_SSID = "YourWiFiSSID";
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* MQTT_SERVER = "your-vps-ip";
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "ESP32_001";
const char* API_TOKEN = "your_device_token";
```

### MQTT Topics
- **Subscribe:** `smartparcel/<DEVICE_ID>/control` (receive commands)
- **Publish:** `smartparcel/<DEVICE_ID>/distance` (sensor data)
- **Publish:** `smartparcel/<DEVICE_ID>/status` (device status)

### Photo Upload
```cpp
// HTTP POST to backend
String serverPath = "http://your-vps-ip:8080/api/v1/packages/upload";
// Add Authorization header with API_TOKEN
// Send multipart/form-data with:
//   - deviceId: ESP32_001
//   - photo: <captured JPEG>
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test  # (if test suite configured)
```

### API Testing (cURL)
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2025"}'

# Get packages
curl http://localhost:8080/api/v1/packages?limit=5 \
  -H "Authorization: Bearer <token>"
```

### WebSocket Testing (JavaScript Console)
```javascript
// Connect to backend
const socket = io('http://localhost:8080', { path: '/ws/socket.io' });

socket.on('connect', () => console.log('Connected!'));
socket.on('package_new', (data) => console.log('New package:', data));
```

---

## 🐛 Troubleshooting

### Backend won't start
- **Check port:** Is 8080 already in use? Change `PORT` in `.env`
- **Database error:** Run `npm run prisma:migrate`
- **Missing secrets:** Set `JWT_SECRET` and `API_TOKEN` in `.env`

### WhatsApp won't connect
- **Port conflict:** Check if 3001 is available
- **Session error:** Delete `wa-session` folder and reconnect
- **Blocked:** WhatsApp may temporarily block after multiple reconnects (wait 24h)

### APK crashes on launch
- **Check logs:** `adb logcat | grep smartparcel`
- **Permissions:** Enable camera/storage in Android settings
- **Network:** Ensure VPS IP is reachable from mobile network

### WebSocket not connecting
- **CORS:** Check `CORS_ORIGIN` includes your client URL
- **Firewall:** Ensure ports 8080, 3001 are open on VPS
- **SSL:** Mixed content (HTTPS→WS) won't work, use WSS or full HTTP

### Dashboard shows 0 packages
- **Token expired:** Re-login to get fresh JWT token
- **Empty database:** Upload a test package via API or ESP32
- **API error:** Check browser console for errors

---

## 🤝 Contributing

Contributions welcome! Please follow:

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier (2 spaces, single quotes)
- **Linting:** ESLint with recommended rules
- **Commits:** Conventional Commits format

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **sitaurs** - Initial work - [GitHub](https://github.com/sitaurs)

---

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Capacitor](https://capacitorjs.com/) - Native mobile framework
- [Lucide](https://lucide.dev/) - Beautiful icon library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Socket.IO](https://socket.io/) - Real-time communication

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/sitaurs/parcel-box/issues)
- **Email:** support@smartparcel.com (if configured)

---

**⭐ Star this repo if you find it useful!**
