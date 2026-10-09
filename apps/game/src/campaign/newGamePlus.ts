import type { Difficulty } from '@m1565/core';
import type { Library } from '@m1565/content';
import type { Holdings, ItemKind, Stores } from './inventory';
import { addItem, canUse, countOf, equip, equipped, ITEM_KINDS } from './inventory';
import type { CampaignSave, CharacterProgress, Loadout } from './types';

/** How a fresh playthrough starts: its difficulty and, for New Game+, what carries over. */
export interface NewGameOptions {
  readonly difficulty: Difficulty;
  /** New Game+ cycle (0 or absent = a first playthrough). */
  readonly ngPlus?: number;
  readonly carry?: CarryOver;
}

/**
 * What New Game+ keeps from a finished playthrough. Story progress (ink state, affinity, routes,
 * battles won, salvage taken) starts over; the company's strength does not.
 */
export interface CarryOver {
  /** Every pilot's level, XP, attributes and unspent points, applied when they join again. */
  readonly veterans: Readonly<Record<string, CharacterProgress>>;
  /** What each pilot had fitted; refitted from the stores when they join again. */
  readonly kit: Readonly<Record<string, Loadout>>;
  /** Spares plus everything the company had fitted (a pilot's own starting kit returns with them). */
  readonly stores: Stores;
  readonly scudi: number;
}

/** New Game+ is offered once a playthrough has reached any ending. */
export function canStartNewGamePlus(save: Pick<CampaignSave, 'ending'> | null): boolean {
  return !!save?.ending;
}

/**
 * Builds a New Game+ start from a finished save: same difficulty, one cycle further, and the
 * company's progress, gear, stores and scudi carried over.
 */
export function newGamePlus(lib: Library, save: CampaignSave): NewGameOptions {
  const veterans: Record<string, CharacterProgress> = { ...save.veterans };
  const kit: Record<string, Loadout> = { ...save.kit };
  let stores = save.stores;
  for (const r of save.roster) {
    veterans[r.characterId] = {
      level: r.level,
      xp: r.xp,
      stats: { ...r.stats },
      statPoints: r.statPoints ?? 0,
    };
    kit[r.characterId] = {
      frame: r.frame,
      weapon: r.weapon,
      charm: r.charm ?? null,
      amulet: r.amulet ?? null,
    };
    // Like a pilot leaving the company: their own starting armatura and weapon go with them
    // (the story hands them over again when they join), everything else waits in the stores.
    const own = lib.characters.get(r.characterId);
    if (r.frame !== own?.frame) stores = addItem(stores, 'frame', r.frame);
    if (r.weapon !== own?.weapon) stores = addItem(stores, 'weapon', r.weapon);
    if (r.charm) stores = addItem(stores, 'charm', r.charm);
    if (r.amulet) stores = addItem(stores, 'amulet', r.amulet);
  }
  return {
    difficulty: save.difficulty,
    ngPlus: save.ngPlus + 1,
    carry: { veterans, kit, stores, scudi: save.scudi },
  };
}

/**
 * Fits a returning pilot with the gear they had last playthrough, slot by slot, wherever that
 * item is still in the stores and they can use it; the kit the story gave them goes to the stores.
 */
export function refitKit(lib: Library, h: Holdings, characterId: string, kit: Loadout): Holdings {
  let out = h;
  for (const kind of ITEM_KINDS) {
    const want = kit[kind as keyof Loadout] ?? null;
    const entry = out.roster.find((r) => r.characterId === characterId);
    if (!entry || !want || equipped(entry, kind) === want) continue;
    if (countOf(out.stores, kind as ItemKind, want) < 1) continue;
    if (!canUse(lib, entry, kind, want)) continue;
    out = equip(lib, out, characterId, kind, want);
  }
  return out;
}
