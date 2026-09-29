import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { initSteam, unlockAchievement } from './steam';

const isPackaged = app.isPackaged;
const gameIndex = isPackaged
  ? join(process.resourcesPath, 'game', 'index.html')
  : join(__dirname, '..', '..', 'game', 'dist-native', 'index.html');

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#1b1410',
    title: 'Armatura 1565',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  // Steam Deck and most players expect a fullscreen game; F11 toggles.
  win.setFullScreen(process.env.ARMATURA_WINDOWED !== '1');
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
  });
  // Links (e.g. credits) open in the system browser, never inside the game window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  void win.loadFile(gameIndex);
}

app.whenReady().then(() => {
  initSteam();
  ipcMain.handle(
    'steam:achievement',
    (_e, name: unknown) => typeof name === 'string' && unlockAchievement(name),
  );
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
