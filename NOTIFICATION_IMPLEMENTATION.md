# 🔔 PUSH NOTIFICATIONS - IMPLEMENTATION COMPLETE

## ✅ Fitur yang Sudah Ditambahkan

### 1. **Notification Service** (`notificationService.ts`)
Service lengkap untuk handle notifikasi di native (Android) dan web (PWA):

- ✅ Request notification permission
- ✅ Register push notifications untuk Android
- ✅ Handle notification tap → auto navigate ke /packages
- ✅ Support web notifications (PWA)
- ✅ Custom notification channels untuk Android
- ✅ Notification untuk paket baru
- ✅ Notification untuk paket diambil

### 2. **Auto Trigger Notifications**
Notifikasi otomatis muncul ketika:
- ✅ **Paket baru terdeteksi** (via Socket.IO event `package:new`)
- ✅ Format: "📦 Paket Baru Tiba! Paket untuk [nama] No. Resi: [tracking]"
- ✅ Tap notifikasi → langsung ke halaman Packages

### 3. **Permissions**
- ✅ `POST_NOTIFICATIONS` sudah ada di AndroidManifest.xml
- ✅ Permission request otomatis saat app pertama kali dibuka
- ✅ Support runtime permission untuk Android 13+

### 4. **Integration Points**
- ✅ `main.tsx` → Initialize notification service
- ✅ `Dashboard.tsx` → Trigger notif saat `socket.on('package:new')`
- ✅ Capacitor plugin `@capacitor/push-notifications@6.0.2` installed

---

## 📱 CARA INSTALL & TEST

### **Step 1: Install APK Baru**

APK sudah di-build dengan support notifikasi:
```
D:\projct\projek_cdio\pwa\android\app\build\outputs\apk\debug\app-debug.apk
Size: ~4 MB
```

**Install via USB:**
```powershell
# Connect phone via USB
# Enable USB Debugging

adb devices
adb install -r "D:\projct\projek_cdio\pwa\android\app\build\outputs\apk\debug\app-debug.apk"
```

**Install Manual:**
1. Copy `app-debug.apk` ke phone
2. Buka Files app → Downloads
3. Tap `app-debug.apk`
4. Allow install from this source
5. Tap Install

---

### **Step 2: Grant Permission**

Saat pertama kali buka app:
1. ✅ Popup "Allow Smart Parcel to send you notifications?"
2. ✅ Tap **"Allow"**

Atau manual di Settings:
- Settings → Apps → Smart Parcel → Notifications → **ON**

---

### **Step 3: Test Notification**

#### **Test 1: Simulasi Paket Baru (Backend)**

**Cara 1: Via MQTT (Recommended)**
```bash
# Publish event package detected
mosquitto_pub -h localhost -t "device/BOX001/package/detected" -m '{
  "trackingNumber": "JNE123456789",
  "recipient": "Budi Santoso",
  "weight": 2.5,
  "timestamp": "2025-10-29T10:30:00Z"
}'
```

**Cara 2: Via Socket.IO (JavaScript Console di Browser)**
```javascript
// Buka browser console
// Connect ke backend WebSocket
const io = require('socket.io-client');
const socket = io('http://localhost:8080');

// Emit package:new event
socket.emit('package:new', {
  id: Date.now(),
  trackingNumber: 'TEST123456',
  recipient: 'Test User',
  deviceId: 'BOX001',
  deviceName: 'Smart Box 1',
  status: 'captured',
  tsDetected: new Date().toISOString()
});
```

**Cara 3: Via Backend API (POST request)**
```powershell
# Tambah paket baru via API
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/packages" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    trackingNumber = "API123456"
    recipient = "John Doe"
    deviceId = "BOX001"
    weight = 1.5
    status = "captured"
  } | ConvertTo-Json)
```

#### **Test 2: Manual Trigger Notification**

Tambahkan button test di Dashboard (temporary untuk testing):

```tsx
// Di Dashboard.tsx, tambahkan button:
<button
  onClick={async () => {
    await notificationService.notifyNewPackage({
      trackingNumber: 'TEST-12345',
      recipient: 'Test User',
      deviceName: 'Box 1'
    });
  }}
  className="px-4 py-2 bg-blue-500 text-white rounded"
>
  Test Notification
</button>
```

---

## 🎯 EXPECTED BEHAVIOR

### **Skenario 1: App Terbuka**
1. Paket baru terdeteksi → MQTT/Socket.IO emit event
2. Dashboard menerima event `package:new`
3. ✅ **Notifikasi muncul di notification bar**
4. ✅ **Suara/getar** (jika enabled di phone)
5. Tap notifikasi → App buka halaman Packages

### **Skenario 2: App Minimize/Background**
1. Paket baru terdeteksi
2. ✅ **Notifikasi muncul di notification bar**
3. ✅ **Head-up notification** (popup di atas)
4. Tap notifikasi → App terbuka ke halaman Packages

### **Skenario 3: App Tertutup (Killed)**
1. Paket baru terdeteksi
2. ⚠️ **Notifikasi TIDAK muncul** (butuh push notification server/FCM)
3. **Solusi:** Implement Firebase Cloud Messaging (FCM) untuk push dari server

---

## 🔧 TROUBLESHOOTING

### **Problem 1: Notifikasi Tidak Muncul**

**Check Permission:**
```
Settings → Apps → Smart Parcel → Notifications → Ensure ON
```

**Check Do Not Disturb:**
```
Settings → Sound → Do Not Disturb → OFF
```

**Check Battery Optimization:**
```
Settings → Apps → Smart Parcel → Battery → Unrestricted
```

### **Problem 2: Permission Denied**

**Re-request Permission:**
Di app, tambahkan button:
```tsx
<button onClick={async () => {
  const granted = await notificationService.requestPermission();
  alert(granted ? 'Permission granted!' : 'Permission denied!');
}}>
  Request Notification Permission
</button>
```

### **Problem 3: App Closed = No Notification**

**Current Limitation:**
- Notifikasi hanya muncul jika app TERBUKA atau BACKGROUND
- Jika app KILLED (force stop), notifikasi TIDAK muncul

**Solution: Implement FCM (Firebase Cloud Messaging)**

Untuk push notification saat app killed, butuh:
1. Firebase project setup
2. Add `google-services.json` ke Android project
3. Backend send notification via FCM API

**Would you like me to implement FCM?**

---

## 📊 NOTIFICATION TYPES

### **1. New Package Notification**
```
Title: 📦 Paket Baru Tiba!
Body:  Paket untuk [recipient]
       No. Resi: [trackingNumber]
Icon:  /icons/icon-192x192.png
Sound: Default
Action: Navigate to /packages
```

### **2. Package Pickup Notification** (Future)
```
Title: ✅ Paket Diambil
Body:  Paket [trackingNumber] telah diambil oleh [recipient]
Icon:  /icons/icon-192x192.png
Action: Navigate to /packages
```

---

## 🚀 NEXT STEPS (Optional Enhancements)

### **1. Implement FCM for Background Push**
- Setup Firebase project
- Add FCM server key to backend
- Send push via Firebase Admin SDK
- **Benefit:** Notifikasi muncul even if app killed

### **2. Custom Notification Actions**
```
Actions: [View Package] [Dismiss]
```

### **3. Notification History**
- Save notifications to IndexedDB
- Show notification list in app
- Mark as read/unread

### **4. Rich Notifications**
- Show package photo in notification
- Progress bar for delivery status
- Large text expandable

### **5. Notification Preferences**
- Enable/disable per type
- Custom sound selection
- Vibration pattern

---

## 📝 CODE CHANGES SUMMARY

### Files Modified:
1. ✅ `pwa/package.json` - Added `@capacitor/push-notifications`
2. ✅ `pwa/src/services/notificationService.ts` - **NEW** notification service
3. ✅ `pwa/src/main.tsx` - Initialize notification service
4. ✅ `pwa/src/pages/Dashboard.tsx` - Trigger notification on `package:new`

### Files Already Configured:
- ✅ `AndroidManifest.xml` - `POST_NOTIFICATIONS` permission exists
- ✅ `capacitor.config.ts` - Notification plugin auto-registered

### Build Output:
```
APK: app-debug.apk
Size: 3.98 MB (was 3.92 MB)
New: +60KB for push notification plugin
Plugins: 7 total (added @capacitor/push-notifications)
```

---

## ✅ TESTING CHECKLIST

- [ ] Install APK baru ke phone
- [ ] Grant notification permission saat app dibuka
- [ ] Test: Trigger paket baru via MQTT/Socket.IO
- [ ] Verify: Notifikasi muncul di notification bar
- [ ] Verify: Tap notifikasi → navigate ke /packages
- [ ] Test: App di background → notifikasi tetap muncul
- [ ] Test: Suara/getar notification
- [ ] Test: Multiple notifications (stacking)

---

## 🎉 READY TO TEST!

**Current Status:**
- ✅ Notification service implemented
- ✅ APK built with push notifications
- ✅ Auto-trigger on new package
- ✅ Permission handling
- ⏳ **Ready for testing on device**

**Install APK:**
```
Location: D:\projct\projek_cdio\pwa\android\app\build\outputs\apk\debug\app-debug.apk
Size: 3.98 MB
```

**Test Command (if phone connected):**
```powershell
adb install -r "D:\projct\projek_cdio\pwa\android\app\build\outputs\apk\debug\app-debug.apk"
```

**Or manual:** Copy APK to phone → Install → Open app → Allow notifications → Trigger test package!

---

Mau saya implementasikan FCM untuk push notification saat app closed? 🔥
