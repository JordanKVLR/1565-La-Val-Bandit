import { describe, expect, it } from 'vitest';
import type { Attack, Weapon } from '../src';
import {
  applyCommand,
  createBattle,
  DEFAULT_BALANCE,
  meetsRequirements,
  requireUnit,
  starterAttacks,
  techniqueCost,
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
  it('blades get Slash (accurate, light, cheap) and Thrust (plain)', () => {
    expect(starterAttacks(SWORD).map(summary)).toEqual([
      ['Slash', 0.8, 12, 20, 5],
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

  it('technique requirements check all six attributes', () => {
    const stats = { bas: 0, pow: 20, dex: 5, agl: 20, def: 0, wep: 0 };
    const tech = { ...starterAttacks(SWORD)[1]!, requires: { pow: 10, dex: 7 } };
    expect(meetsRequirements(stats, tech)).toBe(false);
    expect(meetsRequirements({ ...stats, dex: 7 }, tech)).toBe(true);
  });

  it('starter costs follow the shared formula: stronger is dearer and less accurate', () => {
    const [slash, thrust] = starterAttacks(SWORD);
    expect(slash).toMatchObject({ apCost: 20, fpCost: 5, accuracy: 12 });
    expect(thrust).toMatchObject({ apCost: 30, fpCost: 5, accuracy: 0 });
    expect(techniqueCost(1.4, 1, DEFAULT_BALANCE)).toEqual({
      apCost: 50,
      fpCost: 11,
      accuracy: -24,
    });
    expect(techniqueCost(0.7, 2, DEFAULT_BALANCE)).toEqual(techniqueCost(1.4, 1, DEFAULT_BALANCE));
  });
});

describe('turn economy', () => {
  const start = () =>
    createBattle(
      setup({
        map: makeMap(['pppp', 'pppp', 'pppp', 'pppp']),
        units: [
          unit({ id: 'a', stats: { agl: 20 }, at: { x: 0, y: 0 } }),
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
