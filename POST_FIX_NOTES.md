# 📝 Post-Fix Installation Notes

## TypeScript Type Definitions

### PWA Project

The `vite.config.ts` file uses `process.cwd()` which requires `@types/node` for TypeScript type checking.

**To fix TypeScript errors (optional, code works fine without it):**

```bash
cd pwa
npm install --save-dev @types/node
```

This is purely for TypeScript type checking and doesn't affect runtime behavior. The code will work correctly without it.

---

## Verification Steps

After applying all fixes, verify everything works:

### 1. Backend MQTT Topics

```bash
cd backend
npm run dev
```

Test MQTT commands:
- Lock: Publish to `smartparcel/box-01/lock/set` with payload `"UNLOCK"`
- Lamp: Publish to `smartparcel/box-01/lamp/set` with payload `"ON"`
- Capture: Publish to `smartparcel/box-01/cmd/capture` with payload `"CAPTURE"`
- Buzzer: Publish to `smartparcel/box-01/buzzer/trigger` with payload `"200"`

### 2. PWA Environment Variables

```bash
cd pwa

# Create .env if not exists
cp .env.example .env

# Optional: Install @types/node to remove TS warning
npm install --save-dev @types/node

# Start dev server
npm run dev
```

### 3. Firmware Configuration

```bash
cd firmware

# Create config from template
cp include/config.h.example include/config.h

# Edit config.h with your credentials (NEVER commit this file!)
nano include/config.h

# Verify it's ignored by Git
git status
# Should NOT show include/config.h

# Upload to device
platformio run --target upload
```

---

## Testing Checklist

### Backend:
- [ ] Server starts without errors
- [ ] MQTT connects successfully
- [ ] Can publish to individual topics
- [ ] ES6 imports work (no require errors)

### PWA:
- [ ] Dev server starts
- [ ] API calls work through proxy
- [ ] WebSocket connects
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`

### Firmware:
- [ ] `config.h` created from template
- [ ] All credentials updated (not defaults!)
- [ ] `config.h` NOT showing in `git status`
- [ ] Compiles without errors
- [ ] Uploads successfully

### Integration:
- [ ] ESP32 connects to WiFi
- [ ] ESP32 connects to MQTT broker
- [ ] Backend receives MQTT messages from ESP32
- [ ] Dashboard controls work (via MQTT)
- [ ] WhatsApp notifications work
- [ ] Web Push notifications work

---

## Common Issues

### Issue: TypeScript error in vite.config.ts

**Error:**
```
Cannot find name 'process'. Do you need to install type definitions for node?
```

**Solution:**
```bash
cd pwa
npm install --save-dev @types/node
```

**Note:** This is optional - the code works fine at runtime.

---

### Issue: Dashboard controls don't work

**Check:**
1. Backend MQTT service is running
2. MQTT broker is accessible
3. Firmware is subscribed to correct topics
4. Topics match: `smartparcel/{deviceId}/lock/set` etc.

**Debug:**
```bash
# Monitor MQTT messages
mosquitto_sub -h mqtt.yourserver.com -u smartbox -P yourpass -t "smartparcel/#" -v
```

---

### Issue: Firmware config.h shows in Git

**Solution:**
```bash
# Add to .gitignore if not already there
echo "include/config.h" >> firmware/.gitignore
echo "src/config.h" >> firmware/.gitignore

# Remove from Git cache
git rm --cached firmware/include/config.h

# Commit the .gitignore change
git add firmware/.gitignore
git commit -m "chore: ignore firmware config.h"
```

---

### Issue: WhatsApp disconnects frequently

**Solutions:**
1. Check `wa-session/` folder permissions
2. Ensure stable internet connection
3. Check for WhatsApp Web conflicts (logout other devices)
4. Try clearing session and reconnecting

---

## Environment Variables Summary

### Backend (.env)
```env
PORT=8080
DATABASE_URL=file:./db.sqlite
API_TOKEN=your_secure_token_here
MQTT_HOST=mqtt.server.com
MQTT_PASS=your_mqtt_password
```

### PWA (.env)
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
VITE_API_BASE_URL=/api/v1
```

### Firmware (config.h)
```cpp
#define API_TOKEN "same_as_backend_API_TOKEN"
#define MQTT_PASS "same_as_backend_MQTT_PASS"
```

**IMPORTANT:** API_TOKEN and MQTT_PASS must match between backend and firmware!

---

## Production Deployment

### 1. Generate secure credentials

```bash
# API Token (32 chars)
openssl rand -hex 16

# MQTT Password (24 chars)
openssl rand -base64 24
```

### 2. Update all .env files

- backend/.env
- pwa/.env (production URLs)
- firmware/include/config.h

### 3. Build and deploy

```bash
# Backend
cd backend
npm run build
npm start

# PWA
cd pwa
npm run build
# Deploy dist/ folder to web server

# Firmware
cd firmware
platformio run --target upload
```

---

## Success Indicators

✅ Backend starts and shows:
```
✅ [MQTT] Connected!
📡 [MQTT] Subscribed to: smartparcel/#
```

✅ PWA shows:
```
[Vite] connected.
WebSocket connected
```

✅ Firmware shows:
```
WiFi connected!
MQTT connected!
Subscribed to: smartparcel/box-01/lock/set
```

---

## Support

If you encounter issues:
1. Check logs: `npm run dev` or `platformio device monitor`
2. Verify credentials match across all services
3. Check MQTT broker is accessible
4. Review documentation in FIRMWARE_SECURITY.md

**All critical issues are now resolved!** 🎉
