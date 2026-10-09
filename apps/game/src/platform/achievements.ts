import type { Achievement, AchievementEvent } from '@m1565/content';
import { achievementsForEvent, loadAchievements, metaAchievements } from '@m1565/content';
import { desktopBridge } from './desktop';
import { readJson, writeJson } from './storage';

/**
 * Achievements and trophies. The registry (packages/content/data/achievements.json) is the one
 * list for every platform; the game reports events (`reportAchievementEvent`) and never names
 * ids itself. Each unlock is recorded in the player's profile on this device (so the platinum
 * and "all endings" can be worked out anywhere) and sent to every platform backend:
 *
 * - Steam: the Electron shell's `window.desktop.unlockAchievement` (steamworks.js), id = API
 *   name;
 * - Google Play Games, Game Center, PlayStation trophies and Xbox achievements: register a
 *   backend with `registerAchievementBackend` when a port adds the SDK (see docs/CONSOLE.md).
 *
 * Backends are told about every unlock again when it recurs (e.g. an ending in New Game+) and
 * at start-up (`syncAchievements`): platform unlocks are idempotent, and this repairs an unlock
 * that failed while offline.
 */
export const ACHIEVEMENTS: readonly Achievement[] = loadAchievements();
const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a] as const));

export interface AchievementBackend {
  readonly name: string;
  unlock(achievement: Achievement): Promise<unknown> | unknown;
}

/** Steam, through the Electron shell; does nothing elsewhere. */
const steamBackend: AchievementBackend = {
  name: 'steam',
  unlock: (a) => desktopBridge()?.unlockAchievement(a.id),
};

const backends: AchievementBackend[] = [steamBackend];

export function registerAchievementBackend(backend: AchievementBackend): () => void {
  backends.push(backend);
  return () => {
    const i = backends.indexOf(backend);
    if (i >= 0) backends.splice(i, 1);
  };
}

/** What this device's player has earned and read; shared by every save slot. */
interface Profile {
  readonly achievements: Readonly<Record<string, number>>;
  readonly codexRead: readonly string[];
}

const PROFILE_KEY = 'armatura.profile.v1';

function loadProfile(): Profile {
  const p = readJson<Partial<Profile>>(PROFILE_KEY);
  return {
    achievements: p?.achievements && typeof p.achievements === 'object' ? p.achievements : {},
    codexRead: Array.isArray(p?.codexRead) ? p.codexRead : [],
  };
}

function send(a: Achievement): void {
  for (const b of backends) {
    try {
      void Promise.resolve(b.unlock(a)).catch(() => false);
    } catch {
      // A backend that throws (SDK not ready) must not stop the game or the other backends.
    }
  }
}

/** Ids earned on this device. */
export function unlockedAchievements(): ReadonlySet<string> {
  return new Set(Object.keys(loadProfile().achievements));
}

/**
 * Unlocks entries (recording new ones, telling every backend), then any meta entries (all
 * endings, platinum) they complete. Returns the ids newly earned on this device.
 */
function unlockAll(list: readonly Achievement[]): string[] {
  if (list.length === 0) return [];
  const profile = loadProfile();
  const earned = { ...profile.achievements };
  const fresh: string[] = [];
  let pending = [...list];
  while (pending.length) {
    for (const a of pending) {
      send(a);
      if (earned[a.id] === undefined) {
        earned[a.id] = Date.now();
        fresh.push(a.id);
      }
    }
    pending = metaAchievements(ACHIEVEMENTS, new Set(Object.keys(earned)));
  }
  if (fresh.length) writeJson(PROFILE_KEY, { ...profile, achievements: earned });
  return fresh;
}

/** Reports a game event; unlocks whatever it earns. Returns the ids newly earned. */
export function reportAchievementEvent(event: AchievementEvent): string[] {
  return unlockAll(achievementsForEvent(ACHIEVEMENTS, event));
}

/** Unlocks one entry by id (for `manual` entries and debugging). Unknown ids are ignored. */
export function unlockAchievement(id: string | undefined): void {
  const a = id ? BY_ID.get(id) : undefined;
  if (a) unlockAll([a]);
}

/**
 * Records a historical note as read (`allIds`: every entry in the codex); reading the first
 * and the last earn achievements.
 */
export function noteCodexRead(entryId: string, allIds: readonly string[]): void {
  const profile = loadProfile();
  if (profile.codexRead.includes(entryId)) return;
  const codexRead = [...profile.codexRead, entryId];
  writeJson(PROFILE_KEY, { ...profile, codexRead });
  const read = allIds.filter((id) => codexRead.includes(id)).length;
  reportAchievementEvent({ type: 'codexRead', read, total: allIds.length });
}

/** Tells the backends about every unlock recorded on this device (call once at start-up). */
export function syncAchievements(): void {
  for (const id of unlockedAchievements()) {
    const a = BY_ID.get(id);
    if (a) send(a);
  }
}
