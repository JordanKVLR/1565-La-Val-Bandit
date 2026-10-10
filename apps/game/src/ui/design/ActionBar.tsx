import type { ComponentChildren, JSX } from 'preact';
import type { Ref } from 'preact';
import { cx } from './logic';

export interface ActionBarProps {
  /** Name of the group for assistive tech ("Actions"), from the string table. */
  label: string;
  /** horizontal: a slim strip (phones, along the bottom edge) · vertical: a column beside a unit. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * nav: a landmark (the battle's commands, which tests and screen readers find by name) ·
   * toolbar (default): a group of related buttons.
   */
  as?: 'nav' | 'toolbar';
  class?: string;
  testId?: string;
  style?: JSX.CSSProperties;
  barRef?: Ref<HTMLElement>;
  children: ComponentChildren;
}

/**
 * A slim group of `Button`s on one glass strip, separated by hairlines rather than boxes. Put
 * the commit action (End Turn, Confirm) last, after an `ActionBarSeparator`.
 */
export function ActionBar({
  label,
  orientation = 'horizontal',
  as = 'toolbar',
  class: className,
  testId,
  style,
  barRef,
  children,
}: ActionBarProps) {
  const props = {
    class: cx('ds-actionbar', `ds-actionbar--${orientation}`, className),
    'aria-label': label,
    'data-testid': testId,
    style,
  };
  return as === 'nav' ? (
    <nav {...props} ref={barRef ?? null}>
      {children}
    </nav>
  ) : (
    <div
      {...props}
      ref={(barRef ?? null) as Ref<HTMLDivElement>}
      role="toolbar"
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
}

/** A hairline between groups of actions in an ActionBar. */
export function ActionBarSeparator() {
  return <span class="ds-actionbar__sep" role="separator" />;
}
