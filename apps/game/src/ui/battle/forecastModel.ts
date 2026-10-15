import type {
  AttackForecast,
  BattleState,
  FacingZone,
  HitParts,
  Reaction,
  ReactionChoice,
  UnitState,
} from '@m1565/core';
import { assistFor, attackFpCost } from '@m1565/core';
import { t } from '../../i18n';

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

/** "+10" or "−20": percentage points with a real minus sign, never colour alone. */
const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

/**
 * Every term that moves a hit chance, as chips (only the ones that apply, in the order they are
 * added up). `noDodge` is the bonus a blow gets when its target is not dodging (+15).
 */
export function hitChips(parts: HitParts, zone: FacingZone, noDodge: number): string[] {
  const n = (v: number) => ({ n: signed(v) });
  return [
    parts.technique ? t('overlay.mod.technique', n(parts.technique)) : null,
    parts.stats ? t('overlay.mod.stats', n(parts.stats)) : null,
    zone === 'side' && parts.flank ? t('overlay.mod.side', n(parts.flank)) : null,
    zone === 'rear' && parts.flank ? t('overlay.mod.rear', n(parts.flank)) : null,
    parts.height > 0 ? t('overlay.mod.high', n(parts.height)) : null,
    parts.height < 0 ? t('overlay.mod.low', n(parts.height)) : null,
    parts.assist ? t('overlay.mod.assist', n(parts.assist)) : null,
    parts.terrain ? t('overlay.mod.terrain', n(parts.terrain)) : null,
    parts.tired ? t('overlay.mod.tired', n(parts.tired)) : null,
    parts.skills ? t('overlay.mod.skills', n(parts.skills)) : null,
    parts.bond ? t('overlay.mod.bond', n(parts.bond)) : null,
    noDodge ? t('overlay.mod.noDodge', n(noDodge)) : null,
  ].filter((c): c is string => c !== null);
}
