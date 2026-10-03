import type { BattleSetup, BattleState, Facing, StatName } from '@m1565/core';
import { deserializeBattle } from '@m1565/core';
import type { Library, ShopItem } from '@m1565/content';
import { battleSalvage, isBattleId, loadBattle } from '@m1565/content';
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
import type { Holdings, ItemKind, Stores } from './inventory';
import { addItem, buy, equip, release, sell, swap } from './inventory';
import { migrateCampaign } from './migrate';
import { applyBattleResults, newRosterEntry, raiseRosterStat, withProgress } from './progression';
import type {
  CampaignSave,
  ChapterInfo,
  CharacterProgress,
  RosterEntry,
  StageState,
} from './types';
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
  /** Spare items: armaturas, weapons, charms and amulets nobody has fitted. */
  readonly stores: Stores;
  /** Progress of named allies who haven't joined the company yet. */
  readonly veterans: Readonly<Record<string, CharacterProgress>>;
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
      roster: (save?.roster ?? []).map((r) => normalizeEntry(lib, r)),
      scudi: save?.scudi ?? 0,
      stores: save?.stores ?? {},
      veterans: save?.veterans ?? {},
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
    const raw = readSave<Record<string, unknown>>(slot);
    const save = raw ? migrateCampaign(lib, raw) : null;
    if (!save) return null;
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
    const { roster, veterans, lines } = applyBattleResults(
      this.lib,
      this.state.roster,
      state,
      this.state.veterans,
    );
    // Scudi: a purse for the victory, more for every enemy brought down (and for veterans), and
    // a bonus if nobody on the player's side fell.
    const b = this.lib.balance;
    const fallen = state.units.filter((u) => u.side === 'enemy' && u.defeated);
    const noLosses = !state.units.some((u) => u.side === 'player' && u.defeated);
    const reward =
      b.rewardVictory +
      fallen.reduce((n, u) => n + b.rewardPerEnemy + b.rewardPerEnemyLevel * u.level, 0) +
      (noLosses ? b.rewardNoLosses : 0);
    const firstWin = !this.state.completedBattles.includes(screen.battleId);
    const completedBattles = firstWin
      ? [...this.state.completedBattles, screen.battleId]
      : this.state.completedBattles;
    // Armaturas recovered from the field, once per battle.
    const salvage = firstWin ? battleSalvage(screen.battleId) : [];
    let stores = this.state.stores;
    for (const id of salvage) stores = addItem(stores, 'frame', id);
    const salvaged = salvage.map(
      (id) => `Salvaged armatura: ${this.lib.frames.get(id)?.name ?? id}`,
    );
    this.patch({
      roster,
      veterans,
      stores,
      scudi: this.state.scudi + reward,
      completedBattles,
    });
    this.runner.setVar('last_battle', screen.battleId);
    unlockAchievement(BATTLE_ACHIEVEMENTS[screen.battleId]);
    this.show({
      kind: 'results',
      battleId: screen.battleId,
      lines: [`+${reward} scudi`, ...salvaged, ...lines],
    });
    this.autosave();
  }

  /** Spends a pilot's unspent stat point between battles. */
  raiseStat(characterId: string, stat: StatName): void {
    this.patch({
      roster: raiseRosterStat(this.state.roster, characterId, stat, this.lib.balance.statMax),
    });
    this.autosave();
  }

  closeResults(): void {
    this.advance();
    this.autosave();
  }

  closePrep(): void {
    this.advance();
    this.autosave();
  }

  /** Fits a spare item to a pilot (or takes off a charm/amulet with null). */
  equipItem(characterId: string, kind: ItemKind, id: string | null): void {
    this.applyHoldings(equip(this.lib, this.holdings(), characterId, kind, id));
  }

  /** Takes the item another pilot has in this slot; they get this pilot's in exchange. */
  swapItem(toId: string, fromId: string, kind: ItemKind): void {
    this.applyHoldings(swap(this.lib, this.holdings(), toId, fromId, kind));
  }

  buyItem(item: ShopItem): void {
    this.applyHoldings(buy(this.lib, this.holdings(), item));
  }

  sellItem(kind: ItemKind, id: string): void {
    this.applyHoldings(sell(this.lib, this.holdings(), kind, id));
  }

  private holdings(): Holdings {
    const { roster, stores, scudi } = this.state;
    return { roster, stores, scudi };
  }

  private applyHoldings(h: Holdings): void {
    this.patch({ roster: h.roster, stores: h.stores, scudi: h.scudi });
    this.autosave();
  }

  /**
   * `?armoury` (testing and design): a small company part-way through Act I, standing in the
   * Armoury with a purse to spend.
   */
  openArmouryDemo(): void {
    const roster = [
      { ...newRosterEntry(this.lib, 'ninu'), level: 6, statPoints: 2 },
      { ...newRosterEntry(this.lib, 'kateri'), level: 5 },
      { ...newRosterEntry(this.lib, 'luis'), level: 6 },
      { ...newRosterEntry(this.lib, 'deniz'), level: 5 },
    ];
    this.patch({
      roster,
      scudi: 1500,
      stores: { 'weapon:pike': 1, 'charm:charm-pow-1': 1, 'frame:moschetta': 1, 'frame:levend': 1 },
      completedBattles: [
        'b1-marsaxlokk',
        'b2-marsa-wells',
        'b3-sciberras',
        'b4-night-crossing',
        'b5-tigne',
      ],
    });
    this.show({ kind: 'prep' });
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
        // New pilots arrive with their own armatura and weapon fitted, and keep any level and
        // XP they earned fighting alongside the company before joining.
        const entry = withProgress(
          newRosterEntry(this.lib, id, frame, weapon),
          this.state.veterans[id],
        );
        const veterans = { ...this.state.veterans };
        delete veterans[id];
        this.patch({ roster: [...this.state.roster, entry], veterans });
        return false;
      }
      case 'leave': {
        let h = this.holdings();
        for (const id of args) h = release(this.lib, h, id);
        this.patch({ roster: h.roster, stores: h.stores });
        return false;
      }
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

  private startBattle(id: string, saved?: BattleState): void {
    if (!isBattleId(id)) return;
    // A snapshot from older rules can't resume; the battle restarts from its beginning.
    let initial: BattleState | undefined;
    try {
      initial = saved ? deserializeBattle(JSON.stringify(saved)) : undefined;
    } catch {
      initial = undefined;
    }
    const setup = loadBattle(id, this.lib, this.state.roster, this.state.veterans);
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
      stores: s.stores,
      veterans: s.veterans,
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

/** Fills any attribute or slot a save lacks from the character's base values. */
function normalizeEntry(lib: Library, r: RosterEntry): RosterEntry {
  const base = lib.characters.get(r.characterId)?.stats;
  const filled = { charm: null, amulet: null, ...r };
  return base ? { ...filled, stats: { ...base, ...r.stats } } : filled;
}
