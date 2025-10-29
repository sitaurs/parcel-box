@echo off
echo.
echo ========================================
echo   Smart Parcel Box - WhatsApp Service
echo   PROPERLY SEPARATED ARCHITECTURE
echo ========================================
echo.
echo Services Status:
echo.
echo [1] Backend Main (Port 8080)    : RUNNING
echo [2] Backend-WhatsApp (Port 3001): RUNNING  
echo [3] PWA (Port 5173)             : RUNNING
echo.
echo ========================================
echo   WhatsApp Service - Dedicated!
echo ========================================
echo.
echo Service URL: http://localhost:3001
echo Socket.IO  : ws://localhost:3001/socket.io
echo Health     : http://localhost:3001/health
echo.
echo ========================================
echo   NEXT STEPS
echo ========================================
echo.
echo 1. RELOAD browser dengan F5
echo 2. Open: http://localhost:5173/whatsapp
echo 3. Click "Start Connection"
echo 4. Wait for QR code (5-10 sec)
echo 5. Scan with WhatsApp mobile
echo.
echo ========================================
echo   UI FEATURES
echo ========================================
echo.
echo - Modern gradient design
echo - Animated QR code with pulse border
echo - Terminal-style activity logs
echo - Real-time connection status
echo - System info dashboard
echo.
echo ========================================
echo   ARCHITECTURE
echo ========================================
echo.
echo PWA ----------+------------ Backend Main
echo              |             (Port 8080)
echo              |             - API, MQTT, DB
echo              |             - NO WhatsApp!
echo              |
echo              +------------ Backend-WhatsApp
echo                           (Port 3001)
echo                           - Dedicated WhatsApp
echo                           - Baileys Service
echo                           - QR Code Generation
echo.
echo ========================================
echo.
echo Backend-WhatsApp is READY!
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173/whatsapp
