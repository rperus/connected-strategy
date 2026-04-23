@echo off
title Connected Strategy
cd /d "C:\dev\Connected_Strategy"

echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║      Connected Strategy - Torre de Control       ║
echo   ╚══════════════════════════════════════════════════╝
echo.

:: Check prerequisites
where pnpm >nul 2>&1
if errorlevel 1 (
  echo   ✗ ERROR: pnpm no esta instalado.
  echo     Instala con: npm install -g pnpm
  pause
  exit /b 1
)

:: Kill any existing processes on our ports
echo   [0/3] Limpiando puertos previos...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4310 ^| findstr LISTENING 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4311 ^| findstr LISTENING 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start API server in background
start /b cmd /c "pnpm dev:server >nul 2>&1"
echo   [1/3] API Server arrancando en puerto 4311...

:: Wait for API to be ready
timeout /t 3 /nobreak >nul

:: Start Web UI in background
start /b cmd /c "pnpm dev:web >nul 2>&1"
echo   [2/3] Web UI arrancando en puerto 4310...

:: Wait for web to be ready
timeout /t 3 /nobreak >nul

:: Open browser
echo   [3/3] Abriendo navegador...
start "" "http://127.0.0.1:4310"

echo.
echo   ✓ Todo listo.
echo   ✓ UI:  http://127.0.0.1:4310
echo   ✓ API: http://127.0.0.1:4311/api/health
echo   ✓ Salud: http://127.0.0.1:4310/health
echo.
echo   Presiona cualquier tecla para DETENER los servidores.
pause >nul

:: Cleanup: kill our processes
echo   Deteniendo servidores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4310 ^| findstr LISTENING 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4311 ^| findstr LISTENING 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
echo   ✓ Servidores detenidos.
