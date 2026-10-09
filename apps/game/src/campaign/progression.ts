import type { BattleState, StatName } from '@m1565/core';
import type { CharacterProgress, Library, RosterEntry } from '@m1565/content';

/**
 * One line of the victory summary, as data: the results screen words it in the player's
 * language (ui/results.ts).
 */
export type ResultLine =
  | { readonly kind: 'scudi'; readonly amount: number }
  | { readonly kind: 'salvage'; readonly frame: string }
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
      xpPerLevel: state.balance.xpPerLevel,
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
