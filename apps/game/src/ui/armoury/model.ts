import type { StatBonus } from '@m1565/core';
import type { Library, RosterEntry, ShopItem } from '@m1565/content';
import type { Holdings, ItemKind, LoadoutSummary, Stores } from '../../campaign/inventory';
import {
  armouryStock,
  canUse,
  countOf,
  equipped,
  priceOf,
  spares,
  summarize,
  swapBlocked,
} from '../../campaign/inventory';
import { t } from '../../i18n';
import type { Tier } from './ItemIcon';

/** Where a shelf entry comes from, which decides what can be done with it. */
export type Source = 'fitted' | 'stores' | 'pilot' | 'shop' | 'unusable';
export type Mode = 'shop' | 'sell';

export interface ShelfEntry {
  readonly kind: ItemKind;
  readonly id: string;
  readonly name: string;
  readonly tier: Tier | null;
  readonly bonus: StatBonus;
  readonly source: Source;
  /** Spares of this item in the stores. */
  readonly owned: number;
  readonly price: number | null;
  readonly sellPrice: number | null;
  /** For items fitted to another pilot: who has it. */
  readonly holderId?: string;
  /** For Armoury stock: the shop listing to buy. */
  readonly shopItem?: ShopItem;
  /** Why the selected pilot can't take, use or buy it. */
  readonly blocked?: string;
}

export interface ShelfSection {
  readonly source: Source;
  readonly title: string;
  readonly entries: readonly ShelfEntry[];
}

export interface ArmouryView {
  readonly roster: readonly RosterEntry[];
  readonly stores: Stores;
  readonly scudi: number;
  readonly completedBattles: readonly string[];
}

export const sideOf = (lib: Library, characterId: string): 'malta' | 'ottoman' =>
  lib.characters.get(characterId)?.allegiance ?? 'malta';

export const nameOf = (lib: Library, characterId: string): string =>
  lib.characters.get(characterId)?.name ?? characterId;

/** Quality tier: weapons carry one; charms read it from their -1/-2/-3 suffix. */
export function tierOf(lib: Library, kind: ItemKind, id: string): Tier | null {
  if (kind === 'frame') return null;
  if (kind === 'weapon') return lib.weapons.get(id)?.tier ?? 'common';
  const m = /-(\d)$/.exec(id);
  if (m) return m[1] === '3' ? 'masterwork' : m[1] === '2' ? 'fine' : 'common';
  return 'fine';
}

export function itemName(lib: Library, kind: ItemKind, id: string): string {
  if (kind === 'frame') return lib.frames.get(id)?.name ?? id;
  if (kind === 'weapon') return lib.weapons.get(id)?.name ?? id;
  return lib.gear.get(id)?.name ?? id;
}

export function itemBonus(lib: Library, kind: ItemKind, id: string): StatBonus {
  if (kind === 'frame') return lib.frames.get(id)?.bonus ?? {};
  if (kind === 'weapon') return lib.weapons.get(id)?.bonus ?? {};
  return lib.gear.get(id)?.bonus ?? {};
}

export function itemDescription(lib: Library, kind: ItemKind, id: string): string {
  if (kind === 'frame') return lib.frames.get(id)?.description ?? '';
  if (kind === 'weapon') return lib.weapons.get(id)?.description ?? '';
  return lib.gear.get(id)?.description ?? '';
}

/** The picture variant for ItemIcon: weapon type, frame model, or the gear id. */
export function iconVariant(lib: Library, kind: ItemKind, id: string): string {
  if (kind === 'weapon') return lib.weapons.get(id)?.type ?? 'blade';
  if (kind === 'frame') return lib.frameModels.get(id) ?? 'knight';
  return id;
}

function entry(
  lib: Library,
  view: ArmouryView,
  kind: ItemKind,
  id: string,
  source: Source,
  extra: Partial<ShelfEntry> = {},
): ShelfEntry {
  const price = priceOf(lib, kind, id);
  return {
    kind,
    id,
    name: itemName(lib, kind, id),
    tier: tierOf(lib, kind, id),
    bonus: itemBonus(lib, kind, id),
    source,
    owned: countOf(view.stores, kind, id),
    price,
    sellPrice: price === null ? null : Math.floor(price / 2),
    ...extra,
  };
}

/**
 * The shelf for one pilot and item kind, in sections: what is fitted, spares in the stores,
 * items on other pilots, the armourer's stock, and armaturas this pilot can't wear. Each item
 * appears once (the first section wins), except stock you already own a spare of.
 */
export function shelfSections(
  lib: Library,
  view: ArmouryView,
  pilotId: string,
  kind: ItemKind,
  mode: Mode,
): ShelfSection[] {
  if (mode === 'sell') {
    return (['weapon', 'charm', 'amulet'] as const)
      .map((k) => ({
        source: 'stores' as const,
        title:
          k === 'weapon'
            ? t('shelf.section.spareWeapons')
            : k === 'charm'
              ? t('shelf.section.spareCharms')
              : t('shelf.section.spareAmulets'),
        entries: spares(view.stores, k).map(([id]) => entry(lib, view, k, id, 'stores')),
      }))
      .filter((s) => s.entries.length > 0);
  }
  const pilot = view.roster.find((r) => r.characterId === pilotId);
  if (!pilot) return [];
  const holdings: Holdings = { roster: view.roster, stores: view.stores, scudi: view.scudi };
  const seen = new Set<string>();
  const take = (id: string) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  };
  const out: ShelfSection[] = [];
  const add = (source: Source, title: string, entries: ShelfEntry[]) => {
    if (entries.length) out.push({ source, title, entries });
  };

  const fitted = equipped(pilot, kind);
  add(
    'fitted',
    t('shelf.section.fitted'),
    fitted && take(fitted) ? [entry(lib, view, kind, fitted, 'fitted')] : [],
  );

  const stored = spares(view.stores, kind);
  add(
    'stores',
    t('shelf.section.stores'),
    stored
      .filter(([id]) => canUse(lib, pilot, kind, id) && take(id))
      .map(([id]) => entry(lib, view, kind, id, 'stores')),
  );

  add(
    'pilot',
    t('shelf.section.pilots'),
    view.roster
      .filter((r) => r.characterId !== pilotId && equipped(r, kind) !== null)
      .map((r) => {
        const id = equipped(r, kind)!;
        const blocked = swapBlocked(lib, holdings, pilotId, r.characterId, kind);
        return entry(lib, view, kind, id, 'pilot', {
          holderId: r.characterId,
          ...(blocked ? { blocked } : {}),
        });
      }),
  );

  if (kind !== 'frame') {
    const stock = armouryStock(lib, view.completedBattles, sideOf(lib, pilotId))
      .filter((s) => s.kind === kind)
      .filter((s, i, all) => all.findIndex((o) => o.item === s.item) === i)
      .map((s) => {
        const e = entry(lib, view, kind, s.item, 'shop', { shopItem: s });
        const short = (e.price ?? 0) - view.scudi;
        return short > 0 ? { ...e, blocked: t('armoury.needScudi', { n: short }) } : e;
      })
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    add('shop', t('shelf.section.stock'), stock);
  } else {
    const side = sideOf(lib, pilotId);
    add(
      'unusable',
      t('shelf.section.unusable'),
      stored
        .filter(([id]) => !canUse(lib, pilot, kind, id) && take(id))
        .map(([id]) =>
          entry(lib, view, kind, id, 'unusable', {
            blocked: t('armoury.otherSide', {
              name: nameOf(lib, pilotId),
              side: t(`armoury.fightsFor.${side}`),
            }),
          }),
        ),
    );
  }
  return out;
}

export type ActionId = 'equip' | 'swap' | 'take' | 'buy-equip' | 'buy' | 'remove' | 'sell';

export interface Action {
  readonly id: ActionId;
  readonly label: string;
  readonly primary: boolean;
}

/** What the detail panel offers for an entry (see the Armoury spec, section 3.2). */
export function actionsFor(e: ShelfEntry, mode: Mode, pilotHasSlotItem: boolean): Action[] {
  if (mode === 'sell')
    return [{ id: 'sell', label: t('action.sell', { n: e.sellPrice ?? 0 }), primary: true }];
  switch (e.source) {
    case 'stores':
      return [{ id: 'equip', label: t('action.equip'), primary: true }];
    case 'pilot':
      return [
        pilotHasSlotItem
          ? { id: 'swap', label: t('action.swap'), primary: true }
          : { id: 'take', label: t('action.take'), primary: true },
      ];
    case 'shop':
      return e.owned > 0
        ? [
            { id: 'equip', label: t('action.equipSpare'), primary: true },
            { id: 'buy', label: t('action.buyAnother', { n: e.price ?? 0 }), primary: false },
          ]
        : [
            { id: 'buy-equip', label: t('action.buyEquip', { n: e.price ?? 0 }), primary: true },
            { id: 'buy', label: t('action.buy', { n: e.price ?? 0 }), primary: false },
          ];
    case 'fitted':
      return e.kind === 'charm' || e.kind === 'amulet'
        ? [{ id: 'remove', label: t('action.remove'), primary: true }]
        : [];
    case 'unusable':
      return [];
  }
}

/** Before → after for a pilot taking this item into the slot (null takes it off). */
export function previewFor(
  lib: Library,
  pilot: RosterEntry,
  kind: ItemKind,
  id: string | null,
): { before: LoadoutSummary; after: LoadoutSummary } {
  return { before: summarize(lib, pilot), after: summarize(lib, { ...pilot, [kind]: id }) };
}

/** The most telling changes for the card's hint line: the best gain and the worst loss. */
export function headlineDelta(before: LoadoutSummary, after: LoadoutSummary): string | null {
  const rows: [string, number][] = [
    [t('stat.dmg'), after.damage - before.damage],
    [t('stat.hit'), after.accuracy - before.accuracy],
    [t('stat.block'), after.block - before.block],
    [t('stat.hp'), after.hp - before.hp],
    [t('stat.mov'), after.move - before.move],
  ];
  const gain = rows.reduce((a, b) => (b[1] > a[1] ? b : a));
  const loss = rows.reduce((a, b) => (b[1] < a[1] ? b : a));
  const parts = [
    gain[1] > 0 ? t('armoury.gain', { stat: gain[0], n: gain[1] }) : null,
    loss[1] < 0 ? t('armoury.loss', { stat: loss[0], n: -loss[1] }) : null,
  ].filter(Boolean);
  return parts.length ? parts.join('  ') : null;
}
