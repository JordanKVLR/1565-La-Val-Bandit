/**
 * Optional Steam integration. When the game runs through Steam (or with steam_appid.txt next to
 * the executable during development), this unlocks achievements. Without Steam it does nothing.
 */
type SteamClient = {
  achievement: { activate(name: string): boolean; isActivated(name: string): boolean };
};

let client: SteamClient | null = null;

export function initSteam(): boolean {
  const appId = Number(process.env.STEAM_APP_ID ?? 0);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const steamworks = require('steamworks.js') as { init(appId?: number): SteamClient };
    client = steamworks.init(appId || undefined);
    return true;
  } catch {
    client = null;
    return false;
  }
}

export function unlockAchievement(name: string): boolean {
  try {
    return client ? client.achievement.activate(name) : false;
  } catch {
    return false;
  }
}
