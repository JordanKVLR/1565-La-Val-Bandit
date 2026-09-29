import type { BattleState } from '@m1565/core';
import { findUnit } from '@m1565/core';

/** Plain-language win and loss conditions for the battle HUD. */
export function describeObjectives(state: BattleState): { win: string; lose: string } {
  const name = (id: string) => findUnit(state, id)?.name ?? id;
  const win = state.victory
    .map((v) => {
      switch (v.type) {
        case 'rout':
          return 'Defeat all enemies';
        case 'defeatLeader':
          return `Defeat ${name(v.unitId)}`;
        case 'survive':
          return `Hold out for ${v.rounds} rounds`;
        case 'escape':
          return `Get ${name(v.unitId)} to the gold tiles`;
      }
    })
    .join(' or ');
  const lose = ['all your units fall', ...state.defeat.map((d) => `${name(d.unitId)} falls`)].join(
    ' or ',
  );
  return { win, lose };
}
