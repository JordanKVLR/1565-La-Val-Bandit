/**
 * What the Electron shell (apps/desktop/src/preload.ts) exposes to the game as
 * `window.desktop`. Absent on the web and in the mobile apps.
 */
export type DesktopLifecycle = 'suspend' | 'resume';

export interface DesktopBridge {
  readonly platform: string;
  unlockAchievement(name: string): Promise<boolean>;
  /** Commits Chromium's storage (the saves) to disk now. */
  flushStorage?(): Promise<void>;
  /** System sleep/wake, screen lock and minimise; returns an unsubscribe function. */
  onLifecycle?(listener: (state: DesktopLifecycle) => void): () => void;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export function desktopBridge(): DesktopBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.desktop;
}
