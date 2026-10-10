import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from './Button';
import type { IconName } from './Icon';
import { cx, nextTrapIndex } from './logic';
import { Divider } from './Panel';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.tabIndex >= 0 && el.getClientRects().length > 0,
  );
}

export interface SheetProps {
  /** The dialog's accessible name (and its heading, unless `title` differs). */
  label: string;
  /** Visible heading; defaults to `label`. Pass `null` to draw none (the name stays). */
  title?: string | null;
  onClose: () => void;
  /** The close button's accessible name ("Close"), from the string table. */
  closeLabel: string;
  /**
   * side: slides in from the right, full height (details on demand, keeps the map visible
   * on the left) · bottom: rises from the bottom edge (short choices on phones) · center: a
   * modal dialog.
   */
  placement?: 'side' | 'bottom' | 'center';
  /** Width: sm 360 px, md 520 px (default), lg 820 px; all capped by the screen. */
  size?: 'sm' | 'md' | 'lg';
  /** A glyph on the hairline under the heading. */
  ornament?: IconName;
  /** Buttons pinned under the scrolling body. */
  footer?: ComponentChildren;
  /** Clicking the dimmed backdrop closes (default true). */
  dismissible?: boolean;
  class?: string;
  testId?: string;
  children: ComponentChildren;
}

/**
 * A glass sheet over a dimmed backdrop, for details on demand and dialogs. It is a modal
 * dialog: focus moves in when it opens and back when it closes, Tab stays inside, and Esc / Ⓑ
 * press its close button through the shared `data-nav-back` convention (ui/input.ts), so the
 * screen decides what closing means. Render it only while open.
 */
export function Sheet({
  label,
  title,
  onClose,
  closeLabel,
  placement = 'side',
  size = 'md',
  ornament,
  footer,
  dismissible = true,
  class: className,
  testId,
  children,
}: SheetProps): JSX.Element {
  const panel = useRef<HTMLElement>(null);
  const heading = title === undefined ? label : title;

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const root = panel.current;
    if (root) {
      const start = root.querySelector<HTMLElement>('[data-nav-default]') ?? root;
      start.focus({ preventScroll: true });
    }
    return () => {
      if (before && before.isConnected && before !== document.body) {
        before.focus({ preventScroll: true });
      }
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panel.current) return;
    const list = focusables(panel.current);
    const next = nextTrapIndex(
      list.indexOf(document.activeElement as HTMLElement),
      list.length,
      e.shiftKey,
    );
    e.preventDefault();
    if (next >= 0) list[next]!.focus();
  };

  return (
    <div
      class={cx('ds-sheet', `ds-sheet--${placement}`, className)}
      onClick={dismissible ? onClose : undefined}
    >
      <section
        ref={panel}
        class={cx('ds-sheet__panel', `ds-sheet--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        data-testid={testId}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        <header class="ds-sheet__head">
          {heading && <h2 class="ds-sheet__title">{heading}</h2>}
          <Button
            class="ds-sheet__close"
            label={closeLabel}
            icon="close"
            iconOnly
            variant="ghost"
            navBack
            onClick={onClose}
          />
        </header>
        <Divider glyph={ornament} class="ds-sheet__rule" />
        <div class="ds-sheet__body">{children}</div>
        {footer && <footer class="ds-sheet__foot">{footer}</footer>}
      </section>
    </div>
  );
}
