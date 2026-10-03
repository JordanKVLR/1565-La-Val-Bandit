import { createBattle } from '@m1565/core';
import { loadBattle, loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { applyBattleResults, newRosterEntry, withProgress } from './progression';

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
