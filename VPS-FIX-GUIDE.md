# VPS Issues Fix Guide

## 🔴 Issues Detected:

### 1. WhatsApp Service Error
```
Error: Cannot find module '/home/ubuntu/smartparcel/wa/dist/index.js'
```
**Cause**: TypeScript not compiled, dist folder empty

### 2. Backend Events.json Corrupted
```
SyntaxError: Unexpected non-whitespace character after JSON at position 18616 (line 761 column 5)
```
**Cause**: JSON file corrupted (possibly incomplete write or manual edit error)

---

## ✅ Quick Fix (Automated):

### Step 1: Upload fix script to VPS
```bash
# On your local machine, copy the fix script to VPS:
scp fix-vps-issues.sh ubuntu@13.213.57.228:/home/ubuntu/
```

### Step 2: Run the fix script on VPS
```bash
# SSH to VPS
ssh ubuntu@13.213.57.228

# Run the fix script
bash /home/ubuntu/fix-vps-issues.sh
```

The script will:
1. Build WhatsApp service (create dist/index.js)
2. Backup corrupted events.json
3. Create fresh events.json
4. Restart both services
5. Show status and logs

---

## ✅ Manual Fix (If automated fails):

### Fix 1: WhatsApp Service

```bash
# SSH to VPS
ssh ubuntu@13.213.57.228

# Navigate to wa directory
cd /home/ubuntu/smartparcel/wa

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify dist/index.js exists
ls -la dist/index.js

# Restart service
pm2 restart smartparcel-whatsapp

# Check logs
pm2 logs smartparcel-whatsapp --lines 20
```

### Fix 2: Backend events.json

```bash
# Still in VPS

# Navigate to backend data directory
cd /home/ubuntu/smartparcel/backend/data

# Backup corrupted file
cp events.json events.json.backup.$(date +%Y%m%d_%H%M%S)

# Create fresh events.json
echo "[]" > events.json

# Verify file is valid JSON
cat events.json

# Restart backend
pm2 restart smartparcel-backend

# Check logs
pm2 logs smartparcel-backend --lines 20
```

---

## ✅ Verify Fix:

```bash
# Check PM2 status
pm2 status

# Should show:
# - smartparcel-backend: online
# - smartparcel-whatsapp: online

# Check if errors stopped
pm2 logs --lines 50

# Test backend API
curl http://localhost:8080/api/v1/auth/health

# Test WhatsApp service
curl http://localhost:3001/health
```

---

## 🔍 Root Causes:

### WhatsApp Service:
- After git pull, TypeScript source updated but not recompiled
- **Solution**: Always run `npm run build` after git pull in wa directory

### Events.json:
- File got corrupted during concurrent writes (MQTT events)
- **Prevention**: 
  - Backend has write lock mechanism
  - May need to add retry logic for failed writes

---

## 📋 Checklist After Fix:

- [ ] WhatsApp service running without errors
- [ ] Backend running without JSON parse errors
- [ ] MQTT messages processing correctly
- [ ] Package detection working
- [ ] No error logs in PM2

---

## 🚀 Prevention for Future:

### Always after `git pull`:

```bash
# Backend
cd /home/ubuntu/smartparcel/backend
npm install
npm run build
pm2 restart smartparcel-backend

# WhatsApp
cd /home/ubuntu/smartparcel/wa
npm install
npm run build
pm2 restart smartparcel-whatsapp
```

Or use the automated deploy script (will create later).

---

## ℹ️ Notes:

- Events.json backup saved with timestamp
- Old events data still in backup file if needed
- Both services should restart cleanly after fix
- MQTT should continue receiving distance sensor data
