import type { PilotStats, StatBonus } from '@m1565/core';
import { effectiveStats, maxHpFor, meetsRequirements, starterAttacks } from '@m1565/core';
import type { Library, RosterEntry, ShopItem } from '@m1565/content';
import { ALLEGIANCE_FACTIONS, attackPool } from '@m1565/content';

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

/**
 * A pilot leaves the company: their charm and amulet, and any armatura or weapon that isn't
 * their own from the start, go back to the stores rather than leaving with them.
 */
export function release(lib: Library, h: Holdings, characterId: string): Holdings {
  const entry = h.roster.find((r) => r.characterId === characterId);
  if (!entry) return h;
  const own = lib.characters.get(characterId);
  let stores = h.stores;
  if (entry.charm) stores = addItem(stores, 'charm', entry.charm);
  if (entry.amulet) stores = addItem(stores, 'amulet', entry.amulet);
  if (entry.frame !== own?.frame) stores = addItem(stores, 'frame', entry.frame);
  if (entry.weapon !== own?.weapon) stores = addItem(stores, 'weapon', entry.weapon);
  return { ...h, stores, roster: h.roster.filter((r) => r.characterId !== characterId) };
}

/**
 * Why `toId` can't take the item `fromId` has in this slot, or undefined if the swap works.
 * Armaturas and weapons trade places (neither slot may be empty), so each pilot must be able to
 * use the other's; charms and amulets simply move, swapping back if `toId` had one fitted.
 */
export function swapBlocked(
  lib: Library,
  h: Holdings,
  toId: string,
  fromId: string,
  kind: ItemKind,
): string | undefined {
  const to = h.roster.find((r) => r.characterId === toId);
  const from = h.roster.find((r) => r.characterId === fromId);
  if (!to || !from || toId === fromId) return 'No one to swap with';
  const item = equipped(from, kind);
  if (!item) return 'Nothing fitted';
  const theirs = lib.characters.get(fromId)?.name ?? fromId;
  if (!canUse(lib, to, kind, item)) return "Can't use this armatura";
  const mine = equipped(to, kind);
  if (mine && !canUse(lib, from, kind, mine)) return `${theirs} can't use yours in exchange`;
  return undefined;
}

/** Swaps the item in one slot between two pilots (see swapBlocked for the rules). */
export function swap(
  lib: Library,
  h: Holdings,
  toId: string,
  fromId: string,
  kind: ItemKind,
): Holdings {
  const reason = swapBlocked(lib, h, toId, fromId, kind);
  if (reason) throw new Error(reason);
  const to = h.roster.find((r) => r.characterId === toId)!;
  const from = h.roster.find((r) => r.characterId === fromId)!;
  const item = equipped(from, kind);
  const mine = equipped(to, kind);
  const roster = h.roster.map((r) =>
    r.characterId === toId
      ? { ...r, [SLOT[kind]]: item }
      : r.characterId === fromId
        ? { ...r, [SLOT[kind]]: mine }
        : r,
  );
  return { ...h, roster };
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

/** Stock for every side in the company, each item listed once. */
export function companyStock(
  lib: Library,
  completedBattles: readonly string[],
  allegiances: readonly ('malta' | 'ottoman')[],
): ShopItem[] {
  const seen = new Set<string>();
  return allegiances
    .flatMap((side) => armouryStock(lib, completedBattles, side))
    .filter((s) => {
      const key = itemKey(s.kind, s.item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export interface LoadoutSummary {
  readonly stats: PilotStats;
  readonly hp: number;
  readonly move: number;
  /** Raw damage before the technique's power: (POW + WEP) × damagePerPoint, rounded. */
  readonly damage: number;
  /** Hit-chance bonus from DEX. */
  readonly accuracy: number;
  /** Damage blocked per hit: DEF × defDamagePerPoint (armaturas have no armour). */
  readonly block: number;
  /** Weapon type and reach, e.g. "firearm 2–4". */
  readonly reach: string;
  /** Techniques this loadout can use now (starters first). */
  readonly techniques: readonly string[];
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
  const range = weapon
    ? weapon.minRange === weapon.maxRange
      ? `${weapon.maxRange}`
      : `${weapon.minRange}–${weapon.maxRange}`
    : '';
  const techniques =
    frame && weapon
      ? [...starterAttacks(weapon), ...attackPool(lib, frame, weapon)]
          .filter((a) => meetsRequirements(stats, a))
          .map((a) => a.name)
      : [];
  return {
    stats,
    hp: maxHpFor(entry.level, stats.bas, frame?.hp ?? 0, b),
    move: frame?.move ?? 0,
    damage: Math.round((stats.pow + stats.wep) * b.damagePerPoint),
    accuracy: stats.dex * b.dexHitFactor,
    block: Math.round(stats.def * b.defDamagePerPoint),
    reach: weapon ? `${weapon.type} ${range}` : '',
    techniques,
  };
}
