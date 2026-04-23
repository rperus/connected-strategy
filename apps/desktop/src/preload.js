/**
 * Connected Strategy — Electron Preload Script
 * Exposes safe APIs to the renderer via contextBridge.
 */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('csDesktop', {
  /** Platform the app is running on */
  platform: process.platform,

  /** App version */
  version: process.env.npm_package_version || '0.1.0',

  /** Notify main process to show/hide window */
  minimize:   () => ipcRenderer.send('window:minimize'),
  maximize:   () => ipcRenderer.send('window:maximize'),
  close:      () => ipcRenderer.send('window:close'),

  /** Signal that the web app is ready (stops the retry loop) */
  appReady:   () => ipcRenderer.send('web-app:ready'),
});
