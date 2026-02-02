import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDb } from './db';

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, we expect the UI to be in ../ui/index.html relative to this file
    // because of how we configured electron-builder files.
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