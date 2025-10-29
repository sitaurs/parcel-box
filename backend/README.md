# Smart Parcel Box - Backend Server

Backend server for the Smart Parcel Box system, built with Node.js, Express, Prisma, and Socket.IO.

## Features

- 📦 Package detection and photo upload
- 📡 Real-time updates via WebSocket (Socket.IO)
- 📱 WhatsApp notifications via Baileys (Sprint 3)
- 🔐 Token-based authentication
- 📊 Event logging and analytics
- 🖼️ Automatic thumbnail generation
- 🔔 Web Push notifications (Sprint 4)

## Prerequisites

- Node.js 20.x or higher
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8080`

## API Endpoints

### Packages

- `POST /api/v1/packages` - Upload package photo (requires auth)
  - Body: multipart/form-data
    - `photo`: Image file (JPEG/PNG)
    - `meta`: JSON string with metadata
  - Example meta: `{"deviceId":"box-01","ts":"2025-10-21T12:34:56Z","distanceCm":18}`

- `GET /api/v1/packages` - List packages with pagination
  - Query params: `from`, `to`, `q`, `page`, `limit`, `deviceId`

- `GET /api/v1/packages/:id` - Get package details

### Events

- `POST /api/v1/events` - Log an event (requires auth)
  - Body: `{"deviceId":"box-01","type":"DROP_OK","ts":"2025-10-21T12:35:20Z","details":{}}`

- `GET /api/v1/events` - List events
  - Query params: `from`, `to`, `type`, `deviceId`, `page`, `limit`

### Devices

- `GET /api/v1/devices` - List all devices
- `GET /api/v1/devices/:id` - Get device details

### WebSocket Events

Connect to: `ws://localhost:8080/ws`

**Server → Client:**
- `package_new` - New package detected
- `event` - New event logged
- `device_status` - Device online/offline status
- `qr_update` - WhatsApp QR code (Sprint 3)
- `wa_status` - WhatsApp connection status (Sprint 3)

**Client → Server:**
- `wa_start` - Start WhatsApp session
- `wa_stop` - Stop WhatsApp session
- `cmd_relay` - Control relay (Sprint 4)
- `cmd_buzz` - Control buzzer (Sprint 4)

## Authentication

Device endpoints require Bearer token authentication:

```
Authorization: Bearer <API_TOKEN>
```

Set `API_TOKEN` in `.env` file.

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── config/
│   │   └── index.ts       # Configuration
│   ├── middleware/
│   │   ├── auth.ts        # Authentication
│   │   └── upload.ts      # File upload handling
│   ├── routes/
│   │   ├── packages.ts    # Package endpoints
│   │   ├── events.ts      # Event endpoints
│   │   └── devices.ts     # Device endpoints
│   ├── services/
│   │   └── socket.ts      # Socket.IO service
│   ├── utils/
│   │   └── thumbnail.ts   # Image processing
│   └── index.ts           # Main server
├── package.json
└── tsconfig.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (DB GUI)
- `npm run prisma:seed` - Seed database with default data

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - Database connection string
- `STORAGE_DIR` - Photo storage directory
- `JWT_SECRET` - Secret for JWT tokens
- `API_TOKEN` - Device authentication token
- `CORS_ORIGIN` - Allowed CORS origins

## Development Notes

### Sprint 1 (Current)
✅ Basic server setup
✅ Prisma database with SQLite
✅ Package upload with photo and thumbnail
✅ Event logging
✅ Socket.IO real-time updates
✅ Device management

### Upcoming Sprints
- Sprint 2: PWA Frontend
- Sprint 3: Baileys WhatsApp integration
- Sprint 4: Manual controls and Web Push
- Sprint 5: ESP32-CAM firmware
- Sprint 6: Testing and hardening

## License

MIT
