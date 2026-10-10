import type { ComponentChildren } from 'preact';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { cx } from './logic';

/**
 * neutral: glass · gold: the accent (new, points to spend) · player / enemy: side, always with
 * its shape (circle / diamond) · danger: with a warning glyph.
 */
export type ChipTone = 'neutral' | 'gold' | 'player' | 'enemy' | 'danger';

const TONE_GLYPH: Partial<Record<ChipTone, IconName>> = {
  player: 'circle',
  enemy: 'diamond',
  danger: 'warning',
};

/** A small label on a pill: a status, a tag, a terrain readout. Not interactive. */
export function Chip({
  tone = 'neutral',
  icon,
  label,
  class: className,
  testId,
  title,
  children,
}: {
  tone?: ChipTone;
  /** Overrides the tone's glyph; `null` draws none. */
  icon?: IconName | null;
  /** The text (from the string table); or pass children. */
  label?: string;
  class?: string;
  testId?: string;
  title?: string;
  children?: ComponentChildren;
}) {
  const glyph = icon === null ? undefined : (icon ?? TONE_GLYPH[tone]);
  return (
    <span class={cx('ds-chip', `ds-chip--${tone}`, className)} data-testid={testId} title={title}>
      {glyph && <Icon name={glyph} class="ds-chip__icon" />}
      {label}
      {children}
    </span>
  );
}

/** A count or short marker on top of something else (a tab, an avatar). */
export function Badge({
  value,
  label,
  class: className,
}: {
  value: number | string;
  /** What the number means, for assistive tech ("2 points to spend"). */
  label: string;
  class?: string;
}) {
  return (
    <span class={cx('ds-badge', className)} role="status" aria-label={label}>
      <span aria-hidden="true">{value}</span>
    </span>
  );
}

/** A side marker: circle for the player, diamond for the enemy, in the side colour. */
export function SideMark({ side, label }: { side: 'player' | 'enemy'; label?: string }) {
  return (
    <Icon
      name={side === 'player' ? 'circle' : 'diamond'}
      class={`ds-side-mark ds-side-mark--${side}`}
      {...(label ? { label } : {})}
    />
  );
}
