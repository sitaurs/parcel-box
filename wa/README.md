# WhatsApp Backend Service - Standalone

Backend terpisah khusus untuk WhatsApp service dengan Baileys.

## 🎯 Features

- ✅ **Start/Stop** WhatsApp connection
- ✅ **Clear Session** untuk logout + hapus auth
- ✅ **Real-time QR Code** via Socket.IO
- ✅ **Send Message** (text & image)
- ✅ **Session Persistence** (auto-reconnect)
- ✅ **Standalone** (tidak bergantung main backend)

---

## 📦 Installation

```bash
cd backend-whatsapp
npm install
```

---

## ⚙️ Configuration

1. **Copy .env.example to .env**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env:**
   ```env
   PORT=3001
   SESSION_DIR=./wa-session
   DEFAULT_PHONE=628123456789
   CORS_ORIGIN=*
   ```

---

## 🚀 Usage

### **Development:**
```bash
npm run dev
```

### **Production:**
```bash
npm run build
npm start
```

Server akan running di: `http://localhost:3001`

---

## 📡 API Endpoints

### **1. Start WhatsApp**
```http
POST /api/wa/start
```

**Response:**
```json
{
  "message": "WhatsApp service started",
  "status": {
    "connected": false,
    "qrCode": "data:image/png;base64,..."
  }
}
```

---

### **2. Stop WhatsApp**
```http
POST /api/wa/stop
```

**Response:**
```json
{
  "message": "WhatsApp connection closed (session preserved)"
}
```

⚠️ **Session tetap ada**, bisa reconnect tanpa scan QR lagi.

---

### **3. Clear Session**
```http
POST /api/wa/clear-session
```

**Response:**
```json
{
  "message": "WhatsApp session cleared"
}
```

⚠️ **Session dihapus**, harus scan QR lagi.

---

### **4. Get Status**
```http
GET /api/wa/status
```

**Response:**
```json
{
  "connected": true,
  "me": "628123456789@s.whatsapp.net",
  "qrCode": null
}
```

---

### **5. Send Message**
```http
POST /api/wa/send
Content-Type: application/json

{
  "to": "628123456789",
  "text": "Hello from backend!"
}
```

**Send Image:**
```json
{
  "to": "628123456789",
  "image": "base64_encoded_image_here",
  "caption": "Check this out!"
}
```

**Response:**
```json
{
  "message": "Message sent successfully"
}
```

---

## 🔌 Socket.IO Events

**URL:** `ws://localhost:3001/socket.io`

### **Client → Server:**
(Tidak ada, pakai REST API untuk control)

### **Server → Client:**

#### **`wa_status`**
Emitted saat status berubah:
```javascript
{
  connected: true,
  me: "628123456789@s.whatsapp.net",
  error: null,
  message: "Connected!"
}
```

#### **`qr_update`**
Emitted saat QR code baru:
```javascript
{
  dataUrl: "data:image/png;base64,iVBORw0KG..."
}
```

---

## 📝 Client Example (JavaScript)

```javascript
import { io } from 'socket.io-client';

// Connect to WhatsApp backend
const socket = io('http://localhost:3001');

// Listen for QR code
socket.on('qr_update', (data) => {
  console.log('QR Code:', data.dataUrl);
  // Display QR in frontend
  document.getElementById('qr').src = data.dataUrl;
});

// Listen for status updates
socket.on('wa_status', (status) => {
  console.log('Status:', status);
  if (status.connected) {
    alert('WhatsApp connected!');
  }
});

// Start WhatsApp
async function startWhatsApp() {
  const response = await fetch('http://localhost:3001/api/wa/start', {
    method: 'POST',
  });
  const data = await response.json();
  console.log(data);
}

// Send message
async function sendMessage(to, text) {
  const response = await fetch('http://localhost:3001/api/wa/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text }),
  });
  const data = await response.json();
  console.log(data);
}
```

---

## 🔗 Integration with Main Backend

Main backend bisa call WhatsApp backend via HTTP:

```typescript
// backend/src/services/whatsapp-client.ts

async function sendWhatsAppNotification(to: string, text: string) {
  try {
    const response = await fetch('http://localhost:3001/api/wa/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, text }),
    });
    
    if (!response.ok) {
      throw new Error('WhatsApp send failed');
    }
    
    console.log('✅ WhatsApp notification sent');
  } catch (error) {
    console.error('❌ WhatsApp error:', error);
  }
}
```

---

## 📁 File Structure

```
backend-whatsapp/
├── src/
│   ├── index.ts       # Main server (Express + Socket.IO)
│   ├── baileys.ts     # Baileys service (WhatsApp logic)
│   └── config.ts      # Configuration
├── wa-session/        # Session storage (gitignored)
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── README.md
```

---

## 🐛 Troubleshooting

### **Error 405 (Connection Blocked)**

1. **Stop service:**
   ```bash
   POST /api/wa/stop
   ```

2. **Clear session:**
   ```bash
   POST /api/wa/clear-session
   ```

3. **Restart service & scan QR baru**

### **QR Code Not Showing**

Check Socket.IO connection:
```javascript
socket.on('connect', () => {
  console.log('✅ Connected to WhatsApp backend');
});
```

### **Session Expired**

Clear session dan scan QR baru:
```bash
curl -X POST http://localhost:3001/api/wa/clear-session
curl -X POST http://localhost:3001/api/wa/start
```

---

## 🎯 Comparison: Main Backend vs Standalone

| Feature | Main Backend | Standalone |
|---------|-------------|------------|
| Port | 8080 | 3001 |
| Dependencies | Full stack | WhatsApp only |
| Restart Impact | Affects all | WhatsApp only |
| Debugging | Complex | Simple |
| Scalability | Monolith | Microservice |

---

## 🚀 Production Deployment

### **Environment Variables:**
```env
PORT=3001
NODE_ENV=production
SESSION_DIR=/var/whatsapp/session
DEFAULT_PHONE=628123456789
CORS_ORIGIN=https://your-frontend.com
```

### **PM2 (Process Manager):**
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name whatsapp-backend
pm2 save
pm2 startup
```

### **Docker:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

---

## 📊 Performance

- **Memory:** ~150 MB (idle)
- **CPU:** <5% (normal)
- **Connections:** Unlimited (Socket.IO)
- **Messages/sec:** ~10-20 (WhatsApp rate limit)

---

## ⚠️ Important Notes

1. **Session Files:** Folder `wa-session/` berisi auth credentials, **JANGAN commit ke git**
2. **Rate Limits:** WhatsApp limit ~10-20 messages/second
3. **QR Timeout:** QR code expire setelah ~60 detik
4. **Reconnect:** Auto-reconnect jika connection drop (preserve session)
5. **Multi-Device:** WhatsApp allow up to 5 linked devices

---

## 📞 Support

**Issue 1: Stuck Fetching Version**
- ✅ Fixed: Skip fetch, pakai fixed version

**Issue 2: Error 405**
- Clear session + scan QR baru

**Issue 3: Auto Logout saat Stop**
- ✅ Fixed: `stop()` preserve session, `clearSession()` untuk logout

---

**Standalone WhatsApp Backend - Ready! 🚀📱**
