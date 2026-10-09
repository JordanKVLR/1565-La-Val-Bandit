import type {
  Attack,
  AttackForecast,
  AttackStyle,
  BattleEvent,
  BattleSetup,
  BattleState,
  Command,
  Coord,
  Facing,
  Reach,
  Reaction,
  ReactionChoice,
  StatName,
  StrikeResult,
  UnitState,
} from '@m1565/core';
import {
  activeUnit,
  applyCommand,
  attackInRange,
  attackRange,
  reactionChoices,
  attackBackOptions,
  chooseReaction,
  CommandError,
  coordKey,
  createBattle,
  findUnit,
  forecastAttack,
  livingUnits,
  meetsRequirements,
  unitStats,
  planAiTurn,
  reachableTiles,
  unitAt,
  unlockedAttacks,
} from '@m1565/core';
import type { BarkSet, Library } from '@m1565/content';
import { t } from '../i18n';
import type { XpGain } from '../ui/battle/XpPanel';
import type { FigureSpec } from '../render/Armatura';
import { figureSpec } from '../render/Armatura';
import { ARROW_COLORS, SIDE_COLORS } from '../render/palette';
import type { HighlightKind, UnitVisual } from '../render/BattleView';
import { sfx } from '../platform/audio';
import { gameplayPause } from '../state/pause';
import { settings } from '../state/settings';
import { Store } from '../state/store';
import type { CursorDir, ScreenCorners } from './cursor';
import { cycleUnit, DEFAULT_CORNERS, stepCursor } from './cursor';

/** What the renderer must offer the controller. Keeps the controller testable without WebGL. */
export interface BattleRenderer {
  syncUnits(list: readonly UnitVisual[]): void;
  animateMove(id: string, path: readonly Coord[], msPerTile: number): Promise<void>;
  setHighlights(layers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }>): void;
  select(c: Coord | undefined): void;
  focus(c: Coord, ms?: number): Promise<void>;
  shake(id: string): void;
  /** Which facing points to each screen corner, so the cursor arrows follow the camera. */
  screenFacings?(): ScreenCorners;
  /** Pans just enough to keep a tile on screen (the keyboard/gamepad cursor). */
  reveal?(c: Coord): void;
}

export interface CloseUpSide {
  readonly id: string;
  readonly name: string;
  readonly side: UnitState['side'];
  readonly initial: string;
  readonly weapon: string;
  readonly figure: FigureSpec;
  readonly maxHp: number;
  readonly hpBefore: number;
}

export interface CloseUpStrike {
  readonly result: StrikeResult;
  readonly style: AttackStyle;
  /** Power and reach of the technique, so the duel can animate it to match. */
  readonly power: number;
  readonly reach: number;
  readonly bark: string;
  readonly reply: string;
  /** Set when this strike levelled the striker up. */
  readonly levelUp?: number;
  /** The attacker's blow that a successful Counter turned aside. */
  readonly repelled?: boolean;
  /** The blow a successful Counter drove back into the attacker. */
  readonly reflected?: boolean;
}

export interface CloseUpData {
  readonly left: CloseUpSide;
  readonly right: CloseUpSide;
  readonly attackName: string;
  /** The technique the defender strikes back with, if it does. */
  readonly backName?: string;
  readonly reaction: Reaction;
  readonly strikes: readonly CloseUpStrike[];
  readonly counter?: { readonly success: boolean; readonly chance: number };
}

/** An attack as the attack menu shows it. */
export interface AttackOption {
  readonly attack: Attack;
  readonly unlocked: boolean;
  readonly affordable: boolean;
  readonly targets: readonly string[];
}

export type Mode =
  | { readonly kind: 'busy' }
  | { readonly kind: 'command' }
  | {
      readonly kind: 'move';
      readonly reach: ReadonlyMap<string, Reach>;
      /** Tile picked with the first tap; a second tap (or Move here) commits. */
      readonly pending?: { readonly to: Coord; readonly cost: number };
    }
  | { readonly kind: 'attackMenu' }
  | { readonly kind: 'target'; readonly attackId: string; readonly targets: readonly string[] }
  | {
      readonly kind: 'forecast';
      readonly attackId: string;
      readonly targetId: string;
      readonly forecast: AttackForecast;
    }
  | { readonly kind: 'facing' }
  | {
      readonly kind: 'reaction';
      readonly attackerId: string;
      readonly defenderId: string;
      readonly forecast: AttackForecast;
      /** Every reaction, usable or not, so the player always sees the full menu. */
      readonly choices: readonly ReactionChoice[];
    }
  | { readonly kind: 'closeUp'; readonly data: CloseUpData }
  | { readonly kind: 'xp'; readonly gains: readonly XpGain[] }
  | { readonly kind: 'levelUp'; readonly unitId: string }
  | { readonly kind: 'ended'; readonly outcome: 'victory' | 'defeat' };

interface ReactionAnswer {
  readonly reaction: Reaction;
  readonly backAttackId?: string;
}

export interface BattleView {
  readonly state: BattleState;
  readonly mode: Mode;
  /** Tile the player last tapped, for the terrain/unit readout. */
  readonly inspected: Coord | undefined;
  readonly log: readonly string[];
  /** Short announcements (e.g. a newly learned technique), newest last. */
  readonly notices: readonly { readonly id: number; readonly text: string }[];
}

/**
 * Waits `ms`, then for as long as gameplay is paused (app suspended, controller disconnected):
 * the AI's pacing pauses go through here, so an enemy turn holds between its steps.
 */
const delay = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms)).then(() => gameplayPause.whenRunning());
const pickLine = (lines: readonly string[]) =>
  lines[Math.floor(Math.random() * lines.length)] ?? '';

/**
 * Runs one battle for the UI: turns rules-engine events into animations, drives AI turns and
 * asks the player for decisions. All rule decisions stay in @m1565/core.
 */
export class BattleController {
  readonly view: Store<BattleView>;
  private renderer: BattleRenderer | undefined;
  private pendingReaction: ((answer: ReactionAnswer) => void) | undefined;
  private pendingCloseUp: (() => void) | undefined;
  private pendingLevelUp: (() => void) | undefined;
  private pendingXp: (() => void) | undefined;
  private running = false;
  private disposed = false;
  /** The keyboard/gamepad tile cursor; follows taps and mouse hover too. */
  private cursorPos: Coord | undefined;

  constructor(
    private readonly setup: BattleSetup,
    private readonly lib: Library,
    private readonly onFinish?: (outcome: 'victory' | 'defeat', state: BattleState) => void,
    initial?: BattleState,
  ) {
    const state = initial ?? createBattle(setup).state;
    this.view = new Store<BattleView>({
      state,
      mode: { kind: 'busy' },
      inspected: undefined,
      log: [],
      notices: [],
    });
  }

  get state(): BattleState {
    return this.view.get().state;
  }

  get mode(): Mode {
    return this.view.get().mode;
  }

  attach(renderer: BattleRenderer): void {
    this.renderer = renderer;
    this.syncUnits();
    void this.beginTurn();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer = undefined;
  }

  retry(): void {
    this.patch({ state: createBattle(this.setup).state, mode: { kind: 'busy' }, log: [] });
    this.syncUnits();
    void this.beginTurn();
  }

  // ── Player input ────────────────────────────────────────────────────────────

  tapTile(c: Coord): void {
    this.cursorPos = c;
    const mode = this.mode;
    if (mode.kind === 'move') {
      const reach = mode.reach.get(coordKey(c));
      if (reach && reach.path.length > 0) {
        // First tap previews the path and its AP cost; tapping the same tile again moves.
        if (mode.pending && coordKey(mode.pending.to) === coordKey(c)) this.confirmMove();
        else this.previewMove(c, reach);
        return;
      }
      // Tapping outside the range just inspects the tile; the range stays up.
      if (mode.pending) this.patch({ mode: { kind: 'move', reach: mode.reach } });
      this.showMoveRange(mode.reach);
    } else if (mode.kind === 'command') {
      // After moving, the main attack's targets are already marked: tapping one opens its forecast.
      const target = unitAt(this.state, c);
      const basic = this.basicOption();
      if (target && basic && basic.targets.includes(target.id)) {
        this.showForecast(basic.attack.id, target.id);
        return;
      }
    } else if (mode.kind === 'target' || mode.kind === 'forecast') {
      const target = unitAt(this.state, c);
      const targets =
        mode.kind === 'target' ? mode.targets : this.targetsFor(this.active()!, mode.attackId);
      if (target && targets.includes(target.id)) {
        if (mode.kind === 'forecast' && target.id === mode.targetId) this.confirmAttack();
        else this.showForecast(mode.attackId, target.id);
        return;
      }
      if (mode.kind === 'target') this.chooseAttack();
    }
    this.patch({ inspected: c });
    this.renderer?.select(c);
  }

  chooseMove(): void {
    const unit = this.active();
    if (!unit || this.mode.kind !== 'command' || !this.canMove()) return;
    sfx('select');
    this.enterMove();
  }

  /** PC: the mouse over a tile previews the route there (so one click then moves). */
  hoverTile(c: Coord | null): void {
    if (c) this.cursorPos = c;
    const mode = this.mode;
    if (mode.kind !== 'move') return;
    const reach = c ? mode.reach.get(coordKey(c)) : undefined;
    if (c && reach && reach.path.length > 0) {
      if (mode.pending && coordKey(mode.pending.to) === coordKey(c)) return;
      this.previewMove(c, reach, false);
    } else if (mode.pending) {
      this.patch({ mode: { kind: 'move', reach: mode.reach } });
      this.showMoveRange(mode.reach);
    }
  }

  private enterMove(): void {
    const unit = this.active();
    if (!unit) return;
    const reach = reachableTiles(this.state, unit);
    this.patch({ mode: { kind: 'move', reach } });
    this.showMoveRange(reach);
  }

  private showMoveRange(reach: ReadonlyMap<string, Reach>, path?: readonly Coord[]): void {
    const unit = this.active();
    if (!unit) return;
    this.highlight([
      {
        kind: 'move',
        tiles: [...reach.values()].map((r) => r.path[r.path.length - 1] ?? unit.pos),
      },
      // Enemies already in reach of the main attack, before moving at all.
      ...(path ? [] : this.basicTargetLayer()),
      ...(path ? [{ kind: 'path' as const, tiles: path }] : []),
    ]);
  }

  /** The main attack, if it can be used now and has someone to hit. */
  private basicOption(): AttackOption | undefined {
    if (!this.canAttack()) return undefined;
    return this.attackOptions().find((o) => o.unlocked && o.affordable && o.targets.length > 0);
  }

  private basicTargetLayer(): { kind: HighlightKind; tiles: Coord[] }[] {
    const basic = this.basicOption();
    return basic
      ? [{ kind: 'target', tiles: basic.targets.map((id) => findUnit(this.state, id)!.pos) }]
      : [];
  }

  private previewMove(to: Coord, reach: Reach, sound = true): void {
    if (this.mode.kind !== 'move') return;
    if (sound) sfx('select');
    this.patch({ mode: { ...this.mode, pending: { to, cost: reach.cost } }, inspected: to });
    this.renderer?.select(to);
    this.showMoveRange(this.mode.reach, reach.path);
  }

  /** Moves to the tile picked in move mode. */
  confirmMove(): void {
    const mode = this.mode;
    if (mode.kind !== 'move' || !mode.pending) return;
    void this.run({ type: 'move', unitId: this.activeId(), to: mode.pending.to });
  }

  /** Opens the list of techniques. */
  chooseAttack(): void {
    const unit = this.active();
    if (
      !unit ||
      !['command', 'move', 'target', 'forecast'].includes(this.mode.kind) ||
      !this.canAttack()
    )
      return;
    sfx('select');
    this.patch({ mode: { kind: 'attackMenu' } });
    this.highlight([]);
  }

  /** Picks a technique from the menu; enemies in its reach light up. */
  chooseTechnique(attackId: string): void {
    const unit = this.active();
    const option = this.attackOptions().find((o) => o.attack.id === attackId);
    if (
      !unit ||
      this.mode.kind !== 'attackMenu' ||
      !option?.unlocked ||
      !option.affordable ||
      !option.targets.length
    )
      return;
    sfx('select');
    this.patch({ mode: { kind: 'target', attackId, targets: option.targets } });
    this.highlight([
      { kind: 'range', tiles: this.rangeTiles(unit, option.attack) },
      { kind: 'target', tiles: option.targets.map((id) => findUnit(this.state, id)!.pos) },
    ]);
  }

  confirmAttack(): void {
    const mode = this.mode;
    if (mode.kind !== 'forecast') return;
    const reaction = this.defenderReaction(mode.targetId, mode.attackId);
    void this.run({
      type: 'attack',
      unitId: this.activeId(),
      targetId: mode.targetId,
      reaction,
      attackId: mode.attackId,
    });
  }

  undoMove(): void {
    if (this.mode.kind !== 'command' || !this.canUndo()) return;
    void this.run({ type: 'undoMove', unitId: this.activeId() });
  }

  chooseEndTurn(): void {
    if (this.mode.kind !== 'command' && this.mode.kind !== 'move') return;
    this.patch({ mode: { kind: 'facing' } });
    this.highlight([]);
  }

  chooseFacing(facing: Facing): void {
    if (this.mode.kind !== 'facing') return;
    void this.run({ type: 'endTurn', unitId: this.activeId(), facing });
  }

  /** Back out of a sub-mode to the previous step. */
  cancel(): void {
    const mode = this.mode;
    const k = mode.kind;
    if (k === 'target' || k === 'forecast') this.chooseAttack();
    else if (k === 'move' && mode.pending) {
      this.patch({ mode: { kind: 'move', reach: mode.reach } });
      this.showMoveRange(mode.reach);
    } else if (k === 'move') this.toCommand();
    else if (k === 'attackMenu' || k === 'facing') this.resumeTurn();
  }

  // ── Keyboard / gamepad cursor ───────────────────────────────────────────────

  /** The tile under the keyboard/gamepad cursor, if any. */
  cursor(): Coord | undefined {
    return this.cursorPos;
  }

  /** Whether the map takes cursor input now (the player is choosing a tile). */
  cursorActive(): boolean {
    return (
      this.active()?.controller === 'human' &&
      ['command', 'move', 'target', 'forecast'].includes(this.mode.kind)
    );
  }

  /**
   * Moves the cursor one tile in a screen direction. In move mode the route there previews,
   * as with a mouse hover. Returns false when the map is not taking cursor input.
   */
  moveCursor(dir: CursorDir): boolean {
    if (!this.cursorActive()) return false;
    const from = this.cursorPos ?? this.view.get().inspected ?? this.active()!.pos;
    const corners = this.renderer?.screenFacings?.() ?? DEFAULT_CORNERS;
    this.pointCursor(stepCursor(from, dir, corners, this.state.map));
    return true;
  }

  /**
   * Jumps the cursor to the next (1) or previous (−1) unit on the field; while choosing a
   * target, only through the enemies the technique can reach.
   */
  cycleCursor(step: 1 | -1): boolean {
    if (!this.cursorActive()) return false;
    const mode = this.mode;
    const ids =
      mode.kind === 'target'
        ? mode.targets
        : mode.kind === 'forecast'
          ? this.targetsFor(this.active()!, mode.attackId)
          : undefined;
    const units = livingUnits(this.state).filter((u) => !ids || ids.includes(u.id));
    const to = cycleUnit(units, this.cursorPos, step);
    if (to) this.pointCursor(to);
    return true;
  }

  /**
   * Acts on the tile under the cursor, like tapping it, with two shortcuts for pads: on your own
   * unit it opens Move, and in a forecast it confirms the attack unless the cursor picked
   * another target.
   */
  confirmCursor(): boolean {
    if (!this.cursorActive()) return false;
    const mode = this.mode;
    const c = this.cursorPos;
    if (mode.kind === 'move' && mode.pending) {
      this.confirmMove();
    } else if (mode.kind === 'forecast') {
      const t = c && unitAt(this.state, c);
      if (
        t &&
        t.id !== mode.targetId &&
        this.targetsFor(this.active()!, mode.attackId).includes(t.id)
      )
        this.tapTile(c);
      else this.confirmAttack();
    } else if (mode.kind === 'target') {
      // Only a marked enemy does anything; elsewhere the cursor just reads the tile.
      const t = c && unitAt(this.state, c);
      if (t && mode.targets.includes(t.id)) this.tapTile(c);
    } else if (
      mode.kind === 'command' &&
      c &&
      unitAt(this.state, c)?.id === this.activeId() &&
      this.canMove()
    ) {
      this.chooseMove();
    } else if (c) {
      this.tapTile(c);
    }
    return true;
  }

  private pointCursor(c: Coord): void {
    this.cursorPos = c;
    // In move mode this previews the route (or clears it off the range), like a mouse hover.
    this.hoverTile(c);
    if (this.mode.kind !== 'move' || !this.mode.pending) this.patch({ inspected: c });
    this.renderer?.select(c);
    this.renderer?.reveal?.(c);
  }

  /** The player's answer to an enemy attack; with Attack back, the technique to strike with. */
  chooseReaction(r: Reaction, backAttackId?: string): void {
    const resolve = this.pendingReaction;
    const mode = this.mode;
    if (!resolve || mode.kind !== 'reaction') return;
    if (!mode.choices.some((c) => c.reaction === r && c.available)) return;
    if (r === 'attackBack' && backAttackId !== undefined) {
      const defender = findUnit(this.state, mode.defenderId);
      const attacker = findUnit(this.state, mode.attackerId);
      const ok =
        defender &&
        attacker &&
        attackBackOptions(this.state, defender, attacker.pos).some(
          (o) => o.available && o.attack.id === backAttackId,
        );
      if (!ok) return;
    }
    this.pendingReaction = undefined;
    resolve({ reaction: r, ...(r === 'attackBack' && backAttackId ? { backAttackId } : {}) });
  }

  finishCloseUp(): void {
    const resolve = this.pendingCloseUp;
    this.pendingCloseUp = undefined;
    resolve?.();
  }

  /** Spends one of a unit's stat points. Works whenever the unit has points to spend. */
  raiseStat(unitId: string, stat: StatName): void {
    try {
      const before = findUnit(this.state, unitId);
      const known = new Set(before ? unlockedAttacks(before).map((a) => a.id) : []);
      const { state } = applyCommand(this.state, { type: 'raiseStat', unitId, stat });
      sfx('tap');
      this.patch({ state });
      const after = findUnit(state, unitId);
      for (const a of after ? unlockedAttacks(after) : []) {
        if (!known.has(a.id))
          this.notify(t('log.learnedTechnique', { name: after!.name, technique: a.name }));
      }
    } catch (e) {
      if (!(e instanceof CommandError)) throw e;
    }
  }

  /** Dismisses the experience pop-up. */
  finishXp(): void {
    const resolve = this.pendingXp;
    this.pendingXp = undefined;
    resolve?.();
  }

  finishLevelUp(): void {
    const resolve = this.pendingLevelUp;
    this.pendingLevelUp = undefined;
    resolve?.();
  }

  // ── Queries for the UI ─────────────────────────────────────────────────────

  active(): UnitState | undefined {
    return activeUnit(this.state);
  }

  canMove(): boolean {
    const t = this.state.turn;
    const u = this.active();
    return !!t && !!u && !t.moved && !t.acted && u.fp < this.state.balance.fpMax;
  }

  canAttack(): boolean {
    const t = this.state.turn;
    const u = this.active();
    return (
      !!t &&
      !!u &&
      !t.acted &&
      u.fp < this.state.balance.fpMax &&
      this.attackOptions().some((o) => o.unlocked && o.affordable && o.targets.length > 0)
    );
  }

  canUndo(): boolean {
    const t = this.state.turn;
    return !!t && t.moved && !t.acted;
  }

  /** Every technique of the active unit, with whether it can be used right now. */
  attackOptions(): AttackOption[] {
    const unit = this.active();
    if (!unit) return [];
    // Requirements count gear bonuses, as the rules engine does.
    const stats = unitStats(unit);
    return unit.attacks.map((attack) => ({
      attack,
      unlocked: meetsRequirements(stats, attack),
      affordable: unit.ap >= attack.apCost,
      targets: this.targetsFor(unit, attack.id),
    }));
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private activeId(): string {
    return this.state.turn?.unitId ?? '';
  }

  private targetsFor(unit: UnitState, attackId: string): string[] {
    const attack = unit.attacks.find((a) => a.id === attackId);
    if (!attack) return [];
    return livingUnits(this.state)
      .filter((u) => u.side !== unit.side && attackInRange(attack, unit.weapon, unit.pos, u.pos))
      .map((u) => u.id);
  }

  private rangeTiles(unit: UnitState, attack: Attack): Coord[] {
    const out: Coord[] = [];
    const { width, depth } = this.state.map;
    for (let y = 0; y < depth; y++) {
      for (let x = 0; x < width; x++)
        if (attackInRange(attack, unit.weapon, unit.pos, { x, y })) out.push({ x, y });
    }
    return out;
  }

  private attackOf(unit: UnitState, attackId: string): Attack {
    return unit.attacks.find((a) => a.id === attackId) ?? unit.attacks[0]!;
  }

  private defenderReaction(targetId: string, attackId: string): Reaction {
    return chooseReaction(this.state, targetId, this.activeId(), attackId);
  }

  private showForecast(attackId: string, targetId: string): void {
    const unit = this.active();
    const target = findUnit(this.state, targetId);
    if (!unit || !target) return;
    const forecast = forecastAttack(
      this.state,
      unit,
      target,
      unit.pos,
      this.attackOf(unit, attackId),
    );
    this.patch({ mode: { kind: 'forecast', attackId, targetId, forecast }, inspected: target.pos });
    this.renderer?.select(target.pos);
  }

  /** The command menu, with the main attack's reach and targets marked if it can strike. */
  private toCommand(): void {
    this.patch({ mode: { kind: 'command' } });
    const unit = this.active();
    const basic = this.basicOption();
    this.highlight(
      unit && basic
        ? [
            { kind: 'range', tiles: this.rangeTiles(unit, basic.attack) },
            ...this.basicTargetLayer(),
          ]
        : [],
    );
  }

  /** Back to the player's turn: the movement range if the unit can still move, else the menu. */
  private resumeTurn(): void {
    if (this.canMove()) this.enterMove();
    else this.toCommand();
  }

  /** Escape objectives stay highlighted under whatever else is shown. */
  private highlight(layers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }>): void {
    const goals = this.state.victory.flatMap((v) => (v.type === 'escape' ? v.tiles : []));
    this.renderer?.setHighlights(
      goals.length ? [{ kind: 'goal', tiles: goals }, ...layers] : layers,
    );
  }

  private patch(p: Partial<BattleView>): void {
    this.view.set({ ...this.view.get(), ...p });
  }

  private speed(): number {
    return settings.get().battleSpeed;
  }

  private syncUnits(): void {
    const activeId = this.state.turn?.unitId;
    this.renderer?.syncUnits(
      livingUnits(this.state).map((u) => ({
        id: u.id,
        label: u.name.charAt(0),
        color: SIDE_COLORS[u.side],
        arrowColor: ARROW_COLORS[u.side],
        hp: u.hp,
        maxHp: u.maxHp,
        active: u.id === activeId,
        enemy: u.side === 'enemy',
        at: u.pos,
        facing: u.facing,
        figure: figureSpec(this.lib, u, SIDE_COLORS[u.side]),
      })),
    );
  }

  /** Starts whatever the current turn needs: the player's menu, or an AI turn. */
  private async beginTurn(): Promise<void> {
    if (this.disposed) return;
    const state = this.state;
    if (state.outcome !== 'ongoing') {
      sfx(state.outcome === 'victory' ? 'victory' : 'loss');
      this.patch({ mode: { kind: 'ended', outcome: state.outcome } });
      this.onFinish?.(state.outcome, state);
      return;
    }
    const unit = this.active();
    if (!unit) return;
    this.syncUnits();
    this.highlight([]);
    await this.renderer?.focus(unit.pos, 300 / this.speed());
    if (unit.controller === 'human') {
      if (unit.fp >= state.balance.fpMax) {
        this.notify(t('log.fainted', { name: unit.name }));
      }
      // The active unit is selected for the player, its movement range already showing.
      this.cursorPos = unit.pos;
      this.renderer?.select(unit.pos);
      this.resumeTurn();
    } else {
      this.patch({ mode: { kind: 'busy' } });
      await this.runAiTurn(unit.id);
    }
  }

  private async runAiTurn(unitId: string): Promise<void> {
    await delay(250 / this.speed());
    const plan = planAiTurn(this.state, unitId);
    for (const planned of plan) {
      if (this.disposed || this.state.turn?.unitId !== unitId || this.state.outcome !== 'ongoing')
        break;
      let cmd: Command = planned;
      if (cmd.type === 'attack') {
        const defender = findUnit(this.state, cmd.targetId);
        // The AI strikes back with its main attack; the player picks the technique.
        const answer: ReactionAnswer =
          defender?.controller === 'human'
            ? await this.askReaction(unitId, cmd.targetId, cmd.attackId ?? 'basic')
            : { reaction: chooseReaction(this.state, cmd.targetId, unitId, cmd.attackId) };
        cmd = { ...cmd, ...answer };
      }
      if (!(await this.execute(cmd))) break;
      if (cmd.type !== 'endTurn') await delay(200 / this.speed());
    }
    if (this.disposed) return;
    // A rejected or interrupted plan still has to end the turn so the battle never stalls.
    if (this.state.outcome === 'ongoing' && this.state.turn?.unitId === unitId) {
      await this.execute({ type: 'endTurn', unitId });
    }
    await this.beginTurn();
  }

  private askReaction(
    attackerId: string,
    defenderId: string,
    attackId: string,
  ): Promise<ReactionAnswer> {
    const attacker = findUnit(this.state, attackerId)!;
    const defender = findUnit(this.state, defenderId)!;
    const attack = this.attackOf(attacker, attackId);
    // Always ask, even when "Do nothing" is the only option, so the player sees why.
    const choices = reactionChoices(this.state, defender, attacker, attacker.pos, attack);
    const forecast = forecastAttack(this.state, attacker, defender, attacker.pos, attack);
    this.renderer?.select(defender.pos);
    this.patch({ mode: { kind: 'reaction', attackerId, defenderId, forecast, choices } });
    return new Promise((resolve) => {
      this.pendingReaction = (answer) => {
        this.patch({ mode: { kind: 'busy' } });
        resolve(answer);
      };
    });
  }

  /** Player-issued command: execute, then continue the flow. */
  private async run(cmd: Command): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.patch({ mode: { kind: 'busy' } });
    this.highlight([]);
    await this.execute(cmd);
    this.running = false;
    if (this.disposed) return;
    const turnOver =
      cmd.type === 'endTurn' ||
      this.state.turn?.unitId !== cmd.unitId ||
      this.state.outcome !== 'ongoing';
    if (turnOver) await this.beginTurn();
    else this.resumeTurn();
  }

  /** Applies a command and plays its events. Returns false if the rules rejected it. */
  private async execute(cmd: Command): Promise<boolean> {
    const before = this.state;
    let result: { state: BattleState; events: BattleEvent[] };
    try {
      result = applyCommand(before, cmd);
    } catch (e) {
      if (e instanceof CommandError) {
        // Only a UI bug offers an illegal command; core's message is for developers.
        this.pushLog(t('log.rejected', { reason: e.message }));
        return false;
      }
      throw e;
    }
    for (const ev of result.events) await this.play(ev, before, result.events);
    this.patch({ state: result.state });
    this.syncUnits();
    // Experience earned in the exchange is shown until the player taps it away.
    const gains = xpGains(before, result.state, result.events);
    if (gains.length) await this.promptXp(gains);
    // Level-ups pause the battle so the player can spend their new stat points.
    for (const ev of result.events) {
      if (ev.type !== 'levelUp') continue;
      const unit = findUnit(this.state, ev.unitId);
      if (unit?.controller === 'human' && unit.statPoints > 0) await this.promptLevelUp(unit.id);
    }
    return true;
  }

  private promptXp(gains: readonly XpGain[]): Promise<void> {
    const previous = this.mode;
    this.patch({ mode: { kind: 'xp', gains } });
    return new Promise((resolve) => {
      this.pendingXp = () => {
        this.patch({ mode: previous.kind === 'xp' ? { kind: 'busy' } : previous });
        resolve();
      };
    });
  }

  private promptLevelUp(unitId: string): Promise<void> {
    const previous = this.mode;
    this.patch({ mode: { kind: 'levelUp', unitId } });
    return new Promise((resolve) => {
      this.pendingLevelUp = () => {
        this.patch({ mode: previous.kind === 'levelUp' ? { kind: 'busy' } : previous });
        resolve();
      };
    });
  }

  private async play(
    ev: BattleEvent,
    before: BattleState,
    all: readonly BattleEvent[],
  ): Promise<void> {
    const r = this.renderer;
    switch (ev.type) {
      case 'unitMoved':
        sfx('move');
        await r?.animateMove(ev.unitId, ev.path, 170 / this.speed());
        break;
      case 'attackResolved': {
        this.pushLog(describeAttack(before, ev));
        const first = ev.strikes[0];
        if (settings.get().closeUps) await this.playCloseUp(before, ev, all);
        else if (first) sfx(first.hit ? (ev.reaction === 'defend' ? 'defend' : 'hit') : 'miss');
        if (first) r?.shake(first.targetId);
        break;
      }
      case 'unitDefeated':
        sfx('defeat');
        this.pushLog(t('log.defeated', { name: findUnit(before, ev.unitId)?.name ?? ev.unitId }));
        break;
      case 'levelUp': {
        const unit = findUnit(before, ev.unitId);
        this.pushLog(t('log.levelUp', { name: unit?.name ?? ev.unitId, level: ev.level }));
        if (unit && ev.newSkills)
          for (const name of skillNames(unit, ev.newSkills))
            this.pushLog(t('log.newSkill', { name }));
        break;
      }
      case 'unitRecovered': {
        const unit = findUnit(before, ev.unitId);
        const skill = unit?.skills?.find((s) => s.id === ev.skillId)?.name ?? ev.skillId;
        this.pushLog(t('log.recovers', { name: unit?.name ?? ev.unitId, n: ev.amount, skill }));
        break;
      }
      case 'roundStarted':
        this.pushLog(t('log.round', { n: ev.round }));
        break;
      default:
        break;
    }
  }

  private playCloseUp(
    before: BattleState,
    ev: Extract<BattleEvent, { type: 'attackResolved' }>,
    all: readonly BattleEvent[],
  ): Promise<void> {
    const first = ev.strikes[0];
    if (!first) return Promise.resolve();
    const a = findUnit(before, first.attackerId)!;
    const d = findUnit(before, first.targetId)!;
    const side = (u: UnitState): CloseUpSide => ({
      id: u.id,
      name: u.name,
      side: u.side,
      initial: u.name.charAt(0),
      weapon: u.weapon.name,
      figure: figureSpec(this.lib, u, SIDE_COLORS[u.side]),
      maxHp: u.maxHp,
      hpBefore: u.hp,
    });
    // Level reached by each striker during this exchange (for the "LEVEL UP" flourish).
    const levelUps = new Map<string, number>();
    for (const e of all) if (e.type === 'levelUp') levelUps.set(e.unitId, e.level);
    const markLevel = (result: StrikeResult, isLast: boolean) =>
      isLast && levelUps.has(result.attackerId)
        ? { levelUp: levelUps.get(result.attackerId)! }
        : {};

    // Player units sit on the left, as in a duel viewed from the defenders' side.
    const [left, right] = a.side === 'player' ? [a, d] : [d, a];
    const repelled = ev.counter?.success === true;
    const used = (unit: UnitState, attack: Attack | undefined) => ({
      power: attack?.power ?? 1,
      reach: attack ? attackRange(attack, unit.weapon).max : 1,
    });
    const main = used(
      a,
      a.attacks.find((x) => x.id === ev.attackId),
    );
    // A reflected Counter replays the attacker's own blow; a strike back uses the chosen technique.
    const backMove = repelled
      ? main
      : used(
          d,
          d.attacks.find((x) => x.name === ev.retaliationName),
        );
    const strikes: CloseUpStrike[] = ev.strikes.map((result, i) => ({
      result,
      style: ev.style,
      ...main,
      bark: i === 0 ? pickLine(this.barks(a).attack) : '',
      reply: repelled
        ? pickLine(this.barks(d).counter)
        : pickLine(replyLines(this.barks(d), ev.reaction, result)),
      ...(repelled ? { repelled: true } : {}),
      ...markLevel(result, i === ev.strikes.length - 1 && !ev.retaliation),
    }));
    if (ev.retaliation) {
      const back = [ev.retaliation, ...(ev.retaliationFollowUps ?? [])];
      back.forEach((r, i) => {
        strikes.push({
          result: r,
          style: ev.retaliationStyle ?? 'slash',
          ...backMove,
          bark: repelled || i > 0 ? '' : pickLine(this.barks(d).counter),
          reply: pickLine(
            r.defeated ? this.barks(a).defeated : r.hit ? this.barks(a).hurt : this.barks(a).avoid,
          ),
          ...(repelled ? { reflected: true } : {}),
          ...markLevel(r, i === back.length - 1),
        });
      });
    }
    this.patch({
      mode: {
        kind: 'closeUp',
        data: {
          left: side(left),
          right: side(right),
          attackName: ev.attackName,
          ...(ev.retaliationName ? { backName: ev.retaliationName } : {}),
          reaction: ev.reaction,
          strikes,
          ...(ev.counter ? { counter: ev.counter } : {}),
        },
      },
    });
    return new Promise((resolve) => {
      this.pendingCloseUp = () => {
        this.patch({ mode: { kind: 'busy' } });
        resolve();
      };
    });
  }

  private barks(u: UnitState): BarkSet {
    const b = this.lib.barks;
    if (u.characterId && b.characters[u.characterId]) return b.characters[u.characterId]!;
    const faction = this.lib.frameFactions.get(u.frameId) ?? 'militia';
    return b[faction];
  }

  private noticeId = 0;

  /** Shows a short announcement for a few seconds. */
  notify(text: string): void {
    const id = ++this.noticeId;
    sfx('victory');
    this.patch({ notices: [...this.view.get().notices, { id, text }] });
    this.pushLog(t('log.notice', { text }));
    setTimeout(
      () => this.patch({ notices: this.view.get().notices.filter((n) => n.id !== id) }),
      3500,
    );
  }

  private pushLog(line: string): void {
    const log = [...this.view.get().log, line].slice(-40);
    this.patch({ log });
  }
}

/** Unlocked techniques for a unit, for UIs outside battle (prep screen). */
export { unlockedAttacks };

function replyLines(b: BarkSet, reaction: Reaction, s: StrikeResult): readonly string[] {
  if (s.defeated) return b.defeated;
  if (!s.hit) return b.avoid;
  if (reaction === 'defend') return b.defend;
  return b.hurt;
}

/** The battle log line for an exchange of blows. */
export function describeAttack(
  state: BattleState,
  ev: Extract<BattleEvent, { type: 'attackResolved' }>,
): string {
  const name = (id: string) => findUnit(state, id)?.name ?? id;
  const first = ev.strikes[0];
  if (!first) return '';
  const hits = ev.strikes.filter((s) => s.hit);
  const dmg = hits.reduce((n, s) => n + s.damage, 0);
  const xp = ev.strikes.reduce((n, s) => n + s.xp, 0);
  const attacker = name(first.attackerId);
  const target = name(first.targetId);
  const attack = ev.attackName;
  if (ev.counter?.success && ev.retaliation) {
    return t('log.counters', {
      target,
      attacker,
      attack,
      chance: ev.counter.chance,
      damage: ev.retaliation.damage,
    });
  }
  const how = t(`log.how.${ev.reaction}`);
  const main = hits.length
    ? xp
      ? t('log.usesXp', { attacker, attack, target, damage: dmg, how, xp })
      : t('log.uses', { attacker, attack, target, damage: dmg, how })
    : t('log.avoids', { target, attacker, attack });
  if (ev.counter && !ev.counter.success) return t('log.counterFailed', { main });
  if (!ev.retaliation) return main;
  const back = [ev.retaliation, ...(ev.retaliationFollowUps ?? [])];
  const landed = back.filter((c) => c.hit);
  const backDmg = landed.reduce((n, c) => n + c.damage, 0);
  const backXp = back.reduce((n, c) => n + c.xp, 0);
  const result = !landed.length
    ? t('log.backMiss')
    : backXp
      ? t('log.backDamageXp', { n: backDmg, xp: backXp })
      : t('log.backDamage', { n: backDmg });
  return ev.retaliationName
    ? t('log.strikesBackWith', { main, technique: ev.retaliationName, result })
    : t('log.strikesBack', { main, result });
}

/** Display names for skill ids, in the order given. */
function skillNames(unit: UnitState, ids: readonly string[]): string[] {
  return ids.map((id) => unit.skills?.find((s) => s.id === id)?.name ?? id);
}

/** XP each player unit earned from the events of one command, with its bar before and after. */
export function xpGains(
  before: BattleState,
  after: BattleState,
  events: readonly BattleEvent[],
): XpGain[] {
  const earned = new Map<string, number>();
  for (const ev of events) {
    if (ev.type !== 'attackResolved') continue;
    const strikes = [
      ...ev.strikes,
      ...(ev.retaliation ? [ev.retaliation] : []),
      ...(ev.retaliationFollowUps ?? []),
    ];
    for (const s of strikes) {
      if (s.xp > 0) earned.set(s.attackerId, (earned.get(s.attackerId) ?? 0) + s.xp);
    }
  }
  const learned = new Map<string, string[]>();
  for (const ev of events) {
    if (ev.type !== 'levelUp' || !ev.newSkills) continue;
    learned.set(ev.unitId, [...(learned.get(ev.unitId) ?? []), ...ev.newSkills]);
  }
  const out: XpGain[] = [];
  for (const [unitId, xp] of earned) {
    const was = findUnit(before, unitId);
    const now = findUnit(after, unitId);
    if (!was || !now || now.side !== 'player') continue;
    out.push({
      unitId,
      name: now.name,
      xp,
      levelBefore: was.level,
      xpBefore: was.xp,
      levelAfter: now.level,
      xpAfter: now.xp,
      ...(learned.has(unitId) ? { newSkills: skillNames(now, learned.get(unitId)!) } : {}),
    });
  }
  return out;
}
