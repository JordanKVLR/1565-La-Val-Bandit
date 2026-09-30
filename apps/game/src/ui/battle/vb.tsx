import type { BalanceConfig, Coord, UnitState } from '@m1565/core';
import { loadLibrary } from '@m1565/content';

/**
 * Pieces of the classic tactical-RPG battle look: framed panels with AP/FP/HP bars labelled
 * above, and the 3×3 assist grid. Our own drawing; only the layout follows the genre.
 */

let lib: ReturnType<typeof loadLibrary> | null = null;

/** The unit's frame (war-harness) name, e.g. "Ħaddiem". */
export function frameName(unit: UnitState): string {
  lib ??= loadLibrary();
  return lib.frames.get(unit.frameId)?.name ?? unit.frameClass;
}

const pct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));

/** "AP  70/100" over a bar; `delta` previews a cost (negative) or fatigue (positive). */
export function VbBar({
  label,
  value,
  max,
  kind,
  delta = 0,
}: {
  label: string;
  value: number;
  max: number;
  kind: 'ap' | 'fp' | 'hp';
  delta?: number;
}) {
  const after = Math.max(0, Math.min(max, value + delta));
  const solid = Math.min(value, after);
  const ghostFrom = pct(solid, max);
  const ghostWidth = pct(Math.max(value, after), max) - ghostFrom;
  return (
    <div class={`vb-bar vb-${kind}`}>
      <div class="vb-bar-text">
        <span>{label}</span>
        <span class={delta ? 'changing' : ''}>
          {delta ? `${value}→${after}` : `${value}/${max}`}
        </span>
      </div>
      <div
        class="vb-track"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemax={max}
      >
        <span class="vb-fill" style={{ width: `${pct(solid, max)}%` }} />
        {ghostWidth > 0 && (
          <span
            class={`bar-ghost ${delta < 0 ? 'spend' : 'gain'}`}
            style={{ left: `${ghostFrom}%`, width: `${ghostWidth}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function VbBars({
  unit,
  balance,
  ap = 0,
  fp = 0,
}: {
  unit: UnitState;
  balance: BalanceConfig;
  /** AP about to be spent. */
  ap?: number;
  /** FP about to be added. */
  fp?: number;
}) {
  return (
    <div class="vb-bars">
      <VbBar label="AP" value={unit.ap} max={balance.apMax} kind="ap" delta={-ap} />
      <VbBar label="FP" value={unit.fp} max={balance.fpMax} kind="fp" delta={fp} />
      <VbBar label="HP" value={unit.hp} max={unit.maxHp} kind="hp" />
    </div>
  );
}

/** 3×3 grid around `center` (north up); an × marks each assisting ally. */
export function AssistGrid({ center, allies }: { center: Coord; allies: readonly Coord[] }) {
  const cells = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const marked = allies.some((a) => a.x === center.x + dx && a.y === center.y + dy);
      cells.push(
        <span
          key={`${dx},${dy}`}
          class={`vb-cell${marked ? ' on' : ''}${!dx && !dy ? ' mid' : ''}`}
        >
          {marked ? '×' : ''}
        </span>,
      );
    }
  }
  return (
    <span class="vb-grid" aria-hidden="true">
      {cells}
    </span>
  );
}

export const pad2 = (n: number) => String(Math.max(0, Math.round(n))).padStart(2, '0');
