import type { PlacedUnit } from '../render/BattleView';

/** Temporary unit placement for the M0 demo map; battle setup moves into content data in M1. */
export const DEMO_UNITS: readonly PlacedUnit[] = [
  { label: 'N', color: '#2f5fa8', at: { x: 5, y: 7 } },
  { label: 'K', color: '#3f8a6a', at: { x: 4, y: 8 } },
  { label: 'L', color: '#7a2f3a', at: { x: 6, y: 8 } },
  { label: 'Y', color: '#a8322f', at: { x: 5, y: 4 } },
  { label: 'Y', color: '#a8322f', at: { x: 7, y: 4 } },
  { label: 'S', color: '#b8742a', at: { x: 8, y: 3 } },
];
