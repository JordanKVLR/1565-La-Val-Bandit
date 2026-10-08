import type { Attack } from './attacks';
import { meetsRequirements } from './attacks';
import type { Reaction } from './combat';
import {
  attackBackOptions,
  attackBackWith,
  attackFpCost,
  attackInRange,
  availableReactions,
  canAct,
  counterChance,
  damageFor,
  facingToward,
  hitChanceFor,
  reactionFpCost,
  reflectDamage,
  strikeNumbers,
  xpFor,
} from './combat';
import type { BattleEvent, StatName, StrikeResult } from './events';
import type { Coord, Facing } from './grid';
import { coordKey, reachableTiles } from './pathfinding';
import { rollPercent } from './rng';
import { skillsUnlockedAt } from './skills';
import type { BattleState } from './state';
import { requireUnit } from './state';
import { endTurn, finish } from './turns';
import type { UnitState } from './units';
import { isHostile, maxHpFor, STAT_NAMES, unitStats } from './units';
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
      /** Which of the unit's attacks to use; the basic weapon attack when omitted. */
      readonly attackId?: string;
      /** With Attack back: the defender's technique for the strike back (its default if omitted). */
      readonly backAttackId?: string;
    }
  | { readonly type: 'endTurn'; readonly unitId: string; readonly facing?: Facing }
  /** Spend one unspent stat point. Allowed at any time, even outside the unit's turn. */
  | { readonly type: 'raiseStat'; readonly unitId: string; readonly stat: StatName };

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
  if (cmd.type === 'raiseStat') return raiseStat(prev, cmd.unitId, cmd.stat);
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
      const attack = unit.attacks.find((a) => a.id === (cmd.attackId ?? 'basic'));
      if (!attack) throw new CommandError(`Unknown attack "${cmd.attackId}"`);
      if (!meetsRequirements(unitStats(unit), attack))
        throw new CommandError(`${attack.name} is not unlocked yet`);
      if (!attackInRange(attack, unit.weapon, unit.pos, target.pos))
        throw new CommandError('Target out of range');
      if (unit.ap < attack.apCost) throw new CommandError('Not enough AP');
      if (!availableReactions(state, target, unit, unit.pos, attack).includes(cmd.reaction)) {
        throw new CommandError(`Reaction "${cmd.reaction}" is not available`);
      }
      if (cmd.reaction === 'attackBack' && cmd.backAttackId !== undefined) {
        const option = attackBackOptions(state, target, unit.pos).find(
          (o) => o.attack.id === cmd.backAttackId,
        );
        if (!option?.available)
          throw new CommandError(
            `Can't strike back with "${cmd.backAttackId}"${option?.reason ? `: ${option.reason}` : ''}`,
          );
      }
      resolveAttack(state, unit, target, attack, cmd.reaction, events, cmd.backAttackId);
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

function raiseStat(
  prev: BattleState,
  unitId: string,
  stat: StatName,
): { state: BattleState; events: BattleEvent[] } {
  const state = JSON.parse(JSON.stringify(prev)) as BattleState;
  const unit = requireUnit(state, unitId);
  if (unit.statPoints <= 0) throw new CommandError(`${unit.name} has no stat points to spend`);
  if (unit.pilot[stat] >= state.balance.statMax)
    throw new CommandError(`${stat.toUpperCase()} is already at its maximum`);
  raisePilot(state, unit, stat);
  unit.statPoints -= 1;
  return { state, events: [{ type: 'statRaised', unitId, stat, value: unit[stat] }] };
}

/** Adds one point to a pilot attribute (and the geared value), refreshing HP for BAS. */
function raisePilot(state: BattleState, unit: UnitState, stat: StatName): void {
  unit.pilot = { ...unit.pilot, [stat]: unit.pilot[stat] + 1 };
  // Recomputed from pilot + gear: a gear penalty may have clamped the old value at 0.
  unit[stat] = Math.max(0, Math.min(state.balance.statMax, unit.pilot[stat] + unit.gear[stat]));
  if (stat === 'bas') refreshMaxHp(state, unit);
}

/** Recomputes max HP after a level or BAS change; current HP rises by the same amount. */
function refreshMaxHp(state: BattleState, unit: UnitState): void {
  const next = maxHpFor(unit.level, unit.bas, unit.frameHp, state.balance);
  if (!unit.defeated) unit.hp += next - unit.maxHp;
  unit.maxHp = next;
}

/** Adds XP and levels the unit up every `xpPerLevel`. Only the player's side earns XP. */
function gainXp(
  state: BattleState,
  unit: UnitState,
  amount: number,
  events: BattleEvent[],
): number {
  if (unit.side !== 'player' || amount <= 0) return 0;
  const b = state.balance;
  unit.xp += amount;
  while (unit.xp >= b.xpPerLevel) {
    unit.xp -= b.xpPerLevel;
    unit.level += 1;
    refreshMaxHp(state, unit);
    unit.statPoints += b.statPointsPerLevel;
    // Skills reached at this level switch on at once; MOV is baked into the unit, so add it here.
    const unlocked = skillsUnlockedAt(unit, unit.level);
    for (const s of unlocked) if (s.effect.type === 'moveBonus') unit.mov += s.effect.tiles;
    // Allies the player doesn't control spend their points at once, evening out their stats.
    if (unit.controller === 'ai') {
      while (unit.statPoints > 0) {
        const open = STAT_NAMES.filter((k) => unit.pilot[k] < b.statMax);
        if (!open.length) break;
        const stat = open.reduce((lo, k) => (unit.pilot[k] < unit.pilot[lo] ? k : lo));
        raisePilot(state, unit, stat);
        unit.statPoints -= 1;
      }
    }
    events.push({
      type: 'levelUp',
      unitId: unit.id,
      level: unit.level,
      statPoints: unit.statPoints,
      ...(unlocked.length ? { newSkills: unlocked.map((s) => s.id) } : {}),
    });
  }
  return amount;
}

function resolveAttack(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  attack: Attack,
  reaction: Reaction,
  events: BattleEvent[],
  backAttackId?: string,
): void {
  const b = state.balance;
  attacker.ap -= attack.apCost;
  attacker.fp = Math.min(b.fpMax, attacker.fp + attackFpCost(state, attacker, attack));
  // Reactions cost the defender FP only, never AP.
  // Chosen before paying, so the FP check sees the defender's fatigue as it was.
  const backAttack = attackBackWith(state, target, attacker.pos, backAttackId);
  target.fp = Math.min(
    b.fpMax,
    target.fp + reactionFpCost(state, target, reaction, attacker.pos, backAttack.id),
  );
  attacker.facing = facingToward(attacker.pos, target.pos, attacker.facing);

  const pending: BattleEvent[] = [];
  const strikes: StrikeResult[] = [];
  let retaliation: StrikeResult | undefined;
  const followUps: StrikeResult[] = [];
  let counter: { success: boolean; chance: number } | undefined;

  if (reaction === 'counter') {
    const chance = counterChance(state, target, attacker);
    const [success, rng] = rollPercent(state.rng, chance);
    state.rng = rng;
    counter = { success, chance };
    if (success) {
      // The blow is turned aside and driven back into the attacker at 1.25×.
      const n = strikeNumbers(state, attacker, target, attacker.pos, attack);
      const incoming = damageFor(state, n, target, 'none') * (attack.hits ?? 1);
      strikes.push({
        attackerId: attacker.id,
        targetId: target.id,
        hitChance: 100 - chance,
        hit: false,
        damage: 0,
        zone: n.zone,
        targetHp: target.hp,
        defeated: false,
        xp: 0,
      });
      retaliation = applyDamage(
        state,
        target,
        attacker,
        reflectDamage(state, incoming),
        n.zone,
        pending,
      );
    }
  }
  if (!counter?.success) {
    for (let i = 0; i < (attack.hits ?? 1) && !target.defeated; i++) {
      strikes.push(strikeOnce(state, attacker, target, attack, reaction, pending));
    }
    if (reaction === 'attackBack' && !target.defeated && !attacker.defeated) {
      // A strike back is a full technique: every hit and effect applies.
      retaliation = strikeOnce(state, target, attacker, backAttack, 'none', pending);
      for (let i = 1; i < (backAttack.hits ?? 1) && !attacker.defeated; i++) {
        followUps.push(strikeOnce(state, target, attacker, backAttack, 'none', pending));
      }
    }
  }
  if (!target.defeated) target.facing = facingToward(target.pos, attacker.pos, target.facing);
  events.push({
    type: 'attackResolved',
    reaction,
    attackId: attack.id,
    attackName: attack.name,
    style: attack.style,
    strikes,
    ...(retaliation
      ? {
          retaliation,
          retaliationStyle: counter?.success ? attack.style : backAttack.style,
          ...(counter?.success ? {} : { retaliationName: backAttack.name }),
          ...(followUps.length ? { retaliationFollowUps: followUps } : {}),
        }
      : {}),
    ...(counter ? { counter } : {}),
  });
  // Defeats and level-ups are reported after the exchange they came from.
  events.push(...pending);
}

/** Deals a fixed amount of damage (a reflected Counter), with defeat and XP handling. */
function applyDamage(
  state: BattleState,
  from: UnitState,
  to: UnitState,
  damage: number,
  zone: StrikeResult['zone'],
  events: BattleEvent[],
): StrikeResult {
  to.hp = Math.max(0, to.hp - damage);
  const defeated = to.hp === 0;
  if (defeated) {
    to.defeated = true;
    events.push({ type: 'unitDefeated', unitId: to.id });
  }
  const xp = gainXp(state, from, xpFor(state, from, to, damage, zone, defeated), events);
  return {
    attackerId: from.id,
    targetId: to.id,
    hitChance: 100,
    hit: true,
    damage,
    zone,
    targetHp: to.hp,
    defeated,
    xp,
  };
}

function strikeOnce(
  state: BattleState,
  attacker: UnitState,
  target: UnitState,
  attack: Attack,
  reaction: Reaction,
  events: BattleEvent[],
): StrikeResult {
  const b = state.balance;
  const n = strikeNumbers(state, attacker, target, attacker.pos, attack);
  const hitChance = hitChanceFor(state, n, reaction);
  const [hit, rng] = rollPercent(state.rng, hitChance);
  state.rng = rng;
  const damage = hit ? damageFor(state, n, target, reaction) : 0;
  target.hp = Math.max(0, target.hp - damage);
  if (hit && target.hp > 0) {
    if (attack.fatigue) target.fp = Math.min(b.fpMax, target.fp + attack.fatigue);
    if (attack.apDamage) target.ap = Math.max(0, target.ap - attack.apDamage);
  }
  const defeated = target.hp === 0;
  if (defeated) {
    target.defeated = true;
    events.push({ type: 'unitDefeated', unitId: target.id });
  }
  // XP only for landing a blow, scaled by how hard it hit.
  const xp = hit
    ? gainXp(state, attacker, xpFor(state, attacker, target, damage, n.zone, defeated), events)
    : 0;
  return {
    attackerId: attacker.id,
    targetId: target.id,
    hitChance,
    hit,
    damage,
    zone: n.zone,
    targetHp: target.hp,
    defeated,
    xp,
  };
}
