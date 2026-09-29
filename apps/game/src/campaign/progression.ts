import type { BattleState } from '@m1565/core';
import type { Library, RosterEntry } from '@m1565/content';

export const XP_PER_LEVEL = 100;
/** Every surviving participant earns this on victory, on top of hits and defeats. */
export const VICTORY_XP = 20;
export const MAX_LEVEL = 30;

type Stats = RosterEntry['stats'];

/**
 * Deterministic growth: a stat with growth g% gains floor(L·g/100) − floor((L−1)·g/100) at level L,
 * so 50% growth means +1 every other level with no dice (replays and saves stay predictable).
 */
export function growthAt(level: number, rate: number): number {
  return Math.floor((level * rate) / 100) - Math.floor(((level - 1) * rate) / 100);
}

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
    stats: { ...c.stats },
    frame: frame && lib.frames.has(frame) ? frame : c.frame,
    weapon: weapon && lib.weapons.has(weapon) ? weapon : c.weapon,
  };
}

export function levelUp(lib: Library, entry: RosterEntry): { entry: RosterEntry; gains: Stats } {
  const c = lib.characters.get(entry.characterId);
  const level = entry.level + 1;
  const gains: Stats = {
    str: c ? growthAt(level, c.growth.str) : 0,
    skl: c ? growthAt(level, c.growth.skl) : 0,
    agi: c ? growthAt(level, c.growth.agi) : 0,
  };
  const stats = {
    str: entry.stats.str + gains.str,
    skl: entry.stats.skl + gains.skl,
    agi: entry.stats.agi + gains.agi,
  };
  return { entry: { ...entry, level, stats }, gains };
}

/** Adds battle XP to the roster, levelling up as needed. Returns the new roster and summary lines. */
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
    const earned = unit.xp + (unit.defeated ? 0 : VICTORY_XP);
    let e: RosterEntry = { ...entry, xp: entry.xp + earned };
    const name = lib.characters.get(entry.characterId)?.name ?? entry.characterId;
    lines.push(`${name} +${earned} XP`);
    while (e.xp >= XP_PER_LEVEL && e.level < MAX_LEVEL) {
      const { entry: up, gains } = levelUp(lib, { ...e, xp: e.xp - XP_PER_LEVEL });
      e = up;
      const parts = (['str', 'skl', 'agi'] as const)
        .filter((k) => gains[k] > 0)
        .map((k) => `${k.toUpperCase()}+${gains[k]}`);
      lines.push(`${name} reached level ${e.level}! ${parts.join(' ') || ''}`.trim());
    }
    return e;
  });
  return { roster: next, lines };
}
