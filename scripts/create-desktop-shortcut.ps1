<#
.SYNOPSIS
    Creates a desktop shortcut for Connected Strategy.

.DESCRIPTION
    Creates a .lnk shortcut on the current user's Desktop that points
    to the Electron desktop app.  Run once after first install.

.NOTES
    ExecutionPolicy Bypass required — run from npm script or manually:
    powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1
#>

param(
    [string]$AppDir   = (Join-Path $PSScriptRoot ".." "apps" "desktop"),
    [string]$IconFile = (Join-Path $PSScriptRoot ".." "assets" "icons" "icon.ico"),
    [string]$ShortcutName = "Connected Strategy"
)

$ErrorActionPreference = "Stop"

# ─── Resolve paths ────────────────────────────────────────────────────────────
$AppDir   = (Resolve-Path $AppDir).Path
$IconFile = if (Test-Path $IconFile) { (Resolve-Path $IconFile).Path } else { "" }
$Desktop  = [Environment]::GetFolderPath("Desktop")
$LnkPath  = Join-Path $Desktop "$ShortcutName.lnk"

# ─── Find electron.exe in node_modules ────────────────────────────────────────
$ElectronExe = Join-Path $AppDir "node_modules" ".bin" "electron.cmd"
if (-not (Test-Path $ElectronExe)) {
    $ElectronExe = Join-Path $AppDir "node_modules" "electron" "dist" "electron.exe"
}

if (-not (Test-Path $ElectronExe)) {
    Write-Warning "electron executable not found at $ElectronExe"
    Write-Warning "Run 'npm install' inside apps/desktop first."
    # Create shortcut to a launch batch file instead
    $LaunchBat = Join-Path $PSScriptRoot "launch-desktop.bat"
    if (Test-Path $LaunchBat) {
        $Target    = $LaunchBat
        $WorkDir   = (Split-Path $LaunchBat)
    } else {
        Write-Error "No launch target found. Aborting shortcut creation."
        exit 1
    }
} else {
    $Target  = $ElectronExe
    $WorkDir = $AppDir
}

# ─── Create the shortcut ──────────────────────────────────────────────────────
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($LnkPath)
$Shortcut.TargetPath       = $Target
$Shortcut.Arguments        = if ($Target -like "*.exe") { "`"$AppDir`"" } else { "" }
$Shortcut.WorkingDirectory = $WorkDir
$Shortcut.Description      = "Open Connected Strategy platform"
if ($IconFile) { $Shortcut.IconLocation = "$IconFile, 0" }
$Shortcut.WindowStyle      = 1   # Normal window
$Shortcut.Save()

Write-Host ""
Write-Host "✓  Desktop shortcut created: $LnkPath" -ForegroundColor Green
Write-Host ""
Write-Host "   To pin to taskbar:" -ForegroundColor Cyan
Write-Host "   1. Right-click the desktop shortcut"
Write-Host "   2. Select 'Pin to taskbar'"
Write-Host ""
