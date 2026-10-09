import type { PadInput } from './controls';
import { heldOnAny, PadTracker } from './gamepadMapping';

/**
 * Gamepad adapter over the browser Gamepad API (Chrome, Electron on Steam, Android WebView).
 * It polls connected pads once per frame while any is connected and reports each input as it
 * fires; what an input means is decided by the UI (see ui/input.ts). A Steamworks Input
 * adapter could replace this file without touching the screens.
 */
export function installGamepad(onInput: (input: PadInput) => void): () => void {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
    return () => {};
  }
  const tracker = new PadTracker();
  let frame = 0;
  let stopped = false;

  const poll = (time: number) => {
    frame = 0;
    if (stopped) return;
    let pads: readonly (Gamepad | null)[] = [];
    try {
      pads = navigator.getGamepads();
    } catch {
      // Blocked by a permissions policy: behave as if no pad is connected.
    }
    if (!pads.some((p) => p?.connected)) {
      // Sleep until a pad connects; no polling cost for touch players.
      tracker.reset();
      return;
    }
    // Inputs are ignored while the game is in the background (but still tracked, so a button
    // held when the window comes back does not fire).
    const fired = tracker.update(heldOnAny(pads), time);
    if (document.hasFocus()) for (const input of fired) onInput(input);
    frame = requestAnimationFrame(poll);
  };
  const start = () => {
    if (!frame && !stopped) frame = requestAnimationFrame(poll);
  };

  window.addEventListener('gamepadconnected', start);
  // Browsers reveal a pad that was already plugged in only after its first button press,
  // which also fires gamepadconnected; polling once here covers pads already revealed.
  start();
  return () => {
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('gamepadconnected', start);
  };
}
