import type { AttackStyle } from './attacks';
import type { FacingZone, Reaction } from './combat';
import type { Coord, Facing } from './grid';
import type { Outcome } from './state';

export interface StrikeResult {
  readonly attackerId: string;
  readonly targetId: string;
  readonly hitChance: number;
  readonly hit: boolean;
  readonly damage: number;
  readonly zone: FacingZone;
  readonly targetHp: number;
  readonly defeated: boolean;
  /** XP the striker earned from this strike (0 on a miss or for units that don't earn XP). */
  readonly xp: number;
}

export type StatName = 'str' | 'skl' | 'agi';

/**
 * What happened, in order. The renderer and UI play these back (animations, close-ups, log);
 * they never re-derive rules.
 */
export type BattleEvent =
  | { readonly type: 'roundStarted'; readonly round: number; readonly order: readonly string[] }
  | {
      readonly type: 'turnStarted';
      readonly unitId: string;
      readonly ap: number;
      readonly mustRest: boolean;
    }
  | {
      readonly type: 'unitMoved';
      readonly unitId: string;
      readonly path: readonly Coord[];
      readonly apCost: number;
    }
  | { readonly type: 'moveUndone'; readonly unitId: string; readonly to: Coord }
  | { readonly type: 'unitFaced'; readonly unitId: string; readonly facing: Facing }
  | {
      readonly type: 'attackResolved';
      readonly reaction: Reaction;
      readonly attackId: string;
      readonly attackName: string;
      readonly style: AttackStyle;
      /** One entry per strike (twin attacks strike twice); stops early if the target falls. */
      readonly strikes: readonly StrikeResult[];
      readonly counter?: StrikeResult;
      readonly counterStyle?: AttackStyle;
    }
  | {
      readonly type: 'levelUp';
      readonly unitId: string;
      readonly level: number;
      readonly statPoints: number;
    }
  | {
      readonly type: 'statRaised';
      readonly unitId: string;
      readonly stat: StatName;
      readonly value: number;
    }
  | { readonly type: 'unitDefeated'; readonly unitId: string }
  | { readonly type: 'turnEnded'; readonly unitId: string; readonly rested: boolean }
  | { readonly type: 'battleEnded'; readonly outcome: Exclude<Outcome, 'ongoing'> };
