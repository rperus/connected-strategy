# Connected Strategy — Platform Launcher
# Starts API server + Web UI in parallel dev mode.
# Usage: .\scripts\start.ps1

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Connected Strategy - Launching Platform" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Start API server in a new window
Write-Host "[1/2] Starting API server on http://127.0.0.1:4311 ..." -ForegroundColor Yellow
$apiJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; pnpm dev:server" -PassThru

# Wait for server to be ready
Write-Host "      Waiting 3s for API to initialise..." -ForegroundColor DarkGray
Start-Sleep 3

# Verify API health
try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:4311/api/health' -TimeoutSec 5
    Write-Host "      [OK] API health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "      [WARN] API not responding yet -- UI will use demo mode gracefully." -ForegroundColor Yellow
}

# Start web UI in a new window
Write-Host "[2/2] Starting Web UI on http://127.0.0.1:4310 ..." -ForegroundColor Yellow
$webJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; pnpm dev:web" -PassThru

Start-Sleep 2

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  Connected Strategy - Platform Running" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  [WEB] Web UI  : http://127.0.0.1:4310" -ForegroundColor Cyan
Write-Host "  [API] API     : http://127.0.0.1:4311" -ForegroundColor Cyan
Write-Host "  [STATUS] Health  : http://127.0.0.1:4311/api/health" -ForegroundColor Cyan
Write-Host "  [DATA] Projects: http://127.0.0.1:4311/api/projects" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C in each terminal window to stop." -ForegroundColor DarkGray
Write-Host ""
