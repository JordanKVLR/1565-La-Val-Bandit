import type { ControlAction, ControlContext } from '../platform/input/controls';
import { promptFor } from '../platform/input/controls';
import { inputDevice } from '../platform/input/device';
import { useStore } from '../state/store';

/**
 * The key or gamepad button for an action, shown next to its button: the pad glyph (Ⓐ, Ⓑ, LB…)
 * when a gamepad was used last, the keyboard key otherwise. Hidden on touch screens until a
 * keyboard or pad is used (see `.key` in styles.css). Decorative: the button names the action.
 */
export function KeyHint({
  action,
  context = 'battle',
}: {
  action: ControlAction;
  context?: ControlContext;
}) {
  const device = useStore(inputDevice);
  const text = promptFor(action, device, context);
  if (!text) return null;
  return (
    <kbd class={`key${device === 'gamepad' ? ' pad' : ''}`} aria-hidden="true">
      {text}
    </kbd>
  );
}

/** "Tap", "Press Enter" or "Press Ⓐ", for hints like "Tap to continue". */
export function usePressWord(): string {
  const device = useStore(inputDevice);
  if (device === 'gamepad') return `Press ${promptFor('confirm', device, 'menu')}`;
  if (device === 'keyboard') return 'Press Enter';
  return 'Tap';
}
