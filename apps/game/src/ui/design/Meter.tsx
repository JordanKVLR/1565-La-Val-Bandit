import { cx, meterModel } from './logic';

export type MeterKind = 'hp' | 'ap' | 'fp' | 'xp' | 'neutral';

export interface MeterProps {
  /** The short label always shown before the bar ("HP"), from the string table. */
  label: string;
  value: number;
  max: number;
  /**
   * hp: solid · ap: notched every 10% · fp: hatched · xp: thin and pale · neutral: gold.
   * The pattern, label and fixed order tell meters apart, never the hue alone.
   */
  kind?: MeterKind;
  /**
   * A previewed change: negative for a cost (AP to spend, HP to lose), drawn as a hollow
   * segment; positive for a gain (FP to add), drawn hatched. The value reads "100→44".
   */
  delta?: number;
  /** Show "value/max" (default) or just the value. */
  showMax?: boolean;
  /** Overrides the text after the bar (e.g. "14 (+1)"). */
  valueText?: string | undefined;
  /** Label on its own row above the bar (dense cards) instead of before it. */
  stacked?: boolean;
  /** Thinner track (secondary meters such as XP). */
  thin?: boolean;
  /** Full description for assistive tech and the tooltip (defaults to the label). */
  title?: string | undefined;
  class?: string;
  testId?: string;
}

/**
 * A labelled bar with its number. The bar itself is `role="meter"` with the label as its name
 * and the value as text, so it reads "HP, 93 of 93" rather than a percentage.
 */
export function Meter({
  label,
  value,
  max,
  kind = 'neutral',
  delta = 0,
  showMax = true,
  valueText,
  stacked = false,
  thin = false,
  title,
  class: className,
  testId,
}: MeterProps) {
  const m = meterModel(value, max, delta, { showMax });
  const text = valueText ?? m.text;
  return (
    <div
      class={cx(
        'ds-meter',
        `ds-meter--${kind}`,
        stacked && 'ds-meter--stacked',
        thin && 'ds-meter--thin',
        m.low && 'is-low',
        className,
      )}
      data-meter={kind}
      data-testid={testId}
      title={title}
    >
      <span class="ds-meter__label" aria-hidden="true">
        {label}
      </span>
      <span
        class="ds-meter__track"
        role="meter"
        aria-label={title ?? label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
      >
        <span class="ds-meter__fill" style={{ width: `${m.fill}%` }} />
        {m.preview && (
          <span
            class={`ds-meter__preview is-${m.preview}`}
            style={{ left: `${m.previewFrom}%`, width: `${m.previewWidth}%` }}
          />
        )}
      </span>
      <span class={cx('ds-meter__value', m.preview && 'changing')} aria-hidden="true">
        {text}
      </span>
    </div>
  );
}
