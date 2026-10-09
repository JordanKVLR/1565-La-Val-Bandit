/**
 * Test helpers for campaign sessions (used only by *.test.ts): an in-memory localStorage, an
 * achievement spy, and a driver that plays the story, winning every battle.
 */
import type { BattleSetup, BattleState } from '@m1565/core';
import { createBattle } from '@m1565/core';
import type { GameSession, SessionView } from './GameSession';

/** Installs an in-memory localStorage and a Steam-style achievement bridge; returns the log. */
export function installFakePlatform(): { unlocked: string[]; storage: Map<string, string> } {
  const storage = new Map<string, string>();
  const unlocked: string[] = [];
  const g = globalThis as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
    clear: () => storage.clear(),
  };
  g.window = {
    desktop: {
      platform: 'test',
      unlockAchievement: (name: string) => {
        unlocked.push(name);
        return Promise.resolve(true);
      },
    },
  };
  return { unlocked, storage };
}

/** The battle as won: every enemy down, nobody on the player's side lost. */
export function wonState(setup: BattleSetup): BattleState {
  const s = createBattle(setup).state;
  return {
    ...s,
    outcome: 'victory',
    units: s.units.map((u) => (u.side === 'enemy' ? { ...u, hp: 0, defeated: true } : u)),
  };
}

/** The battle as lost, with each company pilot having earned some XP first. */
export function lostState(setup: BattleSetup, gain: { level: number; xp: number }): BattleState {
  const s = createBattle(setup).state;
  return {
    ...s,
    outcome: 'defeat',
    units: s.units.map((u) =>
      u.side === 'player' && u.characterId
        ? { ...u, level: u.level + gain.level, xp: gain.xp, hp: 0, defeated: true }
        : u,
    ),
  };
}

/**
 * Plays on (choosing choices matching `prefer`, else the first; winning every battle) until
 * `stop` says so or the story ends. Returns the number of battles fought.
 */
export function playUntil(
  session: GameSession,
  stop: (view: SessionView) => boolean,
  prefer: RegExp = /$^/,
): number {
  let battles = 0;
  for (let guard = 0; guard < 5000; guard++) {
    const view = session.state;
    if (stop(view)) return battles;
    const screen = view.screen;
    switch (screen.kind) {
      case 'story':
        if (screen.choices) {
          const i = screen.choices.findIndex((c) => prefer.test(c));
          session.choose(Math.max(0, i));
        } else session.advance();
        break;
      case 'battle':
        battles++;
        session.finishBattle('victory', wonState(screen.setup));
        break;
      case 'results':
        session.closeResults();
        break;
      case 'prep':
        session.closePrep();
        break;
      case 'end':
      case 'title':
        return battles;
    }
  }
  throw new Error('playUntil: the story did not finish');
}
