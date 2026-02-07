import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import { initDb } from './src/db/db';
import { Language, setLanguage, t } from './src/i18n/translations';
import { IpcContext } from './src/ipc-handlers/context';
import { cleanupOnAppQuit, initializeIpcHandlers } from './src/ipc-handlers/index';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let ipcContext: IpcContext | null = null;
let isCleanupDone = false;
let forceQuit = false;

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

  // Handle window close event with confirmation
  mainWindow.on('close', async (event) => {
    if (!forceQuit && ipcContext) {
      event.preventDefault();

      const currentUser = ipcContext.getCurrentUser();
      
      const response = await dialog.showMessageBox(mainWindow!, {
        type: 'question',
        buttons: [t('app.cancelButton'), t('app.closeButton')],
        defaultId: 0,
        title: t('app.closeConfirmTitle'),
        message: t('app.closeConfirmMessage'),
        detail: currentUser 
          ? t('app.closeConfirmDetailLoggedIn')
          : t('app.closeConfirmDetailLoggedOut'),
      });

      if (response.response === 1) {
        // User confirmed - proceed with cleanup
        forceQuit = true;
        if (!isCleanupDone) {
          console.log('🔄 Logging out user and closing shift...');
          await cleanupOnAppQuit(ipcContext);
          isCleanupDone = true;
        }
        mainWindow?.close();
      }
      // If response is 0 (Cancel), do nothing - window stays open
    }
  });
}

app.whenReady().then(async () => {
  await initDb();
  
  // Initialize IPC handlers after DB is ready and store context
  ipcContext = initializeIpcHandlers();
  
  // Load language preference from database
  await loadLanguagePreference();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

async function loadLanguagePreference() {
  try {
    if (!ipcContext) return;
    const language = await ipcContext.appSettingsRepo.get('language');
    if (language && (language === 'en' || language === 'es')) {
      setLanguage(language as Language);
      console.log(`🌍 Language set to: ${language}`);
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Close open shifts before app quits
app.on('before-quit', async (event) => {
  if (!isCleanupDone && !forceQuit && ipcContext) {
    event.preventDefault();
    console.log('🔄 Closing open shifts before quit...');
    await cleanupOnAppQuit(ipcContext);
    isCleanupDone = true;
    ipcContext = null;
    app.quit();
  }
});

// Handle unexpected termination
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, cleaning up...');
  if (ipcContext) {
    await cleanupOnAppQuit(ipcContext);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, cleaning up...');
  if (ipcContext) {
    await cleanupOnAppQuit(ipcContext);
  }
  process.exit(0);
});