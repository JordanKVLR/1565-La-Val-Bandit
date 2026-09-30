import type { Attack } from './attacks';
import type { Reaction } from './combat';
import {
  attackFpCost,
  availableReactions,
  canAct,
  facingToward,
  forecastAttack,
  reactionFpCost,
  unlockedAttacks,
  usableAttacks,
} from './combat';
import type { Command } from './commands';
import type { Coord } from './grid';
import { manhattan } from './grid';
import { reachableTiles } from './pathfinding';
import type { BattleState } from './state';
import { livingUnits, requireUnit } from './state';
import type { AiProfile, UnitState } from './units';
import { isHostile } from './units';

/** Picks the reaction that minimises expected harm (death risk weighs heavily). */
export function chooseReaction(
  state: BattleState,
  defenderId: string,
  attackerId: string,
  attackId?: string,
): Reaction {
  const defender = requireUnit(state, defenderId);
  const attacker = requireUnit(state, attackerId);
  const attack =
    attacker.attacks.find((a) => a.id === (attackId ?? 'basic')) ?? attacker.attacks[0];
  const f = forecastAttack(state, attacker, defender, attacker.pos, attack);
  const fpLeft = state.balance.fpMax - defender.fp;
  let best: Reaction = 'none';
  let bestScore = Infinity;
  for (const r of availableReactions(state, defender, attacker, attacker.pos, attack)) {
    let score: number;
    if (r === 'counter' && f.counter) {
      // Gamble: with probability `chance` the blow is reflected, otherwise it lands at 1.25×.
      const win = f.counter.chance / 100;
      const dmg = f.damage.counter * f.hits;
      score = (1 - win) * (dmg + (dmg >= defender.hp ? 100 : 0)) - win * f.counter.reflect * 0.8;
    } else {
      const p = f.hitChance[r] / 100;
      const dmg = f.damage[r] * f.hits;
      score = p * dmg + (dmg >= defender.hp ? p * 100 : 0);
      if (r === 'attackBack' && f.retaliation && dmg < defender.hp) {
        score -= (f.retaliation.hitChance / 100) * f.retaliation.damage * 0.8;
      }
    }
    // Fatigue is the price of reacting: spending the last of it leaves the unit defenceless.
    const fp = reactionFpCost(state, defender, r, attacker.pos);
    score += fp * 0.12 + (fp >= fpLeft ? 6 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

interface Plan {
  readonly to: Coord | null;
  readonly targetId: string | null;
  readonly attackId?: string;
  readonly score: number;
}

/**
 * Utility AI: scores every (destination, target) pair by expected damage, kill chance, counter
 * risk and exposure, and falls back to closing distance. Deterministic for a given state.
 */
export function planAiTurn(state: BattleState, unitId: string): Command[] {
  const unit = requireUnit(state, unitId);
  const enemies = livingUnits(state).filter((u) => isHostile(u, unit));
  const commands: Command[] = [];
  if (!canAct(state, unit) || enemies.length === 0) {
    return [{ type: 'endTurn', unitId }];
  }

  const profile = effectiveProfile(state, unit);
  const reach =
    profile === 'hold'
      ? new Map([['here', { cost: 0, path: [] as Coord[] }]])
      : reachableTiles(state, unit);
  let best: Plan = { to: null, targetId: null, score: -Infinity };

  for (const [, r] of reach) {
    const dest = r.path[r.path.length - 1] ?? unit.pos;
    for (const target of enemies) {
      for (const attack of usableAttacks(unit, dest, target.pos, unit.ap - r.cost)) {
        const score = scoreAttack(state, unit, profile, target, dest, r.cost, enemies, attack);
        if (score > best.score) {
          best = {
            to: r.path.length ? dest : null,
            targetId: target.id,
            attackId: attack.id,
            score,
          };
        }
      }
    }
  }

  // Cautious units refuse trades that leave them badly exposed, and wait for the enemy instead.
  if (profile === 'defensive' && best.targetId !== null && best.score < 0) {
    best = { to: null, targetId: null, score: 0 };
  }

  // A unit with its own escape objective heads for the goal first and fights only on the way.
  const goals = state.victory.flatMap((v) =>
    v.type === 'escape' && v.unitId === unit.id && unit.side === 'player' ? v.tiles : [],
  );
  if (goals.length && profile !== 'hold') {
    const toGoal = (c: Coord) => Math.min(...goals.map((g) => manhattan(c, g)));
    let bestDest: Coord | null = null;
    let bestKey = [toGoal(unit.pos), 0];
    for (const [, r] of reach) {
      const dest = r.path[r.path.length - 1];
      if (!dest) continue;
      const key = [toGoal(dest), r.cost];
      if (key[0]! < bestKey[0]! || (key[0] === bestKey[0] && key[1]! < bestKey[1]!)) {
        bestKey = key;
        bestDest = dest;
      }
    }
    if (bestDest) {
      const from = bestDest;
      const apLeft = unit.ap - (reach.get(`${from.x},${from.y}`)?.cost ?? 0);
      let pick: { target: UnitState; attack: Attack } | undefined;
      for (const e of enemies) {
        const attack = usableAttacks(unit, from, e.pos, apLeft)[0];
        if (attack) {
          pick = { target: e, attack };
          break;
        }
      }
      best = pick
        ? { to: from, targetId: pick.target.id, attackId: pick.attack.id, score: 0 }
        : { to: from, targetId: null, score: 0 };
    }
  } else if (best.targetId === null && profile === 'aggressive') {
    // Close in, keeping enough AP back to avoid a blow if possible.
    const budget = unit.ap;
    let bestDist = nearestDistance(unit.pos, enemies);
    for (const [, r] of reach) {
      const dest = r.path[r.path.length - 1];
      if (!dest || r.cost > budget) continue;
      const d = nearestDistance(dest, enemies);
      if (d < bestDist) {
        bestDist = d;
        best = { to: dest, targetId: null, score: 0 };
      }
    }
  }

  if (best.to) commands.push({ type: 'move', unitId, to: best.to });
  if (best.targetId) {
    // The reaction is filled in by whoever controls the defender at resolve time.
    commands.push({
      type: 'attack',
      unitId,
      targetId: best.targetId,
      reaction: 'defend',
      ...(best.attackId ? { attackId: best.attackId } : {}),
    });
  }
  const standAt = best.to ?? unit.pos;
  const nearest = [...enemies].sort(
    (a, b) => manhattan(standAt, a.pos) - manhattan(standAt, b.pos),
  )[0];
  commands.push({
    type: 'endTurn',
    unitId,
    ...(nearest ? { facing: facingToward(standAt, nearest.pos, unit.facing) } : {}),
  });
  return commands;
}

/**
 * Defensive units wait for the enemy while braver allies lead, but take the fight to the enemy
 * once no aggressive ally is left; otherwise two cautious sides would stall forever.
 */
function effectiveProfile(state: BattleState, unit: UnitState): AiProfile {
  if (unit.ai !== 'defensive') return unit.ai;
  const leaders = livingUnits(state).some((u) => u.side === unit.side && u.ai === 'aggressive');
  return leaders ? 'defensive' : 'aggressive';
}

function scoreAttack(
  state: BattleState,
  unit: UnitState,
  profile: AiProfile,
  target: UnitState,
  dest: Coord,
  moveCost: number,
  enemies: readonly UnitState[],
  attack: Attack,
): number {
  const f = forecastAttack(state, unit, target, dest, attack);
  // Assume the defender avoids when it can: the least favourable common case for us.
  const r: Reaction = f.reactions.includes('avoid') ? 'avoid' : (f.reactions[0] ?? 'none');
  const p = f.hitChance[r] / 100;
  const dmg = f.damage[r] * f.hits;
  let score = p * dmg;
  if (dmg >= target.hp) score += p * 40;
  // Side effects are worth a little; spending extra AP (less left to react with) costs a little.
  score += p * ((attack.fatigue ?? 0) * 0.15 + (attack.apDamage ?? 0) * 0.15);
  score -= Math.max(0, attack.apCost - (unit.attacks[0]?.apCost ?? attack.apCost)) * 0.1;
  // Attacking tires the pilot; running out of FP leaves it unable to react.
  const b = state.balance;
  const fpAfter = unit.fp + attackFpCost(state, unit, attack);
  const kills = dmg >= target.hp;
  score -= (fpAfter - unit.fp) * 0.05;
  if (!kills && fpAfter >= b.fpMax) score -= 25;
  else if (!kills && fpAfter + b.defendFpCost >= b.fpMax) score -= 6;
  if (f.retaliation) score -= (f.retaliation.hitChance / 100) * f.retaliation.damage * 0.7;
  if (f.counter) score -= (f.counter.chance / 100) * f.counter.reflect * 0.7;
  const threats = enemies.filter(
    (e) => e.id !== target.id && manhattan(e.pos, dest) <= e.mov + maxReach(e),
  ).length;
  score -= threats * (profile === 'defensive' ? 10 : 2);
  score -= moveCost * 0.05;
  return score;
}

/** Furthest tile the unit could strike with any unlocked attack. */
function maxReach(u: UnitState): number {
  return Math.max(...unlockedAttacks(u).map((a) => a.maxRange ?? u.weapon.maxRange));
}

function nearestDistance(from: Coord, units: readonly UnitState[]): number {
  return Math.min(...units.map((u) => manhattan(from, u.pos)));
}
