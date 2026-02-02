import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDb } from './db';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null; // Keep reference to prevent GC

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev, // Only enable devtools in dev by default
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, UI is in ../ui/index.html relative to electron/main.js
    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  }
}

app.whenReady().then(() => {
  initDb();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});