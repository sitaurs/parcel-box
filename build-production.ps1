# ============================================
# Build Production APK dengan VPS IP
# ============================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Smart Parcel - Production Build Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get VPS IP
Write-Host "Enter your VPS Public IP: " -ForegroundColor Yellow -NoNewline
$VPS_IP = Read-Host

if ([string]::IsNullOrEmpty($VPS_IP)) {
    Write-Host "Error: VPS IP is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Using VPS IP: $VPS_IP" -ForegroundColor Green
Write-Host ""

# Update .env.production
Write-Host "[1/5] Updating PWA environment..." -ForegroundColor Yellow

$envContent = @"
# Production Environment (VPS Ubuntu)
VITE_PROD_API_URL=http://${VPS_IP}:8080/api/v1
VITE_PROD_WS_URL=http://${VPS_IP}:8080
VITE_PROD_WA_WS_URL=http://${VPS_IP}:3001
VITE_API_BASE_URL=/api/v1
VITE_WS_URL=
VITE_WA_WS_URL=
"@

Set-Content -Path "pwa\.env.production" -Value $envContent
Write-Host "   Updated pwa\.env.production" -ForegroundColor Green

# Build PWA
Write-Host ""
Write-Host "[2/5] Building PWA..." -ForegroundColor Yellow
Set-Location pwa
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: PWA build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   PWA built successfully" -ForegroundColor Green

# Sync to Android
Write-Host ""
Write-Host "[3/5] Syncing to Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   Synced to Android" -ForegroundColor Green

# Build APK
Write-Host ""
Write-Host "[4/5] Building Android APK..." -ForegroundColor Yellow
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Gray

Set-Location android
.\gradlew assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: APK build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   APK built successfully" -ForegroundColor Green

# Copy APK
Write-Host ""
Write-Host "[5/5] Copying APK..." -ForegroundColor Yellow

$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
$targetPath = "..\..\smartparcel-$VPS_IP.apk"

Copy-Item $apkPath $targetPath -Force

$apkSize = (Get-Item $targetPath).Length / 1MB
$apkSize = [math]::Round($apkSize, 2)

Write-Host "   APK copied to: $targetPath" -ForegroundColor Green
Write-Host "   APK size: $apkSize MB" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "APK Location:" -ForegroundColor Yellow
Write-Host "  $(Resolve-Path $targetPath)" -ForegroundColor White
Write-Host ""
Write-Host "APK Details:" -ForegroundColor Yellow
Write-Host "  - Target VPS: $VPS_IP" -ForegroundColor White
Write-Host "  - API URL: http://${VPS_IP}:8080/api/v1" -ForegroundColor White
Write-Host "  - WebSocket: http://${VPS_IP}:8080" -ForegroundColor White
Write-Host "  - WhatsApp: http://${VPS_IP}:3001" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Upload backend & wa to VPS" -ForegroundColor White
Write-Host "  2. Run setup-vps.sh on VPS" -ForegroundColor White
Write-Host "  3. Start services with PM2" -ForegroundColor White
Write-Host "  4. Install APK on phone" -ForegroundColor White
Write-Host ""
Write-Host "Install APK:" -ForegroundColor Yellow
Write-Host "  adb install -r `"$targetPath`"" -ForegroundColor White
Write-Host "  Or copy to phone manually" -ForegroundColor White
Write-Host ""
Write-Host "Done!" -ForegroundColor Green

# Return to root
Set-Location ..\..
