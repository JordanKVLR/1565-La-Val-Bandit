import { loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { installFakePlatform } from '../campaign/testkit';
import { better, bestFor, challengeFor, dayNumber, record } from './challenge';

const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

describe('the daily challenge', () => {
  it('is the same battle with the same seed for everyone on a day, and changes daily', () => {
    const a = challengeFor(lib, 20_000);
    const b = challengeFor(lib, 20_000);
    expect(a.skirmish.id).toBe(b.skirmish.id);
    expect(a.setup.seed).toBe(20_000);
    const ids = new Set(
      Array.from(
        { length: lib.skirmishes.length },
        (_, i) => challengeFor(lib, 20_000 + i).skirmish.id,
      ),
    );
    expect(ids.size).toBe(lib.skirmishes.length);
    // Each day uses the skirmish's fixed fallback squad: it needs no save.
    expect(a.setup.units.some((u) => u.side === 'player')).toBe(true);
  });

  it('counts calendar days in the player’s own time zone', () => {
    const noon = new Date(2026, 9, 15, 12, 0, 0);
    const late = new Date(2026, 9, 15, 23, 59, 0);
    const next = new Date(2026, 9, 16, 0, 1, 0);
    expect(dayNumber(late)).toBe(dayNumber(noon));
    expect(dayNumber(next)).toBe(dayNumber(noon) + 1);
  });

  it('ranks fewer losses first, then more goals, then fewer rounds', () => {
    const r = (rounds: number, losses: number, goals: number) => ({ rounds, losses, goals, of: 3 });
    expect(better(r(9, 0, 1), r(5, 1, 3))).toBe(true);
    expect(better(r(9, 0, 2), r(5, 0, 1))).toBe(true);
    expect(better(r(5, 0, 2), r(9, 0, 2))).toBe(true);
    expect(better(r(9, 0, 2), r(5, 0, 2))).toBe(false);
    expect(better(r(9, 2, 0), undefined)).toBe(true);
  });

  it('keeps only a better result for the day, and remembers a month', () => {
    expect(bestFor(100)).toBeUndefined();
    expect(record(100, { rounds: 9, losses: 1, goals: 0, of: 2 })).toBe(true);
    expect(record(100, { rounds: 12, losses: 2, goals: 0, of: 2 })).toBe(false);
    expect(record(100, { rounds: 8, losses: 0, goals: 1, of: 2 })).toBe(true);
    expect(bestFor(100)).toEqual({ rounds: 8, losses: 0, goals: 1, of: 2 });
    for (let d = 101; d < 140; d++) record(d, { rounds: 5, losses: 0, goals: 0, of: 2 });
    expect(bestFor(100)).toBeUndefined();
    expect(bestFor(139)).toBeDefined();
  });
});
