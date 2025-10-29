# 🚀 VPS Quick Fix - Run These Commands Now

## The Problem

Backend is crashing because TypeScript wasn't compiled to JavaScript.

**Error:** `Cannot find module '/home/ubuntu/smartparcel/backend/dist/index.js'`

---

## ✅ Solution: Copy & Paste These Commands

```bash
# 1. Stop the failing process
pm2 stop smartparcel-backend
pm2 delete smartparcel-backend

# 2. Go to backend directory
cd /home/ubuntu/smartparcel/backend

# 3. BUILD THE TYPESCRIPT CODE (this was missing!)
npm run build

# 4. Start backend properly
pm2 start npm --name smartparcel-backend -- start
pm2 save

# 5. Check status
pm2 logs smartparcel-backend --lines 50
```

---

## ✅ Verify It's Working

```bash
# Should return: {"status":"ok"}
curl http://localhost:8080/api/v1/health
```

---

## 📋 What Each Command Does

1. **`pm2 stop/delete`** - Removes the broken process
2. **`npm run build`** - **COMPILES TypeScript → JavaScript** (creates `dist/index.js`)
3. **`pm2 start`** - Starts backend with compiled code
4. **`pm2 save`** - Saves config so it restarts on reboot
5. **`curl`** - Tests if backend is responding

---

## ✅ Expected Output After `npm run build`

You should see:
```
> smart-parcel-backend@1.0.0 build
> tsc

(Compiles successfully with no errors)
```

Then check:
```bash
ls -la dist/
```

Should show:
- `index.js` ✓
- `config.js` ✓
- `routes/` folder ✓
- `services/` folder ✓

---

## ✅ Expected Output After `pm2 start`

```
[PM2] Starting npm in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ smartparcel-backe… │ fork     │ 0    │ online    │ 0%       │ 50mb     │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

**Status should be: `online`** ✅

---

## ✅ Expected Logs After Backend Starts

```bash
pm2 logs smartparcel-backend --lines 20
```

You should see:
```
0|smartparcel-backend  | ✓ Server running on http://localhost:8080
0|smartparcel-backend  | ✓ Socket.IO server started
0|smartparcel-backend  | ✓ Connected to MQTT broker at mqtt://localhost:1883
```

**NO ERRORS!** ✅

---

## 🎯 Success Checklist

- [ ] `npm run build` completes without errors
- [ ] `dist/` folder created with `.js` files
- [ ] PM2 shows backend as `online`
- [ ] Logs show "Server running on http://localhost:8080"
- [ ] `curl http://localhost:8080/api/v1/health` returns `{"status":"ok"}`

---

## 🔥 If It Works, Next Steps:

### 1. Setup WhatsApp Service
```bash
cd /home/ubuntu/smartparcel/wa
npm install --production
npm run build  # Build WA TypeScript too!
cp .env.example .env

# Edit .env
echo "PORT=3001" > .env
echo "BACKEND_URL=http://localhost:8080" >> .env

pm2 start npm --name smartparcel-whatsapp -- start
pm2 save
pm2 logs smartparcel-whatsapp  # Scan QR code with phone
```

### 2. Test From Your Computer
```bash
# From your local machine (not VPS)
curl http://13.213.57.228:8080/api/v1/health
```

If this fails, open firewall:
```bash
# On VPS
sudo ufw allow 8080/tcp
sudo ufw status
```

### 3. Test APK
- Install `smartparcel-13.213.57.228.apk` on your phone
- Login with: `admin@example.com` / `admin123`
- Should connect to VPS successfully!

---

## ❌ Troubleshooting

### If `npm run build` fails:
```bash
cd /home/ubuntu/smartparcel/backend
npm install --save-dev typescript
npx tsc
```

### If PM2 still shows errors:
```bash
pm2 logs smartparcel-backend --lines 100
# Look for the actual error message
```

### If port 8080 is busy:
```bash
sudo lsof -i :8080
# Kill the process using that port
```

### If you need to start fresh:
```bash
pm2 delete all
cd /home/ubuntu/smartparcel/backend
rm -rf dist
npm run build
pm2 start npm --name smartparcel-backend -- start
pm2 save
```

---

## 📞 What to Report Back

After running the commands, tell me:

1. ✅ Did `npm run build` succeed?
2. ✅ Does `ls dist/` show `index.js`?
3. ✅ Does `pm2 status` show `online`?
4. ✅ What does `pm2 logs smartparcel-backend --lines 20` show?
5. ✅ What does `curl http://localhost:8080/api/v1/health` return?

If all ✅, you're ready for APK testing! 🎉
