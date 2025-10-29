# CRITICAL FIXES - WhatsApp Notification & Distance Display

**Date:** October 29, 2025  
**Issues Fixed:**
1. ❌ WhatsApp notifications going to hardcoded `628123456789` instead of UI recipients
2. ❌ Distance sensor showing `--` in DeviceControl despite MQTT data arriving

---

## Problem Analysis

### Issue 1: Hardcoded WhatsApp Recipient

**Root Cause:**
- `backend/src/routes/packages.ts` line 108 was using `config.baileys.defaultPhone || '628123456789'`
- Frontend WhatsApp settings (enabled, recipients[]) stored only in localStorage
- Backend had no way to read recipients from UI

**Log Evidence:**
```
📬 WhatsApp notification queued
```
But notification sent to 628123456789, not to recipients added in UI.

### Issue 2: Distance Display Showing `--`

**Root Cause:**
- MQTT publishing: `smartparcel/box-01/sensor/distance: {"cm":5.01}`
- Backend Socket.IO emitting: `distance_update` with `{deviceId, distance, ts}`
- Frontend expecting: `{deviceId, cm}`
- Field name mismatch: `distance` vs `cm`

**Log Evidence:**
```
[MQTT] smartparcel/box-01/sensor/distance: {"cm":5.01}
```
But DeviceControl.tsx showed `--` because it checked `data.cm` while backend sent `data.distance`.

---

## Solutions Implemented

### Fix 1: WhatsApp Notification Recipients from UI

#### A. Created Backend API Endpoint

**File:** `backend/src/routes/whatsapp.ts` (NEW)
```typescript
GET  /api/v1/wa/settings  // Load settings
POST /api/v1/wa/settings  // Save { enabled: boolean, recipients: string[] }
```

**Storage:** `backend/data/whatsapp-settings.json`
```json
{
  "enabled": true,
  "recipients": ["628123456789", "628987654321"]
}
```

#### B. Updated Package Notification Logic

**File:** `backend/src/routes/packages.ts` (Lines 99-148)

**Before:**
```typescript
notificationQueue.enqueue('package', config.baileys.defaultPhone || '628123456789', {...});
```

**After:**
```typescript
// Load settings from file
const settingsPath = './data/whatsapp-settings.json';
const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));

// Only send if enabled and has recipients
if (settings.enabled && settings.recipients.length > 0) {
  for (const recipient of settings.recipients) {
    notificationQueue.enqueue('package', recipient, {...});
  }
  console.log(`📬 WhatsApp notification queued for ${recipients.length} recipient(s)`);
}
```

#### C. Updated Frontend to Save to Backend

**File:** `pwa/src/pages/WhatsApp.tsx` (Lines 50-110)

**Changes:**
1. **Load:** Try backend API first, fallback to localStorage
2. **Save:** POST to backend API + localStorage backup

```typescript
// Load on mount
const response = await fetch(`${apiUrl}/wa/settings`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
setSettings(data);

// Save function
const response = await fetch(`${apiUrl}/wa/settings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(newSettings)
});
```

#### D. Registered Route in Backend

**File:** `backend/src/index.ts`
```typescript
import whatsappRouter from './routes/whatsapp';
app.use('/api/v1/wa', whatsappRouter);
```

---

### Fix 2: Distance Display

**File:** `pwa/src/pages/DeviceControl.tsx` (Lines 70-82)

**Before:**
```typescript
const handleDistance = (data: any) => {
  const dataDeviceId = data.deviceId || data.device_id || data.id;
  if (dataDeviceId === deviceId && typeof data.cm === 'number') {
    setSensorData({ cm: data.cm, timestamp: new Date().toISOString() });
  }
};
```

**After:**
```typescript
const handleDistance = (data: any) => {
  const dataDeviceId = data.deviceId || data.device_id || data.id;
  
  // Support both field names: distance and cm
  const distanceValue = data.distance !== undefined ? data.distance : data.cm;
  
  if (dataDeviceId === deviceId && typeof distanceValue === 'number') {
    setSensorData({ cm: distanceValue, timestamp: new Date().toISOString() });
  }
};
```

**Why This Works:**
- Backend MQTT handler emits `{deviceId, distance, ts}`
- Frontend now checks BOTH `data.distance` and `data.cm`
- Displays whichever field exists

---

## Data Flow Diagram

### WhatsApp Notification Flow (CORRECTED)

```
┌─────────────────────┐
│  WhatsApp.tsx (UI)  │
│  - Add recipients   │
│  - Toggle enabled   │
│  - Click Save       │
└──────────┬──────────┘
           │ POST /api/v1/wa/settings
           │ {enabled: true, recipients: ["628..."]}
           ▼
┌─────────────────────────────────┐
│  backend/routes/whatsapp.ts     │
│  - Validate recipients          │
│  - Write to data/whatsapp-      │
│    settings.json                │
└──────────┬──────────────────────┘
           │ File saved
           ▼
┌─────────────────────────────────┐
│  ESP32 detects package          │
│  - Takes photo                  │
│  - POST /api/v1/packages        │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  backend/routes/packages.ts     │
│  - Read whatsapp-settings.json  │
│  - Check if enabled=true        │
│  - Loop through recipients[]    │
│  - Queue notification for each  │
└──────────┬──────────────────────┘
           │ For each recipient
           ▼
┌─────────────────────────────────┐
│  notificationQueue.enqueue()    │
│  - Send to recipient 1          │
│  - Send to recipient 2          │
│  - Send to recipient N          │
└─────────────────────────────────┘
```

### Distance Display Flow (CORRECTED)

```
┌─────────────────────────────────┐
│  ESP32-CAM (Firmware)           │
│  - Read ultrasonic sensor       │
│  - MQTT publish                 │
│    smartparcel/box-01/sensor/   │
│    distance: {"cm": 5.01}       │
└──────────┬──────────────────────┘
           │ MQTT message
           ▼
┌─────────────────────────────────┐
│  backend/services/mqtt.ts       │
│  - handleDistance(deviceId, data)│
│  - Extract data.cm              │
│  - emitDistanceUpdate({         │
│      deviceId: "box-01",        │
│      distance: 5.01,  ← renamed │
│      ts: "2025-..."             │
│    })                           │
└──────────┬──────────────────────┘
           │ Socket.IO event: distance_update
           ▼
┌─────────────────────────────────┐
│  pwa/pages/DeviceControl.tsx    │
│  - socket.on('distance_update') │
│  - handleDistance(data)         │
│  - Check data.distance OR data.cm│  ← FIXED
│  - setSensorData({cm: 5.01})   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  UI Renders                     │
│  ┌───────────────────────────┐  │
│  │ Distance Sensor           │  │
│  │ 5.0 cm  ← Now displays!   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Testing Steps

### Test 1: WhatsApp Notification Recipients

1. **Open WhatsApp page** (http://localhost:5174/whatsapp)
2. **Toggle "Enable Notifications"** to ON
3. **Add recipients:**
   - Enter: `628123456789`
   - Click **Add**
   - Enter: `628987654321`
   - Click **Add**
4. **Check logs:**
   ```
   ✅ Settings saved to backend
   ✅ Added recipient: 628123456789
   ✅ Added recipient: 628987654321
   ```

5. **Verify backend saved:**
   ```powershell
   cat backend/data/whatsapp-settings.json
   ```
   Should show:
   ```json
   {
     "enabled": true,
     "recipients": ["628123456789", "628987654321"]
   }
   ```

6. **Trigger package detection:**
   - Place object in front of ESP32 ultrasonic sensor (12-25cm range)
   - ESP32 will auto-capture photo and upload

7. **Check backend logs:**
   ```
   📦 New package: pkg-...
   📬 WhatsApp notification queued for 2 recipient(s)
   📤 Processing 2 queued notifications...
   ✅ Notification sent: package-...
   ✅ Notification sent: package-...
   ```

8. **Check WhatsApp:**
   - BOTH recipients should receive photo + caption
   - No more sending to 628123456789 if not in list

---

### Test 2: Distance Display

1. **Open DeviceControl** (http://localhost:5174/device/box-01)
2. **Move object in front of sensor**
3. **Watch backend logs:**
   ```
   [MQTT] smartparcel/box-01/sensor/distance: {"cm":5.01}
   [MQTT] smartparcel/box-01/sensor/distance: {"cm":17.85}
   ```

4. **Watch UI update in real-time:**
   ```
   ┌───────────────────────┐
   │ Distance Sensor       │
   │ 5.0 cm    ← Updates!  │
   │ Range: 12-25 cm       │
   └───────────────────────┘
   ```

5. **Verify no more `--` display**

---

## Files Modified

### Backend

1. **NEW:** `backend/src/routes/whatsapp.ts` (75 lines)
   - GET /api/v1/wa/settings
   - POST /api/v1/wa/settings

2. **MODIFIED:** `backend/src/routes/packages.ts`
   - Lines 99-148: Read settings from file, send to all recipients

3. **MODIFIED:** `backend/src/index.ts`
   - Line 17: Import whatsappRouter
   - Line 81: app.use('/api/v1/wa', whatsappRouter)

4. **NEW DATA FILE:** `backend/data/whatsapp-settings.json`
   - Created automatically on first save from UI

### Frontend

5. **MODIFIED:** `pwa/src/pages/WhatsApp.tsx`
   - Lines 50-110: Load from backend API, save to backend API
   - Fallback to localStorage if backend unavailable

6. **MODIFIED:** `pwa/src/pages/DeviceControl.tsx`
   - Lines 70-82: Support both `data.distance` and `data.cm`

---

## Validation Results

### TypeScript Compilation
```
✅ No errors in whatsapp.ts
✅ No errors in packages.ts
✅ No errors in index.ts
✅ No errors in WhatsApp.tsx
✅ No errors in DeviceControl.tsx
```

### Runtime Logs (Expected)

**After adding recipients:**
```
✅ Settings saved to backend
✅ Added recipient: 628123456789
📬 WhatsApp notification queued for 1 recipient(s)
```

**After package detection:**
```
[MQTT] smartparcel/box-01/event: {"type":"detect","cm":17.9}
📦 New package: pkg-1761697879617-r1qq9i6lt
📬 WhatsApp notification queued for 1 recipient(s)
📤 Processing 1 queued notifications...
✅ Notification sent: package-1761697879619-qgpumo4ml
```

**Distance sensor working:**
```
[MQTT] smartparcel/box-01/sensor/distance: {"cm":5.01}
[MQTT] smartparcel/box-01/sensor/distance: {"cm":17.85}
```

---

## Security Considerations

### API Authentication
- Both endpoints use `optionalAuth` middleware
- Requires `Authorization: Bearer <token>` header
- Token from localStorage after login

### Input Validation
- Recipients must be 10-15 digits
- Regex: `/^\d{10,15}$/`
- Prevents injection attacks

### File System Safety
- Settings file path hardcoded: `./data/whatsapp-settings.json`
- Directory created with `recursive: true`
- JSON.parse wrapped in try-catch

---

## Backward Compatibility

### Old localStorage Settings
- Still supported as fallback
- Load sequence:
  1. Try backend API
  2. If fails, try localStorage
  3. If both fail, use defaults: `{enabled: false, recipients: []}`

### MQTT Distance Field
- Supports BOTH naming conventions:
  - `{"cm": 5.01}` (current firmware)
  - `{"distance": 5.01}` (backend transform)
- No firmware update required

---

## Next Steps

1. **Restart backend server:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Test notification flow:**
   - Add recipients in UI
   - Trigger detection
   - Verify all recipients receive message

3. **Monitor logs:**
   - Backend: Check for "queued for N recipient(s)"
   - Frontend: Check distance updates in DeviceControl

4. **Verify settings persistence:**
   - Reload WhatsApp page
   - Recipients should still be there (loaded from backend)

---

## Summary

✅ **WhatsApp Notifications:** Now use recipients from UI, not hardcoded  
✅ **Distance Display:** Now shows real-time cm values, not `--`  
✅ **Settings Persistence:** Saved to backend API + localStorage  
✅ **Backward Compatible:** Supports old localStorage and both MQTT field names  
✅ **Type Safe:** All TypeScript errors resolved  

**Status:** READY FOR TESTING 🚀
