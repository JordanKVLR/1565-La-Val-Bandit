import type { BattleState, Facing } from '@m1565/core';
import type { CharacterProgress, RosterEntry } from '@m1565/content';
import type { Stores } from './inventory';
import type { StoryStep } from '../story/StoryRunner';

export type { CharacterProgress, RosterEntry };

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

export const CAMPAIGN_SAVE_VERSION = 2;

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
}
