@echo off
REM Smart Parcel Box - Automated Setup Script for Windows

echo ╔════════════════════════════════════════════╗
echo ║  Smart Parcel Box - Automated Setup       ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js 20.x from https://nodejs.org
    exit /b 1
)

echo [✓] Node.js detected: 
node -v
echo.

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed.
    exit /b 1
)

echo [✓] npm detected:
npm -v
echo.

REM Setup Backend
echo === Setting up Backend ===
cd backend

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo Copying .env.example to .env...
if not exist .env (
    copy .env.example .env
    echo [✓] .env file created
    echo [!] Please edit backend\.env with your configuration
) else (
    echo [!] .env already exists, skipping...
)

echo.
echo Generating VAPID keys...
echo Run this command and add to .env:
echo   npx web-push generate-vapid-keys
echo.

echo Setting up database...
call npm run prisma:generate
if %errorlevel% neq 0 exit /b %errorlevel%

call npm run prisma:migrate
if %errorlevel% neq 0 exit /b %errorlevel%

call npm run prisma:seed
if %errorlevel% neq 0 exit /b %errorlevel%

echo [✓] Backend setup complete
echo.

REM Setup PWA
echo === Setting up PWA ===
cd ..\pwa

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo [✓] PWA setup complete
echo.

REM Final instructions
echo ╔════════════════════════════════════════════╗
echo ║  Setup Complete!                           ║
echo ╚════════════════════════════════════════════╝
echo.
echo Next steps:
echo.
echo 1. Edit backend\.env with your configuration:
echo    - Set API_TOKEN (used by ESP32-CAM)
echo    - Add VAPID keys for Web Push
echo    - Configure other settings
echo.
echo 2. Start the backend:
echo    cd backend
echo    npm run dev
echo.
echo 3. In a new terminal, start the PWA:
echo    cd pwa
echo    npm run dev
echo.
echo 4. Configure and upload ESP32-CAM firmware:
echo    - Edit firmware\include\config.h
echo    - Set WiFi credentials and server IP
echo    - Upload with PlatformIO
echo.
echo For detailed instructions, see:
echo   - QUICKSTART.md
echo   - INSTALLATION.md
echo   - README.md
echo.
echo Happy coding! 🚀
echo.

cd ..
pause
