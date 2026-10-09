import { contextBridge, ipcRenderer } from 'electron';

type Lifecycle = 'suspend' | 'resume';

/** The only desktop features the web game can reach (see apps/game/src/platform/desktop.ts). */
contextBridge.exposeInMainWorld('desktop', {
  platform: 'steam',
  unlockAchievement: (name: string): Promise<boolean> =>
    ipcRenderer.invoke('steam:achievement', name),
  /** Commits the saves (Chromium's storage) to disk now, before a suspend or quit. */
  flushStorage: (): Promise<void> => ipcRenderer.invoke('storage:flush'),
  /** System sleep/wake, screen lock and minimise, so the game can save and pause. */
  onLifecycle: (listener: (state: Lifecycle) => void): (() => void) => {
    const handler = (_e: unknown, state: Lifecycle) => {
      if (state === 'suspend' || state === 'resume') listener(state);
    };
    ipcRenderer.on('lifecycle', handler);
    return () => ipcRenderer.removeListener('lifecycle', handler);
  },
});
