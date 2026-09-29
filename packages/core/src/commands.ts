import type { Reaction } from './combat';
import {
  availableReactions,
  canAct,
  damageFor,
  facingToward,
  hitChanceFor,
  inRange,
  strikeNumbers,
} from './combat';
import type { BattleEvent, StrikeResult } from './events';
import type { Coord, Facing } from './grid';
import { coordKey, reachableTiles } from './pathfinding';
import { rollPercent } from './rng';
import type { BattleState } from './state';
import { requireUnit } from './state';
import { endTurn, finish } from './turns';
import type { UnitState } from './units';
import { isHostile } from './units';
import { evaluateOutcome } from './victory';

export type Command =
  | { readonly type: 'move'; readonly unitId: string; readonly to: Coord }
  | { readonly type: 'undoMove'; readonly unitId: string }
  | {
      readonly type: 'attack';
      readonly unitId: string;
      readonly targetId: string;
      /** Chosen by the defender's controller (the player's UI or the AI) before resolving. */
      readonly reaction: Reaction;
    }
  | { readonly type: 'endTurn'; readonly unitId: string; readonly facing?: Facing };

export class CommandError extends Error {
  override readonly name = 'CommandError';
}

/**
 * The single entry point for changing a battle. Pure: returns a new state plus the events that
 * describe what happened, and throws CommandError for anything illegal.
 */
export function applyCommand(
  prev: BattleState,
  cmd: Command,
): { state: BattleState; events: BattleEvent[] } {
  if (prev.outcome !== 'ongoing') throw new CommandError('The battle is over');
  if (prev.turn?.unitId !== cmd.unitId) throw new CommandError(`It is not ${cmd.unitId}'s turn`);
  // State is plain JSON by design (saves), so a JSON round-trip is a safe deep copy.
  const state = JSON.parse(JSON.stringify(prev)) as BattleState;
  const events: BattleEvent[] = [];
  const unit = requireUnit(state, cmd.unitId);
  const turn = state.turn!;

  switch (cmd.type) {
    case 'move': {
      if (turn.moved || turn.acted) throw new CommandError('Already moved or acted this turn');
      if (!canAct(state, unit)) throw new CommandError('Too fatigued to move');
      const reach = reachableTiles(state, unit).get(coordKey(cmd.to));
      if (!reach || reach.path.length === 0) throw new CommandError('Destination not reachable');
      const last = reach.path[reach.path.length - 1]!;
      const before = reach.path[reach.path.length - 2] ?? unit.pos;
      unit.ap -= reach.cost;
      unit.facing = facingToward(before, last, unit.facing);
      unit.pos = { ...cmd.to };
      turn.moved = true;
      events.push({ type: 'unitMoved', unitId: unit.id, path: reach.path, apCost: reach.cost });
      break;
    }
    case 'undoMove': {
      if (!turn.moved || turn.acted) throw new CommandError('Nothing to undo');
      unit.pos = { ...turn.startPos };
      unit.facing = turn.startFacing;
      unit.ap = turn.startAp;
      turn.moved = false;
      events.push({ type: 'moveUndone', unitId: unit.id, to: unit.pos });
      break;
    }
    case 'attack': {
      if (turn.acted) throw new CommandError('Already acted this turn');
      if (!canAct(state, unit)) throw new CommandError('Too fatigued to attack');
      const target = requireUnit(state, cmd.targetId);
      if (target.defeated || !isHostile(unit, target)) throw new CommandError('Invalid target');
      if (!inRange(unit.weapon, unit.pos, target.pos))
        throw new CommandError('Target out of range');
      if (unit.ap < unit.weapon.apCost) throw new CommandError('Not enough AP');
      if (!availableReactions(state, target, unit).includes(cmd.reaction)) {
        throw new CommandError(`Reaction "${cmd.reaction}" is not available`);
      }
      resolveAttack(state, unit, target, cmd.reaction, events);
      turn.acted = true;
      break;
    }
    case 'endTurn': {
      if (cmd.facing) {
        unit.facing = cmd.facing;
        events.push({ type: 'unitFaced', unitId: unit.id, facing: cmd.facing });
      }
      endTurn(state, events);
      return { state, events };
    }
  }

  const outcome = evaluateOutcome(state);
  if (outcome !== 'ongoing') finish(state, outcome, events);
  else if (unit.defeated) endTurn(state, events);
  return { state, events };
}

function resolveAttack(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  reaction: Reaction,
  events: BattleEvent[],
): void {
  const b = state.balance;
  attacker.ap -= attacker.weapon.apCost;
  attacker.fp = Math.min(b.fpMax, attacker.fp + attacker.weapon.fpCost);
  if (reaction === 'avoid') {
    target.ap -= b.avoidApCost;
    target.fp = Math.min(b.fpMax, target.fp + b.avoidFpCost);
  } else if (reaction === 'counter') {
    target.ap -= target.weapon.apCost;
    target.fp = Math.min(b.fpMax, target.fp + target.weapon.fpCost);
  }
  attacker.facing = facingToward(attacker.pos, target.pos, attacker.facing);

  const strike = strikeOnce(state, attacker, target, reaction, events);
  let counter: StrikeResult | undefined;
  if (reaction === 'counter' && !target.defeated) {
    counter = strikeOnce(state, target, attacker, 'none', events);
  }
  if (!target.defeated) target.facing = facingToward(target.pos, attacker.pos, target.facing);
  events.push(
    counter
      ? { type: 'attackResolved', reaction, strike, counter }
      : { type: 'attackResolved', reaction, strike },
  );
}

function strikeOnce(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  reaction: Reaction | 'none',
  events: BattleEvent[],
): StrikeResult {
  const n = strikeNumbers(state, attacker, target);
  const hitChance = hitChanceFor(state, n, reaction);
  const [hit, rng] = rollPercent(state.rng, hitChance);
  state.rng = rng;
  const damage = hit ? damageFor(state, n, target, reaction) : 0;
  target.hp = Math.max(0, target.hp - damage);
  if (hit) attacker.xp += state.balance.xpHit;
  const defeated = target.hp === 0;
  if (defeated) {
    target.defeated = true;
    attacker.xp += state.balance.xpDefeat;
    events.push({ type: 'unitDefeated', unitId: target.id });
  }
  return {
    attackerId: attacker.id,
    targetId: target.id,
    hitChance,
    hit,
    damage,
    zone: n.zone,
    targetHp: target.hp,
    defeated,
  };
}
