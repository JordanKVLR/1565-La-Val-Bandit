import { afterEach, describe, expect, it } from 'vitest';
import { gameplayPause } from '../../state/pause';
import { setInputDevice } from './device';
import type { DisconnectState } from './disconnect';
import {
  controllerNotice,
  dismissControllerNotice,
  INITIAL_DISCONNECT,
  noteControllerConnection,
  noteControllerEvent,
  reduceDisconnect,
} from './disconnect';
import { padHolding, STANDARD_BUTTONS } from './gamepadMapping';

const playingWith = (index: number): DisconnectState => ({ open: false, activePad: index });

describe('reduceDisconnect', () => {
  it('opens when the pad in use disconnects and the last input was a pad', () => {
    const s = reduceDisconnect(playingWith(0), {
      type: 'disconnected',
      index: 0,
      lastDevice: 'gamepad',
    });
    expect(s).toEqual({ open: true, activePad: null });
  });

  it('opens for a disconnect before any pad input was attributed', () => {
    expect(
      reduceDisconnect(INITIAL_DISCONNECT, {
        type: 'disconnected',
        index: 2,
        lastDevice: 'gamepad',
      }).open,
    ).toBe(true);
  });

  it('stays closed when another pad disconnects', () => {
    const s = reduceDisconnect(playingWith(0), {
      type: 'disconnected',
      index: 1,
      lastDevice: 'gamepad',
    });
    expect(s).toEqual(playingWith(0));
  });

  it('stays closed when the player had moved on to touch or keys', () => {
    for (const lastDevice of ['pointer', 'keyboard'] as const) {
      const s = reduceDisconnect(playingWith(0), { type: 'disconnected', index: 0, lastDevice });
      expect(s).toEqual({ open: false, activePad: null });
    }
  });

  it('closes on reconnect, on any key, tap or pad input', () => {
    const open: DisconnectState = { open: true, activePad: null };
    expect(reduceDisconnect(open, { type: 'connected', index: 0 }).open).toBe(false);
    expect(reduceDisconnect(open, { type: 'otherInput' }).open).toBe(false);
    expect(reduceDisconnect(open, { type: 'padInput', index: 1 })).toEqual(playingWith(1));
  });

  it('keeps the same state object when nothing changes', () => {
    const s = playingWith(0);
    expect(reduceDisconnect(s, { type: 'padInput', index: 0 })).toBe(s);
    expect(reduceDisconnect(s, { type: 'otherInput' })).toBe(s);
    expect(reduceDisconnect(s, { type: 'connected', index: 1 })).toBe(s);
  });
});

describe('the live notice', () => {
  afterEach(() => {
    dismissControllerNotice();
    controllerNotice.set(INITIAL_DISCONNECT);
  });

  it('holds gameplay while open and swallows only the input that dismisses it', async () => {
    setInputDevice('gamepad');
    expect(noteControllerEvent({ type: 'padInput', index: 0 })).toBe(false);
    noteControllerConnection('disconnected', 0);
    expect(controllerNotice.get().open).toBe(true);
    expect(gameplayPause.isHeld('controller')).toBe(true);

    // The battle's AI waits on the gate: nothing advances underneath the notice.
    let advanced = false;
    const ai = gameplayPause.whenRunning().then(() => (advanced = true));
    await Promise.resolve();
    expect(advanced).toBe(false);

    // A key press dismisses it and is used up; the next one reaches the game again.
    expect(noteControllerEvent({ type: 'otherInput' })).toBe(true);
    expect(noteControllerEvent({ type: 'otherInput' })).toBe(false);
    await ai;
    expect(advanced).toBe(true);
    expect(gameplayPause.isHeld('controller')).toBe(false);
  });

  it('reconnecting closes it without using up an input', () => {
    setInputDevice('gamepad');
    noteControllerConnection('disconnected', 3);
    expect(controllerNotice.get().open).toBe(true);
    noteControllerConnection('connected', 3);
    expect(controllerNotice.get().open).toBe(false);
    expect(gameplayPause.isHeld()).toBe(false);
  });

  it('ignores a disconnect after the player switched to touch', () => {
    setInputDevice('gamepad');
    noteControllerEvent({ type: 'padInput', index: 0 });
    setInputDevice('pointer');
    noteControllerConnection('disconnected', 0);
    expect(controllerNotice.get().open).toBe(false);
  });
});

describe('padHolding', () => {
  const pad = (held: string[]) => ({
    connected: true,
    axes: [0, 0, 0, 0],
    buttons: STANDARD_BUTTONS.map((n) => ({ pressed: held.includes(n), value: 0 })),
  });

  it('names the pad that sent an input', () => {
    expect(padHolding([pad([]), null, pad(['a'])], 'a')).toBe(2);
    expect(padHolding([pad(['b'])], 'a')).toBe(-1);
  });
});
