import { createBattle } from '@m1565/core';
import { loadBattle, loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { applyBattleResults, newRosterEntry, skillsLearned, withProgress } from './progression';

const lib = loadLibrary();

describe('XP carries over between stages', () => {
  it('keeps the level and XP of company pilots', () => {
    const roster = [{ ...newRosterEntry(lib, 'ninu'), level: 3, xp: 210 }];
    const { state } = createBattle(loadBattle('b1-marsaxlokk', lib, roster));
    const ninu = state.units.find((u) => u.characterId === 'ninu')!;
    expect(ninu).toMatchObject({ level: 3, xp: 210 });
    const won = {
      ...state,
      units: state.units.map((u) => (u.id === ninu.id ? { ...u, level: 4, xp: 35 } : u)),
    };
    expect(applyBattleResults(lib, roster, won).roster[0]).toMatchObject({ level: 4, xp: 35 });
  });

  it('remembers named allies who fight before joining, and they keep it when they join', () => {
    const { state } = createBattle(loadBattle('b1-marsaxlokk', lib, []));
    const ninu = state.units.find((u) => u.characterId === 'ninu')!;
    const fought = {
      ...state,
      units: state.units.map((u) => (u.id === ninu.id ? { ...u, level: 2, xp: 120 } : u)),
    };
    const { veterans } = applyBattleResults(lib, [], fought);
    expect(veterans['ninu']).toMatchObject({ level: 2, xp: 120 });
    // Their next battle starts from there...
    const next = createBattle(loadBattle('b1-marsaxlokk', lib, [], veterans)).state;
    expect(next.units.find((u) => u.characterId === 'ninu')).toMatchObject({ level: 2, xp: 120 });
    // ...and so does their place in the company.
    expect(withProgress(newRosterEntry(lib, 'ninu'), veterans['ninu'])).toMatchObject({
      level: 2,
      xp: 120,
    });
  });
});

describe('skillsLearned', () => {
  const lib = loadLibrary();
  const levels = (lib.skillSets.get('ninu') ?? []).map((s) => s.level);

  it("lists the unlock levels a pilot's level-up crossed, not the starting skill", () => {
    expect(levels).toEqual([1, 5, 10]);
    const at = (level: number) => [{ characterId: 'ninu', level }];
    expect(skillsLearned(lib, at(1), at(4))).toEqual([]);
    expect(skillsLearned(lib, at(4), at(5))).toEqual([5]);
    expect(skillsLearned(lib, at(4), at(11))).toEqual([5, 10]);
    expect(skillsLearned(lib, at(5), at(5))).toEqual([]);
  });

  it('ignores pilots who were not in the company before', () => {
    expect(skillsLearned(lib, [], [{ characterId: 'ninu', level: 10 }])).toEqual([]);
  });
});
