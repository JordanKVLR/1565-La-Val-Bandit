import { useEffect, useRef } from 'preact/hooks';
import { controllerNotice, dismissControllerNotice } from '../platform/input/disconnect';
import { useStore } from '../state/store';
import { t } from '../i18n';
import { Divider, Icon } from './design';

/**
 * "Controller disconnected": shown above everything when the pad in use goes away mid-game
 * (platform/input/disconnect.ts). Gameplay is held while it is up. It closes when a pad
 * connects or on any key, tap or pad press, and that input goes no further (ui/input.ts).
 * Drawn as a design-system dialog (glass sheet, warning glyph), on the system layer.
 */
export function ControllerNotice() {
  const { open } = useStore(controllerNotice);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    // Take focus from whatever was focused underneath, so nothing behind can be pressed.
    const before = document.activeElement as HTMLElement | null;
    button.current?.focus({ preventScroll: true });
    return () => before?.focus?.({ preventScroll: true });
  }, [open]);
  if (!open) return null;
  return (
    <div
      class="ds-sheet ds-sheet--center fe-notice"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="controller-notice-title"
      aria-describedby="controller-notice-text"
      data-testid="controller-notice"
      onClick={dismissControllerNotice}
    >
      <section class="ds-sheet__panel ds-sheet--sm fe-notice__panel">
        <Icon name="warning" class="fe-notice__icon" />
        <h2 id="controller-notice-title" class="fe-notice__title">
          {t('controller.title')}
        </h2>
        <Divider />
        <p id="controller-notice-text" class="fe-notice__text">
          {t('controller.text')}
        </p>
        <button
          type="button"
          class="ds-btn ds-btn--primary ds-btn--md ds-btn--block fe-notice__btn"
          ref={button}
          data-nav-default
        >
          <span class="ds-btn__text">
            <span class="ds-btn__label">{t('common.continue')}</span>
          </span>
        </button>
      </section>
    </div>
  );
}
