import type { Difficulty } from '@m1565/core';
import { DIFFICULTIES } from '@m1565/core';
import { z } from 'zod';
import achievementData from '../data/achievements.json';

/**
 * Achievements and trophies: one registry (data/achievements.json) for every platform. Each
 * entry has a stable id (the Steamworks API name; console trophy and achievement ids map from
 * it), player-facing text, a hidden flag for story spoilers and a PlayStation-style grade. Its
 * `trigger` says which game event earns it, so the game never hard-codes ids: it reports
 * events and `achievementsForEvent` picks the entries they earn.
 */

export const TROPHY_GRADES = ['bronze', 'silver', 'gold', 'platinum'] as const;
export type TrophyGrade = (typeof TROPHY_GRADES)[number];

const difficulty = z.enum(DIFFICULTIES as [Difficulty, ...Difficulty[]]);

export const AchievementTriggerSchema = z.discriminatedUnion('type', [
  /** A battle won (any of `battles`, if given), optionally on a difficulty, flawless or fast. */
  z
    .object({
      type: z.literal('battleWon'),
      battles: z.array(z.string()).min(1).optional(),
      difficulty: difficulty.optional(),
      /** Nobody on the player's side was defeated. */
      noLosses: z.boolean().optional(),
      /** Won by the end of this round. */
      maxRound: z.number().int().min(1).optional(),
    })
    .strict(),
  /** An ending reached (a route's, if given), optionally on a difficulty or in New Game+. */
  z
    .object({
      type: z.literal('ending'),
      route: z.string().optional(),
      difficulty: difficulty.optional(),
      minNgPlus: z.number().int().min(1).optional(),
    })
    .strict(),
  /** Every route's plain ending achievement earned. */
  z.object({ type: z.literal('allEndings') }).strict(),
  /** New Game+ started. */
  z.object({ type: z.literal('newGamePlus') }).strict(),
  /** A pilot learned a skill that unlocks at `minLevel` or later (skills.json). */
  z.object({ type: z.literal('skillUnlocked'), minLevel: z.number().int().min(2) }).strict(),
  /** Anything bought at the Armoury. */
  z.object({ type: z.literal('itemBought') }).strict(),
  /** A pilot fitted with a weapon of this tier, or with both a charm and an amulet. */
  z
    .object({
      type: z.literal('gearFitted'),
      tier: z.enum(['fine', 'masterwork']).optional(),
      fullKit: z.boolean().optional(),
    })
    .strict(),
  /** This many scudi held at once. */
  z.object({ type: z.literal('scudiHeld'), amount: z.number().int().min(1) }).strict(),
  /** A historical note read (every one, with `all`). */
  z.object({ type: z.literal('codexRead'), all: z.boolean().optional() }).strict(),
  /** Every other entry earned. */
  z.object({ type: z.literal('platinum') }).strict(),
  /** Unlocked by hand (e.g. a platform-side event); `reason` says why it has no game event. */
  z.object({ type: z.literal('manual'), reason: z.string().min(10) }).strict(),
]);
export type AchievementTrigger = z.infer<typeof AchievementTriggerSchema>;

export const AchievementSchema = z
  .object({
    /** Stable forever: platforms key unlocks by it. Upper case, ACH_ prefix (Steam style). */
    id: z.string().regex(/^ACH_[A-Z0-9_]+$/),
    name: z.string().min(2).max(40),
    description: z.string().min(10).max(120),
    /** Spoils the story: platforms show it as hidden until earned. */
    hidden: z.boolean(),
    grade: z.enum(TROPHY_GRADES),
    trigger: AchievementTriggerSchema,
  })
  .strict();
export type Achievement = z.infer<typeof AchievementSchema>;

/** Parses the registry and checks ids are unique and there is exactly one platinum. */
export function loadAchievements(raw: unknown = achievementData): readonly Achievement[] {
  const list = AchievementSchema.array().parse(raw);
  const seen = new Set<string>();
  for (const a of list) {
    if (seen.has(a.id)) throw new Error(`Duplicate achievement id: ${a.id}`);
    seen.add(a.id);
    if ((a.grade === 'platinum') !== (a.trigger.type === 'platinum')) {
      throw new Error(`${a.id}: only the platinum trophy uses the platinum trigger and grade`);
    }
  }
  if (list.filter((a) => a.grade === 'platinum').length > 1) {
    throw new Error('More than one platinum trophy');
  }
  return list;
}

/** Something that happened in the game that may earn achievements. */
export type AchievementEvent =
  | {
      readonly type: 'battleWon';
      readonly battle: string;
      readonly difficulty: Difficulty;
      readonly noLosses: boolean;
      readonly round: number;
    }
  | {
      readonly type: 'ending';
      readonly route: string;
      readonly difficulty: Difficulty;
      readonly ngPlus: number;
    }
  | { readonly type: 'newGamePlus'; readonly cycle: number }
  /** `level`: the level the newly learned skill unlocks at. */
  | { readonly type: 'skillUnlocked'; readonly level: number }
  | { readonly type: 'itemBought' }
  /** Best weapon tier fitted to any pilot, and whether any pilot has a charm and an amulet. */
  | {
      readonly type: 'gearFitted';
      readonly tiers: readonly string[];
      readonly fullKit: boolean;
    }
  | { readonly type: 'scudiHeld'; readonly amount: number }
  | { readonly type: 'codexRead'; readonly read: number; readonly total: number };

/** The event types the game reports (every trigger except the meta ones and `manual`). */
export const EVENT_TRIGGERS = [
  'battleWon',
  'ending',
  'newGamePlus',
  'skillUnlocked',
  'itemBought',
  'gearFitted',
  'scudiHeld',
  'codexRead',
] as const satisfies readonly AchievementEvent['type'][];

/** Does `event` satisfy `trigger`? */
export function triggerMatches(trigger: AchievementTrigger, event: AchievementEvent): boolean {
  switch (trigger.type) {
    case 'battleWon':
      return (
        event.type === 'battleWon' &&
        (!trigger.battles || trigger.battles.includes(event.battle)) &&
        (!trigger.difficulty || trigger.difficulty === event.difficulty) &&
        (!trigger.noLosses || event.noLosses) &&
        (trigger.maxRound === undefined || event.round <= trigger.maxRound)
      );
    case 'ending':
      return (
        event.type === 'ending' &&
        (!trigger.route || trigger.route === event.route) &&
        (!trigger.difficulty || trigger.difficulty === event.difficulty) &&
        (trigger.minNgPlus === undefined || event.ngPlus >= trigger.minNgPlus)
      );
    case 'newGamePlus':
      return event.type === 'newGamePlus' && event.cycle >= 1;
    case 'skillUnlocked':
      return event.type === 'skillUnlocked' && event.level >= trigger.minLevel;
    case 'itemBought':
      return event.type === 'itemBought';
    case 'gearFitted':
      return (
        event.type === 'gearFitted' &&
        (!trigger.tier || event.tiers.includes(trigger.tier)) &&
        (!trigger.fullKit || event.fullKit)
      );
    case 'scudiHeld':
      return event.type === 'scudiHeld' && event.amount >= trigger.amount;
    case 'codexRead':
      return (
        event.type === 'codexRead' &&
        event.total > 0 &&
        (trigger.all ? event.read >= event.total : event.read >= 1)
      );
    case 'allEndings':
    case 'platinum':
    case 'manual':
      return false;
  }
}

/** Entries `event` earns. */
export function achievementsForEvent(
  list: readonly Achievement[],
  event: AchievementEvent,
): Achievement[] {
  return list.filter((a) => triggerMatches(a.trigger, event));
}

/** A route's plain ending entry: earned by its ending on any difficulty and cycle. */
function isPlainEnding(a: Achievement): boolean {
  const t = a.trigger;
  return t.type === 'ending' && !!t.route && !t.difficulty && t.minNgPlus === undefined;
}

/**
 * Meta entries newly earned by what is already unlocked: all endings once every plain ending
 * is in, and the platinum once everything else is. Call again after unlocking what it returns
 * (all endings can complete the platinum).
 */
export function metaAchievements(
  list: readonly Achievement[],
  unlocked: ReadonlySet<string>,
): Achievement[] {
  const endings = list.filter(isPlainEnding);
  const others = list.filter((a) => a.trigger.type !== 'platinum');
  return list.filter((a) => {
    if (unlocked.has(a.id)) return false;
    if (a.trigger.type === 'allEndings')
      return endings.length > 0 && endings.every((e) => unlocked.has(e.id));
    if (a.trigger.type === 'platinum') return others.every((o) => unlocked.has(o.id));
    return false;
  });
}
