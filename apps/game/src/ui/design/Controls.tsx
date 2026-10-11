import type { JSX } from 'preact';
import { useId } from 'preact/hooks';
import { Icon } from './Icon';
import { cx } from './logic';

/**
 * An on/off setting as a switch: a track with a thumb that moves, and the state in words beside
 * it ("On" / "Off"), so it never depends on colour alone. Named by the setting's label.
 */
export function Switch({
  checked,
  onChange,
  labelledBy,
  label,
  onText,
  offText,
  testId,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  /** The id of the visible label naming the setting (preferred), else `label`. */
  labelledBy?: string;
  label?: string;
  /** The state in words, from the string table. */
  onText: string;
  offText: string;
  testId?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      class={cx('ds-switch', checked && 'is-on')}
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      data-testid={testId}
      onClick={() => onChange(!checked)}
    >
      <span class="ds-switch__track" aria-hidden="true">
        <span class="ds-switch__thumb" />
      </span>
      <span class="ds-switch__text" aria-hidden="true">
        {checked ? onText : offText}
      </span>
    </button>
  );
}

export interface SegmentOption<V extends string | number> {
  value: V;
  label: string;
  testId?: string;
}

/**
 * A short choice between a few values (display mode, battle speed, text size): one strip of
 * buttons, the current one pressed (aria-pressed) with a gold wash, bold text, a check glyph and a
 * gold rule under it, never colour alone.
 */
export function Segmented<V extends string | number>({
  label,
  labelledBy,
  options,
  value,
  onChange,
  class: className,
}: {
  /** The group's accessible name, unless `labelledBy` points at a visible label. */
  label?: string;
  labelledBy?: string;
  options: ReadonlyArray<SegmentOption<V>>;
  value: V;
  onChange: (v: V) => void;
  class?: string;
}): JSX.Element {
  return (
    <div
      class={cx('ds-segmented', className)}
      role="group"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            type="button"
            key={String(o.value)}
            class={cx('ds-segmented__opt', on && 'is-on')}
            aria-pressed={on}
            data-testid={o.testId}
            onClick={() => onChange(o.value)}
          >
            {on && <Icon name="confirm" class="ds-segmented__check" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A volume-style slider from 0 to 1 with its value in words beside it (e.g. "70%"). The native
 * range input keeps keyboard, pad (arrows) and assistive-tech support.
 */
export function Slider({
  id,
  value,
  onChange,
  labelledBy,
  valueText,
  step = 0.1,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  labelledBy: string;
  /** The value as shown and read, from the string table ("70%"). */
  valueText: string;
  step?: number;
}): JSX.Element {
  const outId = useId();
  return (
    <span class="ds-slider" style={{ '--slider-fill': `${Math.round(value * 100)}%` }}>
      <input
        id={id}
        class="ds-slider__input"
        type="range"
        min="0"
        max="1"
        step={step}
        value={value}
        aria-labelledby={labelledBy}
        aria-valuetext={valueText}
        aria-describedby={outId}
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
      />
      <output id={outId} class="ds-slider__value" aria-hidden="true">
        {valueText}
      </output>
    </span>
  );
}
