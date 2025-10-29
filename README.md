# 📦 Smart Parcel Box System

Sistem kotak paket pintar berbasis ESP32-CAM dengan deteksi otomatis, notifikasi WhatsApp, dan Progressive Web App untuk monitoring real-time.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Fitur Utama

- 📦 **Deteksi Otomatis**: Sensor ultrasonik HC-SR04 mendeteksi paket dalam jarak 12-25 cm
- 📸 **Foto Real-time**: ESP32-CAM mengambil foto paket dan upload ≤10 detik
- 💬 **Notifikasi WhatsApp**: Integrasi Baileys untuk kirim foto via WhatsApp
- 🌐 **Progressive Web App**: Monitoring dan kontrol via web app (offline-capable)
- 🔓 **Kontrol Manual**: Remote control untuk lampu, kunci, dan buzzer
- 📊 **Event Logging**: Catat semua kejadian dengan timestamp
- 🖼️ **Galeri Foto**: Browse dan ekspor history foto paket
- 🔔 **Web Push**: Notifikasi browser untuk paket baru

## 📁 Struktur Proyek

```
smart-parcel-box/
├── backend/              # Node.js + Express backend (Port 8080)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic (Socket.IO, Baileys, MQTT, Push)
│   │   ├── middleware/   # Auth, upload
│   │   └── utils/        # Helpers
│   ├── prisma/           # Database schema & migrations
│   └── package.json
│
├── backend-whatsapp/     # Standalone WhatsApp service (Port 3001)
│   ├── src/
│   │   ├── index.ts      # Express server + Socket.IO
│   │   ├── baileys.ts    # WhatsApp connection handler
│   │   └── config.ts     # Configuration
│   └── package.json
│
├── pwa/                  # React PWA frontend (Port 5173)
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   ├── components/   # Reusable components
│   │   ├── lib/          # API client, Socket, IndexedDB
│   │   └── contexts/     # React contexts
│   └── package.json
│
├── firmware/             # ESP32-CAM + ESP8266 Arduino code
│   ├── include/
│   │   └── config.h.example  # Configuration template
│   ├── src/              # Firmware source code
│   └── platformio.ini
│
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x atau lebih tinggi
- **npm** atau **yarn**
- **PlatformIO** (untuk ESP32-CAM firmware)
- **Hardware**: ESP32-CAM, HC-SR04, relay 2-ch, solenoid 12V, buzzer 12V

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Generate VAPID keys untuk Web Push
npx web-push generate-vapid-keys
# Copy keys ke .env

# Start server
npm run dev
```

Server akan berjalan di `http://localhost:8080`

### 2. PWA Setup

```bash
cd pwa
npm install
cp .env.example .env
# Edit .env jika perlu (default sudah OK untuk development)

# Start dev server
npm run dev
```

PWA akan berjalan di `http://localhost:5173`

### 3. Firmware Setup

```bash
cd firmware

# Copy config template
cp include/config.h.example include/config.h

# Edit config.h dengan:
# - WiFi SSID & password
# - Server IP address
# - Device ID & API token
# - MQTT credentials

# Upload ke ESP32-CAM
platformio run --target upload

# Monitor serial
platformio device monitor
```

**⚠️ PENTING**: Lihat [FIRMWARE_SECURITY.md](./FIRMWARE_SECURITY.md) untuk panduan keamanan credentials!

## 🔧 Konfigurasi

### Backend (.env)

```env
PORT=8080
DATABASE_URL=file:./db.sqlite
STORAGE_DIR=./storage
JWT_SECRET=your_secret_key
API_TOKEN=your_device_token

# VAPID keys untuk Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=admin@example.com

# Baileys WhatsApp
BAILEYS_DATA_DIR=./wa-session
DEFAULT_PHONE=628123456789

# MQTT Configuration
MQTT_ENABLED=true
MQTT_HOST=13.213.57.228
MQTT_PORT=1883
MQTT_USER=smartbox
MQTT_PASS=your_mqtt_password

# CORS
CORS_ORIGIN=http://localhost:5173
```

### PWA (.env)

```env
# API Base URL (untuk API client)
VITE_API_BASE_URL=/api/v1

# WebSocket URL (untuk Socket.IO)
VITE_WS_URL=http://localhost:8080

# API URL (untuk Vite dev proxy)
VITE_API_URL=http://localhost:8080
```

### Firmware (config.h)

```cpp
#define WIFI_SSID "YourWiFi"
#define WIFI_PASSWORD "YourPassword"
#define API_BASE_URL "192.168.1.100"
#define DEVICE_ID "box-01"
#define API_TOKEN "your_device_token"

// MQTT Configuration
#define MQTT_HOST "mqtt.yourserver.com"
#define MQTT_USER "smartbox"
#define MQTT_PASS "your_mqtt_password"

// Detection parameters
#define DISTANCE_MIN_CM 12
#define DISTANCE_MAX_CM 25
#define DISTANCE_DROP_CM 40
```

## 🔌 Hardware Wiring

### Pin Map ESP32-CAM

| Function | GPIO | Connection |
|----------|------|------------|
| Lock Relay | 13 | Relay IN1 (Active LOW) |
| Light Relay | 4 | Relay IN2 (Active LOW) |
| HC-SR04 TRIG | 12 | Sensor TRIG pin |
| HC-SR04 ECHO | 15 | Sensor ECHO pin |
| Buzzer Control | 16 | MOSFET Gate (via 10kΩ) |

### Power Supply

```
12V/2A Adaptor
├── Relay COM → 12V beban (lock, LED)
├── Step-down 5V → ESP32-CAM, Relay VCC
└── GND (common)
```

**⚠️ PENTING**: HC-SR04 gunakan VCC 3.3V (bukan 5V!)

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Packages
- `POST /api/v1/packages` - Upload foto paket (multipart, requires device token)
- `GET /api/v1/packages` - List paket dengan pagination
- `GET /api/v1/packages/:id` - Detail paket

### Events
- `POST /api/v1/events` - Log event (requires device token)
- `GET /api/v1/events` - List events dengan filter

### Devices
- `GET /api/v1/devices` - List semua devices
- `GET /api/v1/devices/:id` - Detail device

### WhatsApp
- `POST /api/v1/wa/start` - Start WhatsApp service
- `POST /api/v1/wa/stop` - Stop WhatsApp (preserve session)
- `POST /api/v1/wa/clear-session` - Logout dan hapus session
- `GET /api/v1/wa/status` - Connection status
- `POST /api/v1/wa/send` - Send message/image

### Web Push
- `GET /api/v1/push/vapid-key` - Get VAPID public key
- `POST /api/v1/push/subscribe` - Subscribe to notifications
- `POST /api/v1/push/unsubscribe` - Unsubscribe

## 🔄 MQTT Topics

### Device → Backend (Publish)

```
smartparcel/{deviceId}/status            # Device status (online/offline)
smartparcel/{deviceId}/event             # Events (DETECTED, CAPTURE, etc)
smartparcel/{deviceId}/sensor/distance   # Distance readings
smartparcel/{deviceId}/photo/status      # Photo upload ACK
```

### Backend → Device (Subscribe)

```
smartparcel/{deviceId}/lock/set          # Lock control (LOCK/UNLOCK)
smartparcel/{deviceId}/lamp/set          # Lamp control (ON/OFF)
smartparcel/{deviceId}/cmd/capture       # Manual capture (CAPTURE)
smartparcel/{deviceId}/buzzer/trigger    # Buzzer control (duration in ms)
```

**Payload Examples:**

```bash
# Lock control
Topic: smartparcel/box-01/lock/set
Payload: "UNLOCK"  # or "LOCK"

# Lamp control
Topic: smartparcel/box-01/lamp/set
Payload: "ON"  # or "OFF"

# Manual capture
Topic: smartparcel/box-01/cmd/capture
Payload: "CAPTURE"

# Buzzer
Topic: smartparcel/box-01/buzzer/trigger
Payload: "200"  # duration in milliseconds
```

## 🔌 Socket.IO Events

### Client → Server

```javascript
socket.emit('wa_start');                          // Start WhatsApp
socket.emit('wa_stop');                           // Stop WhatsApp
socket.emit('cmd_relay', { deviceId, ch, on });   // Control relay
socket.emit('cmd_buzz', { deviceId, ms });        // Trigger buzzer
socket.emit('cmd_capture', { deviceId });         // Manual capture
```

### Server → Client

```javascript
socket.on('package_new', (data) => { ... });      // New package detected
socket.on('event', (data) => { ... });            // Device event
socket.on('device_update', (data) => { ... });    // Device status update
socket.on('distance_update', (data) => { ... });  // Real-time distance
socket.on('qr_update', (data) => { ... });        // WhatsApp QR code
socket.on('wa_status', (data) => { ... });        // WhatsApp status
```

## 🔐 Security

### Device Authentication

Semua endpoint yang digunakan oleh device (ESP32) memerlukan Bearer token:

```bash
curl -X POST http://localhost:8080/api/v1/packages \
  -H "Authorization: Bearer your_device_token" \
  -F "photo=@image.jpg" \
  -F "meta={\"deviceId\":\"box-01\",\"distanceCm\":15}"
```

### User Authentication

Web app menggunakan JWT token dengan expiry 7 hari.

### Firmware Security

**⚠️ CRITICAL**: Jangan commit credentials ke Git!

- Gunakan `config.h` (di-ignore oleh Git)
- Copy dari `config.h.example`
- Generate secure tokens (32+ characters)
- Rotate credentials setiap 90 hari

Lihat [FIRMWARE_SECURITY.md](./FIRMWARE_SECURITY.md) untuk panduan lengkap.

## 🐳 Docker Deployment

```bash
# Copy environment files
cp backend/.env.example backend/.env
# Edit backend/.env dengan production values

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

Services:
- **Backend**: http://localhost:8080
- **PWA**: http://localhost:80
- **PostgreSQL**: localhost:5432

## 📊 Tech Stack

### Backend
- **Runtime**: Node.js 20.x + TypeScript 5.3
- **Framework**: Express 4.18
- **Database**: SQLite (dev) / PostgreSQL (prod) + Prisma ORM
- **Real-time**: Socket.IO 4.6 + MQTT 5.14
- **WhatsApp**: @whiskeysockets/baileys 6.7
- **Image**: Sharp 0.33
- **Push**: web-push 3.6

### Frontend
- **Framework**: React 18.2 + TypeScript
- **Build**: Vite 5.0 + PWA plugin
- **Styling**: Tailwind CSS 3.3
- **Storage**: IndexedDB (idb 8.0)
- **Icons**: Lucide React
- **Real-time**: Socket.IO Client 4.6

### Firmware
- **Board**: ESP32-CAM AI-Thinker
- **Framework**: Arduino
- **IDE**: PlatformIO
- **Libraries**: WiFi, HTTPClient, MQTT, ArduinoJson

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev          # Start with hot reload (tsx watch)
npm run build        # Build TypeScript
npm run prisma:studio # Open Prisma Studio
```

### PWA Development

```bash
cd pwa
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Firmware Development

```bash
cd firmware
platformio run              # Compile
platformio run -t upload    # Upload to device
platformio device monitor   # Serial monitor
```

## 📝 Known Issues & Fixes

Semua critical issues telah diperbaiki:

✅ **MQTT Topic Mismatch** - Backend sekarang menggunakan topic yang benar:
   - `smartparcel/{deviceId}/lock/set`
   - `smartparcel/{deviceId}/lamp/set`
   - `smartparcel/{deviceId}/cmd/capture`
   - `smartparcel/{deviceId}/buzzer/trigger`

✅ **require() vs import** - Semua menggunakan ES6 import

✅ **Hardcoded URLs** - Vite config menggunakan environment variables

✅ **Security** - Config template dan documentation untuk credentials management

Lihat [FIXES_APPLIED.txt](./FIXES_APPLIED.txt) dan [KONDISI_SAAT_INI.md](./KONDISI_SAAT_INI.md) untuk detail.

## 📚 Documentation

- [ACK Format Specification](./ACK_FORMAT_SPEC.md) - MQTT ACK format untuk ESP32
- [Firmware Security Guide](./FIRMWARE_SECURITY.md) - Panduan keamanan credentials
- [Current Status](./KONDISI_SAAT_INI.md) - Status proyek saat ini
- [Backend README](./backend/README.md) - Backend documentation
- [PWA README](./pwa/README.md) - Frontend documentation
- [WhatsApp Backend](./backend-whatsapp/README.md) - Standalone WhatsApp service

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika ada pertanyaan atau masalah:
- Open an issue
- Contact: your-email@example.com

## 🎉 Acknowledgments

- Baileys WhatsApp Web library
- Eclipse Mosquitto MQTT Broker
- React & Vite communities
- PlatformIO & ESP32 communities

---

**Built with ❤️ for Smart Parcel Management**
