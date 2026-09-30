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
import { LevelUpPanel } from './battle/LevelUpPanel';
import { ForecastPanel } from './battle/ForecastPanel';
import { describeObjectives } from './battle/objectives';
import { TurnQueue } from './battle/TurnQueue';

interface Props {
  setup: BattleSetup;
  lib: Library;
  title: string;
  /** Resume from a saved mid-battle state. */
  initial?: BattleState;
  onExit: (outcome: 'victory' | 'defeat' | 'quit', state: BattleState) => void;
  onStateChange?: (state: BattleState) => void;
  continueLabel?: string;
}

type Panel = 'none' | 'menu' | 'log' | 'help' | 'settings' | 'unit';

/** Modes where the player is mid-decision; the unit card would only get in the way. */
const BUSY_MODES = ['forecast', 'reaction', 'closeUp', 'attackMenu', 'levelUp', 'facing', 'ended'];

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = new BattleView(canvas, state.map, (c) => ctl.tapTile(c));
    viewRef.current = view;
    ctl.attach(view);
    window.__battle = { ctl, view };
    return () => {
      ctl.dispose();
      view.dispose();
      delete window.__battle;
    };
    // Runs once per controller: the map never changes mid-battle, and state flows through ctl.
  }, [ctl]);

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

      <header class="hud-top">
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
          class="btn icon"
          aria-label="Rotate left"
          onClick={() => viewRef.current?.rotate(-1)}
        >
          ⟲
        </button>
        <button
          type="button"
          class="btn icon"
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

      {mode.kind === 'command' && panel === 'none' && <ActionMenu ctl={ctl} />}
      {mode.kind === 'move' && (
        <SubModeBar
          label={
            mode.pending
              ? `AP −${mode.pending.cost} · tap again to move`
              : 'Tap a blue tile to see the cost'
          }
          onCancel={() => ctl.cancel()}
          {...(mode.pending ? { confirm: 'Move here', onConfirm: () => ctl.confirmMove() } : {})}
        />
      )}
      {mode.kind === 'attackMenu' && <AttackMenu ctl={ctl} />}
      {mode.kind === 'target' && (
        <SubModeBar
          label={`${active?.attacks.find((a) => a.id === mode.attackId)?.name ?? 'Attack'}: tap a red enemy`}
          onCancel={() => ctl.cancel()}
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
            onReact={(r) => ctl.chooseReaction(r)}
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
          onRetry={() => ctl.retry()}
          onContinue={() => onExit(mode.outcome, state)}
          {...(continueLabel ? { continueLabel } : {})}
        />
      )}
    </main>
  );
}
