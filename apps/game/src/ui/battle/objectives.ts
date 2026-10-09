import type { BattleState } from '@m1565/core';
import { findUnit } from '@m1565/core';
import { t } from '../../i18n';

/** Plain-language win and loss conditions for the battle HUD. */
export function describeObjectives(state: BattleState): { win: string; lose: string } {
  const name = (id: string) => findUnit(state, id)?.name ?? id;
  const win = state.victory
    .map((v) => {
      switch (v.type) {
        case 'rout':
          return t('objective.rout');
        case 'defeatLeader':
          return t('objective.defeatLeader', { name: name(v.unitId) });
        case 'survive':
          return t('objective.survive', { n: v.rounds });
        case 'escape':
          return t('objective.escape', { name: name(v.unitId) });
      }
    })
    .join(t('objective.or'));
  const lose = [
    t('objective.allFall'),
    ...state.defeat.map((d) => t('objective.unitFalls', { name: name(d.unitId) })),
  ].join(t('objective.or'));
  return { win, lose };
}

/** The tile readout: height, cover and terrain, e.g. "1H 10% Field". */
export function terrainLabel(height: number, terrain: { avoid: number; name: string }): string {
  return t('battle.terrainLabel', { height, avoid: terrain.avoid, terrain: terrain.name });
}
