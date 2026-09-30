import type { BattleState, StatName } from '@m1565/core';
import { pilotStats } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';

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
  };
}

/**
 * Carries each pilot's battle progress (level, XP, stats, unspent points) back into the roster.
 * Levelling itself happens during battle, every 100 XP; this only records the result.
 */
export function applyBattleResults(
  lib: Library,
  roster: readonly RosterEntry[],
  state: BattleState,
): { roster: RosterEntry[]; lines: string[] } {
  const lines: string[] = [];
  const next = roster.map((entry) => {
    const unit = state.units.find(
      (u) => u.side === 'player' && u.characterId === entry.characterId,
    );
    if (!unit) return entry;
    const name = lib.characters.get(entry.characterId)?.name ?? entry.characterId;
    const levels = unit.level - entry.level;
    lines.push(
      levels > 0
        ? `${name} rose ${levels} level${levels > 1 ? 's' : ''} to Lv ${unit.level} (${unit.xp}/${state.balance.xpPerLevel} XP)`
        : `${name}: Lv ${unit.level}, ${unit.xp}/${state.balance.xpPerLevel} XP`,
    );
    return {
      ...entry,
      level: unit.level,
      xp: unit.xp,
      statPoints: unit.statPoints,
      stats: pilotStats(unit),
    };
  });
  return { roster: next, lines };
}

/** Spends one of a pilot's unspent points outside battle (results and preparation screens). */
export function raiseRosterStat(
  roster: readonly RosterEntry[],
  characterId: string,
  stat: StatName,
): RosterEntry[] {
  return roster.map((r) =>
    r.characterId === characterId && (r.statPoints ?? 0) > 0
      ? {
          ...r,
          statPoints: (r.statPoints ?? 0) - 1,
          stats: { ...r.stats, [stat]: r.stats[stat] + 1 },
        }
      : r,
  );
}
