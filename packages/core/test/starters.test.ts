import { describe, expect, it } from 'vitest';
import type { Attack, Weapon } from '../src';
import {
  applyCommand,
  createBattle,
  deserializeBattle,
  meetsRequirements,
  requireUnit,
  SAVE_VERSION,
  starterAttacks,
} from '../src';
import { GUN, makeMap, setup, SWORD, unit } from './fixtures';

const weapon = (type: Weapon['type'], over: Partial<Weapon> = {}): Weapon => ({
  ...SWORD,
  id: type,
  type,
  ...over,
});
const summary = (a: Attack) => [a.name, a.power, a.accuracy, a.apCost, a.fpCost];

describe('starter attacks', () => {
  it('blades get Slash (accurate, light) and Thrust (plain)', () => {
    expect(starterAttacks(SWORD).map(summary)).toEqual([
      ['Slash', 0.8, 20, 30, 5],
      ['Thrust', 1, 0, 30, 5],
    ]);
  });

  it('polearms get Thrust and a reaching Long Thrust instead of Slash', () => {
    const [thrust, long] = starterAttacks(weapon('polearm', { maxRange: 2 }));
    expect(summary(thrust!)).toEqual(['Thrust', 1, 0, 30, 5]);
    expect(thrust).toMatchObject({ minRange: 1, maxRange: 1 });
    expect(summary(long!)).toEqual(['Long Thrust', 1, -20, 35, 5]);
    expect(long).toMatchObject({ minRange: 1, maxRange: 2 });
  });

  it('gunners fire at range and have only a weak Stock Strike up close', () => {
    const [fire, stock] = starterAttacks(GUN);
    expect(fire).toMatchObject({ name: 'Fire', power: 1, apCost: GUN.apCost, fpCost: 5 });
    expect(fire!.minRange).toBeUndefined(); // uses the gun's own 2–4 range
    expect(stock).toMatchObject({ name: 'Stock Strike', power: 0.5, minRange: 1, maxRange: 1 });
  });

  it('every weapon type has two requirement-free starters', () => {
    for (const type of ['blade', 'polearm', 'blunt', 'firearm', 'explosive'] as const) {
      const s = starterAttacks(weapon(type));
      expect(s).toHaveLength(2);
      expect(s.every((a) => Object.keys(a.requires).length === 0)).toBe(true);
    }
  });

  it('technique requirements check all seven attributes', () => {
    const stats = { str: 20, skl: 20, agi: 20, def: 0, int: 5, spi: 0, vit: 0 };
    const tech = { ...starterAttacks(SWORD)[1]!, requires: { str: 10, int: 7 } };
    expect(meetsRequirements(stats, tech)).toBe(false);
    expect(meetsRequirements({ ...stats, int: 7 }, tech)).toBe(true);
  });
});

describe('turn economy', () => {
  const start = () =>
    createBattle(
      setup({
        map: makeMap(['pppp', 'pppp', 'pppp', 'pppp']),
        units: [
          unit({ id: 'a', stats: { agi: 20 }, at: { x: 0, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 3, y: 3 } }),
        ],
      }),
    ).state;

  it('AP refills to 100 at the start of every turn', () => {
    let s = start();
    s = applyCommand(s, { type: 'move', unitId: 'a', to: { x: 2, y: 0 } }).state;
    expect(requireUnit(s, 'a').ap).toBe(92);
    s = applyCommand(s, { type: 'endTurn', unitId: 'a' }).state;
    s = applyCommand(s, { type: 'endTurn', unitId: 'e' }).state;
    expect(requireUnit(s, 'a').ap).toBe(100);
  });

  it('a fainted unit (FP 100) can only pass, and passing recovers most of it', () => {
    let s = start();
    s = { ...s, units: s.units.map((u) => (u.id === 'a' ? { ...u, fp: 100 } : u)) };
    expect(() => applyCommand(s, { type: 'move', unitId: 'a', to: { x: 1, y: 0 } })).toThrow(
      /fatigued/,
    );
    s = applyCommand(s, { type: 'endTurn', unitId: 'a' }).state;
    expect(requireUnit(s, 'a').fp).toBe(100 - 66);
  });
});

describe('save migration v4 → v5', () => {
  it('switches to the refill economy and gives every unit its starter attacks', () => {
    const now = start();
    const oldBalance: Record<string, unknown> = {
      ...now.balance,
      apStart: 20,
      apRegen: 40,
      fpRecovery: 15,
      fpRestRecovery: 35,
      attackFpSurcharge: 20,
    };
    delete oldBalance.apPerFpRecovered;
    const units = now.units.map((u) => ({ ...u, attacks: u.attacks.slice(0, 1) }));
    const v4 = { ...now, saveVersion: 4, balance: oldBalance, units };
    const loaded = deserializeBattle(JSON.stringify(v4));
    expect(loaded.saveVersion).toBe(SAVE_VERSION);
    expect(loaded.balance).toMatchObject({ apStart: 100, apRegen: 100, apPerFpRecovered: 1.5 });
    for (const k of ['fpRecovery', 'fpRestRecovery', 'attackFpSurcharge']) {
      expect(k in loaded.balance).toBe(false);
    }
    expect(requireUnit(loaded, 'a').attacks.map((x) => x.name)).toEqual(['Slash', 'Thrust']);
  });

  function start() {
    return createBattle(
      setup({
        units: [
          unit({ id: 'a', at: { x: 0, y: 0 } }),
          unit({ id: 'e', side: 'enemy', at: { x: 3, y: 3 } }),
        ],
      }),
    ).state;
  }
});
