import type { BattleState, BonusGoal, Outcome } from './state';
import { findUnit } from './state';

export function evaluateOutcome(state: BattleState): Outcome {
  const alive = (side: 'player' | 'enemy') =>
    state.units.some((u) => u.side === side && !u.defeated);
  const won = state.victory.some((v) => {
    switch (v.type) {
      case 'rout':
        return !alive('enemy');
      case 'defeatLeader':
        return findUnit(state, v.unitId)?.defeated ?? false;
      case 'survive':
        return state.round > v.rounds;
      case 'escape': {
        const u = findUnit(state, v.unitId);
        return !!u && !u.defeated && v.tiles.some((t) => t.x === u.pos.x && t.y === u.pos.y);
      }
    }
  });
  if (won) return 'victory';
  const lost =
    !alive('player') || state.defeat.some((d) => findUnit(state, d.unitId)?.defeated ?? false);
  return lost ? 'defeat' : 'ongoing';
}

/** Whether each optional goal was met, judged on the battle as it stands (call once it is won). */
export function bonusResults(state: BattleState): { goal: BonusGoal; met: boolean }[] {
  return (state.bonus ?? []).map((goal) => {
    switch (goal.type) {
      case 'rounds':
        return { goal, met: state.round <= goal.max };
      case 'noLosses':
        return { goal, met: !state.units.some((u) => u.side === 'player' && u.defeated) };
      case 'keepAlive':
        return { goal, met: !(findUnit(state, goal.unitId)?.defeated ?? true) };
    }
  });
}
