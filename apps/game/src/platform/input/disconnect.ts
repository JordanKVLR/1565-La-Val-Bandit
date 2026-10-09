import { gameplayPause } from '../../state/pause';
import { Store } from '../../state/store';
import type { InputDevice } from './controls';
import { inputDevice } from './device';

/**
 * Controller disconnect notice (a console certification theme): when the pad the player was
 * using goes away mid-game, the game pauses and asks them to reconnect it or carry on with
 * another input. Pure state here; `ui/ControllerNotice.tsx` draws it and `ui/input.ts` feeds
 * it the inputs (and swallows the one that dismisses it, so it never reaches the game).
 */
export interface DisconnectState {
  /** The notice is up and gameplay is held. */
  readonly open: boolean;
  /** Index of the pad that sent the latest input, if known. */
  readonly activePad: number | null;
}

export type DisconnectEvent =
  | { readonly type: 'padInput'; readonly index: number }
  | { readonly type: 'connected'; readonly index: number }
  | { readonly type: 'disconnected'; readonly index: number; readonly lastDevice: InputDevice }
  /** A key press, tap or click. */
  | { readonly type: 'otherInput' };

export const INITIAL_DISCONNECT: DisconnectState = { open: false, activePad: null };

export function reduceDisconnect(s: DisconnectState, e: DisconnectEvent): DisconnectState {
  switch (e.type) {
    case 'padInput':
      // Any pad's input dismisses the notice; that pad is the active one from now on.
      return !s.open && s.activePad === e.index ? s : { open: false, activePad: e.index };
    case 'connected':
      // A pad (re)connecting dismisses it; which pad is active is learned from its next input.
      return s.open ? { ...s, open: false } : s;
    case 'disconnected': {
      const wasActive = s.activePad === null || s.activePad === e.index;
      // Only the pad in use matters, and only if the player was playing with it (not with
      // touch or keys after setting the pad down).
      if (wasActive && e.lastDevice === 'gamepad') return { open: true, activePad: null };
      return s.activePad === e.index ? { ...s, activePad: null } : s;
    }
    case 'otherInput':
      return s.open ? { ...s, open: false } : s;
  }
}

/** The live notice state. */
export const controllerNotice = new Store<DisconnectState>(INITIAL_DISCONNECT);

/**
 * Feeds an event to the notice and holds or releases gameplay to match. Returns true when the
 * event dismissed the notice: that input is used up and must not reach the game.
 */
export function noteControllerEvent(e: DisconnectEvent): boolean {
  const before = controllerNotice.get();
  const after = reduceDisconnect(before, e);
  if (after !== before) controllerNotice.set(after);
  if (after.open && !before.open) gameplayPause.hold('controller');
  if (!after.open && before.open) gameplayPause.release('controller');
  return before.open && !after.open && e.type !== 'connected';
}

/** A pad was plugged in or went away (from the gamepad adapter). */
export function noteControllerConnection(type: 'connected' | 'disconnected', index: number): void {
  noteControllerEvent(
    type === 'connected' ? { type, index } : { type, index, lastDevice: inputDevice.get() },
  );
}

/** Closes the notice (its Continue button, or a tap on it). */
export function dismissControllerNotice(): void {
  noteControllerEvent({ type: 'otherInput' });
}
