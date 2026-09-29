import type { BattleState, Coord, UnitState } from '@m1565/core';
import {
  activeUnit,
  createBattle,
  formatTerrainLabel,
  getTile,
  terrainAt,
  unitAt,
} from '@m1565/core';
import { loadBattle } from '@m1565/content';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { PlacedUnit } from '../render/BattleView';
import { BattleView } from '../render/BattleView';

const SIDE_COLORS: Record<UnitState['side'], string> = { player: '#2f5fa8', enemy: '#a8322f' };

function toPlaced(state: BattleState): PlacedUnit[] {
  return state.units
    .filter((u) => !u.defeated)
    .map((u) => ({ label: u.name.charAt(0), color: SIDE_COLORS[u.side], at: u.pos }));
}

interface Props {
  onExit: () => void;
}

export function BattleScreen({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<BattleView | null>(null);
  const [battle] = useState<BattleState>(() => createBattle(loadBattle('b1-marsaxlokk')).state);
  const map = battle.map;
  const [selected, setSelected] = useState<Coord>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = new BattleView(canvas, map, setSelected);
    view.setUnits(toPlaced(battle));
    viewRef.current = view;
    return () => view.dispose();
  }, [map, battle]);

  useEffect(() => viewRef.current?.select(selected), [selected]);

  const tile = selected && getTile(map, selected);
  const terrain = selected && terrainAt(battle, selected);
  const inspected = selected && unitAt(battle, selected);
  const acting = activeUnit(battle);

  return (
    <main class="battle-screen">
      <canvas ref={canvasRef} class="battle-canvas" aria-label={`Battle map: ${map.name}`} />
      <header class="map-name">{map.name}</header>
      {acting && (
        <div class="turn-banner" data-testid="turn-banner">
          Round {battle.round} · {acting.name}
        </div>
      )}
      {inspected && (
        <aside class="unit-card" data-testid="unit-card">
          <strong>{inspected.name}</strong>
          <span>
            HP {inspected.hp}/{inspected.maxHp}
          </span>
          <span>
            AP {inspected.ap} · FP {inspected.fp}
          </span>
          <span>{inspected.weapon.name}</span>
        </aside>
      )}
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
        <button type="button" class="btn icon" aria-label="Back to title" onClick={onExit}>
          ✕
        </button>
      </div>
      {tile && terrain && (
        <div class="terrain-label" data-testid="terrain-label">
          {formatTerrainLabel(tile.height, terrain)}
        </div>
      )}
    </main>
  );
}
