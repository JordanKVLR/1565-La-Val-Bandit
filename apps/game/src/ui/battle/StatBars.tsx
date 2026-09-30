import { portraitUrl } from '../../render/art';
import type { UnitState } from '@m1565/core';

interface BarProps {
  label: string;
  value: number;
  max: number;
  kind: 'ap' | 'fp' | 'hp';
}

export function Bar({ label, value, max, kind }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div class={`bar bar-${kind}`}>
      <span class="bar-label">{label}</span>
      <span class="bar-value">
        {value}/{max}
      </span>
      <span class="bar-track">
        <span class="bar-fill" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

export function UnitBars({
  unit,
  apMax,
  fpMax,
}: {
  unit: UnitState;
  apMax: number;
  fpMax: number;
}) {
  return (
    <div class="unit-bars">
      <Bar label="AP" value={unit.ap} max={apMax} kind="ap" />
      <Bar label="FP" value={unit.fp} max={fpMax} kind="fp" />
      <Bar label="HP" value={unit.hp} max={unit.maxHp} kind="hp" />
    </div>
  );
}

/** Placeholder portrait: side colour, initial and a faction stripe. Swapped for art later. */
export function Portrait({
  name,
  side,
  castId,
}: {
  name: string;
  side: UnitState['side'];
  castId?: string | null;
}) {
  const url = portraitUrl(castId);
  return (
    <div class={`portrait portrait-${side}`} aria-hidden="true">
      {url ? <img src={url} alt="" /> : name.charAt(0)}
    </div>
  );
}
