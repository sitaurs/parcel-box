# 🧪 LOCAL PWA TESTING SETUP - Connected to VPS Backend

## ✅ Setup Complete!

### 📋 Configuration:
- **PWA Frontend:** Running locally at `http://localhost:5173/`
- **Backend API:** VPS at `http://13.213.57.228:8080/api/v1`
- **WebSocket:** VPS at `http://13.213.57.228:8080`
- **WhatsApp Service:** VPS at `http://13.213.57.228:3001`

### 🔧 VPS Backend Environment (.env):
```
✅ PORT=8080
✅ JWT_SECRET=507ff0fb389a0f... (128 chars - secure)
✅ API_TOKEN=0e8364955c1b226... (64 chars - secure)
✅ CORS_ORIGIN=* (allows all origins)
✅ MQTT_HOST=13.213.57.228
✅ MQTT_PORT=1883
✅ MQTT_USER=smartbox
✅ MQTT_PASS=engganngodinginginmcu
✅ STORAGE_DIR=./storage
```

### 🌐 Testing URLs:

**1. Open PWA in Browser:**
```
http://localhost:5173/
```

**2. Login Credentials:**
```
Username: admin
Password: admin123
```

**3. Backend Health Check:**
```bash
curl http://13.213.57.228:8080/health
```

**4. Test MQTT Connection:**
```bash
mosquitto_sub -h 13.213.57.228 -p 1883 -u smartbox -P engganngodinginginmcu -t "smartbox/#" -v
```

---

## 🧪 Test Checklist

### ✅ Authentication Flow:
- [ ] Open `http://localhost:5173/` → Shows Login screen
- [ ] Login with `admin` / `admin123` → Success
- [ ] After login → Shows Name Setup (if no name)
- [ ] Enter name → Saves successfully (no "Not found" error)
- [ ] PIN Setup → Create 4-6 digit PIN
- [ ] Dashboard → Loads with device stats

### ✅ Device Controls:
- [ ] Flash/Lamp button → MQTT message sent to ESP32
- [ ] Buzzer button → MQTT message sent to ESP32
- [ ] Lock button → MQTT message sent to ESP32
- [ ] Capture button → MQTT message sent to ESP32-CAM

**Check Backend Logs:**
```bash
pm2 logs smartparcel-backend --lines 20
```
Should see: `Publishing to MQTT: smartbox/box-01/control`

### ✅ Real-Time Updates:
- [ ] WebSocket connects → Status "Connected" in UI
- [ ] Distance sensor → Shows in dashboard when ESP32 publishes
- [ ] New package → Appears in dashboard/packages page
- [ ] Photo capture → Shows in gallery

### ✅ WhatsApp Integration:
- [ ] Open WhatsApp page → Shows QR code
- [ ] Scan QR → WhatsApp connected
- [ ] Send test message → Received by phone

---

## 🐛 Troubleshooting

### Issue: Can't connect to VPS
**Check:**
```bash
# Test backend
curl http://13.213.57.228:8080/health

# Test MQTT
mosquitto_sub -h 13.213.57.228 -p 1883 -u smartbox -P engganngodinginginmcu -t "smartbox/#" -v

# Check VPS services
ssh ubuntu@13.213.57.228
pm2 status
pm2 logs smartparcel-backend --lines 50
```

### Issue: WebSocket not connecting
**Solution:**
1. Check browser console (F12) for errors
2. Check CORS is enabled in VPS `.env`: `CORS_ORIGIN=*`
3. Check backend logs: `pm2 logs smartparcel-backend`

### Issue: Device controls not working
**Solution:**
1. Check ESP32 is connected to MQTT broker
2. Subscribe to MQTT topic to see messages:
   ```bash
   mosquitto_sub -h 13.213.57.228 -t "smartbox/#" -u smartbox -P engganngodinginginmcu
   ```
3. Check backend logs for MQTT publish messages

### Issue: Photos not showing
**Reason:** Old photos (October) have missing files
**Solution:** 
1. Restart ESP32-CAM to capture new photos
2. New photos will save to `/home/ubuntu/smartparcel/backend/storage/`
3. Check storage folder: `ls -lh /home/ubuntu/smartparcel/backend/storage/2025/11/05/`

---

## 🚀 When Everything Works Locally

### Build APK:
```powershell
# 1. Build PWA for production
cd d:\projct\projek_cdio\pwa
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK
cd android
.\gradlew.bat assembleDebug

# 4. APK location:
# d:\projct\projek_cdio\pwa\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📊 Current Status

### VPS Services:
- ✅ **Backend:** PID 108784, Port 8080, Status: Online
- ✅ **WhatsApp:** PID 107071, Port 3001, Status: Online
- ✅ **MQTT Broker:** Port 1883, Status: Online

### Local Development:
- ✅ **PWA Dev Server:** http://localhost:5173/ (Running)
- ✅ **Environment:** `.env.development.local` configured
- ✅ **Backend Target:** VPS (13.213.57.228:8080)

### Files Changed:
- ✅ `pwa/.env.development.local` → Created (VPS backend config)
- ✅ `pwa/src/contexts/AuthContext.tsx` → Fixed token validation
- ✅ Backend deployed to VPS → Latest code (commit ea7089c)

---

## 🎯 Testing Flow

1. **Open Browser** → http://localhost:5173/
2. **F12 Console** → Check for errors
3. **Login** → admin / admin123
4. **Test each feature** → Dashboard, Packages, Gallery, Device Controls
5. **Check backend logs** → `pm2 logs smartparcel-backend` (via SSH)
6. **Test WebSocket** → Real-time updates when ESP32 publishes
7. **Fix issues** → Edit code locally, hot reload automatic
8. **Build APK** → When everything works perfectly

---

**Last Updated:** Nov 5, 2025 - 08:35 AM
**PWA Status:** ✅ Running at http://localhost:5173/
**Backend Status:** ✅ VPS Online (13.213.57.228:8080)
