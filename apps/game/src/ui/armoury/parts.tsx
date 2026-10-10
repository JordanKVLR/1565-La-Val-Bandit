import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ItemKind } from '../../campaign/inventory';
import { t } from '../../i18n';
import { Meter } from '../design';
import type { Tier } from './ItemIcon';

const PIPS: Record<Tier, number> = { common: 1, fine: 2, masterwork: 3 };

/**
 * Quality tier, readable without colour: filled pips out of three, the word, and (on cards) the
 * frame style.
 */
export function TierBadge({ tier, size = 'sm' }: { tier: Tier; size?: 'sm' | 'md' }) {
  return (
    <span class={`ar-tier t-${tier} s-${size}`} title={t(`tier.${tier}`)}>
      <span class="ar-tier__pips" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} class={n <= PIPS[tier] ? 'on' : ''} />
        ))}
      </span>
      <span class="ar-tier__word">{t(`tier.${tier}`)}</span>
    </span>
  );
}

/**
 * One before → after row, on the design system's meter: the gain is hatched in, the loss is cut
 * out (hollow), and the number says ▲ +n or ▼ −n, so the direction never depends on colour.
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
  const diff = after - before;
  const sentence = t(
    diff > 0 ? 'armoury.deltaUp' : diff < 0 ? 'armoury.deltaDown' : 'armoury.deltaSame',
    { stat: label, before, after, n: Math.abs(diff) },
  );
  const mark = diff > 0 ? ` ▲ +${diff}` : diff < 0 ? ` ▼ −${-diff}` : '';
  return (
    <Meter
      label={label}
      value={before}
      max={Math.max(1, max, before, after)}
      delta={diff}
      kind="neutral"
      valueText={`${before}→${after}${mark}`}
      title={sentence}
      class={`ar-delta${diff > 0 ? ' is-up' : diff < 0 ? ' is-down' : ''}`}
      testId={`stat-delta-${id}`}
    />
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
    <span class="ar-purse" data-testid="scudi" aria-label={t('armoury.scudi', { n: value })}>
      <CoinGlyph />
      <b>{shown.toLocaleString()}</b>
      <span class="ds-visually-hidden">{t('armoury.scudi', { n: value })}</span>
      {float && (
        <span key={float.n} class={`ar-purse__float ${float.up ? 'up' : 'down'}`} aria-hidden="true">
          {float.text}
        </span>
      )}
    </span>
  );
}

/** A scudo: a gold disc with a small cross, coloured by the stylesheet (tokens only). */
export function CoinGlyph() {
  return (
    <svg class="ar-coin" viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <circle class="ar-coin__disc" cx="10" cy="10" r="8.25" />
      <path class="ar-coin__mark" d="M10 5.2 11 9 14.8 10 11 11 10 14.8 9 11 5.2 10 9 9Z" />
    </svg>
  );
}

/** The armourer's sign: an anvil under a Maltese cross, or under a crescent for the Porte. */
export function ArmourerEmblem({ side }: { side: 'malta' | 'ottoman' }) {
  return (
    <svg class="ar-emblem" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <path
        class="ar-emblem__shield"
        d="M24 3.5 43.5 10v15.5C43.5 36.5 34 42.5 24 45.5 14 42.5 4.5 36.5 4.5 25.5V10Z"
      />
      {side === 'malta' ? (
        <path
          class="ar-emblem__sign"
          d="M24 19 21.2 11.2 24 12.8l2.8-1.6ZM24 19l7.8-2.8-1.6 2.8 1.6 2.8ZM24 19l2.8 7.8-2.8-1.6-2.8 1.6ZM24 19l-7.8 2.8 1.6-2.8-1.6-2.8Z"
        />
      ) : (
        <path class="ar-emblem__sign" d="M27 11a7.6 7.6 0 1 0 0 15.2A6 6 0 1 1 27 11Z" />
      )}
      <path class="ar-emblem__anvil" d="M14 31h20l-3 2.6h-3.4l1 3.9H32V39H16v-1.5h3.4l1-3.9H17Z" />
    </svg>
  );
}

/**
 * The shelf glyphs, drawn on the design system's grid (24 units, 1.75 stroke, round caps) so
 * they sit beside its icons: a sword, a cut gem, a medal on a ribbon and a helm.
 */
const KIND_GLYPH: Record<ItemKind, string> = {
  weapon:
    'M19.5 4.5 18.3 8.7 10 17M19.5 4.5l-4.2 1.2L7 14M6 12.5l5.5 5.5M8.5 15.5l-4 4',
  charm: 'M8 4.5h8l3 4.5-7 10.5L5 9ZM5 9h14M10.5 4.5 9.5 9l2.5 10.5L14.5 9l-1-4.5',
  amulet: 'M8.5 3.5 12 9.5l3.5-6M12 21a5.75 5.75 0 1 0 0-11.5A5.75 5.75 0 0 0 12 21ZM12 13v5M9.5 15.5h5',
  frame: 'M5 19.5V12.5a7 7 0 0 1 14 0v7ZM5 13.5h14M12 13.5v6M9.5 16.5h5M12 5.5V3.5',
};

export function KindGlyph({ kind }: { kind: ItemKind }): JSX.Element {
  return (
    <svg
      class="ds-icon ar-kind"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      <path d={KIND_GLYPH[kind]} />
    </svg>
  );
}
