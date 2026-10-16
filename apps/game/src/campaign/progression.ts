import type { BattleState, BonusGoal, StatName } from '@m1565/core';
import { xpToNextLevel } from '@m1565/core';
import type { CharacterProgress, Library, RosterEntry } from '@m1565/content';

/**
 * One line of the victory summary, as data: the results screen words it in the player's
 * language (ui/results.ts).
 */
export type ResultLine =
  | { readonly kind: 'scudi'; readonly amount: number }
  | { readonly kind: 'salvage'; readonly frame: string }
  | { readonly kind: 'parts'; readonly amount: number }
  | {
      readonly kind: 'goal';
      /** The optional goal, as the battle set it. */
      readonly goal: BonusGoal;
      readonly met: boolean;
      /** Name of the unit a keep-alive goal is about. */
      readonly unitName: string;
    }
  | {
      readonly kind: 'pilot';
      readonly name: string;
      /** Levels gained in the battle (0 for none). */
      readonly levels: number;
      readonly level: number;
      readonly xp: number;
      readonly xpPerLevel: number;
    };

export function newRosterEntry(
  lib: Library,
  characterId: string,
  frame?: string,
  weapon?: string,
): RosterEntry {
  const c = lib.characters.get(characterId);
  if (!c) throw new Error(`Unknown character "${characterId}"`);
  return {
    characterId,
    level: 1,
    xp: 0,
    statPoints: 0,
    stats: { ...c.stats },
    frame: frame && lib.frames.has(frame) ? frame : c.frame,
    weapon: weapon && lib.weapons.has(weapon) ? weapon : c.weapon,
    charm: null,
    amulet: null,
  };
}

/**
 * Carries each pilot's battle progress (level, XP, stats, unspent points) back into the roster.
 * Levelling itself happens during battle; this only records the result.
 */
export function applyBattleResults(
  lib: Library,
  roster: readonly RosterEntry[],
  state: BattleState,
  veterans: Readonly<Record<string, CharacterProgress>> = {},
): { roster: RosterEntry[]; veterans: Record<string, CharacterProgress>; lines: ResultLine[] } {
  const lines: ResultLine[] = [];
  // Named allies outside the company keep their progress for later.
  const nextVeterans: Record<string, CharacterProgress> = { ...veterans };
  for (const unit of state.units) {
    if (unit.side !== 'player' || !unit.characterId) continue;
    if (roster.some((r) => r.characterId === unit.characterId)) continue;
    nextVeterans[unit.characterId] = {
      level: unit.level,
      xp: unit.xp,
      stats: { ...unit.pilot },
      statPoints: unit.statPoints,
    };
  }
  const next = roster.map((entry) => {
    const unit = state.units.find(
      (u) => u.side === 'player' && u.characterId === entry.characterId,
    );
    if (!unit) return entry;
    const name = lib.characters.get(entry.characterId)?.name ?? entry.characterId;
    lines.push({
      kind: 'pilot',
      name,
      levels: Math.max(0, unit.level - entry.level),
      level: unit.level,
      xp: unit.xp,
      xpPerLevel: xpToNextLevel(unit.level, state.balance),
    });
    return {
      ...entry,
      level: unit.level,
      xp: unit.xp,
      statPoints: unit.statPoints,
      stats: { ...unit.pilot },
    };
  });
  return { roster: next, veterans: nextVeterans, lines };
}

/** A character joining the company brings the progress they made fighting alongside it. */
export function withProgress(entry: RosterEntry, progress?: CharacterProgress): RosterEntry {
  return progress && progress.level >= entry.level
    ? {
        ...entry,
        level: progress.level,
        xp: progress.xp,
        stats: { ...progress.stats },
        statPoints: progress.statPoints ?? 0,
      }
    : entry;
}

/** Why a pilot can't take this class, or undefined if they can. */
export function promotionBlocked(
  lib: Library,
  entry: RosterEntry,
  classId: string,
): 'level' | 'chosen' | 'unknown' | undefined {
  if (!lib.classes.has(classId)) return 'unknown';
  if (entry.class) return 'chosen';
  return entry.level >= lib.balance.promotionLevel ? undefined : 'level';
}

/**
 * Promotes a pilot: the class's stat package is added (capped at the stat maximum) and its skill
 * joins theirs in battle. Done once; the choice is for good.
 */
export function promote(
  lib: Library,
  roster: readonly RosterEntry[],
  characterId: string,
  classId: string,
): RosterEntry[] {
  const entry = roster.find((r) => r.characterId === characterId);
  if (!entry) throw new Error(`Unknown pilot "${characterId}"`);
  const blocked = promotionBlocked(lib, entry, classId);
  if (blocked) throw new Error(`Can't promote ${characterId}: ${blocked}`);
  const bonus = lib.classes.get(classId)!.bonus as Partial<Record<StatName, number>>;
  const max = lib.balance.statMax;
  const stats = { ...entry.stats };
  for (const k of Object.keys(bonus) as StatName[])
    stats[k] = Math.min(max, stats[k] + (bonus[k] ?? 0));
  return roster.map((r) => (r.characterId === characterId ? { ...r, stats, class: classId } : r));
}

/** Spends one of a pilot's unspent points outside battle (results and preparation screens). */
export function raiseRosterStat(
  roster: readonly RosterEntry[],
  characterId: string,
  stat: StatName,
  max = 32,
): RosterEntry[] {
  return roster.map((r) =>
    r.characterId === characterId && (r.statPoints ?? 0) > 0 && r.stats[stat] < max
      ? {
          ...r,
          statPoints: (r.statPoints ?? 0) - 1,
          stats: { ...r.stats, [stat]: r.stats[stat] + 1 },
        }
      : r,
  );
}

/**
 * The unlock levels of skills (skills.json) that pilots learned between two snapshots of the
 * company, e.g. before and after a battle. Level-1 skills come with the pilot and don't count.
 */
export function skillsLearned(
  lib: Library,
  before: readonly { readonly characterId: string; readonly level: number }[],
  after: readonly { readonly characterId: string; readonly level: number }[],
): number[] {
  const levels: number[] = [];
  for (const now of after) {
    const was = before.find((b) => b.characterId === now.characterId);
    if (!was) continue;
    for (const s of lib.skillSets.get(now.characterId) ?? []) {
      if (s.level > 1 && was.level < s.level && now.level >= s.level) levels.push(s.level);
    }
  }
  return levels;
}
