import type { Reaction } from './combat';
import { availableReactions, canAct, facingToward, forecastAttack, inRange } from './combat';
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
): Reaction {
  const defender = requireUnit(state, defenderId);
  const attacker = requireUnit(state, attackerId);
  const f = forecastAttack(state, attacker, defender);
  let best: Reaction = 'defend';
  let bestScore = Infinity;
  for (const r of availableReactions(state, defender, attacker)) {
    const p = f.hitChance[r] / 100;
    const dmg = f.damage[r];
    let score = p * dmg + (dmg >= defender.hp ? p * 100 : 0);
    if (r === 'counter' && f.counter && dmg < defender.hp) {
      score -= (f.counter.hitChance / 100) * f.counter.damage * 0.8;
    }
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
    if (unit.ap - r.cost < unit.weapon.apCost) continue;
    for (const target of enemies) {
      if (!inRange(unit.weapon, dest, target.pos)) continue;
      const score = scoreAttack(state, unit, profile, target, dest, r.cost, enemies);
      if (score > best.score)
        best = { to: r.path.length ? dest : null, targetId: target.id, score };
    }
  }

  if (best.targetId === null && profile === 'aggressive') {
    // Close in, keeping enough AP back to avoid a blow if possible.
    const budget = Math.max(0, unit.ap - state.balance.avoidApCost);
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
    commands.push({ type: 'attack', unitId, targetId: best.targetId, reaction: 'defend' });
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
): number {
  const f = forecastAttack(state, unit, target, dest);
  // Assume the defender avoids when it can: the least favourable common case for us.
  const r: Reaction = f.reactions.includes('avoid') ? 'avoid' : 'defend';
  const p = f.hitChance[r] / 100;
  const dmg = f.damage[r];
  let score = p * dmg;
  if (dmg >= target.hp) score += p * 40;
  if (f.counter) score -= (f.counter.hitChance / 100) * f.counter.damage * 0.7;
  const threats = enemies.filter(
    (e) => e.id !== target.id && manhattan(e.pos, dest) <= e.mov + e.weapon.maxRange,
  ).length;
  score -= threats * (profile === 'defensive' ? 6 : 2);
  score -= moveCost * 0.05;
  return score;
}

function nearestDistance(from: Coord, units: readonly UnitState[]): number {
  return Math.min(...units.map((u) => manhattan(from, u.pos)));
}
