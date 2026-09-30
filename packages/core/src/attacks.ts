import type { PilotStats, Weapon, WeaponType } from './units';

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

const BASIC: Record<WeaponType, { name: string; style: AttackStyle }> = {
  blade: { name: 'Strike', style: 'slash' },
  polearm: { name: 'Thrust', style: 'thrust' },
  blunt: { name: 'Bash', style: 'bash' },
  firearm: { name: 'Fire', style: 'shot' },
  explosive: { name: 'Throw', style: 'throw' },
};

/** The plain attack every weapon has, with no requirements. */
export function basicAttack(weapon: Weapon): Attack {
  const b = BASIC[weapon.type];
  return {
    id: BASIC_ATTACK_ID,
    name: b.name,
    style: b.style,
    power: 1,
    accuracy: 0,
    apCost: weapon.apCost,
    fpCost: weapon.fpCost,
    requires: {},
  };
}

export function attackRange(attack: Attack, weapon: Weapon): { min: number; max: number } {
  return { min: attack.minRange ?? weapon.minRange, max: attack.maxRange ?? weapon.maxRange };
}

/** True when the pilot's current stats meet every requirement. */
export function meetsRequirements(stats: PilotStats, attack: Attack): boolean {
  return (
    stats.str >= (attack.requires.str ?? 0) &&
    stats.skl >= (attack.requires.skl ?? 0) &&
    stats.agi >= (attack.requires.agi ?? 0)
  );
}
