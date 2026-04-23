@echo off
:: Connected Strategy — Platform Launcher (double-click wrapper)
:: Calls start.ps1 via PowerShell.

echo.
echo  Connected Strategy — Starting Platform...
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Launch failed. See output above.
    pause
)
