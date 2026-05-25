import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import { autoUpdater } from 'electron-updater';
import { startServer } from '../server';

let mainWindow: BrowserWindow | null = null;

function getDashboardPath(): string {
  // Packaged app: dashboard is in extraResources
  const packedPath = join(process.resourcesPath, 'dashboard', 'index.html');
  if (existsSync(packedPath)) return packedPath;

  // Dev / pre-package: __dirname = apps/desktop/out/main/ → up 3 = apps/ → dashboard/dist
  const devPath = join(__dirname, '../../../dashboard/dist/index.html');
  if (existsSync(devPath)) return devPath;

  // Fallback to renderer placeholder (shows "Loading…" if dashboard not built yet)
  return join(__dirname, '../renderer/index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#020308',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // needed to load file:// assets from extraResources
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadFile(getDashboardPath());
}

async function bootstrap() {
  await app.whenReady();

  try {
    await startServer();
    console.log('[desktop] Local server started on port 3010');
  } catch (err) {
    console.error('[desktop] Failed to start local server:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', (info) => mainWindow?.webContents.send('update-available', info));
    autoUpdater.on('update-downloaded', (info) => mainWindow?.webContents.send('update-downloaded', info));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('updater:check', () => autoUpdater.checkForUpdatesAndNotify());
ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall());

bootstrap().catch(console.error);
