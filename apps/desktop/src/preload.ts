import { contextBridge, ipcRenderer } from 'electron';

/** The only desktop features the web game can reach. */
contextBridge.exposeInMainWorld('desktop', {
  platform: 'steam',
  unlockAchievement: (name: string): Promise<boolean> =>
    ipcRenderer.invoke('steam:achievement', name),
});
