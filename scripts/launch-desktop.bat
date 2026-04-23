@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  launch-desktop.bat
REM  Quick-launch wrapper for the Connected Strategy Electron shell.
REM  Double-click this, or use it as a shortcut target.
REM ─────────────────────────────────────────────────────────────────────────────

setlocal

REM Derive repo root from this script's location (scripts\)
set "ROOT=%~dp0.."
set "DESKTOP_DIR=%ROOT%\apps\desktop"

REM Prefer local electron in node_modules
set "ELECTRON=%DESKTOP_DIR%\node_modules\.bin\electron.cmd"
if not exist "%ELECTRON%" (
    set "ELECTRON=%DESKTOP_DIR%\node_modules\electron\dist\electron.exe"
)

if not exist "%ELECTRON%" (
    echo ERROR: Electron not found. Run "npm install" inside apps\desktop first.
    pause
    exit /b 1
)

echo Starting Connected Strategy...
cd /d "%DESKTOP_DIR%"
"%ELECTRON%" .

endlocal
