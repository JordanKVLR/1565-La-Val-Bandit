/**
 * Achievement hooks. On Steam the Electron shell exposes `window.desktop`; elsewhere these are
 * no-ops (Google Play Games / Game Center adapters can plug in here later).
 */
declare global {
  interface Window {
    desktop?: { platform: string; unlockAchievement(name: string): Promise<boolean> };
  }
}

/** Battle id → achievement unlocked on victory. Names must match the Steamworks configuration. */
export const BATTLE_ACHIEVEMENTS: Readonly<Record<string, string>> = {
  'b1-marsaxlokk': 'ACH_FIRST_STAND',
  'b5-tigne': 'ACH_OTHER_SHORE',
  'b9-fall-of-st-elmo': 'ACH_ST_ELMO',
};

export const ENDING_ACHIEVEMENTS: Readonly<Record<string, string>> = {
  cross: 'ACH_ENDING_CROSS',
  island: 'ACH_ENDING_ISLAND',
  crescent: 'ACH_ENDING_CRESCENT',
};

export function unlockAchievement(name: string | undefined): void {
  if (!name) return;
  void window.desktop?.unlockAchievement(name).catch(() => false);
}
