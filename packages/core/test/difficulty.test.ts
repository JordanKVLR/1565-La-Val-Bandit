import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BALANCE,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  difficultyMods,
  enemyScaling,
  isDifficulty,
  NO_SCALING,
  scaleEnemyLevel,
  scaleEnemyStats,
  scaleScudi,
} from '../src';

const b = DEFAULT_BALANCE;
const stats = { bas: 8, pow: 10, dex: 7, agl: 6, def: 5, wep: 9 };

describe('difficulty', () => {
  it('Knight is the neutral reference balance and the default', () => {
    expect(DEFAULT_DIFFICULTY).toBe('knight');
    expect(enemyScaling(b, 'knight')).toEqual(NO_SCALING);
    expect(difficultyMods(b, 'knight')).toEqual({
      enemyLevel: 0,
      enemyStats: 1,
      scudi: 1,
      defeatKeepsXp: false,
    });
    expect(scaleEnemyStats(stats, enemyScaling(b, 'knight'), b.statMax)).toBe(stats);
    expect(scaleScudi(475, b, 'knight')).toBe(475);
  });

  it('Squire weakens enemies and pays more; Grand Master the reverse', () => {
    const squire = enemyScaling(b, 'squire');
    const gm = enemyScaling(b, 'grandMaster');
    expect(squire.levelBonus).toBeLessThan(0);
    expect(squire.statMult).toBeLessThan(1);
    expect(gm.levelBonus).toBeGreaterThan(0);
    expect(gm.statMult).toBeGreaterThan(1);
    expect(scaleScudi(400, b, 'squire')).toBeGreaterThan(400);
    expect(scaleScudi(400, b, 'grandMaster')).toBeLessThan(400);
    expect(difficultyMods(b, 'squire').defeatKeepsXp).toBe(true);
    expect(difficultyMods(b, 'grandMaster').defeatKeepsXp).toBe(false);
  });

  it('scales attributes with rounding, within 1…statMax, and never drops below level 1', () => {
    expect(scaleEnemyStats(stats, { levelBonus: 0, statMult: 1.15 }, 32)).toEqual({
      bas: 9,
      pow: 12,
      dex: 8,
      agl: 7,
      def: 6,
      wep: 10,
    });
    expect(scaleEnemyStats({ ...stats, pow: 30 }, { levelBonus: 0, statMult: 2 }, 32).pow).toBe(32);
    expect(scaleEnemyStats({ ...stats, def: 1 }, { levelBonus: 0, statMult: 0.1 }, 32).def).toBe(1);
    expect(scaleEnemyLevel(1, enemyScaling(b, 'squire'))).toBe(1);
    expect(scaleEnemyLevel(5, enemyScaling(b, 'squire'))).toBe(4);
    expect(scaleEnemyLevel(5, enemyScaling(b, 'grandMaster'))).toBe(7);
  });

  it('New Game+ stacks per cycle on top of the difficulty', () => {
    const one = enemyScaling(b, 'knight', 1);
    const two = enemyScaling(b, 'knight', 2);
    expect(one.levelBonus).toBe(b.ngPlusEnemyLevelPerCycle);
    expect(two.levelBonus).toBe(2 * b.ngPlusEnemyLevelPerCycle);
    expect(one.statMult).toBeCloseTo(1 + b.ngPlusEnemyStatsPerCycle);
    expect(two.statMult).toBeCloseTo(1 + 2 * b.ngPlusEnemyStatsPerCycle);
    const gm1 = enemyScaling(b, 'grandMaster', 1);
    expect(gm1.levelBonus).toBe(b.grandMasterEnemyLevel + b.ngPlusEnemyLevelPerCycle);
    expect(gm1.statMult).toBeCloseTo(b.grandMasterEnemyStats * (1 + b.ngPlusEnemyStatsPerCycle));
    // Nonsense cycle counts count as none.
    expect(enemyScaling(b, 'knight', -3)).toEqual(NO_SCALING);
  });

  it('recognises difficulty ids', () => {
    for (const d of DIFFICULTIES) expect(isDifficulty(d)).toBe(true);
    expect(isDifficulty('easy')).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
  });
});
