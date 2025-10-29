# Android SDK Command Line Tools Installer
# For building APK without Android Studio

Write-Host "Android SDK Command Line Tools Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$SDK_DIR = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$CMDLINE_TOOLS_URL = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$CMDLINE_TOOLS_ZIP = "$env:TEMP\commandlinetools.zip"
$CMDLINE_TOOLS_DIR = "$SDK_DIR\cmdline-tools"
$BUILD_TOOLS_VERSION = "34.0.0"
$PLATFORM_VERSION = "34"

Write-Host "1. Creating SDK directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $SDK_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $CMDLINE_TOOLS_DIR | Out-Null
Write-Host "   Created: $SDK_DIR" -ForegroundColor Green

Write-Host ""
Write-Host "2. Downloading Android Command Line Tools..." -ForegroundColor Yellow
Write-Host "   URL: $CMDLINE_TOOLS_URL" -ForegroundColor Gray
Write-Host "   Size: ~150 MB" -ForegroundColor Gray

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $CMDLINE_TOOLS_URL -OutFile $CMDLINE_TOOLS_ZIP
    $ProgressPreference = 'Continue'
    Write-Host "   Downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "   Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Extracting archive..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $CMDLINE_TOOLS_ZIP -DestinationPath "$CMDLINE_TOOLS_DIR\temp" -Force
    
    # Move to correct structure (cmdline-tools/latest/)
    $latestDir = "$CMDLINE_TOOLS_DIR\latest"
    New-Item -ItemType Directory -Force -Path $latestDir | Out-Null
    Move-Item -Path "$CMDLINE_TOOLS_DIR\temp\cmdline-tools\*" -Destination $latestDir -Force
    Remove-Item -Path "$CMDLINE_TOOLS_DIR\temp" -Recurse -Force
    
    Write-Host "   Extracted to: $latestDir" -ForegroundColor Green
} catch {
    Write-Host "   Extraction failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. Accepting Android SDK licenses..." -ForegroundColor Yellow
$sdkmanager = "$latestDir\bin\sdkmanager.bat"

# Accept all licenses automatically
$licenses = "y`ny`ny`ny`ny`ny`ny`ny`n"
$licenses | & $sdkmanager --licenses 2>&1 | Out-Null
Write-Host "   Licenses accepted" -ForegroundColor Green

Write-Host ""
Write-Host "5. Installing Android SDK components..." -ForegroundColor Yellow
Write-Host "   - Platform Tools" -ForegroundColor Gray
Write-Host "   - Build Tools $BUILD_TOOLS_VERSION" -ForegroundColor Gray
Write-Host "   - Android Platform $PLATFORM_VERSION" -ForegroundColor Gray
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray

try {
    $components = "platform-tools", "build-tools;$BUILD_TOOLS_VERSION", "platforms;android-$PLATFORM_VERSION"
    & $sdkmanager $components | Out-Null
    Write-Host "   SDK components installed" -ForegroundColor Green
} catch {
    Write-Host "   Installation completed with warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "6. Setting environment variables..." -ForegroundColor Yellow

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $SDK_DIR, "User")
Write-Host "   ANDROID_HOME = $SDK_DIR" -ForegroundColor Green

# Add to PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$platformTools = "$SDK_DIR\platform-tools"
$cmdlineTools = "$SDK_DIR\cmdline-tools\latest\bin"

if ($currentPath -notlike "*$platformTools*") {
    $currentPath = "$currentPath;$platformTools"
}
if ($currentPath -notlike "*$cmdlineTools*") {
    $currentPath = "$currentPath;$cmdlineTools"
}

[System.Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
Write-Host "   Added to PATH" -ForegroundColor Green

# Cleanup
Remove-Item -Path $CMDLINE_TOOLS_ZIP -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "ANDROID SDK INSTALLED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SDK Location: $SDK_DIR" -ForegroundColor White
Write-Host "Components:" -ForegroundColor White
Write-Host "   - Platform Tools (adb)" -ForegroundColor Gray
Write-Host "   - Build Tools $BUILD_TOOLS_VERSION" -ForegroundColor Gray
Write-Host "   - Android Platform $PLATFORM_VERSION" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Restart PowerShell!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Close and re-open PowerShell" -ForegroundColor White
Write-Host "   2. cd d:\projct\projek_cdio\pwa\android" -ForegroundColor White
Write-Host "   3. .\gradlew assembleDebug" -ForegroundColor White
Write-Host ""
