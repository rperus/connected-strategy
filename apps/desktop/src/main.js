/**
 * Connected Strategy — Electron Desktop Shell
 * SET-07: Window management, tray icon, desktop shortcuts, port-aware URL loading
 * Wave 5 / Chat 3: Dynamic URL resolution from active_ports.json at runtime.
 */

'use strict';

const { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_NAME        = 'Connected Strategy';
const DEFAULT_PORT    = 4310;
const ICON_PNG        = path.join(__dirname, '..', '..', '..', 'assets', 'icons', 'icon.png');
const ICON_ICO        = path.join(__dirname, '..', '..', '..', 'assets', 'icons', 'icon.ico');
const ACTIVE_PORTS    = path.join(__dirname, '..', '..', '..', 'ops', 'runtime', 'active_ports.json');
const PORT_REGISTRY   = path.join(__dirname, '..', '..', '..', 'config', 'port_registry.yaml');

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray       = null;

// ─── URL Resolution ───────────────────────────────────────────────────────────
/**
 * Resolve the web app URL at runtime.
 *
 * Priority order (mirrors launcher_reads_live_first policy):
 *   1. ops/runtime/active_ports.json — runtime truth (connected_strategy_web.active_port)
 *   2. config/port_registry.yaml     — static registry (core_services.connected_strategy_web.preferred_port)
 *   3. Hardcoded fallback: 4310
 *
 * Logs which source was used so operators can trace the resolution.
 *
 * @returns {string}  Full URL, e.g. "http://127.0.0.1:4310"
 */
function getWebAppUrl() {
  // ── 1. Live override: active_ports.json ─────────────────────────────────────
  try {
    if (fs.existsSync(ACTIVE_PORTS)) {
      const raw  = fs.readFileSync(ACTIVE_PORTS, 'utf-8');
      const data = JSON.parse(raw);
      const svc  = data && data.services && data.services.connected_strategy_web;
      if (svc && typeof svc.active_port === 'number') {
        const url = `http://127.0.0.1:${svc.active_port}`;
        console.log(`[Desktop] URL resolved from active_ports.json: ${url}`);
        return url;
      }
    }
  } catch (err) {
    console.warn(`[Desktop] Could not read active_ports.json: ${err.message}`);
  }

  // ── 2. Static registry: port_registry.yaml ──────────────────────────────────
  // Parse without a YAML library — find the preferred_port under connected_strategy_web.
  // The YAML block looks like:
  //   connected_strategy_web:
  //     preferred_port: 4310
  try {
    if (fs.existsSync(PORT_REGISTRY)) {
      const yaml = fs.readFileSync(PORT_REGISTRY, 'utf-8');
      // Match the preferred_port that appears directly after the connected_strategy_web: key
      const m = yaml.match(/connected_strategy_web:\s*\n\s+preferred_port:\s*(\d+)/);
      if (m) {
        const port = parseInt(m[1], 10);
        const url  = `http://127.0.0.1:${port}`;
        console.log(`[Desktop] URL resolved from port_registry.yaml: ${url}`);
        return url;
      }
    }
  } catch (err) {
    console.warn(`[Desktop] Could not read port_registry.yaml: ${err.message}`);
  }

  // ── 3. Hardcoded fallback ────────────────────────────────────────────────────
  const url = `http://127.0.0.1:${DEFAULT_PORT}`;
  console.log(`[Desktop] URL resolved from hardcoded default: ${url}`);
  return url;
}

// ─── Icon Helper ──────────────────────────────────────────────────────────────
function getAppIcon() {
  // Prefer .ico on Windows for tray, fall back to .png
  if (process.platform === 'win32' && fs.existsSync(ICON_ICO)) {
    return nativeImage.createFromPath(ICON_ICO);
  }
  if (fs.existsSync(ICON_PNG)) {
    return nativeImage.createFromPath(ICON_PNG);
  }
  return nativeImage.createEmpty();
}

// ─── Window Management ────────────────────────────────────────────────────────
function createWindow() {
  const url  = getWebAppUrl();
  const icon = getAppIcon();

  mainWindow = new BrowserWindow({
    width:           1440,
    height:          900,
    minWidth:        1024,
    minHeight:       640,
    title:           APP_NAME,
    icon,
    backgroundColor: '#0f1117',
    show:            false,           // show after ready-to-show
    webPreferences: {
      nodeIntegration:    false,
      contextIsolation:   true,
      sandbox:            true,
      // No remote module, no node in renderer
    },
  });

  // Splash / graceful load: show only when content is ready
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Port-aware URL load with retry fallback
  mainWindow.loadURL(url).catch(() => {
    // If the web server is not up yet, show a waiting page
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(waitingPage(url))}`);
    // Retry every 3 s — re-resolve URL on each attempt in case ports changed
    const retryInterval = setInterval(() => {
      const retryUrl = getWebAppUrl();
      mainWindow.loadURL(retryUrl).then(() => clearInterval(retryInterval)).catch(() => {});
    }, 3000);
  });

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  return mainWindow;
}

function waitingPage(url) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Connected Strategy — Starting…</title>
  <style>
    body { margin:0; background:#0f1117; color:#e2e8f0; font-family:system-ui,sans-serif;
           display:flex; align-items:center; justify-content:center; height:100vh; flex-direction:column; gap:16px; }
    .spinner { width:40px;height:40px;border:3px solid #1e293b;border-top-color:#4FC3F7;
               border-radius:50%;animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    p { color:#94a3b8; font-size:14px; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Connecting to ${url}…</p>
  <p style="font-size:12px;color:#475569;">This page will refresh automatically when the server is ready.</p>
</body>
</html>`;
}

// ─── System Tray ──────────────────────────────────────────────────────────────
function createTray() {
  const icon = getAppIcon();
  tray = new Tray(icon.isEmpty() ? nativeImage.createFromDataURL(fallbackTrayPng()) : icon);
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Connected Strategy',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Recargar',
      click: () => { mainWindow?.reload(); },
    },
    {
      label: 'DevTools',
      click: () => { mainWindow?.webContents.openDevTools(); },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click to restore
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

// Minimal 1×1 transparent PNG as last-resort tray icon fallback (base64)
function fallbackTrayPng() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

// ─── Application Menu ─────────────────────────────────────────────────────────
function buildAppMenu() {
  const template = [
    {
      label: APP_NAME,
      submenu: [
        { role: 'about', label: `Acerca de ${APP_NAME}` },
        { type: 'separator' },
        {
          label: 'Abrir en navegador',
          click: () => {
            // Re-resolve at click time so it reflects the latest active_ports.json
            shell.openExternal(getWebAppUrl());
          },
        },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload',        label: 'Recargar' },
        { role: 'forceReload',   label: 'Recargar forzado' },
        { role: 'toggleDevTools',label: 'Herramientas de desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom',     label: 'Zoom normal' },
        { role: 'zoomIn',        label: 'Acercar' },
        { role: 'zoomOut',       label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Reportar problema',
          click: () => shell.openExternal('https://github.com/your-org/connected-strategy/issues'),
        },
        {
          label: 'Versión',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type:    'info',
              title:   `${APP_NAME} — Versión`,
              message: `${APP_NAME} v${app.getVersion()}`,
              detail:  `Electron ${process.versions.electron}\nNode ${process.versions.node}`,
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.setName(APP_NAME);

// Single-instance lock — bring existing window to front if already running
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildAppMenu();
    createWindow();
    createTray();
  });
}

app.on('window-all-closed', () => {
  // Keep running in tray on Windows/Linux; quit on macOS only if no tray
  if (process.platform === 'darwin') app.quit();
});

app.on('activate', () => {
  // macOS: re-create window when dock icon is clicked and no windows exist
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => { app.isQuitting = true; });
