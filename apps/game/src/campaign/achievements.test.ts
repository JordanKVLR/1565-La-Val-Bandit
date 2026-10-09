import type { ShopItem } from '@m1565/content';
import { loadCodex, loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  noteCodexRead,
  registerAchievementBackend,
  syncAchievements,
  unlockAchievement,
  unlockedAchievements,
} from '../platform/achievements';
import { readSave } from '../platform/storage';
import { GameSession } from './GameSession';
import { newGamePlus } from './newGamePlus';
import { installFakePlatform, playUntil, wonState } from './testkit';
import type { CampaignSave } from './types';

/**
 * Every achievement must be reachable through the game itself: these play the campaign through
 * GameSession (and read the codex as the screen does), never unlocking ids by hand, and check
 * that together they earn the whole registry, platinum included.
 */
const lib = loadLibrary();
const ROUTES = {
  cross: /Stand with the Order/,
  island: /Fight as a Maltese/,
  crescent: /Let him go|Cross to the Ottoman/,
} as const;

let platform: ReturnType<typeof installFakePlatform>;
beforeEach(() => {
  platform = installFakePlatform();
});

function playRoute(route: keyof typeof ROUTES, difficulty: 'knight' | 'grandMaster' = 'knight') {
  const s = new GameSession(lib, undefined, { difficulty });
  playUntil(s, () => false, ROUTES[route]);
  expect(s.state.screen.kind).toBe('end');
  expect(s.state.ending).toBe(route);
  return s;
}

/** A session parked in the Armoury with money to spend (from a save, as Continue would). */
function armourySession(scudi: number): GameSession {
  const s = new GameSession(lib, undefined, { difficulty: 'knight' });
  playUntil(s, (v) => v.screen.kind === 'prep' || v.completedBattles.length >= 5, ROUTES.cross);
  s.autosave();
  const save = readSave<CampaignSave>('auto')!;
  const loaded = new GameSession(lib, { ...save, scudi, battle: null });
  return loaded;
}

describe('achievements earned by playing', () => {
  it('a full route earns its battles, its ending, flawless and swift wins', () => {
    playRoute('crescent');
    const got = unlockedAchievements();
    for (const id of [
      'ACH_FIRST_STAND',
      'ACH_ST_ELMO',
      'ACH_CRESCENT_CAMP',
      'ACH_CRESCENT_MEDALLION',
      'ACH_CRESCENT_FINALE',
      'ACH_ENDING_CRESCENT',
      'ACH_NO_LOSSES',
      'ACH_FINALE_NO_LOSSES',
      'ACH_SWIFT_ROUT',
    ]) {
      expect(got, id).toContain(id);
    }
    expect(got).not.toContain('ACH_ENDING_CROSS');
    expect(got).not.toContain('ACH_ALL_ENDINGS');
    // Steam heard about each one.
    expect(platform.unlocked).toContain('ACH_ENDING_CRESCENT');
  });

  it('a flawed win does not count as flawless', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const screen = s.state.screen;
    if (screen.kind !== 'battle') throw new Error('expected a battle');
    const won = wonState(screen.setup);
    const hurt = {
      ...won,
      round: 7,
      units: won.units.map((u, i) =>
        u.side === 'player' && i === won.units.findIndex((x) => x.side === 'player')
          ? { ...u, hp: 0, defeated: true }
          : u,
      ),
    };
    s.finishBattle('victory', hurt);
    expect(unlockedAchievements()).toContain('ACH_FIRST_STAND');
    expect(unlockedAchievements()).not.toContain('ACH_NO_LOSSES');
    expect(unlockedAchievements()).not.toContain('ACH_SWIFT_ROUT');
  });

  it('a level-up past a skill level earns the skill achievements', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const screen = s.state.screen;
    if (screen.kind !== 'battle') throw new Error('expected a battle');
    const won = wonState(screen.setup);
    const ninu = s.state.roster.find((r) => r.characterId === 'ninu')!;
    expect(ninu.level).toBeLessThan(5);
    s.finishBattle('victory', {
      ...won,
      units: won.units.map((u) => (u.characterId === 'ninu' ? { ...u, level: 10 } : u)),
    });
    expect(unlockedAchievements()).toContain('ACH_FIRST_SKILL');
    expect(unlockedAchievements()).toContain('ACH_THIRD_SKILL');
  });

  it('the Armoury: a purchase, a masterwork blade, a charm with an amulet, a full coffer', () => {
    const s = armourySession(9000);
    const shop = (item: string): ShopItem => lib.shop.find((x) => x.item === item)!;
    const ninu = 'ninu';
    s.buyItem(shop('toledo-espada'));
    expect(unlockedAchievements()).toContain('ACH_FIRST_PURCHASE');
    s.equipItem(ninu, 'weapon', 'toledo-espada');
    expect(unlockedAchievements()).toContain('ACH_MASTERWORK');
    s.buyItem(shop('charm-pow-1'));
    s.buyItem(shop('pilgrim-shell'));
    s.equipItem(ninu, 'charm', 'charm-pow-1');
    expect(unlockedAchievements()).not.toContain('ACH_FULL_KIT');
    s.equipItem(ninu, 'amulet', 'pilgrim-shell');
    expect(unlockedAchievements()).toContain('ACH_FULL_KIT');
    // Selling the spare blade back takes the purse past 5,000.
    s.buyItem(shop('toledo-espada'));
    expect(unlockedAchievements()).not.toContain('ACH_TREASURY');
    s.sellItem('weapon', 'arming-sword');
    s.sellItem('weapon', 'toledo-espada');
    expect(s.state.scudi).toBeGreaterThanOrEqual(5000);
    expect(unlockedAchievements()).toContain('ACH_TREASURY');
  });

  it('reading the historical notes', () => {
    const ids = loadCodex().map((e) => e.id);
    noteCodexRead(ids[0]!, ids);
    expect(unlockedAchievements()).toContain('ACH_CODEX_FIRST');
    expect(unlockedAchievements()).not.toContain('ACH_CODEX_ALL');
    for (const id of ids) noteCodexRead(id, ids);
    expect(unlockedAchievements()).toContain('ACH_CODEX_ALL');
  });

  it('every entry, platinum last, through the game alone', () => {
    // Three routes (the island's on Grand Master), then New Game+ from a finished save.
    playRoute('cross');
    playRoute('island', 'grandMaster');
    playRoute('crescent');
    const finished = readSave<CampaignSave>('auto')!;
    const ngp = new GameSession(lib, undefined, newGamePlus(lib, finished));
    playUntil(ngp, () => false, ROUTES.cross);
    expect(ngp.state.ending).toBe('cross');
    // Progression, the Armoury and the codex, as the tests above.
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const screen = s.state.screen;
    if (screen.kind !== 'battle') throw new Error('expected a battle');
    const won = wonState(screen.setup);
    s.finishBattle('victory', {
      ...won,
      units: won.units.map((u) => (u.characterId === 'ninu' ? { ...u, level: 10 } : u)),
    });
    const shop = armourySession(9000);
    const item = (id: string): ShopItem => lib.shop.find((x) => x.item === id)!;
    shop.buyItem(item('toledo-espada'));
    shop.equipItem('ninu', 'weapon', 'toledo-espada');
    shop.buyItem(item('charm-pow-1'));
    shop.buyItem(item('pilgrim-shell'));
    shop.equipItem('ninu', 'charm', 'charm-pow-1');
    shop.equipItem('ninu', 'amulet', 'pilgrim-shell');
    shop.sellItem('weapon', 'arming-sword');
    const ids = loadCodex().map((e) => e.id);
    expect(unlockedAchievements()).not.toContain('ACH_PLATINUM');
    for (const id of ids) noteCodexRead(id, ids);

    const got = unlockedAchievements();
    const missing = ACHIEVEMENTS.map((a) => a.id).filter((id) => !got.has(id));
    expect(missing).toEqual([]);
    expect(platform.unlocked.at(-1)).toBe('ACH_PLATINUM');
  });
});

describe('the achievement adapter', () => {
  it('sends unlocks to every registered backend and re-syncs them at start-up', () => {
    const seen: string[] = [];
    const off = registerAchievementBackend({ name: 'test', unlock: (a) => seen.push(a.id) });
    unlockAchievement('ACH_FIRST_STAND');
    unlockAchievement('ACH_NOT_A_THING');
    unlockAchievement(undefined);
    expect(seen).toEqual(['ACH_FIRST_STAND']);
    syncAchievements();
    expect(seen).toEqual(['ACH_FIRST_STAND', 'ACH_FIRST_STAND']);
    off();
    unlockAchievement('ACH_OTHER_SHORE');
    expect(seen).toHaveLength(2);
  });

  it('a backend that throws does not stop the others or the game', () => {
    const off = registerAchievementBackend({
      name: 'broken',
      unlock: () => {
        throw new Error('SDK not ready');
      },
    });
    expect(() => unlockAchievement('ACH_FIRST_STAND')).not.toThrow();
    expect(platform.unlocked).toContain('ACH_FIRST_STAND');
    off();
  });

  it('keeps unlocks in the device profile, apart from the save slots', () => {
    unlockAchievement('ACH_KALKARA');
    expect(JSON.parse(platform.storage.get('armatura.profile.v1')!)).toMatchObject({
      achievements: { ACH_KALKARA: expect.any(Number) },
    });
  });
});
