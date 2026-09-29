import type { Coord } from '@m1565/core';
import { formatTerrainLabel, getTile } from '@m1565/core';
import { loadMap, loadTerrains, mapSources } from '@m1565/content';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BattleView } from '../render/BattleView';
import { DEMO_UNITS } from '../scenes/demoBattle';

interface Props {
  onExit: () => void;
}

export function BattleScreen({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<BattleView | null>(null);
  const terrains = useMemo(() => loadTerrains(), []);
  const map = useMemo(() => loadMap(mapSources['b1-marsaxlokk'], terrains), [terrains]);
  const [selected, setSelected] = useState<Coord>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const view = new BattleView(canvas, map, setSelected);
    view.setUnits(DEMO_UNITS);
    viewRef.current = view;
    return () => view.dispose();
  }, [map]);

  useEffect(() => viewRef.current?.select(selected), [selected]);

  const tile = selected && getTile(map, selected);
  const terrain = tile && terrains.get(tile.terrain);

  return (
    <main class="battle-screen">
      <canvas ref={canvasRef} class="battle-canvas" aria-label={`Battle map: ${map.name}`} />
      <header class="map-name">{map.name}</header>
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
