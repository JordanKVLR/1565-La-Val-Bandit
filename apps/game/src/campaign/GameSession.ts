import type { BattleSetup, BattleState, Facing } from '@m1565/core';
import type { Library } from '@m1565/content';
import { isBattleId, loadBattle } from '@m1565/content';
import storyJson from '@m1565/content/story/main.ink';
import {
  BATTLE_ACHIEVEMENTS,
  ENDING_ACHIEVEMENTS,
  unlockAchievement,
} from '../platform/achievements';
import type { SlotId } from '../platform/storage';
import { readSave, writeSave } from '../platform/storage';
import { Store } from '../state/store';
import type { StoryStep } from '../story/StoryRunner';
import { StoryRunner } from '../story/StoryRunner';
import { applyBattleResults, newRosterEntry } from './progression';
import type { CampaignSave, ChapterInfo, RosterEntry, StageState } from './types';
import { CAMPAIGN_SAVE_VERSION } from './types';

export type Screen =
  | { readonly kind: 'title' }
  | {
      readonly kind: 'story';
      readonly line: Extract<StoryStep, { kind: 'line' }> | null;
      readonly choices: readonly string[] | null;
      readonly card: ChapterInfo | null;
    }
  | {
      readonly kind: 'battle';
      readonly battleId: string;
      readonly setup: BattleSetup;
      readonly initial?: BattleState;
      /** Changes on every new battle so the screen remounts. */
      readonly key: number;
    }
  | { readonly kind: 'prep' }
  | { readonly kind: 'results'; readonly battleId: string; readonly lines: readonly string[] }
  | { readonly kind: 'end' };

export interface SessionView {
  readonly screen: Screen;
  readonly stage: StageState;
  readonly chapter: ChapterInfo;
  readonly roster: readonly RosterEntry[];
  readonly scudi: number;
  readonly armory: readonly string[];
  readonly completedBattles: readonly string[];
}

const FACINGS: readonly Facing[] = ['north', 'east', 'south', 'west'];
const EMPTY_STAGE: StageState = { map: null, actors: {} };

/**
 * One playthrough. The ink script is the master flow: it narrates, branches and issues
 * `>>> commands` (stage, battle, join…) that this class carries out.
 */
export class GameSession {
  readonly view: Store<SessionView>;
  private runner: StoryRunner;
  private battleCounter = 0;
  private startedAt = Date.now();
  private playMsBefore = 0;
  private lastStep: StoryStep | null = null;

  constructor(
    private readonly lib: Library,
    save?: CampaignSave,
  ) {
    this.runner = new StoryRunner(storyJson, save?.ink);
    this.view = new Store<SessionView>({
      screen: { kind: 'title' },
      stage: save?.stage ?? EMPTY_STAGE,
      chapter: save?.chapter ?? { title: '', subtitle: '' },
      roster: save?.roster ?? [],
      scudi: save?.scudi ?? 0,
      armory: save?.armory ?? [],
      completedBattles: save?.completedBattles ?? [],
    });
    if (save) {
      this.playMsBefore = save.playMs;
      this.lastStep = save.lastStep;
      if (save.battle && isBattleId(save.battle.id)) {
        this.startBattle(save.battle.id, save.battle.state);
      } else if (save.lastStep?.kind === 'line') {
        this.show({ kind: 'story', line: save.lastStep, choices: null, card: null });
      } else {
        this.advance();
      }
    } else {
      this.advance();
    }
  }

  static load(lib: Library, slot: SlotId): GameSession | null {
    const save = readSave<CampaignSave>(slot);
    if (!save || save.version !== CAMPAIGN_SAVE_VERSION) return null;
    try {
      return new GameSession(lib, save);
    } catch {
      return null;
    }
  }

  get state(): SessionView {
    return this.view.get();
  }

  /** Tap on the story screen: dismiss a chapter card or move to the next line. */
  advance(): void {
    for (let guard = 0; guard < 500; guard++) {
      const step = this.runner.next();
      if (step.kind === 'line') {
        this.lastStep = step;
        this.show({ kind: 'story', line: step, choices: null, card: null });
        return;
      }
      if (step.kind === 'choices') {
        this.lastStep = null;
        this.show({ kind: 'story', line: this.currentLine(), choices: step.choices, card: null });
        return;
      }
      if (step.kind === 'end') {
        this.show({ kind: 'end' });
        return;
      }
      if (this.runCommand(step.name, step.args)) return;
    }
    throw new Error(
      'Story ran 500 commands without showing anything; check the script for a loop.',
    );
  }

  choose(index: number): void {
    this.runner.choose(index);
    this.advance();
    this.autosave();
  }

  /** Called by the battle screen when a battle ends or the player leaves it. */
  finishBattle(outcome: 'victory' | 'defeat' | 'quit', state: BattleState): void {
    const screen = this.state.screen;
    if (screen.kind !== 'battle') return;
    if (outcome === 'quit') {
      this.saveBattleProgress(state);
      this.show({ kind: 'title' });
      return;
    }
    if (outcome === 'defeat') {
      // Giving up after a defeat returns to the title; the autosave still holds the battle start.
      this.show({ kind: 'title' });
      return;
    }
    const { roster, lines } = applyBattleResults(this.lib, this.state.roster, state);
    const reward = 100 + 25 * state.units.filter((u) => u.side === 'enemy' && u.defeated).length;
    const completedBattles = this.state.completedBattles.includes(screen.battleId)
      ? this.state.completedBattles
      : [...this.state.completedBattles, screen.battleId];
    this.patch({ roster, scudi: this.state.scudi + reward, completedBattles });
    this.runner.setVar('last_battle', screen.battleId);
    unlockAchievement(BATTLE_ACHIEVEMENTS[screen.battleId]);
    this.show({
      kind: 'results',
      battleId: screen.battleId,
      lines: [`+${reward} scudi`, ...lines],
    });
    this.autosave();
  }

  closeResults(): void {
    this.advance();
    this.autosave();
  }

  closePrep(roster: readonly RosterEntry[], scudi: number, armory: readonly string[]): void {
    this.patch({ roster, scudi, armory });
    this.advance();
    this.autosave();
  }

  /** Keeps a mid-battle snapshot so Continue resumes exactly where the player left off. */
  saveBattleProgress(state: BattleState): void {
    const screen = this.state.screen;
    if (screen.kind !== 'battle') return;
    this.write('auto', { id: screen.battleId, state });
  }

  saveTo(slot: SlotId): boolean {
    const screen = this.state.screen;
    return this.write(slot, screen.kind === 'battle' ? { id: screen.battleId } : null);
  }

  autosave(): void {
    const screen = this.state.screen;
    this.write('auto', screen.kind === 'battle' ? { id: screen.battleId } : null);
  }

  getVar(name: string): unknown {
    return this.runner.getVar(name);
  }

  // ── internals ──────────────────────────────────────────────────────────────

  /** Runs one script command. Returns true if it put something on screen (stop advancing). */
  private runCommand(name: string, args: readonly string[]): boolean {
    switch (name) {
      case 'chapter': {
        const chapter = { title: args[0] ?? '', subtitle: args[1] ?? '' };
        this.patch({ chapter });
        this.show({ kind: 'story', line: null, choices: null, card: chapter });
        this.autosave();
        return true;
      }
      case 'stage':
        this.patch({ stage: { map: args[0] ?? null, actors: {} } });
        return false;
      case 'actor': {
        const [id, x, y, facing] = args;
        if (!id) return false;
        const f = FACINGS.includes(facing as Facing) ? (facing as Facing) : 'south';
        const actors = {
          ...this.state.stage.actors,
          [id]: { x: Number(x ?? 0), y: Number(y ?? 0), facing: f },
        };
        this.patch({ stage: { ...this.state.stage, actors } });
        return false;
      }
      case 'exit': {
        const actors = { ...this.state.stage.actors };
        for (const id of args) delete actors[id];
        this.patch({ stage: { ...this.state.stage, actors } });
        return false;
      }
      case 'join': {
        const [id, frame, weapon] = args;
        if (!id || this.state.roster.some((r) => r.characterId === id)) return false;
        const entry = newRosterEntry(this.lib, id, frame, weapon);
        const armory = [...new Set([...this.state.armory, entry.frame, entry.weapon])];
        this.patch({ roster: [...this.state.roster, entry], armory });
        return false;
      }
      case 'leave':
        this.patch({ roster: this.state.roster.filter((r) => !args.includes(r.characterId)) });
        return false;
      case 'scudi':
        this.patch({ scudi: this.state.scudi + Number(args[0] ?? 0) });
        return false;
      case 'battle': {
        const id = args[0] ?? '';
        if (!isBattleId(id)) throw new Error(`Story asked for unknown battle "${id}"`);
        this.startBattle(id);
        this.autosave();
        return true;
      }
      case 'prep':
        this.show({ kind: 'prep' });
        return true;
      case 'save':
        this.autosave();
        return false;
      case 'end':
        unlockAchievement(ENDING_ACHIEVEMENTS[String(this.runner.getVar('route'))]);
        this.show({ kind: 'end' });
        this.autosave();
        return true;
      default:
        console.warn(`Unknown story command "${name}"`);
        return false;
    }
  }

  private startBattle(id: string, initial?: BattleState): void {
    if (!isBattleId(id)) return;
    const setup = loadBattle(id, this.lib, this.state.roster);
    this.battleCounter += 1;
    this.show({
      kind: 'battle',
      battleId: id,
      setup,
      ...(initial ? { initial } : {}),
      key: this.battleCounter,
    });
  }

  private currentLine(): Extract<StoryStep, { kind: 'line' }> | null {
    const s = this.state.screen;
    return s.kind === 'story' ? s.line : null;
  }

  private show(screen: Screen): void {
    this.patch({ screen });
  }

  private patch(p: Partial<SessionView>): void {
    this.view.set({ ...this.view.get(), ...p });
  }

  private write(slot: SlotId, battle: CampaignSave['battle']): boolean {
    const s = this.state;
    const save: CampaignSave = {
      version: CAMPAIGN_SAVE_VERSION,
      ink: this.runner.saveState(),
      roster: s.roster,
      scudi: s.scudi,
      armory: s.armory,
      completedBattles: s.completedBattles,
      stage: s.stage,
      chapter: s.chapter,
      lastStep: this.lastStep,
      battle,
      savedAt: Date.now(),
      playMs: this.playMsBefore + (Date.now() - this.startedAt),
    };
    return writeSave(slot, save);
  }
}
