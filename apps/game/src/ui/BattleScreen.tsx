import type { BattleSetup, BattleState, Facing } from '@m1565/core';
import {
  attackFpCost,
  findUnit,
  formatTerrainLabel,
  getTile,
  terrainAt,
  unitAt,
} from '@m1565/core';
import type { Library } from '@m1565/content';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BattleView } from '../render/BattleView';
import { BattleController } from '../scenes/BattleController';
import type { CursorDir } from '../scenes/cursor';
import { useStore } from '../state/store';
import { ActionMenu, SubModeBar } from './battle/ActionMenu';
import { AttackMenu } from './battle/AttackMenu';
import { CloseUp } from './battle/CloseUp';
import { EndOverlay } from './battle/EndOverlay';
import { FacingPicker } from './battle/FacingPicker';
import { BattleMenu, LogPanel } from './battle/BattleMenu';
import { HelpPanel } from './battle/HelpPanel';
import type { CostPreview } from './battle/StatBars';
import { UnitCard, UnitDetails } from './battle/UnitPanels';
import { SettingsPanel } from './SettingsPanel';
import { settings } from '../state/settings';
import { LevelUpPanel } from './battle/LevelUpPanel';
import { XpPanel } from './battle/XpPanel';
import { ForecastPanel } from './battle/ForecastPanel';
import { describeObjectives } from './battle/objectives';
import { TurnQueue } from './battle/TurnQueue';
import { useTapVerb } from './KeyHint';

interface Props {
  setup: BattleSetup;
  lib: Library;
  title: string;
  /** Resume from a saved mid-battle state. */
  initial?: BattleState;
  onExit: (outcome: 'victory' | 'defeat' | 'quit', state: BattleState) => void;
  /** Retry after a defeat; without it the battle simply restarts in place. */
  onRetry?: (state: BattleState) => void;
  /** Says what retrying costs on this difficulty. */
  retryNote?: string;
  onStateChange?: (state: BattleState) => void;
  continueLabel?: string;
}

type Panel = 'none' | 'menu' | 'log' | 'help' | 'settings' | 'unit';

/** Modes where the player is mid-decision; the unit card would only get in the way. */
const BUSY_MODES = [
  'forecast',
  'reaction',
  'closeUp',
  'attackMenu',
  'xp',
  'levelUp',
  'facing',
  'ended',
];

declare global {
  interface Window {
    /** Test/debug hook: the live battle controller and renderer. */
    __battle?: { ctl: BattleController; view: BattleView };
  }
}

export function BattleScreen({
  setup,
  lib,
  title,
  initial,
  onExit,
  onRetry,
  retryNote,
  onStateChange,
  continueLabel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<BattleView | null>(null);
  const ctl = useMemo(
    () => new BattleController(setup, lib, undefined, initial),
    [setup, lib, initial],
  );
  const { state, mode, inspected, log, notices } = useStore(ctl.view);
  // Only one overlay at a time: opening one closes whatever else was open.
  const [panel, setPanel] = useState<Panel>('none');
  const close = () => setPanel('none');
  const tapVerb = useTapVerb();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = new BattleView(canvas, state.map, (c) => ctl.tapTile(c), {
      onHover: (c) => ctl.hoverTile(c),
      onCancel: () => ctl.cancel(),
    });
    viewRef.current = view;
    view.setHighContrast(settings.get().highContrast);
    const unsubscribe = settings.subscribe(() => view.setHighContrast(settings.get().highContrast));
    ctl.attach(view);
    window.__battle = { ctl, view };
    return () => {
      unsubscribe();
      ctl.dispose();
      view.dispose();
      delete window.__battle;
    };
    // Runs once per controller: the map never changes mid-battle, and state flows through ctl.
  }, [ctl]);

  // Keyboard (and the gamepad, which sends the same keys; see platform/input/controls.ts):
  // arrows move the tile cursor · Enter/Space select or confirm · Esc back (or the menu) ·
  // M move · A attack · E end turn · U undo · [ ] cycle units · , . rotate · + − zoom.
  // On `document`, so these run before the generic focus fallbacks on `window` (ui/input.ts).
  useEffect(() => {
    const ARROWS: Record<string, CursorDir> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, select, textarea')) return;
      const m = ctl.mode;
      const used = () => e.preventDefault();
      if (e.key === 'ContextMenu') {
        used();
        setPanel((p) => (p === 'none' ? 'menu' : 'none'));
        return;
      }
      if (e.key === 'Escape') {
        used();
        if (panel !== 'none') close();
        else if (m.kind === 'command') setPanel('menu');
        else ctl.cancel();
        return;
      }
      if (panel !== 'none') return;
      // A focused button inside a dialog (forecast, facing, level-up...) is pressed natively.
      const inDialog = !!target?.closest('[role="dialog"]');
      const dir = ARROWS[e.key];
      if (dir) {
        if (inDialog || !ctl.moveCursor(dir)) return;
        used();
        // The map has the player's attention now: Enter must act on the cursor, not a button.
        if (target && target !== document.body) target.blur();
        return;
      }
      const confirm = e.key === 'Enter' || e.key === ' ';
      // A button reached with Tab or the D-pad is pressed natively; one merely left focused
      // by a click is not, so Enter still acts on the map.
      const button = target?.closest<HTMLElement>('button, a, [role="button"]');
      if (confirm && button && (inDialog || button.matches(':focus-visible'))) return;
      if (confirm) used();
      switch (e.key) {
        case 'm':
        case 'M':
          ctl.chooseMove();
          return;
        case 'a':
        case 'A':
          ctl.chooseAttack();
          return;
        case 'e':
        case 'E':
          ctl.chooseEndTurn();
          return;
        case 'u':
        case 'U':
          ctl.undoMove();
          return;
        case '[':
        case ']':
          if (ctl.cycleCursor(e.key === ']' ? 1 : -1)) used();
          return;
        case ',':
        case '.':
          used();
          viewRef.current?.rotate(e.key === '.' ? 1 : -1);
          return;
        case '=':
        case '+':
        case '-':
          used();
          viewRef.current?.zoomBy(e.key === '-' ? 1 / 1.1 : 1.1);
          return;
      }
      if (!confirm) return;
      if (ctl.confirmCursor()) return;
      if (m.kind === 'xp') ctl.finishXp();
      else if (m.kind === 'closeUp') ctl.finishCloseUp();
      else if (m.kind === 'levelUp') ctl.finishLevelUp();
      else if (m.kind === 'reaction')
        document.querySelector<HTMLButtonElement>('[data-testid="react-go"]')?.click();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ctl, panel]);

  useEffect(() => {
    if (mode.kind === 'command' || mode.kind === 'ended') onStateChange?.(state);
  }, [state, mode.kind, onStateChange]);

  const active = ctl.active();
  const tile = inspected && getTile(state.map, inspected);
  const terrain = inspected && terrainAt(state, inspected);
  const inspectedUnit = inspected && unitAt(state, inspected);
  // Your unit's own card stays up while you plan its turn, showing what each step will cost.
  const planning =
    active?.controller === 'human' &&
    ['command', 'move', 'attackMenu', 'target'].includes(mode.kind);
  const preview = ((): CostPreview | undefined => {
    if (!active) return undefined;
    if (mode.kind === 'move' && mode.pending) return { ap: mode.pending.cost };
    if (mode.kind === 'target') {
      const attack = active.attacks.find((a) => a.id === mode.attackId);
      if (attack) return { ap: attack.apCost, fp: attackFpCost(state, active, attack) };
    }
    return undefined;
  })();
  const [detailsFor, setDetailsFor] = useState<string | null>(null);
  const detailsUnit = detailsFor ? findUnit(state, detailsFor) : undefined;

  const facingCorners = (): Record<'upLeft' | 'upRight' | 'downLeft' | 'downRight', Facing> =>
    viewRef.current?.screenFacings() ?? {
      upLeft: 'north',
      upRight: 'east',
      downLeft: 'west',
      downRight: 'south',
    };

  return (
    <main class="battle-screen">
      <canvas ref={canvasRef} class="battle-canvas" aria-label={`Battle map: ${title}`} />

      <header class="hud-top" hidden={mode.kind === 'forecast' || mode.kind === 'reaction'}>
        <div class="map-name">{title}</div>
        {active && state.outcome === 'ongoing' && (
          <div class="turn-banner" data-testid="turn-banner">
            Round {state.round} · {active.name}
          </div>
        )}
        {state.outcome === 'ongoing' && (
          <div class="objective" data-testid="objective">
            <span>Win: {describeObjectives(state).win}</span>
            <span class="lose">Lose if {describeObjectives(state).lose}</span>
          </div>
        )}
      </header>
      {!BUSY_MODES.includes(mode.kind) && <TurnQueue state={state} />}

      <div class="hud-controls" hidden={mode.kind === 'forecast' || mode.kind === 'reaction'}>
        <button
          type="button"
          class="btn icon pointer-only"
          aria-label="Rotate left"
          onClick={() => viewRef.current?.rotate(-1)}
        >
          ⟲
        </button>
        <button
          type="button"
          class="btn icon pointer-only"
          aria-label="Rotate right"
          onClick={() => viewRef.current?.rotate(1)}
        >
          ⟳
        </button>
        <button type="button" class="btn icon" aria-label="Menu" onClick={() => setPanel('menu')}>
          ☰
        </button>
      </div>

      {notices.length > 0 && (
        <div class="notices" role="status">
          {notices.map((n) => (
            <div class="notice" key={n.id}>
              {n.text}
            </div>
          ))}
        </div>
      )}

      <div class="hud-bottom-left">
        {inspectedUnit &&
          !BUSY_MODES.includes(mode.kind) &&
          !(planning && inspectedUnit.id === active?.id) && (
            <UnitCard
              unit={inspectedUnit}
              state={state}
              onDetails={() => {
                setDetailsFor(inspectedUnit.id);
                setPanel('unit');
              }}
            />
          )}
        {planning && active && (
          <UnitCard
            unit={active}
            state={state}
            preview={preview}
            testId="active-card"
            onDetails={() => {
              setDetailsFor(active.id);
              setPanel('unit');
            }}
          />
        )}
        {tile && terrain && (
          <div class="terrain-label" data-testid="terrain-label">
            {formatTerrainLabel(tile.height, terrain)}
          </div>
        )}
      </div>

      {(mode.kind === 'command' || mode.kind === 'move') && panel === 'none' && (
        <ActionMenu ctl={ctl} moving={mode.kind === 'move'} />
      )}
      {mode.kind === 'move' && mode.pending && (
        <SubModeBar
          label={`AP −${mode.pending.cost} · ${tapVerb} again to move`}
          onCancel={() => ctl.cancel()}
          confirm="Move here"
          onConfirm={() => ctl.confirmMove()}
        />
      )}
      {mode.kind === 'attackMenu' && <AttackMenu ctl={ctl} />}
      {mode.kind === 'target' && (
        <SubModeBar
          label={`${active?.attacks.find((a) => a.id === mode.attackId)?.name ?? 'Attack'}: ${tapVerb === 'tap' ? 'tap' : 'pick'} a marked enemy`}
          onCancel={() => ctl.cancel()}
        />
      )}
      {mode.kind === 'xp' && (
        <XpPanel
          gains={mode.gains}
          xpPerLevel={state.balance.xpPerLevel}
          onDone={() => ctl.finishXp()}
        />
      )}
      {mode.kind === 'levelUp' && findUnit(state, mode.unitId) && (
        <LevelUpPanel
          unit={findUnit(state, mode.unitId)!}
          onRaise={(stat) => ctl.raiseStat(mode.unitId, stat)}
          onDone={() => ctl.finishLevelUp()}
        />
      )}
      {mode.kind === 'facing' && active && (
        <FacingPicker
          corners={facingCorners()}
          current={active.facing}
          onPick={(f) => ctl.chooseFacing(f)}
          onCancel={() => ctl.cancel()}
        />
      )}
      {mode.kind === 'forecast' && active && (
        <ForecastPanel
          key={`${mode.targetId}:${mode.attackId}`}
          state={state}
          attacker={active}
          defender={findUnit(state, mode.targetId)!}
          forecast={mode.forecast}
          onConfirm={() => ctl.confirmAttack()}
          onCancel={() => ctl.cancel()}
        />
      )}
      {mode.kind === 'reaction' && (
        <div class="reaction-wrap">
          <div class="reaction-title">
            {findUnit(state, mode.attackerId)!.name} attacks! How do you respond?
          </div>
          <ForecastPanel
            key={`${mode.attackerId}>${mode.defenderId}`}
            state={state}
            attacker={findUnit(state, mode.attackerId)!}
            defender={findUnit(state, mode.defenderId)!}
            forecast={mode.forecast}
            choices={mode.choices}
            onReact={(r, backAttackId) => ctl.chooseReaction(r, backAttackId)}
          />
        </div>
      )}
      {mode.kind === 'closeUp' && <CloseUp data={mode.data} onDone={() => ctl.finishCloseUp()} />}
      {panel === 'menu' && (
        <BattleMenu
          onResume={close}
          onLog={() => setPanel('log')}
          onHelp={() => setPanel('help')}
          onSettings={() => setPanel('settings')}
          onQuit={() => onExit('quit', state)}
        />
      )}
      {panel === 'log' && <LogPanel log={log} onClose={() => setPanel('menu')} />}
      {panel === 'help' && <HelpPanel onClose={() => setPanel('menu')} />}
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel('menu')} />}
      {panel === 'unit' && detailsUnit && (
        <UnitDetails unit={detailsUnit} state={state} onClose={close} />
      )}
      {mode.kind === 'ended' && (
        <EndOverlay
          outcome={mode.outcome}
          onRetry={() => (onRetry ? onRetry(state) : ctl.retry())}
          {...(retryNote ? { retryNote } : {})}
          onContinue={() => onExit(mode.outcome, state)}
          {...(continueLabel ? { continueLabel } : {})}
        />
      )}
    </main>
  );
}
