import type { Library, Skirmish } from '@m1565/content';
import { loadBattle } from '@m1565/content';
import type { BattleSetup, BattleState } from '@m1565/core';
import { bonusResults } from '@m1565/core';

/**
 * The daily challenge: one skirmish a day (the same for everyone, by calendar day), fought with a
 * fixed company and a fixed seed, so a result means the same thing on every device. Results are
 * kept on this device only (there is no server).
 */
const KEY = 'm1565.challenge';
const DAY_MS = 86_400_000;

export interface ChallengeResult {
  readonly rounds: number;
  readonly losses: number;
  /** Optional goals met, of those offered. */
  readonly goals: number;
  readonly of: number;
}

export interface Challenge {
  readonly day: number;
  readonly skirmish: Skirmish;
  readonly setup: BattleSetup;
}

/** Whole days since 1 Jan 1970 in the player's own calendar day. */
export function dayNumber(now: Date = new Date()): number {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / DAY_MS);
}

/** Today's challenge: which skirmish, and the battle with the day's seed. */
export function challengeFor(lib: Library, day: number): Challenge {
  const list = lib.skirmishes;
  const skirmish = list[((day % list.length) + list.length) % list.length]!;
  const setup = loadBattle(skirmish.id as Parameters<typeof loadBattle>[0], lib);
  return { day, skirmish, setup: { ...setup, seed: day } };
}

/** How the finished battle scored. */
export function scoreOf(state: BattleState): ChallengeResult {
  const goals = bonusResults(state);
  return {
    rounds: state.round,
    losses: state.units.filter((u) => u.side === 'player' && u.defeated).length,
    goals: goals.filter((g) => g.met).length,
    of: goals.length,
  };
}

/** Fewer losses first, then more goals, then fewer rounds. */
export function better(a: ChallengeResult, b: ChallengeResult | undefined): boolean {
  if (!b) return true;
  if (a.losses !== b.losses) return a.losses < b.losses;
  if (a.goals !== b.goals) return a.goals > b.goals;
  return a.rounds < b.rounds;
}

type Store = Record<string, ChallengeResult>;

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

/** The best result for a day, if it was won. */
export function bestFor(day: number): ChallengeResult | undefined {
  return read()[String(day)];
}

/** Records a win if it beats the day's best; returns whether it did. */
export function record(day: number, result: ChallengeResult): boolean {
  const store = read();
  if (!better(result, store[String(day)])) return false;
  store[String(day)] = result;
  // Keep a month of history.
  const keep = Object.keys(store)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 31);
  const trimmed = Object.fromEntries(keep.map((d) => [String(d), store[String(d)]!]));
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    return false;
  }
  return true;
}
