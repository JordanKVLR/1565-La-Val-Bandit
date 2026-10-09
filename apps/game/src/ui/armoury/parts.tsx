import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Tier } from './ItemIcon';

const PIPS: Record<Tier, number> = { common: 1, fine: 2, masterwork: 3 };

/** Quality tier, readable without colour: a label, pips and a border style. */
export function TierBadge({ tier, size = 'sm' }: { tier: Tier; size?: 'sm' | 'md' }) {
  return (
    <span class={`tier-badge t-${tier} s-${size}`} title={t(`tier.${tier}`)}>
      <span class="pips" aria-hidden="true">
        {'◆'.repeat(PIPS[tier])}
      </span>
      {size === 'md' || tier !== 'common' ? <span class="tl">{t(`tier.${tier}`)}</span> : null}
    </span>
  );
}

/**
 * One before → after row: a bar with the gain solid (▲, +) or the loss hatched (▼, −), so the
 * direction never depends on colour.
 */
export function StatDelta({
  id,
  label,
  before,
  after,
  max,
}: {
  /** Names the row for tests (`stat-delta-<id>`); never shown. */
  id: string;
  label: string;
  before: number;
  after: number;
  max: number;
}) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%`;
  const lo = Math.min(before, after);
  const hi = Math.max(before, after);
  const diff = after - before;
  return (
    <div
      class={`stat-delta${diff > 0 ? ' up' : diff < 0 ? ' down' : ''}`}
      role="img"
      aria-label={t(
        diff > 0 ? 'armoury.deltaUp' : diff < 0 ? 'armoury.deltaDown' : 'armoury.deltaSame',
        {
          stat: label,
          before,
          after,
          n: Math.abs(diff),
        },
      )}
      data-testid={`stat-delta-${id}`}
    >
      <span class="sd-label">{label}</span>
      <span class="sd-track">
        <span class="sd-fill" style={{ width: pct(lo) }} />
        {diff !== 0 && (
          <span
            class={`sd-change ${diff > 0 ? 'gain' : 'loss'}`}
            style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }}
          />
        )}
      </span>
      <span class="sd-num">
        {before}→{after}
        {diff !== 0 && <b> {diff > 0 ? `+${diff} ▲` : `−${-diff} ▼`}</b>}
      </span>
    </div>
  );
}

const calm = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scudi that count up or down when they change, with the difference floating away. */
export function ScudiCounter({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const [float, setFloat] = useState<{ text: string; up: boolean; n: number } | null>(null);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value) return;
    setFloat((f) => ({
      text: `${value > start ? '+' : '−'}${Math.abs(value - start)}`,
      up: value > start,
      n: (f?.n ?? 0) + 1,
    }));
    if (calm()) {
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 450);
      const eased = 1 - (1 - k) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span class="scudi-counter" data-testid="scudi" aria-label={t('armoury.scudi', { n: value })}>
      <CoinGlyph />
      <b>{shown.toLocaleString()}</b>
      <span class="visually-hidden">{t('armoury.scudi', { n: value })}</span>
      {float && (
        <span key={float.n} class={`scudi-float ${float.up ? 'up' : 'down'}`} aria-hidden="true">
          {float.text}
        </span>
      )}
    </span>
  );
}

export function CoinGlyph() {
  return (
    <svg class="coin" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="#d6b25e" stroke="#6b4e1c" stroke-width="1.5" />
      <path d="M10 5 L11 9 L15 10 L11 11 L10 15 L9 11 L5 10 L9 9 Z" fill="#7a5a22" />
    </svg>
  );
}

/** The armourer's sign: an anvil under a Maltese cross, or under a crescent for the Porte. */
export function ArmourerEmblem({ side }: { side: 'malta' | 'ottoman' }) {
  return (
    <svg class="armourer-emblem" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <path
        d="M24 3 L44 10 V26 C44 37 34 43 24 46 C14 43 4 37 4 26 V10 Z"
        fill="#1d1712"
        stroke="#c9a45c"
        stroke-width="2"
      />
      {side === 'malta' ? (
        <path
          d="M24 8 L27 14 L24 13 L21 14 Z M30 17 L36 14 L35 17 L36 20 Z M24 26 L21 20 L24 21 L27 20 Z M18 17 L12 20 L13 17 L12 14 Z"
          fill="#f4ead2"
        />
      ) : (
        <path d="M27 9 A8 8 0 1 0 27 25 A6.2 6.2 0 1 1 27 9 Z" fill="#f4ead2" />
      )}
      <path
        d="M12 31 H34 L31 34 H27 L28 38 H32 V40 H16 V38 H20 L21 34 H15 Z"
        fill="#9aa1ab"
        stroke="#2a2d33"
        stroke-width="1"
      />
    </svg>
  );
}
