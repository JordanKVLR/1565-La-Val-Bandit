import { DEFAULT_BALANCE, techniqueCost } from './balance';
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
  /** Multiplier on raw damage, (POW + WEP) × damagePerPoint. */
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
  /** Fraction (0–1) of the target's DEF ignored. */
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

type Starter = Omit<Attack, 'requires' | 'apCost' | 'fpCost' | 'accuracy'> &
  Partial<Pick<Attack, 'apCost' | 'fpCost' | 'accuracy'>>;

/**
 * Every pilot starts with two attacks for their weapon, with no stat requirements. Costs come
 * from the shared technique formula (see techniqueCost), so a light accurate strike is cheap and
 * a heavy one dear. Long Thrust pays for its reach with accuracy, as in the classic games.
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
          ...melee,
          description:
            'A quick diagonal cut. Lighter than a thrust but hard to dodge: cheap and accurate.',
        },
        {
          id: 'thrust',
          name: 'Thrust',
          style: 'thrust',
          power: 1,
          ...melee,
          description: 'A lunge with the point. Full weight behind it, at normal accuracy.',
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
          ...melee,
          description: 'Both hands drive the spear home at an adjacent foe.',
        },
        {
          id: 'long-thrust',
          name: 'Long Thrust',
          style: 'thrust',
          power: 1,
          accuracy: -20,
          apCost: 35,
          minRange: 1,
          maxRange: 2,
          description:
            'A deep lunge that reaches an enemy two tiles away. The reach costs accuracy.',
        },
      ];
    case 'blunt':
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Bash',
          style: 'bash',
          power: 0.8,
          ...melee,
          description: 'A punch with the shield rim: light, quick and accurate.',
        },
        {
          id: 'smash',
          name: 'Smash',
          style: 'overhead',
          power: 1,
          ...melee,
          description: 'The mace comes down overhead with full force.',
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
          apCost: weapon.apCost,
          description:
            'Aim and fire at range. Reloading and the smoke make every shot tiring (extra FP).',
        },
        // Swung like a club, the butt hits about as hard as a sword's slash.
        {
          id: 'stock-strike',
          name: 'Stock Strike',
          style: 'bash',
          power: 0.8,
          ...melee,
          description:
            'Reverse the gun and club an adjacent foe with the butt, hard as a sword cut.',
        },
      ];
    case 'explosive':
      return [
        {
          id: BASIC_ATTACK_ID,
          name: 'Throw',
          style: 'throw',
          power: 1,
          apCost: weapon.apCost,
          description: 'Light the fuse and lob a grenade over the line. Tiring (extra FP).',
        },
        {
          id: 'shove',
          name: 'Shove',
          style: 'bash',
          power: 0.5,
          ...melee,
          description: 'A desperate push to make room. Weak, but better than nothing up close.',
        },
      ];
  }
}

/** The two attacks every pilot has from the start with this weapon (no requirements). */
export function starterAttacks(weapon: Weapon): Attack[] {
  return starters(weapon).map((a) => ({
    ...techniqueCost(a.power, a.hits ?? 1, DEFAULT_BALANCE, a.style),
    ...a,
    requires: {},
  }));
}

/** The weapon's main attack. */
export function basicAttack(weapon: Weapon): Attack {
  return starterAttacks(weapon)[0]!;
}

export function attackRange(attack: Attack, weapon: Weapon): { min: number; max: number } {
  return { min: attack.minRange ?? weapon.minRange, max: attack.maxRange ?? weapon.maxRange };
}

/** True when the unit's attributes (gear included) meet every requirement. */
export function meetsRequirements(stats: PilotStats, attack: Attack): boolean {
  return (Object.keys(attack.requires) as Array<keyof PilotStats>).every(
    (k) => stats[k] >= (attack.requires[k] ?? 0),
  );
}
