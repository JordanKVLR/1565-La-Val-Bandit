import type { BattleSetup, BattleState, Facing } from '@m1565/core';
import { findUnit, formatTerrainLabel, getTile, terrainAt, unitAt } from '@m1565/core';
import type { Library } from '@m1565/content';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BattleView } from '../render/BattleView';
import { BattleController } from '../scenes/BattleController';
import { useStore } from '../state/store';
import { ActionMenu, SubModeBar } from './battle/ActionMenu';
import { CloseUp } from './battle/CloseUp';
import { EndOverlay } from './battle/EndOverlay';
import { FacingPicker } from './battle/FacingPicker';
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
  const { state, mode, inspected, log } = useStore(ctl.view);
  const [showLog, setShowLog] = useState(false);

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
      {!['forecast', 'reaction', 'closeUp'].includes(mode.kind) && <TurnQueue state={state} />}

      <div class="hud-controls">
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
        <button
          type="button"
          class="btn icon"
          aria-label="Battle log"
          onClick={() => setShowLog((s) => !s)}
        >
          ☰
        </button>
        <button
          type="button"
          class="btn icon"
          aria-label="Quit battle"
          onClick={() => onExit('quit', state)}
        >
          ✕
        </button>
      </div>

      {showLog && (
        <aside class="battle-log" aria-label="Battle log">
          {log.slice(-12).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </aside>
      )}

      {tile && terrain && (
        <div class="terrain-label" data-testid="terrain-label">
          {formatTerrainLabel(tile.height, terrain)}
        </div>
      )}

      {inspectedUnit && !['forecast', 'reaction', 'closeUp'].includes(mode.kind) && (
        <aside class="unit-card" data-testid="unit-card">
          <strong>
            {inspectedUnit.name} <small>Lv {inspectedUnit.level}</small>
          </strong>
          <span>
            HP {inspectedUnit.hp}/{inspectedUnit.maxHp} · AP {inspectedUnit.ap} · FP{' '}
            {inspectedUnit.fp}
          </span>
          <span>
            {inspectedUnit.weapon.name} · range {inspectedUnit.weapon.minRange}–
            {inspectedUnit.weapon.maxRange}
          </span>
        </aside>
      )}

      {mode.kind === 'command' && <ActionMenu ctl={ctl} />}
      {mode.kind === 'move' && (
        <SubModeBar label="Tap a blue tile to move" onCancel={() => ctl.cancel()} />
      )}
      {mode.kind === 'target' && (
        <SubModeBar label="Tap an enemy to attack" onCancel={() => ctl.cancel()} />
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
            state={state}
            attacker={findUnit(state, mode.attackerId)!}
            defender={findUnit(state, mode.defenderId)!}
            forecast={mode.forecast}
            reactions={mode.options}
            onReact={(r) => ctl.chooseReaction(r)}
          />
        </div>
      )}
      {mode.kind === 'closeUp' && <CloseUp data={mode.data} onDone={() => ctl.finishCloseUp()} />}
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
