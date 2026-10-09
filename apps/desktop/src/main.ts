import { app, BrowserWindow, ipcMain, powerMonitor, session, shell } from 'electron';
import { join } from 'node:path';
import { initSteam, unlockAchievement } from './steam';

const isPackaged = app.isPackaged;
const gameIndex = isPackaged
  ? join(process.resourcesPath, 'game', 'index.html')
  : join(__dirname, '..', '..', 'game', 'dist-native', 'index.html');

/** Commits Chromium's storage (the saves) to disk now instead of on its own timer. */
const flushSaves = () => session.defaultSession.flushStorageData();

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
  // Suspend/resume (Steam Deck sleep, lid close, screen lock, minimise): the game saves and
  // pauses its sound and battle (platform/lifecycle.ts); the saves go to disk at once.
  const notify = (state: 'suspend' | 'resume') => {
    if (state === 'suspend') flushSaves();
    if (!win.isDestroyed()) win.webContents.send('lifecycle', state);
  };
  const onSuspend = () => notify('suspend');
  const onResume = () => notify('resume');
  win.on('minimize', onSuspend);
  win.on('restore', onResume);
  powerMonitor.on('suspend', onSuspend);
  powerMonitor.on('lock-screen', onSuspend);
  powerMonitor.on('resume', onResume);
  powerMonitor.on('unlock-screen', onResume);
  win.on('closed', () => {
    powerMonitor.off('suspend', onSuspend);
    powerMonitor.off('lock-screen', onSuspend);
    powerMonitor.off('resume', onResume);
    powerMonitor.off('unlock-screen', onResume);
  });
  void win.loadFile(gameIndex);
}

app.whenReady().then(() => {
  initSteam();
  ipcMain.handle(
    'steam:achievement',
    (_e, name: unknown) => typeof name === 'string' && unlockAchievement(name),
  );
  ipcMain.handle('storage:flush', () => flushSaves());
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitting (Steam's "Exit game", Alt+F4, the Deck's power menu) commits the saves first.
app.on('before-quit', () => flushSaves());
app.on('window-all-closed', () => app.quit());
