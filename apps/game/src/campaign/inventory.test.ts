import { loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import type { Holdings } from './inventory';
import { addItem, armouryStock, buy, countOf, equip, sell, spares, summarize } from './inventory';
import { newRosterEntry } from './progression';

const lib = loadLibrary();
const start = (): Holdings => ({
  roster: [newRosterEntry(lib, 'ninu'), newRosterEntry(lib, 'kateri')],
  stores: addItem({}, 'frame', 'cavaliere'),
  scudi: 500,
});

describe('inventory', () => {
  it('equipping swaps the item with the stores, so each item serves one pilot', () => {
    const h = equip(lib, start(), 'ninu', 'frame', 'cavaliere');
    expect(h.roster[0]!.frame).toBe('cavaliere');
    expect(countOf(h.stores, 'frame', 'cavaliere')).toBe(0);
    expect(countOf(h.stores, 'frame', 'haddiem')).toBe(1);
    expect(() => equip(lib, h, 'kateri', 'frame', 'cavaliere')).toThrow(/No spare/);
  });

  it('armatura and weapon slots are never empty; charms and amulets can come off', () => {
    expect(() => equip(lib, start(), 'ninu', 'weapon', null)).toThrow(/always needs/);
    let h = buy(lib, start(), {
      item: 'pilgrim-shell',
      kind: 'amulet',
      allegiance: 'malta',
      after: null,
    });
    h = equip(lib, h, 'ninu', 'amulet', 'pilgrim-shell');
    expect(h.roster[0]!.amulet).toBe('pilgrim-shell');
    h = equip(lib, h, 'ninu', 'amulet', null);
    expect(h.roster[0]!.amulet).toBeNull();
    expect(countOf(h.stores, 'amulet', 'pilgrim-shell')).toBe(1);
  });

  it('only lets pilots use armaturas of their own side', () => {
    const h = { ...start(), stores: addItem({}, 'frame', 'yeniceri') };
    expect(() => equip(lib, h, 'ninu', 'frame', 'yeniceri')).toThrow(/can't use/);
  });

  it('buys at the listed price and sells spares back for half', () => {
    const item = {
      item: 'pike',
      kind: 'weapon' as const,
      allegiance: 'malta' as const,
      after: null,
    };
    const price = lib.weapons.get('pike')!.price;
    let h = buy(lib, start(), item);
    expect(h.scudi).toBe(500 - price);
    expect(spares(h.stores, 'weapon')).toEqual([['pike', 1]]);
    h = sell(lib, h, 'weapon', 'pike');
    expect(h.scudi).toBe(500 - price + Math.floor(price / 2));
    expect(() => sell(lib, h, 'frame', 'cavaliere')).toThrow(/can't be sold/);
    expect(() => buy(lib, { ...h, scudi: 0 }, item)).toThrow(/Not enough/);
  });

  it('stocks more as the story advances', () => {
    const early = armouryStock(lib, [], 'malta').length;
    const later = armouryStock(
      lib,
      ['b5-tigne', 'b6-kalkara-chapel', 'b9-fall-of-st-elmo'],
      'malta',
    );
    expect(later.length).toBeGreaterThan(early);
    expect(later.every((s) => s.kind !== ('frame' as string))).toBe(true);
  });

  it('summarizes how gear changes the pilot: attributes, HP, damage, accuracy and block', () => {
    const base = start().roster[0]!;
    const before = summarize(lib, base);
    const after = summarize(lib, { ...base, weapon: 'bastard-sword', charm: 'charm-def-1' });
    const wep =
      lib.weapons.get('bastard-sword')!.bonus.wep! - lib.weapons.get('arming-sword')!.bonus.wep!;
    expect(after.stats.wep - before.stats.wep).toBe(wep);
    expect(after.damage - before.damage).toBe(wep * lib.balance.damagePerPoint);
    expect(after.block).toBeGreaterThan(before.block);
  });
});
