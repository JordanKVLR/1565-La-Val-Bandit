import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useState } from 'preact/hooks';
import type { ControlAction, ControlContext } from '../../platform/input/controls';
import { KeyHint } from '../KeyHint';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import type { ConfirmState } from './logic';
import { CONFIRM_TIMEOUT_MS, confirmStep, cx } from './logic';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** The visible text, from the string table. With `iconOnly` it is the accessible name. */
  label: string;
  /**
   * primary: the one main action on a surface (gold fill) · secondary: glass with a gold
   * hairline (default) · ghost: text only, for quiet or repeated actions · danger: destructive,
   * always with a warning glyph and, with `confirmLabel`, a second press to confirm.
   */
  variant?: ButtonVariant;
  /** sm: dense lists (visual 32 px, hit area still 44 px) · md: default 44 px · lg: 52 px. */
  size?: ButtonSize;
  icon?: IconName | undefined;
  /** Shows only the icon; `label` becomes the aria-label and the tooltip. */
  iconOnly?: boolean;
  /** The keyboard/pad prompt for the action this button does (ADR 0009). */
  keyHint?: ControlAction | undefined;
  keyContext?: ControlContext;
  disabled?: boolean;
  /** Why it is disabled, shown small under the label and read with it. */
  reason?: string | undefined;
  /** Small secondary text under the label (e.g. "30 AP"). */
  detail?: string | undefined;
  /** A toggle's state (aria-pressed): drawn with a gold rule and wash, not colour alone. */
  pressed?: boolean | undefined;
  /** danger: the label shown after the first press; the second press does the action. */
  confirmLabel?: string | undefined;
  onClick?: (() => void) | undefined;
  /** Full width of its container. */
  block?: boolean;
  /** Esc / Ⓑ presses this button in a dialog (ui/input.ts). */
  navBack?: boolean;
  /** Enter / Ⓐ with nothing focused focuses this button in a dialog. */
  navDefault?: boolean;
  type?: 'button' | 'submit';
  class?: string;
  testId?: string;
  id?: string;
  /** Tooltip; defaults to `label` for icon-only buttons. */
  title?: string | undefined;
  'aria-describedby'?: string;
  'aria-controls'?: string;
  'aria-expanded'?: boolean;
  children?: ComponentChildren;
}

/** The one button. Every hit area is at least 44 px (CLAUDE.md). */
export function Button({
  label,
  variant = 'secondary',
  size = 'md',
  icon,
  iconOnly = false,
  keyHint,
  keyContext = 'battle',
  disabled = false,
  reason,
  detail,
  pressed,
  confirmLabel,
  onClick,
  block = false,
  navBack = false,
  navDefault = false,
  type = 'button',
  class: className,
  testId,
  title,
  children,
  ...aria
}: ButtonProps): JSX.Element {
  const reasonId = useId();
  const [confirm, setConfirm] = useState<ConfirmState>('idle');
  const needsConfirm = variant === 'danger' && !!confirmLabel;
  const armed = confirm === 'armed';

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(
      () => setConfirm(confirmStep('armed', 'timeout', needsConfirm).state),
      CONFIRM_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [armed, needsConfirm]);

  const press = () => {
    const next = confirmStep(confirm, 'press', needsConfirm);
    setConfirm(next.state);
    if (next.fire) onClick?.();
  };
  const glyph: IconName | undefined = variant === 'danger' ? (icon ?? 'warning') : icon;
  const text = armed && confirmLabel ? confirmLabel : label;
  const showReason = disabled && !!reason;
  const describedBy = cx(showReason && reasonId, aria['aria-describedby']) || undefined;

  return (
    <button
      type={type}
      class={cx(
        'ds-btn',
        `ds-btn--${variant}`,
        `ds-btn--${size}`,
        iconOnly && 'ds-btn--icon',
        block && 'ds-btn--block',
        pressed && 'is-pressed',
        armed && 'is-armed',
        className,
      )}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={iconOnly ? text : undefined}
      aria-describedby={describedBy}
      aria-controls={aria['aria-controls']}
      aria-expanded={aria['aria-expanded']}
      title={title ?? (iconOnly ? text : undefined)}
      data-testid={testId}
      data-nav-back={navBack || undefined}
      data-nav-default={navDefault || undefined}
      id={aria.id}
      onClick={press}
      onBlur={
        armed ? () => setConfirm(confirmStep('armed', 'blur', needsConfirm).state) : undefined
      }
    >
      {glyph && <Icon name={glyph} class="ds-btn__icon" />}
      {!iconOnly && (
        <span class="ds-btn__text">
          <span class="ds-btn__label">{text}</span>
          {detail && <small class="ds-btn__detail">{detail}</small>}
          {showReason && (
            <small class="ds-btn__reason" id={reasonId}>
              {reason}
            </small>
          )}
        </span>
      )}
      {children}
      {keyHint && <KeyHint action={keyHint} context={keyContext} />}
    </button>
  );
}
