import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDb } from './src/db/db';
import { initializeIpcHandlers } from './src/ipc-handlers';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In Prod: dist/main.js is inside "electron/" folder
    // UI is inside "ui/" folder
    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  }
}

app.whenReady().then(async () => {
  await initDb();
  
  // Initialize IPC handlers after DB is ready
  initializeIpcHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});