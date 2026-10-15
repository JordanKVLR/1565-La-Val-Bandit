import type { BattleSetup, BattleState, Facing } from '@m1565/core';
import { attackFpCost, findUnit, getTile, terrainAt, unitAt, xpToNextLevel } from '@m1565/core';
import type { Library } from '@m1565/content';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { t } from '../i18n';
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
import type { CostPreview } from './battle/stats';
import { UnitCard, UnitDetails } from './battle/UnitPanels';
import { SettingsPanel } from './SettingsPanel';
import { settings } from '../state/settings';
import { LevelUpPanel } from './battle/LevelUpPanel';
import { XpPanel } from './battle/XpPanel';
import { ForecastPanel } from './battle/ForecastPanel';
import { terrainLabel } from './battle/objectives';
import { TurnQueue } from './battle/TurnQueue';
import { BattleBrief, MapControls, RoundBanner, Toasts } from './battle/BattleChrome';
import { usePrompt } from './KeyHint';
import type { AnchorSource } from './design';
import { Chip, PHONE_QUERY, useMediaQuery } from './design';

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

/**
 * Modes where the player is mid-decision, in a dialog or picker: the unit card would only get in
 * the way, and the round banner never covers them.
 */
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
  // The renderer as state too, so pieces pinned to the map (the action bar) re-render once it exists.
  const [view, setView] = useState<BattleView | null>(null);
  const ctl = useMemo(
    () => new BattleController(setup, lib, undefined, initial),
    [setup, lib, initial],
  );
  const { state, mode, inspected, log, notices } = useStore(ctl.view);
  // Only one overlay at a time: opening one closes whatever else was open.
  const [panel, setPanelState] = useState<Panel>('none');
  // The key handler below is installed once and reads the panel from here, so a key pressed
  // right after a panel opens (before Preact re-runs any effect) is never handled as if the
  // panel were still closed.
  const panelRef = useRef<Panel>(panel);
  const setPanel = (next: Panel | ((p: Panel) => Panel)) => {
    panelRef.current = typeof next === 'function' ? next(panelRef.current) : next;
    setPanelState(panelRef.current);
  };
  const close = () => setPanel('none');
  const prompt = usePrompt();
  const phone = useMediaQuery(PHONE_QUERY);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = new BattleView(canvas, state.map, (c) => ctl.tapTile(c), {
      onHover: (c) => ctl.hoverTile(c),
      onCancel: () => ctl.cancel(),
    });
    viewRef.current = view;
    setView(view);
    view.setHighContrast(settings.get().highContrast);
    const unsubscribe = settings.subscribe(() => view.setHighContrast(settings.get().highContrast));
    ctl.attach(view);
    window.__battle = { ctl, view };
    return () => {
      unsubscribe();
      ctl.dispose();
      view.dispose();
      setView(null);
      delete window.__battle;
    };
    // Runs once per controller: the map never changes mid-battle, and state flows through ctl.
  }, [ctl]);

  // Keyboard (and the gamepad, which sends the same keys; see platform/input/controls.ts):
  // arrows move the tile cursor · Enter/Space select or confirm · Esc back (or the menu) ·
  // M move · A attack · E end turn · U undo · [ ] cycle units · , . rotate · + − zoom.
  // On `document`, so these run before the generic focus fallbacks on `window` (ui/input.ts).
  // A layout effect, so the handler exists the moment the battle is visible.
  useLayoutEffect(() => {
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
      const panel = panelRef.current;
      if (e.key === 'Escape') {
        used();
        if (panel !== 'none') setPanel('none');
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
      // In the attack menu and facing picker, Enter with nothing focused is left to the generic
      // fallback (ui/input.ts), which focuses the dialog's default choice: Ⓐ always does
      // something, and a second Ⓐ presses it.
      if (confirm && m.kind !== 'attackMenu' && m.kind !== 'facing') used();
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
      // Go! (Enter / Ⓐ) strikes even when the tile cursor is not in use.
      if (m.kind === 'forecast') ctl.confirmAttack();
      else if (m.kind === 'xp') ctl.finishXp();
      else if (m.kind === 'closeUp') ctl.finishCloseUp();
      else if (m.kind === 'levelUp') ctl.finishLevelUp();
      else if (m.kind === 'reaction')
        document.querySelector<HTMLButtonElement>('[data-testid="react-go"]')?.click();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ctl]);

  // Progress is saved after every command (the player's and the AI's), so a console suspend or
  // a killed app resumes from the last thing that happened. The state only changes between
  // commands, so every snapshot is a consistent one; an AI turn resumed from one is re-planned.
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.(state);
  }, [state]);

  const active = ctl.active();
  // The forecast and the reaction prompt take the whole screen's attention: the chrome steps back.
  const inDuel = mode.kind === 'forecast' || mode.kind === 'reaction';
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
  // The action bar stands beside the active unit and follows the camera (ui/design/useAnchor).
  const anchor = useMemo<AnchorSource | null>(
    () =>
      view && {
        point: () => {
          const unit = ctl.active();
          return unit ? view.tileScreenPosition(unit.pos) : null;
        },
        subscribe: (onChange) => view.onFrame(onChange),
        // The other units (where they stand, above their tiles) stay uncovered when possible.
        avoid: () => {
          const id = ctl.active()?.id;
          return ctl.state.units
            .filter((u) => !u.defeated && u.id !== id)
            .map((u) => {
              const p = view.tileScreenPosition(u.pos);
              return { x: p.x, y: p.y - 24 };
            });
        },
        // While the movement range shows, the bar keeps off its tiles where it can.
        keepClear: () => {
          const mode = ctl.mode;
          if (mode.kind !== 'move') return [];
          return [...mode.reach.values()].flatMap((r) => {
            const end = r.path[r.path.length - 1];
            return end ? [view.tileScreenPosition(end)] : [];
          });
        },
      },
    [view, ctl],
  );
  // The tapped unit's card, unless it is the unit being planned (its own card shows that).
  const showInspected =
    !!inspectedUnit &&
    !BUSY_MODES.includes(mode.kind) &&
    !(planning && inspectedUnit.id === active?.id);
  // Phones show one card at a time, the tapped unit's first, so the map keeps its height.
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
      <canvas ref={canvasRef} class="battle-canvas" aria-label={t('battle.mapLabel', { title })} />

      <BattleBrief title={title} state={state} active={active} hidden={inDuel} />
      {!BUSY_MODES.includes(mode.kind) && <TurnQueue state={state} />}
      <MapControls
        hidden={inDuel}
        onRotate={(d) => viewRef.current?.rotate(d)}
        onMenu={() => setPanel('menu')}
      />
      {/* Never over a dialog: a reaction can open the moment a round begins. */}
      <RoundBanner
        round={state.round}
        enabled={state.outcome === 'ongoing' && !BUSY_MODES.includes(mode.kind) && panel === 'none'}
      />
      <Toasts notices={notices} />

      <div class="hud-bottom-left">
        {showInspected && (
          <UnitCard
            unit={inspectedUnit}
            state={state}
            onDetails={() => {
              setDetailsFor(inspectedUnit.id);
              setPanel('unit');
            }}
          />
        )}
        {planning && active && !(phone && showInspected) && (
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
          <Chip
            class="bhud-terrain"
            icon={null}
            testId="terrain-label"
            label={terrainLabel(tile.height, terrain)}
          />
        )}
      </div>

      {/* Covers the map exactly (in TV mode too), so map positions are layer positions. */}
      <div class="bhud-layer">
        {(mode.kind === 'command' || mode.kind === 'move') &&
          panel === 'none' &&
          // On a phone the route prompt takes the docked bar's place, so the map stays clear.
          !(phone && mode.kind === 'move' && mode.pending) && (
            <ActionMenu ctl={ctl} moving={mode.kind === 'move'} anchor={anchor} />
          )}
        {/* The technique list and the facing picker open where the action bar stood. */}
        {mode.kind === 'attackMenu' && <AttackMenu ctl={ctl} anchor={anchor} />}
        {mode.kind === 'facing' && active && (
          <FacingPicker
            corners={facingCorners()}
            current={active.facing}
            onPick={(f) => ctl.chooseFacing(f)}
            onCancel={() => ctl.cancel()}
            anchor={anchor}
          />
        )}
      </div>
      {mode.kind === 'move' && mode.pending && (
        <SubModeBar
          label={prompt('moveAgain', { cost: mode.pending.cost })}
          onCancel={() => ctl.cancel()}
          confirm={t('battle.moveHere')}
          onConfirm={() => ctl.confirmMove()}
        />
      )}
      {mode.kind === 'target' && (
        <SubModeBar
          label={prompt('pickEnemy', {
            attack:
              active?.attacks.find((a) => a.id === mode.attackId)?.name ??
              t('battle.action.attack'),
          })}
          onCancel={() => ctl.cancel()}
        />
      )}
      {mode.kind === 'xp' && (
        <XpPanel
          gains={mode.gains}
          xpToNext={(level) => xpToNextLevel(level, state.balance)}
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
        <ForecastPanel
          key={`${mode.attackerId}>${mode.defenderId}`}
          state={state}
          attacker={findUnit(state, mode.attackerId)!}
          defender={findUnit(state, mode.defenderId)!}
          forecast={mode.forecast}
          choices={mode.choices}
          onReact={(r, backAttackId) => ctl.chooseReaction(r, backAttackId)}
          heading={t('battle.reactionTitle', { name: findUnit(state, mode.attackerId)!.name })}
        />
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
