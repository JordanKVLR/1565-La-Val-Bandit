import type { BalanceConfig, PilotStats, StatName, UnitState } from '@m1565/core';
import { portraitUrl } from '../../render/art';
import { STAT_INFO } from './statInfo';

/** Attribute bars are full at this value; higher values still show their number. */
export const ATTRIBUTE_BAR_MAX = 40;

type BarKind = 'hp' | 'ap' | 'fp' | 'attr';

interface BarProps {
  label: string;
  value: number;
  max: number;
  kind: BarKind;
  /**
   * Change an action would make, drawn as a faded segment: negative for AP about to be spent,
   * positive for FP about to be added.
   */
  delta?: number;
  title?: string;
}

const pct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));

/** One horizontal bar: label, track and number, with an optional "about to change" preview. */
export function Bar({ label, value, max, kind, delta = 0, title }: BarProps) {
  const after = Math.max(0, Math.min(max, value + delta));
  const solid = Math.min(value, after);
  const ghostFrom = pct(solid, max);
  const ghostWidth = pct(Math.max(value, after), max) - ghostFrom;
  const text = delta !== 0 ? `${value}→${after}` : kind === 'attr' ? `${value}` : `${value}/${max}`;
  return (
    <div class={`bar bar-${kind}`} title={title}>
      <span class="bar-label">{label}</span>
      <span
        class="bar-track"
        role="meter"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-label={label}
      >
        <span class="bar-fill" style={{ width: `${pct(solid, max)}%` }} />
        {ghostWidth > 0 && (
          <span
            class={`bar-ghost ${delta < 0 ? 'spend' : 'gain'}`}
            style={{ left: `${ghostFrom}%`, width: `${ghostWidth}%` }}
          />
        )}
      </span>
      <span class={`bar-value${delta !== 0 ? ' changing' : ''}`}>{text}</span>
    </div>
  );
}

/** AP/FP an action is about to cost, previewed on the bars. */
export interface CostPreview {
  readonly ap?: number;
  readonly fp?: number;
}

export function UnitBars({
  unit,
  balance,
  preview,
}: {
  unit: UnitState;
  balance: BalanceConfig;
  preview?: CostPreview | undefined;
}) {
  return (
    <div class="unit-bars">
      <Bar label="HP" value={unit.hp} max={unit.maxHp} kind="hp" />
      <Bar label="AP" value={unit.ap} max={balance.apMax} kind="ap" delta={-(preview?.ap ?? 0)} />
      <Bar label="FP" value={unit.fp} max={balance.fpMax} kind="fp" delta={preview?.fp ?? 0} />
    </div>
  );
}

/** The seven pilot attributes as bars (full at 40), optionally with a + button each. */
export function AttributeBars({
  stats,
  help = false,
  onRaise,
  canRaise = true,
  raiseLabel,
}: {
  stats: PilotStats;
  help?: boolean;
  onRaise?: ((stat: StatName) => void) | undefined;
  canRaise?: boolean;
  raiseLabel?: (label: string) => string;
}) {
  return (
    <div class={`attr-bars${onRaise ? ' raisable' : ''}`}>
      {STAT_INFO.map((s) => (
        <div class="attr-row" key={s.key}>
          <Bar
            label={s.label}
            value={stats[s.key]}
            max={ATTRIBUTE_BAR_MAX}
            kind="attr"
            title={s.help}
          />
          {onRaise && (
            <button
              type="button"
              class="btn icon raise"
              aria-label={raiseLabel ? raiseLabel(s.label) : `Raise ${s.label}`}
              disabled={!canRaise}
              onClick={() => onRaise(s.key)}
            >
              +
            </button>
          )}
          {help && <small class="attr-help">{s.help}</small>}
        </div>
      ))}
    </div>
  );
}

/** Armour (shield) or movement (boot) icon with the number in the middle. */
export function StatIcon({ kind, value }: { kind: 'arm' | 'mov'; value: number }) {
  const name = kind === 'arm' ? 'Armour' : 'Movement';
  return (
    <span
      class={`stat-icon stat-icon-${kind}`}
      role="img"
      aria-label={`${name} ${value}`}
      title={name}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        {kind === 'arm' ? (
          <path d="M16 2 28 6.5V15c0 7.5-5.2 12.6-12 15C9.2 27.6 4 22.5 4 15V6.5Z" />
        ) : (
          <path d="M8 2h13v13.5l7.2 3.6c1.8.9 2.8 2.7 2.8 4.7V28H3v-5.5c0-1.9 1.1-3.6 2.8-4.4L8 17Z" />
        )}
      </svg>
      <b>{value}</b>
    </span>
  );
}

export function ArmMovIcons({ arm, mov }: { arm: number; mov: number }) {
  return (
    <span class="stat-icons">
      <StatIcon kind="arm" value={arm} />
      <StatIcon kind="mov" value={mov} />
    </span>
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
