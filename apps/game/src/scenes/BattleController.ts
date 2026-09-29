import type {
  AttackForecast,
  BattleEvent,
  BattleSetup,
  BattleState,
  Command,
  Coord,
  Facing,
  Reach,
  Reaction,
  StrikeResult,
  UnitState,
} from '@m1565/core';
import {
  activeUnit,
  applyCommand,
  availableReactions,
  chooseReaction,
  CommandError,
  coordKey,
  createBattle,
  findUnit,
  forecastAttack,
  inRange,
  livingUnits,
  planAiTurn,
  reachableTiles,
  unitAt,
} from '@m1565/core';
import type { BarkSet, Library } from '@m1565/content';
import type { HighlightKind, UnitVisual } from '../render/BattleView';
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
  readonly maxHp: number;
  readonly hpBefore: number;
}

export interface CloseUpData {
  readonly left: CloseUpSide;
  readonly right: CloseUpSide;
  readonly reaction: Reaction;
  readonly strikes: ReadonlyArray<{
    readonly result: StrikeResult;
    readonly bark: string;
    readonly reply: string;
  }>;
}

export type Mode =
  | { readonly kind: 'busy' }
  | { readonly kind: 'command' }
  | { readonly kind: 'move'; readonly reach: ReadonlyMap<string, Reach> }
  | { readonly kind: 'target'; readonly targets: readonly string[] }
  | { readonly kind: 'forecast'; readonly targetId: string; readonly forecast: AttackForecast }
  | { readonly kind: 'facing' }
  | {
      readonly kind: 'reaction';
      readonly attackerId: string;
      readonly defenderId: string;
      readonly forecast: AttackForecast;
      readonly options: readonly Reaction[];
    }
  | { readonly kind: 'closeUp'; readonly data: CloseUpData }
  | { readonly kind: 'ended'; readonly outcome: 'victory' | 'defeat' };

export interface BattleView {
  readonly state: BattleState;
  readonly mode: Mode;
  /** Tile the player last tapped, for the terrain/unit readout. */
  readonly inspected: Coord | undefined;
  readonly log: readonly string[];
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
        void this.run({ type: 'move', unitId: this.activeId(), to: c });
        return;
      }
      this.toCommand();
    } else if (mode.kind === 'target' || mode.kind === 'forecast') {
      const target = unitAt(this.state, c);
      if (target && (mode.kind === 'forecast' || mode.targets.includes(target.id))) {
        if (mode.kind === 'forecast' && target.id === mode.targetId) {
          this.confirmAttack();
          return;
        }
        if (mode.kind === 'target' || this.targetsFor(this.active()!).includes(target.id)) {
          this.showForecast(target.id);
          return;
        }
      }
      if (mode.kind === 'target') this.toCommand();
    }
    this.patch({ inspected: c });
    this.renderer?.select(c);
  }

  chooseMove(): void {
    const unit = this.active();
    if (!unit || this.mode.kind !== 'command' || !this.canMove()) return;
    const reach = reachableTiles(this.state, unit);
    this.patch({ mode: { kind: 'move', reach } });
    this.highlight([
      {
        kind: 'move',
        tiles: [...reach.values()].map((r) => r.path[r.path.length - 1] ?? unit.pos),
      },
    ]);
  }

  chooseAttack(): void {
    const unit = this.active();
    if (!unit || this.mode.kind !== 'command' || !this.canAttack()) return;
    const targets = this.targetsFor(unit);
    this.patch({ mode: { kind: 'target', targets } });
    this.highlight([
      { kind: 'range', tiles: this.rangeTiles(unit) },
      { kind: 'target', tiles: targets.map((id) => findUnit(this.state, id)!.pos) },
    ]);
  }

  confirmAttack(): void {
    const mode = this.mode;
    if (mode.kind !== 'forecast') return;
    const reaction = chooseReaction(this.state, mode.targetId, this.activeId());
    void this.run({ type: 'attack', unitId: this.activeId(), targetId: mode.targetId, reaction });
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

  /** Back out of a sub-mode (move/target/forecast/facing) to the action menu. */
  cancel(): void {
    if (['move', 'target', 'forecast', 'facing'].includes(this.mode.kind)) this.toCommand();
  }

  chooseReaction(r: Reaction): void {
    const resolve = this.pendingReaction;
    if (!resolve) return;
    this.pendingReaction = undefined;
    resolve(r);
  }

  finishCloseUp(): void {
    const resolve = this.pendingCloseUp;
    this.pendingCloseUp = undefined;
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
      u.ap >= u.weapon.apCost &&
      this.targetsFor(u).length > 0
    );
  }

  canUndo(): boolean {
    const t = this.state.turn;
    return !!t && t.moved && !t.acted;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private activeId(): string {
    return this.state.turn?.unitId ?? '';
  }

  private targetsFor(unit: UnitState): string[] {
    return livingUnits(this.state)
      .filter((u) => u.side !== unit.side && inRange(unit.weapon, unit.pos, u.pos))
      .map((u) => u.id);
  }

  private rangeTiles(unit: UnitState): Coord[] {
    const out: Coord[] = [];
    const { width, depth } = this.state.map;
    for (let y = 0; y < depth; y++) {
      for (let x = 0; x < width; x++)
        if (inRange(unit.weapon, unit.pos, { x, y })) out.push({ x, y });
    }
    return out;
  }

  private showForecast(targetId: string): void {
    const unit = this.active();
    const target = findUnit(this.state, targetId);
    if (!unit || !target) return;
    const forecast = forecastAttack(this.state, unit, target);
    this.patch({ mode: { kind: 'forecast', targetId, forecast }, inspected: target.pos });
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
      })),
    );
  }

  /** Starts whatever the current turn needs: the player's menu, or an AI turn. */
  private async beginTurn(): Promise<void> {
    if (this.disposed) return;
    const state = this.state;
    if (state.outcome !== 'ongoing') {
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
            ? await this.askReaction(unitId, cmd.targetId)
            : chooseReaction(this.state, cmd.targetId, unitId);
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

  private askReaction(attackerId: string, defenderId: string): Promise<Reaction> {
    const attacker = findUnit(this.state, attackerId)!;
    const defender = findUnit(this.state, defenderId)!;
    const options = availableReactions(this.state, defender, attacker);
    if (options.length === 1) return Promise.resolve(options[0]!);
    const forecast = forecastAttack(this.state, attacker, defender);
    this.renderer?.select(defender.pos);
    this.patch({ mode: { kind: 'reaction', attackerId, defenderId, forecast, options } });
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
    for (const ev of result.events) await this.play(ev, before, result.state);
    this.patch({ state: result.state });
    this.syncUnits();
    return true;
  }

  private async play(ev: BattleEvent, before: BattleState, after: BattleState): Promise<void> {
    const r = this.renderer;
    switch (ev.type) {
      case 'unitMoved':
        await r?.animateMove(ev.unitId, ev.path, 170 / this.speed());
        break;
      case 'attackResolved': {
        this.pushLog(describeAttack(before, ev));
        if (settings.get().closeUps) await this.playCloseUp(before, after, ev);
        r?.shake(ev.strike.targetId);
        break;
      }
      case 'unitDefeated':
        this.pushLog(`${findUnit(before, ev.unitId)?.name ?? ev.unitId} is defeated.`);
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
    after: BattleState,
    ev: Extract<BattleEvent, { type: 'attackResolved' }>,
  ): Promise<void> {
    const a = findUnit(before, ev.strike.attackerId)!;
    const d = findUnit(before, ev.strike.targetId)!;
    const side = (u: UnitState): CloseUpSide => ({
      id: u.id,
      name: u.name,
      side: u.side,
      initial: u.name.charAt(0),
      weapon: u.weapon.name,
      maxHp: u.maxHp,
      hpBefore: u.hp,
    });
    // Player units sit on the left, as in a duel viewed from the defenders' side.
    const [left, right] = a.side === 'player' ? [a, d] : [d, a];
    const strikes = [
      {
        result: ev.strike,
        bark: pickLine(this.barks(a).attack),
        reply: pickLine(replyLines(this.barks(d), ev.reaction, ev.strike)),
      },
    ];
    if (ev.counter) {
      strikes.push({
        result: ev.counter,
        bark: pickLine(this.barks(d).counter),
        reply: pickLine(
          ev.counter.defeated
            ? this.barks(a).defeated
            : ev.counter.hit
              ? this.barks(a).hurt
              : this.barks(a).avoid,
        ),
      });
    }
    void after;
    this.patch({
      mode: {
        kind: 'closeUp',
        data: { left: side(left), right: side(right), reaction: ev.reaction, strikes },
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

  private pushLog(line: string): void {
    const log = [...this.view.get().log, line].slice(-40);
    this.patch({ log });
  }
}

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
  const s = ev.strike;
  const main = s.hit
    ? `${name(s.attackerId)} hits ${name(s.targetId)} for ${s.damage} (${ev.reaction}).`
    : `${name(s.targetId)} avoids ${name(s.attackerId)}'s attack.`;
  if (!ev.counter) return main;
  const c = ev.counter;
  return `${main} Counter: ${c.hit ? `${c.damage} damage` : 'miss'}.`;
}
