import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { cx } from './logic';

/**
 * Quiet helper text in the muted colour, for a sentence that explains what is around it
 * ("Tap a tile to see the route"). Visible, so it works on touch and on a TV.
 */
export function Hint({
  text,
  icon,
  class: className,
  testId,
}: {
  text: string;
  icon?: IconName;
  class?: string;
  testId?: string;
}) {
  return (
    <p class={cx('ds-hint', className)} data-testid={testId}>
      {icon && <Icon name={icon} class="ds-hint__icon" />}
      {text}
    </p>
  );
}

/**
 * A tooltip for a pointer or keyboard: shown while its trigger is hovered or has focus, and
 * read as the trigger's description. Touch screens never see it, so it must only repeat what
 * is reachable elsewhere (a sheet, the help) — never the only place a fact lives.
 */
export function Tooltip({
  text,
  placement = 'top',
  children,
  class: className,
}: {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Renders the trigger (one focusable element) and spreads the given props on it, so it is
   * described by the tooltip: `{(p) => <Button {...p} label={…} />}`.
   */
  children: (trigger: { 'aria-describedby': string }) => ComponentChildren;
  class?: string;
}) {
  const id = useId();
  return (
    <span class={cx('ds-tooltip', `ds-tooltip--${placement}`, className)}>
      {children({ 'aria-describedby': id })}
      <span class="ds-tooltip__bubble" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}
