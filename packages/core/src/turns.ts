import type { BattleEvent } from './events';
import { nextInt } from './rng';
import type { BattleState } from './state';
import { requireUnit } from './state';
import { evaluateOutcome } from './victory';

/** Rolls initiative (AGI + d6, ties by id) for every living unit and starts the round. */
export function startRound(state: BattleState, events: BattleEvent[]): void {
  state.round += 1;
  const outcome = evaluateOutcome(state);
  if (outcome !== 'ongoing') {
    finish(state, outcome, events);
    return;
  }
  const rolls = state.units
    .filter((u) => !u.defeated)
    .map((u) => {
      const [d6, rng] = nextInt(state.rng, 1, 6);
      state.rng = rng;
      return { id: u.id, init: u.agi + d6 };
    });
  rolls.sort((a, b) => b.init - a.init || a.id.localeCompare(b.id));
  state.turnOrder = rolls.map((r) => r.id);
  state.turnIndex = -1;
  events.push({ type: 'roundStarted', round: state.round, order: [...state.turnOrder] });
  advanceTurn(state, events);
}

/** Moves to the next living unit in the order, starting a new round when the order runs out. */
export function advanceTurn(state: BattleState, events: BattleEvent[]): void {
  state.turn = null;
  for (let i = state.turnIndex + 1; i < state.turnOrder.length; i++) {
    const unit = requireUnit(state, state.turnOrder[i]!);
    if (unit.defeated) continue;
    state.turnIndex = i;
    unit.ap = Math.min(state.balance.apMax, unit.ap + state.balance.apRegen);
    state.turn = {
      unitId: unit.id,
      moved: false,
      acted: false,
      startPos: { ...unit.pos },
      startFacing: unit.facing,
      startAp: unit.ap,
    };
    events.push({
      type: 'turnStarted',
      unitId: unit.id,
      ap: unit.ap,
      mustRest: unit.fp >= state.balance.fpMax,
    });
    return;
  }
  startRound(state, events);
}

/** Ends the active unit's turn: fatigue recovers (more if it neither moved nor acted). */
export function endTurn(state: BattleState, events: BattleEvent[]): void {
  const turn = state.turn;
  if (!turn) return;
  const unit = requireUnit(state, turn.unitId);
  const rested = !turn.moved && !turn.acted;
  if (!unit.defeated) {
    const recovery = rested ? state.balance.fpRestRecovery : state.balance.fpRecovery;
    unit.fp = Math.max(0, unit.fp - recovery);
  }
  events.push({ type: 'turnEnded', unitId: unit.id, rested });
  advanceTurn(state, events);
}

export function finish(
  state: BattleState,
  outcome: Exclude<BattleState['outcome'], 'ongoing'>,
  events: BattleEvent[],
): void {
  state.outcome = outcome;
  state.turn = null;
  events.push({ type: 'battleEnded', outcome });
}
