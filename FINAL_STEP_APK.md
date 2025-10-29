# 🚀 FINAL STEP: BUILD APK

## Anda sudah sampai di tahap akhir! Tinggal 1 langkah lagi! 🎉

---

## ❌ **ERROR YANG TERJADI:**

```
BUILD FAILED in 7m

* What went wrong:
Could not determine the dependencies of task ':app:compileDebugJavaWithJavac'.
> SDK location not found. Define a valid SDK location with an ANDROID_HOME 
  environment variable or by setting the sdk.dir path in your project's 
  local properties file at 'D:\projct\projek_cdio\pwa\android\local.properties'.
```

**Penyebab:** Android SDK belum terinstall.

---

## ✅ **SOLUSI: 2 OPSI**

### **OPSI 1: Install Android Command Line Tools (RECOMMENDED - FAST)**

**Kelebihan:**
- ✅ Cepat (~10 menit)
- ✅ Minimal (~500 MB)
- ✅ Otomatis dengan script
- ✅ Cukup untuk build APK

**Cara:**

```powershell
# Run script installer (sudah saya buatkan)
cd d:\projct\projek_cdio
.\install-android-sdk.ps1

# Script akan:
# 1. Download Android Command Line Tools (~150 MB)
# 2. Extract ke C:\Users\fahri\AppData\Local\Android\Sdk
# 3. Install Platform Tools + Build Tools + Android 34
# 4. Set ANDROID_HOME environment variable
# 5. Add to PATH

# Tunggu 5-10 menit...
```

**Setelah selesai:**
```powershell
# 1. RESTART PowerShell (PENTING!)
exit

# 2. Open PowerShell baru
cd d:\projct\projek_cdio\pwa\android

# 3. Build APK
.\gradlew assembleDebug

# 4. Tunggu 3-5 menit...
# ✅ APK akan ada di: app\build\outputs\apk\debug\app-debug.apk
```

---

### **OPSI 2: Install Android Studio (LENGKAP - SLOWER)**

**Kelebihan:**
- ✅ GUI lengkap
- ✅ Emulator built-in
- ✅ Visual debugging
- ✅ Layout inspector

**Kekurangan:**
- ❌ Size besar (~2 GB)
- ❌ Instalasi lama (~30 menit)

**Cara:**

1. **Download Android Studio:**
   - Link: https://developer.android.com/studio
   - Size: ~2 GB
   - File: `android-studio-2024.x.x-windows.exe`

2. **Install:**
   - Run installer
   - Choose "Standard" installation
   - Accept all components
   - Wait 20-30 minutes...

3. **Configure:**
   - Open Android Studio
   - "More Actions" → "SDK Manager"
   - Verify installed:
     - ✅ Android SDK Platform 34
     - ✅ Android SDK Build-Tools 34.0.0
     - ✅ Android SDK Platform-Tools

4. **Build APK:**
   ```
   Android Studio → Open → Select: d:\projct\projek_cdio\pwa\android
   Wait for Gradle sync...
   Build → Build Bundle(s) / APK(s) → Build APK(s)
   Wait 3-5 minutes...
   ✅ APK ready!
   ```

---

## 🎯 **REKOMENDASI: OPSI 1 (Command Line Tools)**

Karena Anda hanya perlu build APK, tidak perlu GUI, maka Command Line Tools sudah cukup.

**Total waktu:**
- Install SDK: ~10 menit
- Build APK: ~5 menit
- **Total: ~15 menit** 🚀

---

## 📋 **STEP-BY-STEP (OPSI 1):**

### **Step 1: Run Installer Script**

```powershell
cd d:\projct\projek_cdio
.\install-android-sdk.ps1
```

**Script akan otomatis:**
```
📱 Android SDK Command Line Tools Setup
==========================================

1️⃣  Creating SDK directory...
   ✅ Created: C:\Users\fahri\AppData\Local\Android\Sdk

2️⃣  Downloading Android Command Line Tools...
   URL: https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
   Size: ~150 MB
   ✅ Downloaded successfully

3️⃣  Extracting archive...
   ✅ Extracted to: cmdline-tools/latest

4️⃣  Accepting Android SDK licenses...
   ✅ Licenses accepted

5️⃣  Installing Android SDK components...
   - Platform Tools (adb, fastboot)
   - Build Tools 34.0.0
   - Android Platform 34 (API 34)
   This may take 5-10 minutes...
   ✅ SDK components installed

6️⃣  Setting environment variables...
   ✅ ANDROID_HOME = C:\Users\fahri\AppData\Local\Android\Sdk
   ✅ Added to PATH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ANDROID SDK INSTALLED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **Step 2: Restart PowerShell**

```powershell
# Close current PowerShell
exit

# Open NEW PowerShell window
# (Environment variables updated)
```

---

### **Step 3: Verify Installation**

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME
# Output: C:\Users\fahri\AppData\Local\Android\Sdk

# Check adb
adb --version
# Output: Android Debug Bridge version 1.0.41

# Check sdkmanager
sdkmanager --version
# Output: 13.0
```

---

### **Step 4: Build APK**

```powershell
cd d:\projct\projek_cdio\pwa\android
.\gradlew assembleDebug
```

**Output:**
```
Starting a Gradle Daemon, 1 busy Daemon could not be reused, use --status for details

> Task :app:checkDebugAarMetadata
> Task :app:preBuild
> Task :app:preDebugBuild
> Task :app:mergeDebugNativeLibs
> Task :app:stripDebugDebugSymbols
> Task :app:compileDebugJavaWithJavac
> Task :app:dexBuilderDebug
> Task :app:mergeDebugJavaResource
> Task :app:packageDebug
> Task :app:assembleDebug

BUILD SUCCESSFUL in 3m 45s
127 actionable tasks: 127 executed
```

**APK Location:**
```
android\app\build\outputs\apk\debug\app-debug.apk
Size: ~25 MB
```

---

## 🎉 **SELESAI! APK SIAP INSTALL!**

### **Install ke Phone:**

**Method 1 - USB (Fastest):**
```powershell
# Connect phone via USB
# Enable USB Debugging on phone (Settings → Developer Options)

adb devices
# Output: List of devices attached
#         ABC123XYZ    device

adb install app\build\outputs\apk\debug\app-debug.apk
# Output: Performing Streamed Install
#         Success
```

**Method 2 - Manual Copy:**
1. Copy `app-debug.apk` to phone (via USB or cloud)
2. Open "Files" app on phone
3. Navigate to Downloads folder
4. Tap `app-debug.apk`
5. Allow "Install unknown apps"
6. Tap "Install"
7. ✅ Done!

---

## 📊 **FINAL STATUS:**

| Task | Status |
|------|--------|
| ✅ Capacitor installed | DONE |
| ✅ Android project created | DONE |
| ✅ Code updated for native | DONE |
| ✅ Production build | DONE |
| ✅ Assets synced | DONE |
| ✅ Permissions configured | DONE |
| ✅ Java JDK installed | DONE |
| ⚠️ Android SDK | **PENDING** |
| ⏳ Build APK | **READY** |

---

## 🚀 **NEXT ACTION:**

```powershell
# Run installer script
cd d:\projct\projek_cdio
.\install-android-sdk.ps1

# Tunggu 10 menit...

# Restart PowerShell

# Build APK
cd d:\projct\projek_cdio\pwa\android
.\gradlew assembleDebug

# ✅ APK READY dalam 5 menit!
```

**TOTAL: 15 menit dari sekarang!** 🎉🚀
