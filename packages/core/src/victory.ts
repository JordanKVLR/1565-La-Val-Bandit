import type { BattleState, Outcome } from './state';
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
    }
  });
  if (won) return 'victory';
  const lost =
    !alive('player') || state.defeat.some((d) => findUnit(state, d.unitId)?.defeated ?? false);
  return lost ? 'defeat' : 'ongoing';
}
