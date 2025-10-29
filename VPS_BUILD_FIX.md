# VPS Backend Build Fix

## Problem

The backend is failing with:
```
Error: Cannot find module '/home/ubuntu/smartparcel/backend/dist/index.js'
```

This happens because the TypeScript code hasn't been compiled to JavaScript yet.

## Solution

You need to build the TypeScript code before starting the backend.

---

## Quick Fix Commands (Copy-Paste All)

```bash
# Stop the failing PM2 process
pm2 stop smartparcel-backend
pm2 delete smartparcel-backend

# Go to backend directory
cd /home/ubuntu/smartparcel/backend

# Build TypeScript code
npm run build

# Start backend with PM2
pm2 start npm --name smartparcel-backend -- start

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs smartparcel-backend --lines 50

# Test backend
curl http://localhost:8080/api/v1/health
```

---

## Step-by-Step Explanation

### 1. Stop Failing Process
```bash
pm2 stop smartparcel-backend
pm2 delete smartparcel-backend
```

### 2. Build TypeScript
```bash
cd /home/ubuntu/smartparcel/backend
npm run build
```

This will:
- Compile TypeScript files from `src/` to JavaScript in `dist/`
- Create `dist/index.js` and all other compiled files

### 3. Verify Build Output
```bash
ls -la dist/
```

You should see:
- `index.js`
- `config.ts` → `config.js`
- `routes/` folder
- `services/` folder
- etc.

### 4. Start Backend
```bash
pm2 start npm --name smartparcel-backend -- start
pm2 save
```

### 5. Check Logs
```bash
pm2 logs smartparcel-backend --lines 50
```

You should see:
```
✓ Server running on http://localhost:8080
✓ Socket.IO server started
✓ Connected to MQTT broker
```

### 6. Test API
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Should return: {"status":"ok"}
```

---

## If Still Failing

### Check if build script exists
```bash
cd /home/ubuntu/smartparcel/backend
cat package.json | grep -A 5 '"scripts"'
```

### Manual build if npm run build fails
```bash
# Install TypeScript compiler globally
npm install -g typescript

# Build manually
cd /home/ubuntu/smartparcel/backend
npx tsc
```

### Check tsconfig.json
```bash
cat tsconfig.json
```

Should have:
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

---

## Complete Backend Startup Checklist

- [ ] PM2 installed globally
- [ ] Backend dependencies installed (`npm install --production`)
- [ ] `.env` file created with `DATABASE_URL`
- [ ] Prisma migrations applied (`npx prisma migrate deploy`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] **TypeScript compiled to JavaScript (`npm run build`)**
- [ ] Backend started with PM2
- [ ] Backend accessible on port 8080
- [ ] Logs show no errors

---

## Next Steps After Backend Works

### 1. Setup WhatsApp Service
```bash
cd /home/ubuntu/smartparcel/wa
npm install --production
npm run build  # Build TypeScript for WA service too
cp .env.example .env

# Edit .env
nano .env
# Set: PORT=3001, BACKEND_URL=http://localhost:8080

pm2 start npm --name smartparcel-whatsapp -- start
pm2 save
pm2 logs smartparcel-whatsapp  # Scan QR code
```

### 2. Test Full System
```bash
# Check both services
pm2 status

# Test backend
curl http://localhost:8080/api/v1/health

# Test WhatsApp (after QR scanned)
curl http://localhost:3001/health

# Check logs
pm2 logs smartparcel-backend --lines 20
pm2 logs smartparcel-whatsapp --lines 20
```

### 3. Configure Firewall (if not done)
```bash
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 1883/tcp  # MQTT
sudo ufw status
```

---

## Success Indicators

✅ **Backend Running:**
```bash
pm2 status
# Should show: smartparcel-backend | online
```

✅ **Backend Responding:**
```bash
curl http://localhost:8080/api/v1/health
# Returns: {"status":"ok"}
```

✅ **No Errors in Logs:**
```bash
pm2 logs smartparcel-backend --lines 20
# Should show server started successfully
```

✅ **Database Working:**
```bash
cd /home/ubuntu/smartparcel/backend
npx prisma studio --browser none --port 5555
# Should start without errors (Ctrl+C to exit)
```

---

## Troubleshooting

### Error: "npm run build" not found
```bash
cd /home/ubuntu/smartparcel/backend
npm install --save-dev typescript @types/node
npx tsc
```

### Error: TypeScript errors during build
```bash
# Build with skip lib check
npx tsc --skipLibCheck
```

### Error: Port 8080 already in use
```bash
# Find process using port 8080
sudo lsof -i :8080
# Kill it
sudo kill -9 <PID>
```

### Error: Permission denied
```bash
# Fix permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/smartparcel
```

---

## Emergency Full Restart

If everything is messed up:

```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Go to backend
cd /home/ubuntu/smartparcel/backend

# Clean and rebuild
rm -rf node_modules dist
npm install --production
npm run build

# Setup database
cp .env.production .env
echo "DATABASE_URL=file:./prisma/db.sqlite" >> .env
npx prisma migrate deploy
npx prisma generate

# Start backend
pm2 start npm --name smartparcel-backend -- start
pm2 save

# Check logs
pm2 logs smartparcel-backend
```
