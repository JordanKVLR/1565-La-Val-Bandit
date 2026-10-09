import { useEffect, useRef } from 'preact/hooks';
import { controllerNotice, dismissControllerNotice } from '../platform/input/disconnect';
import { useStore } from '../state/store';

/**
 * "Controller disconnected": shown above everything when the pad in use goes away mid-game
 * (platform/input/disconnect.ts). Gameplay is held while it is up. It closes when a pad
 * connects or on any key, tap or pad press, and that input goes no further (ui/input.ts).
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
      class="modal controller-notice"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="controller-notice-title"
      aria-describedby="controller-notice-text"
      data-testid="controller-notice"
      onClick={dismissControllerNotice}
    >
      <div class="modal-box">
        <h2 id="controller-notice-title">Controller disconnected</h2>
        <p id="controller-notice-text" class="modal-hint">
          The game is paused. Reconnect your controller, or press any key or tap to continue.
        </p>
        <button type="button" class="btn" ref={button} data-nav-default>
          Continue
        </button>
      </div>
    </div>
  );
}
