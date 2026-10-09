import type { ParamValue } from '../i18n/format';
import { displayMode } from '../platform/display';
import type { ControlAction, ControlContext, InputDevice } from '../platform/input/controls';
import { promptFor } from '../platform/input/controls';
import { inputDevice } from '../platform/input/device';
import { useStore } from '../state/store';
import type { PromptHint } from './prompts';
import { promptText } from './prompts';

/**
 * Which prompts to show: the last input's, except that the TV layout (ADR 0010) shows pad
 * glyphs until a keyboard is used, since nobody taps a TV.
 */
export function usePromptDevice(): InputDevice {
  const device = useStore(inputDevice);
  const mode = useStore(displayMode);
  return mode === 'tv' && device === 'pointer' ? 'gamepad' : device;
}

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
  const device = usePromptDevice();
  const text = promptFor(action, device, context);
  if (!text) return null;
  return (
    <kbd class={`key${device === 'gamepad' ? ' pad' : ''}`} aria-hidden="true">
      {text}
    </kbd>
  );
}

/** `promptText` (ui/prompts.ts) for the device whose prompts are showing. */
export function usePrompt(): (
  hint: PromptHint,
  params?: Readonly<Record<string, ParamValue>>,
) => string {
  const device = usePromptDevice();
  return (hint, params) => promptText(hint, device, params);
}
