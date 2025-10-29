# Smart Parcel Box - PWA

Progressive Web App for monitoring and controlling the Smart Parcel Box system.

## Features

- 📱 **Progressive Web App** - Install on mobile/desktop, works offline
- 🎨 **Modern UI** - Built with React, TypeScript, and Tailwind CSS
- 🌓 **Dark Mode** - System-aware theme with manual override
- 📡 **Real-time Updates** - WebSocket connection for live notifications
- 📦 **Package Management** - View history, photos, and details
- 🖼️ **Photo Gallery** - Browse all captured package photos
- 💬 **WhatsApp Integration** - QR-based connection and notifications
- ⚙️ **Settings** - Customize detection thresholds and durations
- 🔌 **Offline Support** - IndexedDB caching and service worker

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create `.env.local` file:
   ```
   VITE_API_BASE_URL=/api/v1
   VITE_WS_URL=http://localhost:8080
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
pwa/
├── public/
│   └── icons/              # PWA icons
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout.tsx
│   │   ├── Snackbar.tsx
│   │   └── LoadingSkeleton.tsx
│   ├── contexts/           # React contexts
│   │   ├── SocketContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/                # Utilities and services
│   │   ├── api.ts          # API client
│   │   ├── socket.ts       # WebSocket client
│   │   └── db.ts           # IndexedDB wrapper
│   ├── pages/              # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Packages.tsx
│   │   ├── Gallery.tsx
│   │   ├── WhatsApp.tsx
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.ts
└── package.json
```

## Pages

### Dashboard (`/`)
- Device status overview
- Quick control buttons (Light, Lock, Buzzer)
- Recent events feed
- Real-time updates

### Packages (`/packages`)
- Searchable package list with pagination
- Filter by date, device, and keywords
- CSV export functionality
- Click for detailed view with full photo

### Gallery (`/gallery`)
- Grid view of all package photos
- Search and filter
- Lightbox view for full-size images
- Lazy loading for performance

### WhatsApp (`/whatsapp`)
- Start/stop WhatsApp session
- QR code display for pairing
- Connection status
- Implementation in Sprint 3

### Settings (`/settings`)
- Theme selection (Light/Dark/System)
- Detection parameters (distance thresholds)
- Control durations (light, lock, buzzer)
- WhatsApp default phone number
- API and timezone configuration

### About (`/about`)
- App information and version
- Feature list
- Technology stack
- Changelog
- Contact information

## PWA Features

### Service Worker
- Caches app shell for offline access
- Network-first strategy for API calls
- Cache-first for images and media
- Automatic updates

### Installable
- Add to Home Screen on mobile
- Standalone window on desktop
- Custom app icons and splash screen

### Offline Support
- IndexedDB for local data storage
- Cached packages and events
- Settings persistence
- Works without network connection

## WebSocket Events

The app listens to these real-time events:

- `package_new` - New package detected
- `event` - System event logged
- `device_status` - Device online/offline
- `qr_update` - WhatsApp QR code
- `wa_status` - WhatsApp connection status

## API Integration

All API calls use the `/api/v1` base URL and support:
- Token authentication (Bearer)
- JSON responses
- Error handling
- Pagination

See `src/lib/api.ts` for available endpoints.

## Development

### Hot Reload
The dev server supports hot module replacement (HMR) for instant updates during development.

### Proxy Configuration
API and WebSocket requests are proxied to the backend server (default: `localhost:8080`).

### Type Safety
Full TypeScript support with strict mode enabled.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
