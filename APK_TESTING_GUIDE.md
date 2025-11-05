# APK Testing Guide - Fixed Auth Issue

## ✅ Fix Applied (Nov 5, 2025 - 08:18 AM)

### Issue Fixed:
**Onboarding "Not found" error** when submitting name on first app launch.

### Root Cause:
The APK was trying to save the user's name to the server before logging in, resulting in a 404 error because there was no valid authentication token.

### Solution Implemented:
Added token validation in the `setupName()` function to:
1. Check if token exists in localStorage
2. Validate token is not expired
3. Logout and show proper error message if token is invalid
4. Redirect user to login screen

---

## 📱 New APK Details

**File:** `smartparcel-vps-fixed-auth.apk`
**Location:** `d:\projct\projek_cdio\smartparcel-vps-fixed-auth.apk`
**Size:** 6.91 MB
**Build Time:** Nov 5, 2025 - 08:18 AM
**API Target:** http://13.213.57.228:8080/api/v1
**WhatsApp Target:** http://13.213.57.228:3001

---

## 🧪 Testing Steps

### 1. Clean Installation (Recommended)
```bash
# Uninstall old APK first
adb uninstall com.smartparcel.app

# Install new APK
adb install smartparcel-vps-fixed-auth.apk
```

### 2. First Launch Flow
1. **Open APK** → Should show **Login Screen** (not onboarding)
2. **Login** with credentials:
   - Username: `admin`
   - Password: `admin123`
3. **After Login** → Will show Name Setup (if no name set)
4. **Enter Name** → Should save successfully (no "Not found" error)
5. **PIN Setup** → Create 4-6 digit PIN (e.g., `123456`)
6. **Dashboard** → Should load with device stats

### 3. Test Device Controls
From the dashboard or device control page:
- ✅ **Flash/Lamp** → Tap to toggle LED
- ✅ **Buzzer** → Tap to sound alarm
- ✅ **Lock** → Tap to lock/unlock
- ✅ **Capture** → Tap to take photo

**Expected:** Backend logs should show MQTT messages being sent to ESP32.

### 4. Test Photo Upload
1. **Trigger ESP32-CAM** → Detect distance < 10cm OR press capture button
2. **Check Gallery** → New photo should appear
3. **Check Dashboard** → Photo count should increase

**Note:** Currently, old photos (50 from October) have missing files, so they'll show as white. New photos from ESP32-CAM should work correctly.

---

## 🔍 Troubleshooting

### Issue: Still seeing "Not found" error
**Solution:** 
1. Uninstall APK completely
2. Clear app data: Settings → Apps → Smart Parcel → Clear Data
3. Reinstall APK
4. Login with `admin` / `admin123`

### Issue: Can't login
**Check:**
- VPS backend is running: `pm2 status smartparcel-backend`
- Network connectivity to VPS: `curl http://13.213.57.228:8080/health`
- Check backend logs: `pm2 logs smartparcel-backend --lines 50`

### Issue: Device controls not working
**Check:**
1. ESP32-CAM/ESP8266 is online and connected to MQTT broker
2. Backend MQTT connection: Check logs for "MQTT connected"
3. Device ID matches in both firmware and backend

### Issue: Distance sensor not appearing
**Solution:**
1. Power cycle ESP32-CAM
2. Check MQTT broker: `mosquitto_sub -h 13.213.57.228 -t "smartbox/#" -u smartbox -P engganngodinginginmcu`
3. Verify ESP32 firmware is publishing to correct topic

---

## 🚀 VPS Status

**Backend:** ✅ Running (PID 108784, Port 8080)
**WhatsApp:** ✅ Running (PID 107071, Port 3001)
**MQTT Broker:** ✅ Running (Port 1883)

**Latest Deployment:** Nov 5, 2025 - 08:20 AM
**Git Commit:** `ea7089c` - "fix: validate token in setupName before API call"

---

## 📋 Known Issues (Pending)

1. **Photos Missing:** Database has 50 packages from October, but photo files were deleted. Need ESP32-CAM to upload new photos.

2. **Distance Sensor Not Publishing:** ESP32-CAM needs restart to resume distance publishing (MQTT messages not appearing in backend logs).

3. **Photo Count Inconsistency:** Gallery shows 50 packages but dashboard shows 20 (need to investigate query filters).

---

## 🎯 Next Steps

1. ✅ **Test APK with new auth fix** (this step)
2. ⏳ **Restart ESP32-CAM** to resume distance publishing + photo capture
3. ⏳ **Update ESP32-CAM firmware** with upload fix (30s timeout)
4. ⏳ **End-to-end testing** with real hardware

---

## 📞 Support

If you encounter any issues:
1. Check backend logs: `pm2 logs smartparcel-backend`
2. Check WhatsApp service logs: `pm2 logs smartparcel-whatsapp`
3. Check system status: `pm2 status`
4. Restart services: `pm2 restart all`

---

**Last Updated:** Nov 5, 2025 - 08:22 AM
**Tested By:** [Pending user testing]
**Status:** ✅ Ready for testing
