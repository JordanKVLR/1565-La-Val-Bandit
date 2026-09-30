import type { StatName } from '@m1565/core';

/** Labels and one-line explanations for the seven pilot attributes. */
export const STAT_INFO: ReadonlyArray<{ key: StatName; label: string; help: string }> = [
  { key: 'str', label: 'STR', help: 'Damage with every attack' },
  { key: 'skl', label: 'SKL', help: 'Accuracy' },
  { key: 'agi', label: 'AGI', help: 'Evasion and turn order' },
  { key: 'def', label: 'DEF', help: 'Blocks 1.5 damage per point' },
  { key: 'int', label: 'INT', help: 'Counter odds, technique accuracy' },
  { key: 'spi', label: 'SPI', help: 'Less fatigue, faster recovery' },
  { key: 'vit', label: 'VIT', help: '+5% max HP per point' },
];
