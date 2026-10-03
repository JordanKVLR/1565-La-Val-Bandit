import { loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { addItem } from '../../campaign/inventory';
import { newRosterEntry } from '../../campaign/progression';
import type { ArmouryView } from './model';
import { actionsFor, headlineDelta, previewFor, shelfSections, tierOf } from './model';

const lib = loadLibrary();
const view = (over: Partial<ArmouryView> = {}): ArmouryView => ({
  roster: [
    newRosterEntry(lib, 'ninu'),
    newRosterEntry(lib, 'kateri'),
    newRosterEntry(lib, 'deniz'),
  ],
  stores: addItem(addItem({}, 'weapon', 'pike'), 'frame', 'yeniceri'),
  scudi: 400,
  completedBattles: [],
  ...over,
});
const sources = (v: ArmouryView, pilot: string, kind: Parameters<typeof shelfSections>[3]) =>
  shelfSections(lib, v, pilot, kind, 'shop').map((s) => s.source);

describe('armoury shelf', () => {
  it('lists fitted, spares, other pilots and stock in that order, each item once', () => {
    const v = view();
    expect(sources(v, 'ninu', 'weapon')).toEqual(['fitted', 'stores', 'pilot', 'shop']);
    const all = shelfSections(lib, v, 'ninu', 'weapon', 'shop').flatMap((s) =>
      s.entries.filter((e) => e.source !== 'pilot' && e.source !== 'shop').map((e) => e.id),
    );
    expect(new Set(all).size).toBe(all.length);
  });

  it('marks stock you cannot afford and armaturas of the other side', () => {
    const poor = shelfSections(lib, view({ scudi: 10 }), 'ninu', 'weapon', 'shop').find(
      (s) => s.source === 'shop',
    )!;
    expect(poor.entries.every((e) => /Need \d+ more scudi/.test(e.blocked ?? ''))).toBe(true);
    const frames = shelfSections(lib, view(), 'ninu', 'frame', 'shop');
    expect(frames.find((s) => s.source === 'unusable')?.entries[0]?.id).toBe('yeniceri');
    expect(sources(view(), 'ninu', 'frame')).not.toContain('shop');
  });

  it('sells only spare weapons, charms and amulets, never armaturas', () => {
    const sell = shelfSections(lib, view(), 'ninu', 'weapon', 'sell');
    expect(sell.flatMap((s) => s.entries.map((e) => e.kind))).toEqual(['weapon']);
    expect(sell[0]!.entries[0]!.sellPrice).toBe(Math.floor(lib.weapons.get('pike')!.price / 2));
  });

  it('offers the right actions for each source', () => {
    const v = view();
    const s = shelfSections(lib, v, 'ninu', 'weapon', 'shop');
    const of = (src: string) => s.find((x) => x.source === src)!.entries[0]!;
    expect(actionsFor(of('stores'), 'shop', true).map((a) => a.id)).toEqual(['equip']);
    expect(actionsFor(of('pilot'), 'shop', true).map((a) => a.id)).toEqual(['swap']);
    const stock = s.find((x) => x.source === 'shop')!.entries;
    const fresh = stock.find((e) => e.owned === 0)!;
    const spare = stock.find((e) => e.owned > 0)!;
    expect(actionsFor(fresh, 'shop', true).map((a) => a.id)).toEqual(['buy-equip', 'buy']);
    expect(actionsFor(spare, 'shop', true).map((a) => a.id)).toEqual(['equip', 'buy']);
    expect(actionsFor(of('fitted'), 'shop', true)).toEqual([]);
  });

  it('reads tiers from weapons and charm levels', () => {
    expect(tierOf(lib, 'weapon', 'toledo-espada')).toBe('masterwork');
    expect(tierOf(lib, 'weapon', 'pike')).toBe('common');
    expect(tierOf(lib, 'charm', 'charm-pow-3')).toBe('masterwork');
    expect(tierOf(lib, 'frame', 'cavaliere')).toBeNull();
  });

  it('summarises the biggest change for a card', () => {
    const ninu = view().roster[0]!;
    const { before, after } = previewFor(lib, ninu, 'weapon', 'bastard-sword');
    expect(headlineDelta(before, after)).toMatch(/^▲ DMG \+\d+/);
  });
});
