import type { ComponentChildren } from 'preact';
import { cx } from './logic';

/**
 * A label and its value: "MOV 4", "Blocks 9 dmg". Label in small spaced capitals, value in
 * tabular figures. Put several in a `StatGrid` (a <dl>), or use `inline` inside a sentence-like
 * row.
 */
export function Stat({
  label,
  value,
  note,
  title,
  emphasis = false,
  class: className,
  testId,
}: {
  label: string;
  value: ComponentChildren;
  /** Small text after the value, e.g. the gear's share "(+1)". */
  note?: string | undefined;
  /** Explanation, shown as a tooltip and read after the value. */
  title?: string | undefined;
  /** Larger value in the accent colour (the one number that matters on this surface). */
  emphasis?: boolean;
  class?: string;
  testId?: string;
}) {
  return (
    <div
      class={cx('ds-stat', emphasis && 'ds-stat--emphasis', className)}
      title={title}
      data-testid={testId}
    >
      <dt class="ds-stat__label">{label}</dt>
      <dd class="ds-stat__value">
        {value}
        {note && <small class="ds-stat__note"> {note}</small>}
      </dd>
    </div>
  );
}

/** A grid of `Stat`s as one description list. `columns` is the most it uses on wide screens. */
export function StatGrid({
  columns = 2,
  class: className,
  children,
}: {
  columns?: 1 | 2 | 3 | 4;
  class?: string;
  children: ComponentChildren;
}) {
  return (
    <dl class={cx('ds-stat-grid', className)} style={{ '--ds-cols': columns }}>
      {children}
    </dl>
  );
}
