# 🔧 VPS QUICK FIX COMMANDS

## ⚠️ Error yang Terjadi:

1. ❌ `DATABASE_URL` not found in .env
2. ❌ `pm2` command not found
3. ⚠️ npm deprecated warnings (minor, bisa diabaikan)

---

## ✅ SOLUSI - Copy-Paste Commands Ini di VPS:

### **Step 1: Install PM2 (Process Manager)**

```bash
npm install -g pm2
```

### **Step 2: Setup Environment File**

```bash
# Copy .env.production ke .env
cp .env.production .env

# Verify isi .env
cat .env
```

**Pastikan ada line:** `DATABASE_URL=file:./prisma/db.sqlite`

Jika TIDAK ADA, tambahkan dengan:
```bash
echo "DATABASE_URL=file:./prisma/db.sqlite" >> .env
```

### **Step 3: Setup Database**

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npm run seed
```

### **Step 4: Start Backend Service**

```bash
# Start dengan PM2
pm2 start npm --name smartparcel-backend -- start

# Check status
pm2 status

# View logs
pm2 logs smartparcel-backend --lines 50
```

### **Step 5: Test Backend**

```bash
# Test API health
curl http://localhost:8080/api/v1/health

# Should return: {"status":"ok"}
```

---

## 🚀 FULL AUTOMATED SETUP (Run in One Go)

```bash
# Pull latest changes first
cd /home/ubuntu/smartparcel
git pull

# Run automated fix script
cd backend
chmod +x quick-fix.sh
./quick-fix.sh

# Start service
pm2 start npm --name smartparcel-backend -- start
pm2 save
pm2 startup
```

---

## 📋 DETAILED STEPS (Step by Step)

### **1. Update Repository**

```bash
cd /home/ubuntu/smartparcel
git pull origin main
```

### **2. Install Global Dependencies**

```bash
# Install PM2
sudo npm install -g pm2

# Verify
pm2 --version
```

### **3. Setup Backend**

```bash
cd backend

# Install dependencies (already done)
# npm install --production

# Create .env from production template
cp .env.production .env

# Edit .env (optional - untuk customize)
nano .env
```

**Ensure these are set in .env:**
```bash
PORT=8080
NODE_ENV=production
DATABASE_URL=file:./prisma/db.sqlite
JWT_SECRET=your-secret-from-production-env
API_TOKEN=your-api-token
CORS_ORIGIN=*
MQTT_HOST=13.213.57.228
MQTT_PORT=1883
MQTT_USER=smartbox
MQTT_PASS=engganngodinginginmcu
```

### **4. Database Setup**

```bash
# Create database directory if needed
mkdir -p prisma

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed data (creates admin user, sample devices)
npm run seed
```

**Output should show:**
```
✅ Created admin user
✅ Created 2 devices
✅ Seeding completed
```

### **5. Start Service**

```bash
# Start backend
pm2 start npm --name smartparcel-backend -- start

# OR if you have ecosystem file:
pm2 start ecosystem.config.js

# Check logs
pm2 logs smartparcel-backend

# Check status
pm2 status
```

### **6. Save PM2 Config**

```bash
# Save current PM2 processes
pm2 save

# Setup auto-start on reboot
pm2 startup

# Copy-paste the command it shows, example:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### **7. Test Backend**

```bash
# Test health endpoint
curl http://localhost:8080/api/v1/health

# Test with Nginx (if configured)
curl http://localhost

# Test from external
curl http://13.213.57.228:8080/api/v1/health
```

---

## 🔍 TROUBLESHOOTING

### **Problem: "Environment variable not found: DATABASE_URL"**

**Fix:**
```bash
echo "DATABASE_URL=file:./prisma/db.sqlite" >> backend/.env
```

### **Problem: "Command 'pm2' not found"**

**Fix:**
```bash
sudo npm install -g pm2
```

### **Problem: "Port 8080 already in use"**

**Check what's using port:**
```bash
sudo lsof -i :8080
```

**Kill process:**
```bash
sudo kill -9 <PID>
```

**Or change port in .env:**
```bash
PORT=8081
```

### **Problem: "Prisma Client not found"**

**Fix:**
```bash
npx prisma generate
```

### **Problem: "Database locked"**

**Fix:**
```bash
# Stop all services using database
pm2 stop all

# Delete database (WARNING: data will be lost)
rm -f prisma/db.sqlite

# Recreate
npx prisma migrate deploy
npm run seed

# Restart
pm2 restart all
```

---

## 📊 VERIFY EVERYTHING WORKS

### **Check PM2 Status**
```bash
pm2 status
# Should show: smartparcel-backend | online
```

### **Check Logs**
```bash
pm2 logs smartparcel-backend --lines 100
```

### **Check API Response**
```bash
curl http://localhost:8080/api/v1/health
# Should return: {"status":"ok","timestamp":"..."}
```

### **Check Database**
```bash
cd backend
npx prisma studio
# Opens database browser on port 5555
# Access via: http://13.213.57.228:5555
```

### **Check Processes**
```bash
ps aux | grep node
# Should show node processes for backend
```

---

## 🎯 AFTER BACKEND WORKS, SETUP WHATSAPP

```bash
cd /home/ubuntu/smartparcel/wa

# Install dependencies
npm install --production

# Create .env
cat > .env << EOF
PORT=3001
NODE_ENV=production
SESSION_DIR=./wa-session
BACKEND_URL=http://localhost:8080
EOF

# Start with PM2
pm2 start npm --name smartparcel-whatsapp -- start

# Scan QR code
pm2 logs smartparcel-whatsapp
# Scan the QR code with WhatsApp app
```

---

## 🎯 FINAL PM2 COMMANDS

```bash
# Save all processes
pm2 save

# Setup auto-start
pm2 startup

# List processes
pm2 list

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Delete all
pm2 delete all

# Monitor
pm2 monit
```

---

## ✅ SUCCESS CHECKLIST

- [ ] PM2 installed globally
- [ ] `.env` file exists in backend/
- [ ] `DATABASE_URL` set in .env
- [ ] Prisma migrations completed
- [ ] Prisma client generated
- [ ] Database seeded with initial data
- [ ] Backend started with PM2
- [ ] PM2 config saved
- [ ] Auto-start configured
- [ ] Backend accessible on port 8080
- [ ] Health check returns OK
- [ ] Logs show no errors

---

## 🚀 QUICK COPY-PASTE ALL COMMANDS

```bash
# 1. Install PM2
sudo npm install -g pm2

# 2. Setup backend
cd /home/ubuntu/smartparcel/backend
cp .env.production .env
echo "DATABASE_URL=file:./prisma/db.sqlite" >> .env

# 3. Setup database
npx prisma migrate deploy
npx prisma generate
npm run seed

# 4. Start service
pm2 start npm --name smartparcel-backend -- start
pm2 save
pm2 startup

# 5. Test
curl http://localhost:8080/api/v1/health
pm2 status
pm2 logs smartparcel-backend --lines 20
```

---

**Copy commands di atas, paste di VPS terminal!** 🚀
