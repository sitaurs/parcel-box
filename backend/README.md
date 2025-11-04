# Smart Parcel Box - Backend Server

REST API server for Smart Parcel Box IoT system with real-time WebSocket communication and MQTT integration.

## 🏗️ Architecture

- **Framework**: Express 4 + TypeScript
- **WebSocket**: Socket.IO for real-time client updates
- **MQTT**: Mosquitto client for ESP32-CAM communication
- **Database**: JSON file-based storage (see [Database section](#database))
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Multer + Sharp for image uploads and thumbnails

## 📦 Dependencies

Key dependencies:
- `express` - Web framework
- `socket.io` - WebSocket server
- `mqtt` - MQTT client for ESP32 communication
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `multer` - File uploads
- `sharp` - Image processing (thumbnails)
- `winston` - Structured logging (optional, recommended)

## 🗄️ Database

**Current Implementation**: JSON File-Based Storage

The backend uses a custom JSON file database system located in `backend/data/*.json`:
- `users.json` - User accounts and authentication
- `devices.json` - ESP32-CAM device registry
- `packages.json` - Package delivery records
- `events.json` - System event logs
- `notifications.json` - Notification queue
- `whatsapp-settings.json` - WhatsApp configuration

### Why JSON DB?

✅ **Zero-config deployment** - No database server required  
✅ **Simple backups** - Copy `data/` directory  
✅ **Human-readable** - Easy debugging with `cat users.json | jq`  
✅ **Suitable for current scale** - Expected <10k records  

### Prisma Schema (Future Migration Path)

The `prisma/` directory contains a schema definition for **future PostgreSQL migration** when scale requirements increase (>10k packages, high concurrency). 

**Current Status**: Prisma is **NOT ACTIVE**. The schema exists as documentation only.

**When to migrate**: See [ADR-001: JSON Database Decision](../docs/ADR-001-json-database-decision.md)

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Required Environment Variables

**Critical** (must be set in production):
- `JWT_SECRET` - Strong secret for JWT signing (min 32 chars)
- `API_TOKEN` - Device authentication token
- `MQTT_USER` - MQTT broker username
- `MQTT_PASS` - MQTT broker password

**Optional** (have sensible defaults):
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `WA_API_URL` - WhatsApp service URL (default: http://localhost:3001)
- `STORAGE_DIR` - File upload directory (default: ./storage)

See `.env.example` for complete list.

### Development

```bash
# Start development server with auto-reload
npm run dev

# Server will start on http://localhost:8080
# API docs available at http://localhost:8080/api-docs
```

### Production Build

```bash
# Compile TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

**Note**: Test suite is currently being implemented. See [M1.3 in project roadmap](../COMPREHENSIVE_ANALYSIS_REPORT.md#m13--implement-unit-tests-untuk-critical-paths).

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login (JWT token)
- `POST /api/v1/auth/refresh` - Refresh expired token
- `GET /api/v1/auth/me` - Get current user profile

### Packages
- `GET /api/v1/packages` - List all packages (with filters)
- `GET /api/v1/packages/:id` - Get package details
- `POST /api/v1/packages` - Create package (device only)

### Devices
- `GET /api/v1/devices` - List all devices
- `GET /api/v1/devices/:id` - Get device details
- `POST /api/v1/devices/:id/lock` - Lock device
- `POST /api/v1/devices/:id/unlock` - Unlock device

### WhatsApp
- `GET /api/v1/wa/settings` - Get WhatsApp settings
- `PUT /api/v1/wa/settings` - Update WhatsApp settings

### Admin (Admin role required)
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/admin/users` - Create user
- `PUT /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user

**Full API documentation**: http://localhost:8080/api-docs (Swagger UI)

## 🔐 Security

### Authentication & Authorization
- **JWT Tokens**: 7-day expiry with automatic refresh
- **Password Hashing**: bcrypt with 10 rounds
- **API Token**: Device authentication for ESP32-CAM uploads
- **Role-Based Access**: Admin routes protected by middleware

### Production Validation
The server **will refuse to start** in production mode if:
- `JWT_SECRET` is weak or using default value
- `API_TOKEN` is not set or using default value
- `MQTT_USER` or `MQTT_PASS` is missing

### File Upload Security
- **MIME Type Whitelist**: Only JPEG/PNG allowed
- **File Size Limit**: 10MB maximum
- **UUID Filenames**: Prevents path traversal attacks
- **Thumbnail Generation**: Automatic with Sharp

## 📊 Logging

**Current**: Console-based logging with emoji prefixes (🔐, ✅, ❌, ⚠️)

**Recommended** (in progress): Winston structured logging
```typescript
import { logger } from './utils/logger';

// Development: logs everything
// Production: only warnings and errors
logger.debug('Debug message'); // Filtered in prod
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

See [M1.1 in project roadmap](../COMPREHENSIVE_ANALYSIS_REPORT.md#m11--replace-all-consolelogs-dengan-logger).

## 🔧 Configuration

### MQTT Topics

ESP32-CAM devices communicate via MQTT:
```
smartparcel/{deviceId}/status       - Device online/offline
smartparcel/{deviceId}/event        - Detection events
smartparcel/{deviceId}/sensor/distance - Ultrasonic sensor readings
smartparcel/{deviceId}/control      - Commands to device
smartparcel/{deviceId}/settings/*   - Device settings management
```

### WebSocket Events

Client-server real-time communication:
```typescript
// Server → Client
device_status     - Device online/offline
package_new       - New package detected
event             - System event
distance_update   - Real-time sensor data
control_ack       - Command acknowledgment

// Client → Server
cmd_relay         - Control relay (lock/lamp)
cmd_buzz          - Trigger buzzer
cmd_capture       - Manual photo capture
```

## 📦 Data Backup & Retention

### Manual Backup
```bash
# Backup all data files
cp -r backend/data backend/data.backup.$(date +%Y%m%d)

# Restore from backup
cp -r backend/data.backup.20251104/* backend/data/
```

### Automated Backup (Recommended)
```bash
# Add to crontab (daily backup at 3 AM)
0 3 * * * /path/to/backup-script.sh
```

See [M2.4 in project roadmap](../COMPREHENSIVE_ANALYSIS_REPORT.md#m24--kebijakan-data--backup) for automated backup implementation.

### Data Retention Policy

**Recommended** (to be implemented):
- **Packages**: Keep 90 days, archive older
- **Events**: Keep 30 days, delete older
- **Logs**: Rotate daily, keep 7 days

## 🐛 Debugging

### Common Issues

**1. Server won't start**
```bash
# Check if port is in use
netstat -ano | findstr :8080

# Check environment variables
node -e "console.log(process.env.JWT_SECRET)"
```

**2. MQTT not connecting**
```bash
# Test MQTT broker
mosquitto_sub -h 13.213.57.228 -p 1883 -u smartbox -P yourpass -t "smartparcel/#"
```

**3. Database errors**
```bash
# Check data directory permissions
ls -la backend/data/

# Verify JSON syntax
cat backend/data/users.json | jq .
```

## 📚 Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point, server initialization
│   ├── config.ts             # Environment configuration
│   ├── middleware/
│   │   ├── auth.ts           # JWT + API token authentication
│   │   └── upload.ts         # Multer file upload config
│   ├── routes/
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── packages.ts       # Package management
│   │   ├── devices.ts        # Device registry
│   │   ├── lock.ts           # Lock/unlock control
│   │   ├── whatsapp.ts       # WhatsApp settings
│   │   ├── notifications.ts  # Notification queue
│   │   ├── admin.ts          # Admin user management
│   │   └── push.ts           # Web push notifications
│   ├── services/
│   │   ├── database.ts       # JSON file database
│   │   ├── mqtt.ts           # MQTT client & handlers
│   │   ├── socket.ts         # Socket.IO server
│   │   ├── notificationQueue.ts # Notification retry logic
│   │   └── push.ts           # Web push service
│   ├── utils/
│   │   ├── logger.ts         # Structured logging (WIP)
│   │   ├── sentry.ts         # Error tracking (WIP)
│   │   └── thumbnail.ts      # Image processing
│   └── config/
│       └── swagger.ts        # API documentation config
├── data/                     # JSON database files
├── storage/                  # Uploaded images
├── prisma/
│   └── schema.prisma         # Future migration reference (NOT ACTIVE)
├── package.json
├── tsconfig.json
└── README.md                 # This file
```

## 🔗 Related Documentation

- [Main README](../README.md) - Full project documentation
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [Audit Report](../AUDIT_REPORT.md) - Security audit results
- [Comprehensive Analysis](../COMPREHENSIVE_ANALYSIS_REPORT.md) - Detailed code analysis
- [ADR-001](../docs/ADR-001-json-database-decision.md) - Database architecture decision

## 📝 License

MIT - See [LICENSE](../LICENSE) file for details
