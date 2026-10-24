@echo off
title OphthaCare 2.0 - Clinical Server
cd /d "%~dp0"

echo ========================================================
echo  OphthaCare 2.0 - Ophthalmic Surgery Clinical System
echo ========================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

start "" cmd /c "timeout /t 2 /nobreak >nul & (if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" (start "" "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" "http://localhost:3001") else (start http://localhost:3001))"

echo Server is running at http://localhost:3001
echo Press Ctrl+C to stop the clinical server.
echo.
node server.js
pause
