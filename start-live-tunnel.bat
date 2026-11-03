@echo off
title EduManage SaaS - Live Launcher
echo ========================================================
echo       EduManage SaaS - Cloudflare Live Launcher
echo ========================================================
echo.
echo 1. Starting Backend .NET 8 Web API (Port 5000)...
start "EduManage-API" cmd /k "cd SchoolManagement.API && dotnet run"

echo.
echo 2. Starting Frontend Angular SPA (Port 4200 + Proxy)...
start "EduManage-UI" cmd /k "cd school-management-ui && npm run start:tunnel"

echo.
echo 3. Waiting 6 seconds for servers to start...
timeout /t 6 /nobreak > nul

echo.
echo 4. Checking and starting Cloudflare Tunnel...
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] 'cloudflared' command not found!
    echo Please download cloudflared-windows-amd64.exe from:
    echo https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
    echo and place it in this folder or in your Windows PATH.
    echo.
    pause
    exit /b
)

echo.
echo Launching Cloudflare Tunnel for http://localhost:4200 ...
echo Look for the 'https://...trycloudflare.com' link below:
cloudflared tunnel --url http://localhost:4200
pause
