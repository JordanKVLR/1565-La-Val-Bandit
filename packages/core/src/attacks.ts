import type { PilotStats, Weapon } from './units';

/** How the duel close-up animates an attack. Purely presentational. */
export type AttackStyle =
  'slash' | 'thrust' | 'overhead' | 'sweep' | 'bash' | 'charge' | 'shot' | 'volley' | 'throw';

/**
 * A technique a pilot can use. Units carry a pool of attacks their frame and weapon allow; each
 * attack becomes usable once the pilot's stats meet `requires` (checked live, so spending stat
 * points mid-battle unlocks attacks immediately).
 */
export interface Attack {
  readonly id: string;
  readonly name: string;
  readonly style: AttackStyle;
  /** Multiplier on (weapon power + STR). */
  readonly power: number;
  /** Added to hit chance, in percentage points. */
  readonly accuracy: number;
  readonly apCost: number;
  readonly fpCost: number;
  /** Overrides the weapon's range when set. */
  readonly minRange?: number;
  readonly maxRange?: number;
  /** Number of separate strikes (each rolls to hit). */
  readonly hits?: number;
  /** Fraction (0–1) of the target's armour ignored. */
  readonly pierce?: number;
  /** Fatigue added to the target on each hit. */
  readonly fatigue?: number;
  /** AP removed from the target on each hit. */
  readonly apDamage?: number;
  /** The target cannot choose Counter against this attack. */
  readonly noCounter?: boolean;
  readonly requires: Partial<PilotStats>;
  readonly description?: string;
}

export const BASIC_ATTACK_ID = 'basic';

type Starter = Omit<Attack, 'requires'>;

/**
 * Every pilot starts with two attacks for their weapon, with no stat requirements. Costs follow
 * the classic tactical-RPG pattern: a quick accurate cut and a solid strike for about 30 AP and
 * only 5 FP each, so fatigue comes mostly from reacting, not from attacking.
 * The first entry (id `basic`) is the weapon's main attack.
 */
function starters(weapon: Weapon): Starter[] {
  const melee = { minRange: 1, maxRange: 1 };
  switch (weapon.type) {
    case 'blade':
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Slash',
          style: 'slash',
          power: 0.8,
          accuracy: 20,
          apCost: 30,
          fpCost: 5,
          ...melee,
        },
        {
          id: 'thrust',
          name: 'Thrust',
          style: 'thrust',
          power: 1,
          accuracy: 0,
          apCost: 30,
          fpCost: 5,
          ...melee,
        },
      ];
    case 'polearm':
      // Polearms can't slash; Long Thrust uses their reach instead.
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Thrust',
          style: 'thrust',
          power: 1,
          accuracy: 0,
          apCost: 30,
          fpCost: 5,
          ...melee,
        },
        {
          id: 'long-thrust',
          name: 'Long Thrust',
          style: 'thrust',
          power: 1,
          accuracy: -20,
          apCost: 35,
          fpCost: 5,
          minRange: 1,
          maxRange: 2,
        },
      ];
    case 'blunt':
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Bash',
          style: 'bash',
          power: 0.8,
          accuracy: 20,
          apCost: 30,
          fpCost: 5,
          ...melee,
        },
        {
          id: 'smash',
          name: 'Smash',
          style: 'overhead',
          power: 1,
          accuracy: 0,
          apCost: 30,
          fpCost: 5,
          ...melee,
        },
      ];
    case 'firearm':
      // Range is the gunner's advantage; up close they can only club with the stock.
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Fire',
          style: 'shot',
          power: 1,
          accuracy: 0,
          apCost: weapon.apCost,
          fpCost: 5,
        },
        {
          id: 'stock-strike',
          name: 'Stock Strike',
          style: 'bash',
          power: 0.5,
          accuracy: 10,
          apCost: 25,
          fpCost: 5,
          ...melee,
        },
      ];
    case 'explosive':
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Throw',
          style: 'throw',
          power: 1,
          accuracy: 0,
          apCost: weapon.apCost,
          fpCost: 5,
        },
        {
          id: 'shove',
          name: 'Shove',
          style: 'bash',
          power: 0.5,
          accuracy: 10,
          apCost: 25,
          fpCost: 5,
          ...melee,
        },
      ];
  }
}

/** The two attacks every pilot has from the start with this weapon (no requirements). */
export function starterAttacks(weapon: Weapon): Attack[] {
  return starters(weapon).map((a) => ({ ...a, requires: {} }));
}

/** The weapon's main attack. */
export function basicAttack(weapon: Weapon): Attack {
  return starterAttacks(weapon)[0]!;
}

export function attackRange(attack: Attack, weapon: Weapon): { min: number; max: number } {
  return { min: attack.minRange ?? weapon.minRange, max: attack.maxRange ?? weapon.maxRange };
}

/** True when the pilot's current stats meet every requirement. */
export function meetsRequirements(stats: PilotStats, attack: Attack): boolean {
  return (Object.keys(attack.requires) as Array<keyof PilotStats>).every(
    (k) => stats[k] >= (attack.requires[k] ?? 0),
  );
}
