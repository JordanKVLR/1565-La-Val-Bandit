import type { BattleState, Facing } from '@m1565/core';
import type { RosterEntry } from '@m1565/content';
import type { StoryStep } from '../story/StoryRunner';

export type { RosterEntry };

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

export const CAMPAIGN_SAVE_VERSION = 1;

export interface CampaignSave {
  readonly version: number;
  /** inkjs story state JSON. */
  readonly ink: string;
  readonly roster: readonly RosterEntry[];
  readonly scudi: number;
  /** Frame and weapon designs the player owns; any pilot of the right allegiance may use them. */
  readonly armory: readonly string[];
  readonly completedBattles: readonly string[];
  readonly stage: StageState;
  readonly chapter: ChapterInfo;
  /** The line on screen when saved, so a resumed game shows it again. */
  readonly lastStep: StoryStep | null;
  readonly battle: { readonly id: string; readonly state?: BattleState } | null;
  readonly savedAt: number;
  readonly playMs: number;
}
