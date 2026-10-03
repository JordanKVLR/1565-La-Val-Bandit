import type { AttackStyle, Reaction, WeaponType } from '@m1565/core';
import type { Pose } from './Armatura';

/**
 * Hand-made keyframes for every weapon and attack style in the duel close-up. All poses are
 * offsets from the weapon's guard (see guardFor in Armatura.ts); x is forward toward the enemy.
 * The weapon continues the forearm, so its angle is sR + eR + wR (0 down, π/2 ahead, π up).
 */
export type Key = { readonly t: number; readonly p: Partial<Pose> };

export interface MoveSpec {
  readonly weapon: WeaponType;
  readonly style: AttackStyle;
  /** Technique power (1 = a plain Thrust): stronger moves wind up longer and hit harder. */
  readonly power: number;
  /** Tiles the technique reaches: 2+ for Long Thrust, guns and throws. */
  readonly reach: number;
}

export interface Move {
  readonly keys: readonly Key[];
  /** Seconds from the start to the moment of contact. */
  readonly impact: number;
  /** Extra distance (world units) the two fighters keep apart for this move. */
  readonly standoff: number;
  /** Time window in which the weapon leaves a motion trail. */
  readonly trail: readonly [number, number] | null;
  readonly projectile: 'shot' | 'bomb' | null;
  /** When the projectile leaves the attacker (and the muzzle flashes). */
  readonly release: number;
  /** A heavy blow: bigger knockback and camera shake. */
  readonly heavy: boolean;
  /** Times the attacker's feet kick up dust (steps, landings, the charge). */
  readonly dust: readonly number[];
}

/** Distance between the two fighters' bases at rest. */
export const GAP = 3.2;

/** How far from the enemy each weapon strikes. */
function contact(weapon: WeaponType, reach: number): number {
  switch (weapon) {
    case 'polearm':
      return reach >= 2 ? 2.35 : 1.75;
    case 'blunt':
      return 1.15;
    case 'firearm':
    case 'explosive':
      return 1.2;
    default:
      return 1.3;
  }
}

export function moveFor(spec: MoveSpec): Move {
  const k = Math.min(2, Math.max(0.5, spec.power));
  // Stronger techniques take a longer wind-up.
  const W = 0.85 + 0.2 * k;
  const ranged = spec.style === 'shot' || spec.style === 'volley' || spec.style === 'throw';
  const standoff = ranged ? 1.4 : spec.weapon === 'polearm' && spec.reach >= 2 ? 0.9 : 0;
  const adv = GAP + standoff - contact(spec.weapon, spec.reach);
  const heavy = k >= 1.3;
  const base = { standoff, projectile: null, release: 0, heavy, dust: [] as number[] };

  switch (`${spec.weapon}:${spec.style}`) {
    // ── Swords and sabres ────────────────────────────────────────
    case 'blade:thrust': {
      const i = 0.28 * W + 0.14;
      return {
        ...base,
        impact: i,
        trail: [0.28 * W, i + 0.1],
        dust: [i - 0.02],
        keys: [
          {
            t: 0.28 * W,
            p: {
              x: adv * 0.45,
              sR: 0.35,
              eR: 1.5,
              wR: -0.3,
              sL: 0.1,
              lean: 0.05,
              hR: 0.35,
              kR: -0.4,
            },
          },
          {
            t: i,
            p: {
              x: adv + 0.15,
              sR: 1.55,
              eR: 0,
              wR: 0,
              sL: -0.6,
              eL: 0.2,
              lean: -0.42,
              hR: 1.0,
              kR: -0.25,
              hL: -0.7,
              kL: -0.05,
            },
          },
          { t: i + 0.28, p: { x: adv + 0.1, sR: 1.45, eR: 0.15, lean: -0.3 } },
          { t: i + 0.65, p: {} },
        ],
      };
    }
    case 'blade:overhead': {
      const i = 0.38 * W + 0.16;
      return {
        ...base,
        impact: i,
        trail: [0.38 * W, i + 0.15],
        dust: [i],
        heavy: true,
        keys: [
          {
            t: 0.38 * W,
            p: {
              x: adv * 0.7,
              y: 0.14,
              sR: 3.1,
              eR: 0.4,
              wR: 0.3,
              sL: 3.0,
              eL: 0.5,
              lean: 0.25,
              hR: 0.6,
              kR: -0.9,
            },
          },
          {
            t: i,
            p: {
              x: adv,
              y: -0.08,
              sR: 1.2,
              eR: 0,
              wR: 0.1,
              sL: 1.1,
              eL: 0.1,
              lean: -0.6,
              hR: 0.75,
              kR: -0.95,
              hL: -0.3,
              kL: -0.4,
            },
          },
          { t: i + 0.25, p: { x: adv, y: -0.05, sR: 0.7, wR: 0.3, sL: 0.7, lean: -0.5 } },
          { t: i + 0.65, p: {} },
        ],
      };
    }
    case 'blade:sweep': {
      const i = 0.32 * W + 0.22;
      return {
        ...base,
        impact: i,
        trail: [0.32 * W, i + 0.12],
        dust: [0.3 * W, i],
        keys: [
          { t: 0.18 * W, p: { x: adv * 0.6, y: -0.12, hR: 0.9, kR: -1.3, hL: -0.1, kL: -0.9 } },
          {
            t: 0.32 * W,
            p: {
              x: adv * 0.85,
              y: -0.18,
              spin: -1.2,
              sR: 1.5,
              eR: 0.2,
              wR: 0.05,
              lean: 0.1,
              hR: 1.0,
              kR: -1.4,
              hL: -0.1,
              kL: -1.0,
            },
          },
          // One full turn, the blade level at the waist, landing on the enemy as it comes round.
          {
            t: i,
            p: {
              x: adv,
              y: -0.2,
              spin: Math.PI * 2,
              sR: 1.55,
              eR: 0.05,
              wR: 0,
              lean: -0.3,
              hR: 1.0,
              kR: -1.4,
            },
          },
          { t: i + 0.22, p: { x: adv, y: -0.1, spin: Math.PI * 2 + 0.5, sR: 1.3, lean: -0.2 } },
          { t: i + 0.6, p: { spin: Math.PI * 2 } },
        ],
      };
    }
    // ── Spears and pikes ─────────────────────────────────────────
    case 'polearm:thrust': {
      const long = spec.reach >= 2;
      const i = 0.3 * W + (long ? 0.18 : 0.14);
      return {
        ...base,
        impact: i,
        trail: [0.3 * W, i + 0.08],
        dust: [i - 0.03],
        keys: [
          // Draw the spear back with both hands...
          {
            t: 0.3 * W,
            p: {
              x: adv * 0.4 - 0.25,
              sR: 0.2,
              eR: 0.7,
              wR: 0.55,
              sL: 0.7,
              eL: 0.5,
              lean: 0.1,
              hR: 0.3,
              kR: -0.4,
            },
          },
          // ...and drive it home; Long Thrust lunges deep from two tiles out.
          long
            ? {
                t: i,
                p: {
                  x: adv + 0.25,
                  y: -0.1,
                  sR: 1.3,
                  eR: 0.05,
                  wR: 0.15,
                  sL: 1.5,
                  eL: 0,
                  lean: -0.5,
                  hR: 1.25,
                  kR: -0.1,
                  hL: -1.0,
                  kL: -0.05,
                },
              }
            : {
                t: i,
                p: {
                  x: adv + 0.2,
                  sR: 1.25,
                  eR: 0.05,
                  wR: 0.2,
                  sL: 1.45,
                  eL: 0,
                  lean: -0.35,
                  hR: 1.0,
                  kR: -0.25,
                  hL: -0.7,
                },
              },
          { t: i + 0.3, p: { x: adv + 0.1, sR: 1.0, eR: 0.3, sL: 1.3, lean: -0.25 } },
          { t: i + 0.7, p: {} },
        ],
      };
    }
    case 'polearm:charge': {
      const i = 0.72 * W;
      const step = (n: number) => 0.2 * W + n * 0.13 * W;
      const run = (n: number): Partial<Pose> =>
        n % 2
          ? { hR: -0.6, kR: -0.2, hL: 0.85, kL: -1.2 }
          : { hR: 0.85, kR: -1.2, hL: -0.6, kL: -0.2 };
      const couched = { sR: 0.25, eR: 1.25, wR: 0.05, sL: 1.0, eL: 0.5, lean: -0.35 };
      return {
        ...base,
        impact: i,
        heavy: true,
        trail: [step(1), i + 0.08],
        dust: [step(0), step(1), step(2), step(3)],
        keys: [
          { t: 0.15 * W, p: { x: -0.5, ...couched, hR: -0.4, hL: 0.4 } },
          ...[0, 1, 2, 3].map((n) => ({
            t: step(n),
            p: {
              x: -0.5 + ((adv + 0.5) * (n + 1)) / 5,
              y: n % 2 ? 0.06 : 0,
              ...couched,
              ...run(n),
            },
          })),
          {
            t: i,
            p: {
              x: adv + 0.3,
              ...couched,
              sR: 0.6,
              eR: 0.95,
              lean: -0.55,
              hR: 1.05,
              kR: -0.3,
              hL: -0.8,
              kL: -0.1,
            },
          },
          { t: i + 0.35, p: { x: adv + 0.15, ...couched, lean: -0.3 } },
          { t: i + 0.85, p: {} },
        ],
      };
    }
    case 'polearm:sweep': {
      const i = 0.32 * W + 0.18;
      return {
        ...base,
        impact: i,
        trail: [0.32 * W, i + 0.12],
        dust: [i],
        keys: [
          {
            t: 0.32 * W,
            p: {
              x: adv * 0.8,
              y: -0.15,
              spin: -1.1,
              sR: 1.45,
              eR: 0.1,
              wR: 0.05,
              sL: 1.6,
              eL: 0.05,
              lean: 0.1,
              hR: 0.9,
              kR: -1.3,
              kL: -0.9,
            },
          },
          {
            t: i,
            p: { x: adv, y: -0.2, spin: 0.5, sR: 1.5, sL: 1.6, lean: -0.3, hR: 0.95, kR: -1.35 },
          },
          { t: i + 0.25, p: { x: adv, y: -0.1, spin: 0.8, lean: -0.2 } },
          { t: i + 0.65, p: {} },
        ],
      };
    }
    case 'polearm:bash': {
      const i = 0.28 * W + 0.14;
      return {
        ...base,
        impact: i,
        trail: null,
        dust: [i],
        keys: [
          {
            t: 0.28 * W,
            p: {
              x: adv * 0.5,
              sR: 1.2,
              eR: 1.2,
              wR: 0.6,
              sL: 1.2,
              eL: 1.1,
              lean: 0.1,
              hR: 0.4,
              kR: -0.6,
            },
          },
          // Ram the haft forward with both hands.
          {
            t: i,
            p: {
              x: adv + 0.25,
              sR: 1.65,
              eR: 0.2,
              wR: 1.3,
              sL: 1.75,
              eL: 0.1,
              lean: -0.6,
              hR: 0.95,
              kR: -0.3,
              hL: -0.7,
            },
          },
          { t: i + 0.3, p: { x: adv + 0.1, lean: -0.3 } },
          { t: i + 0.65, p: {} },
        ],
      };
    }
    // ── Mace and shield ──────────────────────────────────────────
    case 'blunt:bash': {
      const i = 0.25 * W + 0.15;
      return {
        ...base,
        impact: i,
        trail: null,
        dust: [0.25 * W, i],
        keys: [
          {
            t: 0.25 * W,
            p: { x: adv * 0.5 - 0.2, y: -0.06, sL: 0.9, eL: 1.3, lean: 0.12, hR: 0.6, kR: -0.9 },
          },
          // Punch the shield into the enemy.
          {
            t: i,
            p: {
              x: adv + 0.25,
              sL: 1.6,
              eL: 0.05,
              lean: -0.65,
              hR: 1.0,
              kR: -0.3,
              hL: -0.8,
              kL: -0.05,
            },
          },
          { t: i + 0.3, p: { x: adv + 0.1, sL: 1.4, eL: 0.4, lean: -0.3 } },
          { t: i + 0.65, p: {} },
        ],
      };
    }
    case 'blunt:overhead': {
      const i = 0.4 * W + 0.16;
      return {
        ...base,
        impact: i,
        heavy: true,
        trail: [0.4 * W, i + 0.1],
        dust: [i],
        keys: [
          {
            t: 0.4 * W,
            p: {
              x: adv * 0.7,
              y: 0.2,
              sR: 3.2,
              eR: 0.7,
              wR: 0.3,
              sL: 1.4,
              eL: 0.6,
              lean: 0.3,
              hR: 0.7,
              kR: -1.0,
            },
          },
          {
            t: i,
            p: {
              x: adv,
              y: -0.06,
              sR: 1.0,
              eR: 0,
              wR: 0.3,
              sL: 1.1,
              lean: -0.7,
              hR: 0.8,
              kR: -1.0,
              hL: -0.3,
              kL: -0.4,
            },
          },
          { t: i + 0.3, p: { x: adv, y: -0.04, sR: 0.6, wR: 0.4, lean: -0.55 } },
          { t: i + 0.7, p: {} },
        ],
      };
    }
    // ── Arquebus and tüfek ───────────────────────────────────────
    case 'firearm:shot':
    case 'firearm:volley': {
      const kneel = spec.style === 'volley';
      const fire = 0.55 * W;
      const i = fire + 0.12;
      const low: Partial<Pose> = kneel ? { y: -0.42, hR: 1.5, kR: -1.5, hL: 0.05, kL: -1.55 } : {};
      return {
        ...base,
        impact: i,
        trail: null,
        projectile: 'shot',
        release: fire,
        dust: kneel ? [0.25] : [],
        keys: [
          // Settle and take aim (kneeling for a volley)...
          { t: 0.3 * W, p: { ...low, lean: -0.06, sR: 1.42, eR: 0.08, sL: 1.48, eL: 0.08 } },
          { t: fire - 0.02, p: { ...low, lean: -0.06, sR: 1.42, eR: 0.08, sL: 1.48, eL: 0.08 } },
          // ...then the kick of the shot.
          { t: fire + 0.06, p: { ...low, x: -0.14, lean: 0.22, sR: 1.6, eR: 0.1, sL: 1.66 } },
          { t: fire + 0.45, p: { ...low } },
          { t: fire + 0.85, p: {} },
        ],
      };
    }
    case 'firearm:bash': {
      // Stock Strike: turn the gun so the butt leads and drive it into the enemy.
      const i = 0.28 * W + 0.14;
      return {
        ...base,
        impact: i,
        trail: [0.28 * W, i + 0.08],
        dust: [i],
        keys: [
          {
            t: 0.28 * W,
            p: {
              x: adv * 0.5,
              sR: 0.8,
              eR: 1.4,
              wR: -3.6,
              sL: 1.2,
              eL: 1.0,
              lean: 0.15,
              hR: 0.4,
              kR: -0.6,
            },
          },
          {
            t: i,
            p: {
              x: adv + 0.2,
              sR: 1.55,
              eR: 0.3,
              wR: -3.45,
              sL: 1.45,
              eL: 0.4,
              lean: -0.55,
              hR: 0.95,
              kR: -0.3,
              hL: -0.7,
            },
          },
          { t: i + 0.3, p: { x: adv + 0.1, lean: -0.25 } },
          { t: i + 0.65, p: {} },
        ],
      };
    }
    // ── Grenades ─────────────────────────────────────────────────
    case 'explosive:throw': {
      const release = 0.45 * W;
      const i = release + 0.45;
      return {
        ...base,
        impact: i,
        heavy: true,
        trail: null,
        projectile: 'bomb',
        release,
        dust: [release],
        keys: [
          { t: 0.3 * W, p: { sR: -0.75, eR: 0.7, wR: 0.2, lean: 0.25, hR: -0.3, hL: 0.4 } },
          {
            t: release,
            p: { x: 0.25, sR: 2.7, eR: 0.3, lean: -0.35, hR: 0.55, kR: -0.3, hL: -0.45 },
          },
          { t: release + 0.25, p: { x: 0.2, sR: 1.4, eR: 0.3, lean: -0.2 } },
          { t: i + 0.5, p: {} },
        ],
      };
    }
    case 'explosive:bash': {
      const i = 0.25 * W + 0.13;
      return {
        ...base,
        impact: i,
        trail: null,
        dust: [i],
        keys: [
          { t: 0.25 * W, p: { x: adv * 0.5, sR: 0.9, eR: 1.4, sL: 0.9, eL: 1.4, lean: 0.1 } },
          {
            t: i,
            p: {
              x: adv + 0.2,
              sR: 1.5,
              eR: 0.2,
              sL: 1.5,
              eL: 0.2,
              lean: -0.6,
              hR: 0.9,
              kR: -0.3,
              hL: -0.7,
            },
          },
          { t: i + 0.3, p: { x: adv + 0.1, lean: -0.3 } },
          { t: i + 0.6, p: {} },
        ],
      };
    }
    // ── Slash (swords, and the fallback for anything else) ───────
    default: {
      const i = 0.3 * W + 0.18;
      return {
        ...base,
        impact: i,
        trail: [0.3 * W, i + 0.15],
        dust: [i - 0.05],
        keys: [
          {
            t: 0.3 * W,
            p: {
              x: adv * 0.6,
              sR: 2.5,
              eR: 0.6,
              wR: 0.5,
              sL: 0.6,
              eL: 0.8,
              lean: 0.15,
              hR: 0.6,
              kR: -0.5,
              hL: -0.3,
            },
          },
          {
            t: i,
            p: {
              x: adv,
              sR: 1.3,
              eR: 0.1,
              wR: 0,
              sL: 0.2,
              lean: -0.35,
              hR: 0.9,
              kR: -0.4,
              hL: -0.5,
              kL: -0.1,
            },
          },
          { t: i + 0.2, p: { x: adv, sR: 0.4, eR: 0.1, wR: -0.1, lean: -0.4 } },
          { t: i + 0.6, p: {} },
        ],
      };
    }
  }
}

export interface ReactionSpec {
  readonly reaction: Reaction;
  readonly hit: boolean;
  readonly defeated: boolean;
  /** The defender's own weapon (it parries with it). */
  readonly weapon: WeaponType;
  readonly attackStyle: AttackStyle;
  readonly heavy: boolean;
}

/** How a defender braces with its own weapon. */
function blockPose(weapon: WeaponType): Partial<Pose> {
  switch (weapon) {
    case 'blunt':
      return { sL: 1.6, eL: 0.15, lean: 0.15 };
    case 'polearm':
      return { sR: 1.7, eR: 0.5, wR: 0.25, sL: 2.1, eL: 0.2, lean: 0.15 };
    case 'firearm':
      return { sR: 1.8, eR: 1.1, wR: -1.25, sL: 2.1, eL: 0.4, lean: 0.15 };
    default:
      return { sR: 1.25, eR: 0.95, wR: 0.25, sL: 1.2, eL: 1.0, lean: 0.15 };
  }
}

/** Defender keyframes from the moment of impact (times relative to impact). */
export function reactionFor(spec: ReactionSpec): Key[] {
  const block = blockPose(spec.weapon);
  if (spec.defeated) {
    const back = spec.heavy ? -1.1 : -0.75;
    return [
      { t: 0.12, p: { x: back * 0.4, lean: 0.55, sR: 2.2, sL: 2.0 } },
      {
        t: 0.6,
        p: { x: back, y: 0.1, fall: 1.45, lean: 0.3, sR: 2.8, sL: 2.6, hR: 0.8, hL: 0.6, kR: -0.2 },
      },
      { t: 1.0, p: { x: back - 0.05, y: 0.12, fall: 1.52 } },
    ];
  }
  if (!spec.hit && spec.reaction === 'counter') {
    // A successful Counter: catch the blow on the weapon and shove it back.
    return [
      { t: 0.02, p: { x: 0.1, ...block } },
      { t: 0.25, p: { x: 0.3, ...block, lean: -0.45, hR: 0.9, kR: -0.3, hL: -0.6 } },
      { t: 0.65, p: {} },
    ];
  }
  if (spec.hit && spec.reaction === 'defend') {
    const push = spec.heavy ? -0.5 : -0.25;
    return [
      { t: 0.02, p: { x: push * 0.6, ...block, hR: 0.5, kR: -0.7 } },
      { t: 0.3, p: { x: push, ...block, lean: 0.1 } },
      { t: 0.7, p: {} },
    ];
  }
  if (spec.hit) {
    // Heavy blows knock the defender back onto one knee.
    return spec.heavy
      ? [
          { t: 0.1, p: { x: -0.6, lean: 0.65, sR: 1.6, sL: 1.4, hR: 0.6, kR: -0.9 } },
          { t: 0.35, p: { x: -0.95, y: -0.22, lean: 0.35, hR: 1.3, kR: -1.6, hL: 0.1, kL: -1.5 } },
          { t: 0.75, p: { x: -0.8, y: -0.1, lean: 0.2 } },
          { t: 1.1, p: {} },
        ]
      : [
          { t: 0.08, p: { x: -0.3, lean: 0.55, sR: 1.3, sL: 1.1, hR: 0.5, kR: -0.8 } },
          { t: 0.4, p: { x: -0.3, lean: 0.25 } },
          { t: 0.8, p: {} },
        ];
  }
  if (spec.reaction === 'avoid') {
    const high =
      spec.attackStyle === 'slash' ||
      spec.attackStyle === 'overhead' ||
      spec.attackStyle === 'sweep';
    return high
      ? [
          // Duck under a swing.
          {
            t: 0.1,
            p: { x: -0.25, y: -0.38, lean: -0.25, hR: 1.25, kR: -1.7, hL: 0.55, kL: -1.5 },
          },
          { t: 0.4, p: { x: -0.3, y: -0.3, lean: -0.15 } },
          { t: 0.8, p: {} },
        ]
      : [
          // Sidestep a thrust, a charge or a shot.
          { t: 0.1, p: { x: -0.2, z: 0.75, lean: 0.25, hR: 0.6, kR: -0.8, hL: -0.2 } },
          { t: 0.4, p: { x: -0.25, z: 0.8, lean: 0.1 } },
          { t: 0.85, p: {} },
        ];
  }
  return [
    { t: 0.1, p: { x: -0.1, lean: 0.25 } },
    { t: 0.5, p: {} },
  ];
}
