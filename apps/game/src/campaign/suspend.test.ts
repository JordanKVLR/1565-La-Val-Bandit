import { createBattle } from '@m1565/core';
import { loadLibrary } from '@m1565/content';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { KeyValueBackend } from '../platform/storage';
import { readSave, saveKey, setStorageBackend } from '../platform/storage';
import { GameSession } from './GameSession';
import { installFakePlatform, playUntil } from './testkit';
import type { CampaignSave } from './types';

/**
 * Suspend/resume safety: the game can be killed at any moment (console suspend, phone, Deck),
 * so every meaningful change is saved at once and Continue resumes exactly there.
 */
const lib = loadLibrary();
let platform: ReturnType<typeof installFakePlatform>;

beforeEach(() => {
  platform = installFakePlatform();
});
afterEach(() => setStorageBackend(null));

/** "Kill" the game and press Continue: a fresh session from the autosave. */
const relaunch = () => GameSession.load(lib, 'auto')!;

function lineOf(s: GameSession): string | null {
  const screen = s.state.screen;
  return screen.kind === 'story' ? (screen.line?.text ?? null) : null;
}

describe('resuming after a kill', () => {
  it('every story line is saved: a relaunch shows the same line', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    for (let i = 0; i < 6; i++) s.advance();
    const shown = lineOf(s);
    expect(shown).toBeTruthy();
    expect(lineOf(relaunch())).toBe(shown);
    // …and the next line after that is the same as the uninterrupted game's.
    const resumed = relaunch();
    s.advance();
    resumed.advance();
    expect(lineOf(resumed)).toBe(lineOf(s));
  });

  it('a story choice is saved at once', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'story' && !!v.screen.choices);
    s.choose(0);
    expect(lineOf(relaunch())).toBe(lineOf(s));
  });

  it('a battle resumes from the latest command, and flush rewrites it', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const screen = s.state.screen;
    if (screen.kind !== 'battle') throw new Error('expected a battle');
    const resumedAt = (r: GameSession) => {
      const sc = r.state.screen;
      return sc.kind === 'battle' ? (sc.initial?.round ?? null) : null;
    };
    // A snapshot as the battle screen hands it over after a command: here, a later round.
    s.saveBattleProgress({ ...createBattle(screen.setup).state, round: 3 });
    expect(resumedAt(relaunch())).toBe(3);
    // Something else overwrote the autosave (say, a battle start written by an older path):
    // the suspend hook writes the latest snapshot again.
    s.autosave();
    expect(relaunch().state.screen).toMatchObject({ kind: 'battle' });
    expect(resumedAt(relaunch())).toBeNull();
    s.flush();
    expect(resumedAt(relaunch())).toBe(3);
  });

  it('flush in a battle without a snapshot leaves the autosave alone', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    playUntil(s, (v) => v.screen.kind === 'battle');
    const before = platform.storage.get(saveKey('auto'));
    s.flush();
    expect(platform.storage.get(saveKey('auto'))).toBe(before);
  });

  it('flush on the story screen saves the current line', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    s.advance();
    platform.storage.clear();
    s.flush();
    expect(readSave<CampaignSave>('auto')?.lastStep).toMatchObject({ kind: 'line' });
  });

  it('a kill in the middle of writing the autosave loses at most that step', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    for (let i = 0; i < 3; i++) s.advance();
    const saved = lineOf(s);
    // Storage that tears the write of the primary copy and then "dies".
    const real = platform.storage;
    let armed = true;
    const flaky: KeyValueBackend = {
      getItem: (k) => real.get(k) ?? null,
      setItem: (k, v) => {
        if (armed && k === saveKey('auto')) {
          armed = false;
          real.set(k, v.slice(0, 40));
          throw new Error('killed');
        }
        real.set(k, v);
      },
      removeItem: (k) => void real.delete(k),
    };
    setStorageBackend(flaky);
    s.advance();
    const next = lineOf(s);
    expect(real.get(saveKey('auto'))?.length).toBe(40); // the primary copy is torn
    setStorageBackend(null);
    // Continue still works, from the save being written (complete in its side copy).
    expect([saved, next]).toContain(lineOf(relaunch()));
    expect(lineOf(relaunch())).toBe(next);
  });

  it('a damaged autosave falls back to the previous good copy', () => {
    const s = new GameSession(lib, undefined, { difficulty: 'knight' });
    for (let i = 0; i < 3; i++) s.advance();
    const previous = lineOf(s);
    s.advance();
    platform.storage.set(saveKey('auto'), '{"version":3,"ink":');
    expect(lineOf(relaunch())).toBe(previous);
  });
});
