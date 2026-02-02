import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDb } from './db';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  if (isDev) {
    console.log('Loading development URL...');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  }
}

app.whenReady().then(() => {
  console.log('App Ready');
  try {
    initDb();
  } catch (err) {
    console.error('DB Init failed:', err);
  }
  
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});