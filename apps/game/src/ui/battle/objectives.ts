import type { BattleState, BonusGoal } from '@m1565/core';
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

/** The text of one optional goal, e.g. "Win within 8 rounds". */
export function goalText(goal: BonusGoal, nameOf: (id: string) => string): string {
  switch (goal.type) {
    case 'rounds':
      return t('objective.bonus.rounds', { n: goal.max });
    case 'noLosses':
      return t('objective.bonus.noLosses');
    case 'keepAlive':
      return t('objective.bonus.keepAlive', { name: nameOf(goal.unitId) });
  }
}

/** Optional goals for the HUD: each with its reward, e.g. "Win within 8 rounds · +120 scudi, +2 parts". */
export function describeBonus(state: BattleState): string[] {
  const name = (id: string) => findUnit(state, id)?.name ?? id;
  return (state.bonus ?? []).map((g) =>
    t('objective.bonus.line', {
      goal: goalText(g, name),
      scudi: g.scudi,
      parts: g.parts,
    }),
  );
}

/** The tile readout: height, cover and terrain, e.g. "1H 10% Field". */
export function terrainLabel(height: number, terrain: { avoid: number; name: string }): string {
  return t('battle.terrainLabel', { height, avoid: terrain.avoid, terrain: terrain.name });
}
