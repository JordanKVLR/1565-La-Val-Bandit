import type { AttackForecast, BattleState, Reaction, ReactionChoice, UnitState } from '@m1565/core';
import { assistFor, attackFpCost } from '@m1565/core';

/** The defender's strike back, as `forecastAttack` gives it. */
type Retaliation = NonNullable<AttackForecast['retaliation']>;

/** One side of the combat forecast: what it does, its odds and where its meters end up. */
export interface ForecastSide {
  readonly unit: UnitState;
  /** The technique it uses, or the reaction it takes. */
  readonly action: 'technique' | 'reaction';
  /** Name of the technique (for a reaction, the screen words the reaction itself). */
  readonly techniqueName: string | null;
  /** Chance per strike, or null when this side does not strike. */
  readonly hit: number | null;
  /** Damage per strike, or null when this side does not strike. */
  readonly damage: number | null;
  readonly hits: number;
  /** HP if every strike against it lands. */
  readonly hpAfter: number;
  /** AP its action spends and FP it adds. */
  readonly apCost: number;
  readonly fpGain: number;
  /** Ally assist bonus (percent). */
  readonly assist: number;
}

export interface ForecastModel {
  readonly attacker: ForecastSide;
  readonly defender: ForecastSide;
  /** The defender may fall to this attack (every strike landing). */
  readonly defenderMayFall: boolean;
  /** The attacker may fall to the strike back or a reflected blow. */
  readonly attackerMayFall: boolean;
}

/**
 * The numbers the forecast shows, from core's forecast and the reaction in play. Pure, so the
 * panel only draws: HP after every strike lands, costs as meter previews, odds per side.
 */
export function forecastModel({
  state,
  attacker,
  defender,
  forecast: f,
  reaction,
  back,
  choice,
}: {
  state: BattleState;
  attacker: UnitState;
  defender: UnitState;
  forecast: AttackForecast;
  reaction: Reaction;
  /** The strike back in play (the technique the player picked, or the default). */
  back?: Retaliation | undefined;
  /** The player's reaction option (when the player defends), for its FP cost. */
  choice?: ReactionChoice | undefined;
}): ForecastModel {
  const strikesBack = reaction === 'attackBack' && back ? back : undefined;
  const counters = reaction === 'counter' && f.counter ? f.counter : undefined;
  // Counter's damage is what lands if it fails.
  const toDefender = f.damage[reaction];
  const toAttacker = strikesBack
    ? strikesBack.damage * strikesBack.hits
    : counters
      ? counters.reflect
      : 0;
  const defenderHpAfter = Math.max(0, defender.hp - toDefender * f.hits);
  const attackerHpAfter = Math.max(0, attacker.hp - toAttacker);
  return {
    attacker: {
      unit: attacker,
      action: 'technique',
      techniqueName: f.attack.name,
      hit: f.hitChance[reaction],
      damage: toDefender,
      hits: f.hits,
      hpAfter: attackerHpAfter,
      apCost: f.attack.apCost,
      fpGain: attackFpCost(state, attacker, f.attack),
      assist: assistFor(state, attacker, defender.pos).bonus,
    },
    defender: {
      unit: defender,
      action: strikesBack ? 'technique' : 'reaction',
      techniqueName: strikesBack?.attackName ?? null,
      hit: strikesBack ? strikesBack.hitChance : counters ? counters.chance : null,
      damage: strikesBack ? strikesBack.damage : counters ? counters.reflect : null,
      hits: strikesBack?.hits ?? 1,
      hpAfter: defenderHpAfter,
      apCost: 0,
      fpGain: choice ? (strikesBack ? strikesBack.fpCost : choice.fpCost) : 0,
      assist: assistFor(state, defender, attacker.pos).bonus,
    },
    defenderMayFall: toDefender > 0 && defenderHpAfter === 0,
    attackerMayFall: toAttacker > 0 && attackerHpAfter === 0,
  };
}
