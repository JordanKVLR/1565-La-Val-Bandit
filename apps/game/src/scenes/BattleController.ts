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
  reactionChoices,
  chooseReaction,
  CommandError,
  coordKey,
  createBattle,
  findUnit,
  forecastAttack,
  livingUnits,
  meetsRequirements,
  pilotStats,
  planAiTurn,
  reachableTiles,
  unitAt,
  unlockedAttacks,
} from '@m1565/core';
import type { BarkSet, Library } from '@m1565/content';
import type { FigureSpec } from '../render/Armatura';
import { figureSpec } from '../render/Armatura';
import type { HighlightKind, UnitVisual } from '../render/BattleView';
import { sfx } from '../platform/audio';
import { settings } from '../state/settings';
import { Store } from '../state/store';

/** What the renderer must offer the controller. Keeps the controller testable without WebGL. */
export interface BattleRenderer {
  syncUnits(list: readonly UnitVisual[]): void;
  animateMove(id: string, path: readonly Coord[], msPerTile: number): Promise<void>;
  setHighlights(layers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }>): void;
  select(c: Coord | undefined): void;
  focus(c: Coord, ms?: number): Promise<void>;
  shake(id: string): void;
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
  | { readonly kind: 'levelUp'; readonly unitId: string }
  | { readonly kind: 'ended'; readonly outcome: 'victory' | 'defeat' };

export interface BattleView {
  readonly state: BattleState;
  readonly mode: Mode;
  /** Tile the player last tapped, for the terrain/unit readout. */
  readonly inspected: Coord | undefined;
  readonly log: readonly string[];
  /** Short announcements (e.g. a newly learned technique), newest last. */
  readonly notices: readonly { readonly id: number; readonly text: string }[];
}

const SIDE_COLORS = { player: '#2f5fa8', enemy: '#a8322f' } as const;
const ARROW_COLORS = { player: '#9cc8ff', enemy: '#ffb0a8' } as const;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const pickLine = (lines: readonly string[]) =>
  lines[Math.floor(Math.random() * lines.length)] ?? '';

/**
 * Runs one battle for the UI: turns rules-engine events into animations, drives AI turns and
 * asks the player for decisions. All rule decisions stay in @m1565/core.
 */
export class BattleController {
  readonly view: Store<BattleView>;
  private renderer: BattleRenderer | undefined;
  private pendingReaction: ((r: Reaction) => void) | undefined;
  private pendingCloseUp: (() => void) | undefined;
  private pendingLevelUp: (() => void) | undefined;
  private running = false;
  private disposed = false;

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
    const mode = this.mode;
    if (mode.kind === 'move') {
      const reach = mode.reach.get(coordKey(c));
      if (reach && reach.path.length > 0) {
        // First tap previews the path and its AP cost; tapping the same tile again moves.
        if (mode.pending && coordKey(mode.pending.to) === coordKey(c)) this.confirmMove();
        else this.previewMove(c, reach);
        return;
      }
      this.toCommand();
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
    const reach = reachableTiles(this.state, unit);
    this.patch({ mode: { kind: 'move', reach } });
    this.highlight([
      {
        kind: 'move',
        tiles: [...reach.values()].map((r) => r.path[r.path.length - 1] ?? unit.pos),
      },
    ]);
  }

  private previewMove(to: Coord, reach: Reach): void {
    if (this.mode.kind !== 'move') return;
    const unit = this.active()!;
    sfx('select');
    this.patch({ mode: { ...this.mode, pending: { to, cost: reach.cost } }, inspected: to });
    this.renderer?.select(to);
    this.highlight([
      {
        kind: 'move',
        tiles: [...this.mode.reach.values()].map((r) => r.path[r.path.length - 1] ?? unit.pos),
      },
      { kind: 'path', tiles: reach.path },
    ]);
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
    if (!unit || !['command', 'target', 'forecast'].includes(this.mode.kind) || !this.canAttack())
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
    if (this.mode.kind !== 'command') return;
    this.patch({ mode: { kind: 'facing' } });
    this.highlight([]);
  }

  chooseFacing(facing: Facing): void {
    if (this.mode.kind !== 'facing') return;
    void this.run({ type: 'endTurn', unitId: this.activeId(), facing });
  }

  /** Back out of a sub-mode to the previous step. */
  cancel(): void {
    const k = this.mode.kind;
    if (k === 'target' || k === 'forecast') this.chooseAttack();
    else if (['move', 'attackMenu', 'facing'].includes(k)) this.toCommand();
  }

  chooseReaction(r: Reaction): void {
    const resolve = this.pendingReaction;
    const mode = this.mode;
    if (!resolve || mode.kind !== 'reaction') return;
    if (!mode.choices.some((c) => c.reaction === r && c.available)) return;
    this.pendingReaction = undefined;
    resolve(r);
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
        if (!known.has(a.id)) this.notify(`${after!.name} learned a new technique: ${a.name}!`);
      }
    } catch (e) {
      if (!(e instanceof CommandError)) throw e;
    }
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
    const stats = pilotStats(unit);
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

  private toCommand(): void {
    this.patch({ mode: { kind: 'command' } });
    this.highlight([]);
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
        this.notify(`${unit.name} has fainted from fatigue and must rest this turn.`);
      }
      this.patch({ mode: { kind: 'command' } });
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
        const reaction =
          defender?.controller === 'human'
            ? await this.askReaction(unitId, cmd.targetId, cmd.attackId ?? 'basic')
            : chooseReaction(this.state, cmd.targetId, unitId, cmd.attackId);
        cmd = { ...cmd, reaction };
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

  private askReaction(attackerId: string, defenderId: string, attackId: string): Promise<Reaction> {
    const attacker = findUnit(this.state, attackerId)!;
    const defender = findUnit(this.state, defenderId)!;
    const attack = this.attackOf(attacker, attackId);
    // Always ask, even when "Do nothing" is the only option, so the player sees why.
    const choices = reactionChoices(this.state, defender, attacker, attacker.pos, attack);
    const forecast = forecastAttack(this.state, attacker, defender, attacker.pos, attack);
    this.renderer?.select(defender.pos);
    this.patch({ mode: { kind: 'reaction', attackerId, defenderId, forecast, choices } });
    return new Promise((resolve) => {
      this.pendingReaction = (r) => {
        this.patch({ mode: { kind: 'busy' } });
        resolve(r);
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
    else this.toCommand();
  }

  /** Applies a command and plays its events. Returns false if the rules rejected it. */
  private async execute(cmd: Command): Promise<boolean> {
    const before = this.state;
    let result: { state: BattleState; events: BattleEvent[] };
    try {
      result = applyCommand(before, cmd);
    } catch (e) {
      if (e instanceof CommandError) {
        this.pushLog(`⚠ ${e.message}`);
        return false;
      }
      throw e;
    }
    for (const ev of result.events) await this.play(ev, before, result.events);
    this.patch({ state: result.state });
    this.syncUnits();
    // Level-ups pause the battle so the player can spend their new stat points.
    for (const ev of result.events) {
      if (ev.type !== 'levelUp') continue;
      const unit = findUnit(this.state, ev.unitId);
      if (unit?.controller === 'human' && unit.statPoints > 0) await this.promptLevelUp(unit.id);
    }
    return true;
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
        this.pushLog(`${findUnit(before, ev.unitId)?.name ?? ev.unitId} is defeated.`);
        break;
      case 'levelUp':
        this.pushLog(
          `★ ${findUnit(before, ev.unitId)?.name ?? ev.unitId} reached level ${ev.level}!`,
        );
        break;
      case 'roundStarted':
        this.pushLog(`— Round ${ev.round} —`);
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
    const strikes: CloseUpStrike[] = ev.strikes.map((result, i) => ({
      result,
      style: ev.style,
      bark: i === 0 ? pickLine(this.barks(a).attack) : '',
      reply: repelled
        ? pickLine(this.barks(d).counter)
        : pickLine(replyLines(this.barks(d), ev.reaction, result)),
      ...(repelled ? { repelled: true } : {}),
      ...markLevel(result, i === ev.strikes.length - 1 && !ev.retaliation),
    }));
    if (ev.retaliation) {
      const r = ev.retaliation;
      strikes.push({
        result: r,
        style: ev.retaliationStyle ?? 'slash',
        bark: repelled ? '' : pickLine(this.barks(d).counter),
        reply: pickLine(
          r.defeated ? this.barks(a).defeated : r.hit ? this.barks(a).hurt : this.barks(a).avoid,
        ),
        ...(repelled ? { reflected: true } : {}),
        ...markLevel(r, true),
      });
    }
    this.patch({
      mode: {
        kind: 'closeUp',
        data: {
          left: side(left),
          right: side(right),
          attackName: ev.attackName,
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
    this.pushLog(`★ ${text}`);
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

function describeAttack(
  state: BattleState,
  ev: Extract<BattleEvent, { type: 'attackResolved' }>,
): string {
  const name = (id: string) => findUnit(state, id)?.name ?? id;
  const first = ev.strikes[0];
  if (!first) return '';
  const hits = ev.strikes.filter((s) => s.hit);
  const dmg = hits.reduce((n, s) => n + s.damage, 0);
  const xp = ev.strikes.reduce((n, s) => n + s.xp, 0);
  if (ev.counter?.success && ev.retaliation) {
    return `${name(first.targetId)} COUNTERS ${name(first.attackerId)}'s ${ev.attackName} (${ev.counter.chance}% chance): ${ev.retaliation.damage} damage reflected.`;
  }
  const how = REACTION_WORD[ev.reaction];
  const main = hits.length
    ? `${name(first.attackerId)} uses ${ev.attackName} on ${name(first.targetId)}: ${dmg} damage (${how})${xp ? `, +${xp} XP` : ''}.`
    : `${name(first.targetId)} avoids ${name(first.attackerId)}'s ${ev.attackName}.`;
  if (ev.counter && !ev.counter.success) return `${main} The counter failed.`;
  if (!ev.retaliation) return main;
  const c = ev.retaliation;
  return `${main} Strikes back: ${c.hit ? `${c.damage} damage${c.xp ? `, +${c.xp} XP` : ''}` : 'miss'}.`;
}

const REACTION_WORD: Record<Reaction, string> = {
  defend: 'defended',
  avoid: 'tried to avoid',
  attackBack: 'took it to strike back',
  counter: 'failed counter',
  none: 'no reaction',
};
