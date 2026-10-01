import type { PilotStats, StatBonus } from '@m1565/core';
import { effectiveStats, maxHpFor } from '@m1565/core';
import type { Library, RosterEntry, ShopItem } from '@m1565/content';
import { ALLEGIANCE_FACTIONS } from '@m1565/content';

/**
 * The player's gear, the classic way: real items, not unlimited designs. An armatura or weapon
 * fitted to one pilot can't be used by another; spares sit in the stores until equipped or
 * sold. Armaturas only come from the story and salvage; the Armoury sells weapons, charms and
 * amulets and buys them back at half price.
 */
export type ItemKind = 'frame' | 'weapon' | 'charm' | 'amulet';
export const ITEM_KINDS: readonly ItemKind[] = ['frame', 'weapon', 'charm', 'amulet'];

/** Spare (unequipped) items, keyed "kind:id", with how many of each the player holds. */
export type Stores = Readonly<Record<string, number>>;

export const itemKey = (kind: ItemKind, id: string) => `${kind}:${id}`;

export function countOf(stores: Stores, kind: ItemKind, id: string): number {
  return stores[itemKey(kind, id)] ?? 0;
}

export function addItem(stores: Stores, kind: ItemKind, id: string, n = 1): Stores {
  const key = itemKey(kind, id);
  const next = (stores[key] ?? 0) + n;
  if (next < 0) throw new Error(`No spare ${kind} "${id}"`);
  const out = { ...stores };
  if (next === 0) delete out[key];
  else out[key] = next;
  return out;
}

/** Spare items of one kind, as [id, count] pairs, in a stable order. */
export function spares(stores: Stores, kind: ItemKind): [string, number][] {
  return Object.entries(stores)
    .filter(([k, n]) => k.startsWith(`${kind}:`) && n > 0)
    .map(([k, n]): [string, number] => [k.slice(kind.length + 1), n])
    .sort(([a], [b]) => a.localeCompare(b));
}

export interface Holdings {
  readonly roster: readonly RosterEntry[];
  readonly stores: Stores;
  readonly scudi: number;
}

const SLOT: Record<ItemKind, 'frame' | 'weapon' | 'charm' | 'amulet'> = {
  frame: 'frame',
  weapon: 'weapon',
  charm: 'charm',
  amulet: 'amulet',
};

/** The item currently in a pilot's slot, or null for an empty charm/amulet slot. */
export function equipped(entry: RosterEntry, kind: ItemKind): string | null {
  return (entry[SLOT[kind]] as string | null | undefined) ?? null;
}

/** Whether this pilot may use the item (armaturas must belong to their side's factions). */
export function canUse(lib: Library, entry: RosterEntry, kind: ItemKind, id: string): boolean {
  if (kind !== 'frame') return true;
  const allegiance = lib.characters.get(entry.characterId)?.allegiance ?? 'malta';
  const faction = lib.frameFactions.get(id);
  return !!faction && (ALLEGIANCE_FACTIONS[allegiance] as readonly string[]).includes(faction);
}

/**
 * Fits a spare item to a pilot; whatever was in that slot goes back to the stores. Armatura and
 * weapon slots can't be left empty; charm and amulet slots can (pass null to take one off).
 */
export function equip(
  lib: Library,
  h: Holdings,
  characterId: string,
  kind: ItemKind,
  id: string | null,
): Holdings {
  const entry = h.roster.find((r) => r.characterId === characterId);
  if (!entry) throw new Error(`Unknown pilot "${characterId}"`);
  if (id === null && (kind === 'frame' || kind === 'weapon'))
    throw new Error(`A pilot always needs an ${kind === 'frame' ? 'armatura' : 'weapon'}`);
  if (id !== null && !canUse(lib, entry, kind, id))
    throw new Error(`${characterId} can't use ${id}`);
  const current = equipped(entry, kind);
  if (current === id) return h;
  let stores = h.stores;
  if (id !== null) stores = addItem(stores, kind, id, -1);
  if (current !== null) stores = addItem(stores, kind, current, 1);
  const roster = h.roster.map((r) =>
    r.characterId === characterId ? { ...r, [SLOT[kind]]: id } : r,
  );
  return { ...h, roster, stores };
}

/** Price of an item in the Armoury (armaturas have none: they are never sold or bought). */
export function priceOf(lib: Library, kind: ItemKind, id: string): number | null {
  if (kind === 'weapon') return lib.weapons.get(id)?.price ?? null;
  if (kind === 'charm' || kind === 'amulet') return lib.gear.get(id)?.price ?? null;
  return null;
}

export function buy(lib: Library, h: Holdings, item: ShopItem): Holdings {
  const price = priceOf(lib, item.kind, item.item);
  if (price === null) throw new Error(`${item.item} isn't for sale`);
  if (h.scudi < price) throw new Error('Not enough scudi');
  return { ...h, scudi: h.scudi - price, stores: addItem(h.stores, item.kind, item.item) };
}

/** Sells a spare item back for half its price. Only spares can be sold, never fitted gear. */
export function sell(lib: Library, h: Holdings, kind: ItemKind, id: string): Holdings {
  const price = priceOf(lib, kind, id);
  if (price === null) throw new Error(`${id} can't be sold`);
  return {
    ...h,
    scudi: h.scudi + Math.floor(price / 2),
    stores: addItem(h.stores, kind, id, -1),
  };
}

/** What the Armoury has on the shelves for this side, given the battles won so far. */
export function armouryStock(
  lib: Library,
  completedBattles: readonly string[],
  allegiance: 'malta' | 'ottoman',
): ShopItem[] {
  return lib.shop.filter(
    (s) => s.allegiance === allegiance && (s.after === null || completedBattles.includes(s.after)),
  );
}

export interface LoadoutSummary {
  readonly stats: PilotStats;
  readonly hp: number;
  readonly armour: number;
  readonly move: number;
  /** Raw damage before the technique's power: (POW + WEP) × damagePerPoint, rounded. */
  readonly damage: number;
  /** Hit-chance bonus from DEX. */
  readonly accuracy: number;
  /** Damage blocked per hit: armour + DEF × defDamagePerPoint. */
  readonly block: number;
}

/** A pilot's fighting numbers with a given loadout (for before → after comparisons). */
export function summarize(lib: Library, entry: RosterEntry): LoadoutSummary {
  const b = lib.balance;
  const frame = lib.frames.get(entry.frame);
  const weapon = lib.weapons.get(entry.weapon);
  const gear = (id: string | null | undefined): StatBonus | undefined =>
    id ? lib.gear.get(id)?.bonus : undefined;
  const stats = effectiveStats(
    entry.stats,
    [frame?.bonus, weapon?.bonus, gear(entry.charm), gear(entry.amulet)],
    b.statMax,
  );
  const armour = frame?.armour ?? 0;
  return {
    stats,
    hp: maxHpFor(entry.level, stats.bas, frame?.hp ?? 0, b),
    armour,
    move: frame?.move ?? 0,
    damage: Math.round((stats.pow + stats.wep) * b.damagePerPoint),
    accuracy: stats.dex * b.dexHitFactor,
    block: Math.round(armour + stats.def * b.defDamagePerPoint),
  };
}
