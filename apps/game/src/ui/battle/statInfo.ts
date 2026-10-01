import type { StatName } from '@m1565/core';

/** Labels and one-line explanations for the six pilot attributes (the classic framework). */
export const STAT_INFO: ReadonlyArray<{ key: StatName; label: string; help: string }> = [
  { key: 'bas', label: 'BAS', help: 'Base: +4 max HP per point' },
  { key: 'pow', label: 'POW', help: 'Power: damage of every attack' },
  { key: 'dex', label: 'DEX', help: 'Dexterity: accuracy' },
  { key: 'agl', label: 'AGL', help: 'Agility: evasion and turn order' },
  { key: 'def', label: 'DEF', help: 'Defence: blocks 1.5 damage per point' },
  { key: 'wep', label: 'WEP', help: 'Weapon skill: weapon damage' },
];

/** "WEP+4 · DEX+1" for a gear bonus (negative values shown with a minus). */
export function bonusText(bonus: Partial<Record<StatName, number>>): string {
  return STAT_INFO.filter((s) => bonus[s.key])
    .map((s) => `${s.label}${bonus[s.key]! > 0 ? '+' : ''}${bonus[s.key]}`)
    .join(' · ');
}
