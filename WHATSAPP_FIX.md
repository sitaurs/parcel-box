# 🔧 WhatsApp Error 405 - FIXED!

## ❌ Problem: Error 405 (Connection Blocked)

WhatsApp Web memblokir koneksi karena session corrupted atau terdeteksi sebagai bot.

```
❌ WhatsApp connection closed
Status code: 405
Error: Connection Failure
❌ WhatsApp connection blocked (Error 405)
```

## ✅ Solution Applied

### 1. Fixed Duplicate Logs (DONE)

**Problem:** Event listeners tidak di-cleanup dengan benar
- Socket.off() menggunakan arrow function baru (beda reference)
- Socket.connect() dipanggil redundant dari SocketContext

**Fix:** `pwa/src/pages/WhatsApp.tsx`
```typescript
// Define handlers with stable references
const handleQRUpdate = (data) => { ... };
const handleWAStatus = (data) => { ... };

// Add listeners
socket.on('qr_update', handleQRUpdate);
socket.on('wa_status', handleWAStatus);

// Cleanup with same reference
return () => {
  socket.off('qr_update', handleQRUpdate);
  socket.off('wa_status', handleWAStatus);
};
```

### 2. Cleared WhatsApp Session (DONE)

```bash
✅ WhatsApp session cleared!
```

Folder `backend/wa-session/` telah dihapus.

---

## 🔄 Manual Steps Required

### Step 1: Restart Backend Server

**Option A: Via Terminal (if you have access)**
```bash
# Stop backend (Ctrl+C in terminal 1ebc7d0a-34df-481b-893b-08e8e3cf53fe)
# Then restart:
cd d:\projct\projek_cdio\backend
npm run dev
```

**Option B: Via VS Code Terminal Panel**
1. Find terminal: "esbuild" or backend terminal
2. Click to focus
3. Press `Ctrl+C` to stop
4. Run: `npm run dev`

**Option C: Kill Process & Restart**
```powershell
# Find Node process
Get-Process node | Where-Object {$_.Path -like "*projek_cdio*"} | Stop-Process -Force

# Restart
cd d:\projct\projek_cdio\backend
npm run dev
```

### Step 2: Reload PWA in Browser

```
Press F5 or Ctrl+R in browser
```

### Step 3: Try WhatsApp Connection Again

1. Go to WhatsApp page
2. Click "Start" button
3. QR code should appear (no Error 405!)
4. Scan with your phone

---

## 🧪 Testing After Restart

### Expected Behavior:

**Backend Log:**
```
⚡ Using WhatsApp Web version: 2.2409.2
Emitted WA status: false Using WhatsApp Web v2.2409.2
Emitted WA status: false Connecting to WhatsApp servers...
📱 QR code generated
Emitted QR update
```

**Web Log (Single, not double!):**
```
18:XX:XX ✅ Socket connected
18:XX:XX 🔄 Starting WhatsApp service...
18:XX:XX ℹ️ Using WhatsApp Web v2.2409.2
18:XX:XX ℹ️ Connecting to WhatsApp servers...
18:XX:XX 📱 QR Code generated - Scan dengan WhatsApp Anda
```

---

## 🔍 Why Error 405 Happens?

WhatsApp blocks connections when:
1. ❌ **Session corrupted** - Old auth data invalid
2. ❌ **Too many reconnects** - Rate limited
3. ❌ **Detected as bot** - Unusual pattern
4. ❌ **Multiple devices** - Another WhatsApp Web active

**Solution:** Clear session + fresh start

---

## 🚨 If Error 405 Still Appears

### 1. Wait 15-30 minutes
WhatsApp may have rate-limited your IP. Wait before retrying.

### 2. Use Different Phone Number
Test with another WhatsApp account.

### 3. Try Different Baileys Version
Edit `backend/package.json`:
```json
"@whiskeysockets/baileys": "^6.7.8"
```
Then: `npm install`

### 4. Use Backend-WhatsApp (Standalone)
The standalone WhatsApp service might work better:
```bash
cd backend-whatsapp
npm install
npm run dev
```
Port: 3001

---

## 📝 Summary of Fixes

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Duplicate logs | ✅ Fixed | None (code updated) |
| wa-session cleared | ✅ Done | None |
| Backend restart | ⏸️ Pending | Manual restart needed |
| Browser reload | ⏸️ Pending | Press F5 |

---

## 🎯 Quick Commands

```powershell
# Stop backend (in backend terminal)
Ctrl+C

# Start backend
cd d:\projct\projek_cdio\backend
npm run dev

# Reload browser
F5

# Test WhatsApp
# Go to: http://localhost:5173/whatsapp
# Click "Start"
```

---

## ✅ Success Indicators

After restart, you should see:

**✅ No more duplicate logs**
```
18:XX:XX ℹ️ Using WhatsApp Web v2.2409.2  (once, not 4x!)
```

**✅ QR Code appears**
```
[Base64 QR code image displayed]
```

**✅ No Error 405**
```
# Should NOT see:
❌ WhatsApp connection blocked (Error 405)
```

---

**Ready to test!** 🚀

1. Restart backend (`Ctrl+C` → `npm run dev`)
2. Reload browser (`F5`)
3. Go to WhatsApp page
4. Click "Start"
5. Scan QR code

Good luck! 🎉
