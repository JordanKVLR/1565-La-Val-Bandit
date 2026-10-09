import type { BattleState, Difficulty, Facing } from '@m1565/core';
import type { CharacterProgress, RosterEntry } from '@m1565/content';
import type { Stores } from './inventory';
import type { StoryStep } from '../story/StoryRunner';

export type { CharacterProgress, RosterEntry };

/** What a pilot had fitted: armatura, weapon, charm and amulet. */
export type Loadout = Pick<RosterEntry, 'frame' | 'weapon' | 'charm' | 'amulet'>;

export interface StageActor {
  readonly x: number;
  readonly y: number;
  readonly facing: Facing;
}

export interface StageState {
  readonly map: string | null;
  readonly actors: Readonly<Record<string, StageActor>>;
}

export interface ChapterInfo {
  readonly title: string;
  readonly subtitle: string;
}

export const CAMPAIGN_SAVE_VERSION = 3;

export interface CampaignSave {
  readonly version: number;
  /** inkjs story state JSON. */
  readonly ink: string;
  readonly roster: readonly RosterEntry[];
  readonly scudi: number;
  /** Spare armaturas, weapons, charms and amulets ("kind:id" → count). */
  readonly stores: Stores;
  /** Named allies who have fought for the player but not joined yet: their progress so far. */
  readonly veterans?: Readonly<Record<string, CharacterProgress>>;
  readonly completedBattles: readonly string[];
  readonly stage: StageState;
  readonly chapter: ChapterInfo;
  /** The line on screen when saved, so a resumed game shows it again. */
  readonly lastStep: StoryStep | null;
  readonly battle: { readonly id: string; readonly state?: BattleState } | null;
  readonly savedAt: number;
  readonly playMs: number;
  /** Chosen at New Game; can be changed from the in-game menu. */
  readonly difficulty: Difficulty;
  /** New Game+ cycle: completed playthroughs before this one (0 = first). */
  readonly ngPlus: number;
  /** Route of the ending reached in this playthrough, once reached (offers New Game+). */
  readonly ending: string | null;
  /**
   * New Game+: what each carried-over pilot had fitted at the end of the last playthrough. The
   * items wait in the stores and are fitted again when the pilot rejoins.
   */
  readonly kit?: Readonly<Record<string, Loadout>>;
}
