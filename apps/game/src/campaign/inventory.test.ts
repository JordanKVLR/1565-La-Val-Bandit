import { loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import type { Holdings } from './inventory';
import {
  addItem,
  armouryStock,
  buy,
  companyStock,
  countOf,
  equip,
  release,
  sell,
  spares,
  summarize,
  swap,
  swapBlocked,
} from './inventory';
import { migrateCampaign } from './migrate';
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
    expect(after.damage).toBe(
      Math.round((after.stats.pow + after.stats.wep) * lib.balance.damagePerPoint),
    );
    expect(after.damage).toBeGreaterThan(before.damage);
    expect(after.block).toBeGreaterThan(before.block);
  });

  it('returns gear to the stores when a pilot leaves', () => {
    let h = buy(lib, start(), {
      item: 'pilgrim-shell',
      kind: 'amulet',
      allegiance: 'malta',
      after: null,
    });
    h = equip(lib, h, 'ninu', 'amulet', 'pilgrim-shell');
    h = equip(lib, h, 'ninu', 'frame', 'cavaliere');
    const own = lib.characters.get('ninu')!;
    h = release(lib, h, 'ninu');
    expect(h.roster.map((r) => r.characterId)).toEqual(['kateri']);
    expect(countOf(h.stores, 'amulet', 'pilgrim-shell')).toBe(1);
    expect(countOf(h.stores, 'frame', 'cavaliere')).toBe(1);
    // Their own armatura went to the stores when the cavaliere was fitted; it isn't doubled.
    expect(countOf(h.stores, 'frame', own.frame)).toBe(1);
    // With their own loadout, only trinkets come back.
    const plain = release(lib, start(), 'kateri');
    expect(plain.stores).toEqual(start().stores);
  });

  it('lists each Armoury item once for a mixed company', () => {
    const all = lib.shop.map((s) => s.after).filter((a): a is string => !!a);
    const stock = companyStock(lib, all, ['malta', 'ottoman']);
    const keys = stock.map((s) => `${s.kind}:${s.item}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('swapping gear between pilots', () => {
  it('trades weapons both ways, so neither pilot is left without one', () => {
    const h = swap(lib, start(), 'ninu', 'kateri', 'weapon');
    const [ninu, kateri] = h.roster;
    expect(ninu!.weapon).toBe(lib.characters.get('kateri')!.weapon);
    expect(kateri!.weapon).toBe(lib.characters.get('ninu')!.weapon);
    expect(h.stores).toEqual(start().stores);
  });

  it("moves a charm across, handing back the taker's own if they had one", () => {
    let h = buy(lib, start(), {
      item: 'charm-pow-1',
      kind: 'charm',
      allegiance: 'malta',
      after: null,
    });
    h = equip(lib, h, 'kateri', 'charm', 'charm-pow-1');
    h = swap(lib, h, 'ninu', 'kateri', 'charm');
    expect(h.roster[0]!.charm).toBe('charm-pow-1');
    expect(h.roster[1]!.charm).toBeNull();
  });

  it("refuses when either pilot can't use the other's armatura", () => {
    const mixed = { ...start(), roster: [...start().roster, newRosterEntry(lib, 'deniz')] };
    expect(swapBlocked(lib, mixed, 'ninu', 'deniz', 'frame')).toMatch(/Can't use/);
    expect(() => swap(lib, mixed, 'ninu', 'deniz', 'frame')).toThrow();
    expect(swapBlocked(lib, mixed, 'ninu', 'kateri', 'frame')).toBeUndefined();
  });
});

describe('campaign save migration', () => {
  it('maps the seven old stats onto the six, caps them and turns designs into spares', () => {
    const v1 = {
      version: 1,
      scudi: 300,
      roster: [
        {
          characterId: 'ninu',
          level: 4,
          xp: 40,
          statPoints: 2,
          stats: { str: 40, skl: 8, agi: 9, def: 4, int: 5, spi: 5, vit: 7 },
          frame: 'haddiem',
          weapon: 'arming-sword',
        },
      ],
      armory: ['haddiem', 'arming-sword', 'cavaliere', 'pike'],
    };
    const save = migrateCampaign(lib, v1)!;
    const ninu = save.roster[0]!;
    expect(ninu.stats).toMatchObject({ pow: 32, dex: 8, agl: 9, def: 4, bas: 7 });
    expect(ninu.xp).toBe(200);
    expect(countOf(save.stores, 'frame', 'cavaliere')).toBe(1);
    expect(countOf(save.stores, 'weapon', 'pike')).toBe(1);
    expect(countOf(save.stores, 'frame', 'haddiem')).toBe(0);
  });
});
