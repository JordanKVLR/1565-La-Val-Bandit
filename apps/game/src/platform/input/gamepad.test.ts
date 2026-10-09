import { describe, expect, it } from 'vitest';
import type { ControlContext, PadInput } from './controls';
import { CONTROLS, helpRows, keyForPad, PAD_GLYPHS, promptFor } from './controls';
import type { PadLike } from './gamepadMapping';
import { heldInputs, heldOnAny, PadTracker, STANDARD_BUTTONS } from './gamepadMapping';

/** A mock standard-mapping pad: name the buttons held and the stick positions. */
function pad(
  held: readonly string[] = [],
  axes: readonly number[] = [0, 0, 0, 0],
  extra: Partial<PadLike> = {},
): PadLike {
  return {
    mapping: 'standard',
    connected: true,
    axes,
    buttons: STANDARD_BUTTONS.map((name) => ({
      pressed: held.includes(name),
      value: held.includes(name) ? 1 : 0,
    })),
    ...extra,
  };
}

describe('heldInputs', () => {
  it('names held buttons by the standard layout', () => {
    expect([...heldInputs(pad(['a', 'rb', 'start']))].sort()).toEqual(['a', 'rb', 'start']);
  });

  it('counts analogue triggers past half travel', () => {
    const p = pad();
    const buttons = p.buttons.map((b, i) => (i === 6 ? { pressed: false, value: 0.7 } : b));
    expect(heldInputs({ ...p, buttons }).has('lt')).toBe(true);
    const light = p.buttons.map((b, i) => (i === 7 ? { pressed: false, value: 0.2 } : b));
    expect(heldInputs({ ...p, buttons: light }).has('rt')).toBe(false);
  });

  it('treats the left stick as the D-pad, along its stronger axis only', () => {
    expect([...heldInputs(pad([], [0.9, 0.3, 0, 0]))]).toEqual(['right']);
    expect([...heldInputs(pad([], [-0.4, -0.8, 0, 0]))]).toEqual(['up']);
    expect(heldInputs(pad([], [0.3, 0.2, 0, 0])).size).toBe(0);
  });

  it('reports the right stick separately', () => {
    expect([...heldInputs(pad([], [0, 0, 0, -1]))]).toEqual(['rsUp']);
    expect([...heldInputs(pad([], [0, 0, -1, 0]))]).toEqual(['rsLeft']);
  });

  it('ignores a disconnected pad and tolerates short button lists', () => {
    expect(heldInputs(pad(['a'], undefined, { connected: false })).size).toBe(0);
    expect([...heldInputs({ buttons: [{ pressed: true, value: 1 }], axes: [] })]).toEqual(['a']);
  });

  it('merges every connected pad', () => {
    expect([...heldOnAny([pad(['a']), null, pad(['b'])])].sort()).toEqual(['a', 'b']);
  });
});

describe('PadTracker', () => {
  const held = (...inputs: PadInput[]) => new Set<PadInput>(inputs);

  it('fires a button once per press', () => {
    const t = new PadTracker();
    expect(t.update(held('a'), 0)).toEqual(['a']);
    expect(t.update(held('a'), 16)).toEqual([]);
    expect(t.update(held('a'), 2000)).toEqual([]);
    expect(t.update(held(), 2016)).toEqual([]);
    expect(t.update(held('a'), 2032)).toEqual(['a']);
  });

  it('repeats a held direction after a delay, then at an interval', () => {
    const t = new PadTracker({ down: { delay: 300, interval: 100 } });
    expect(t.update(held('down'), 0)).toEqual(['down']);
    expect(t.update(held('down'), 299)).toEqual([]);
    expect(t.update(held('down'), 300)).toEqual(['down']);
    expect(t.update(held('down'), 350)).toEqual([]);
    expect(t.update(held('down'), 400)).toEqual(['down']);
  });

  it('starts over after reset', () => {
    const t = new PadTracker();
    t.update(held('b'), 0);
    t.reset();
    expect(t.update(held('b'), 10)).toEqual(['b']);
  });
});

describe('control tables', () => {
  it('map the pad to the battle keys the battle screen already handles', () => {
    expect(keyForPad('battle', 'a')).toBe('Enter');
    expect(keyForPad('battle', 'b')).toBe('Escape');
    expect(keyForPad('battle', 'x')).toBe('a');
    expect(keyForPad('battle', 'y')).toBe('e');
    expect(keyForPad('battle', 'view')).toBe('u');
    expect(keyForPad('battle', 'ls')).toBe('m');
    expect(keyForPad('battle', 'up')).toBe('ArrowUp');
    expect(keyForPad('battle', 'lb')).toBe('[');
    expect(keyForPad('battle', 'rt')).toBe('.');
    expect(keyForPad('battle', 'rsUp')).toBe('=');
    expect(keyForPad('battle', 'start')).toBe('ContextMenu');
    expect(keyForPad('battle', 'home')).toBeUndefined();
  });

  it('map bumpers to shelves and triggers to pilots in the Armoury (Q/E and [ ])', () => {
    expect(keyForPad('armoury', 'lb')).toBe('q');
    expect(keyForPad('armoury', 'rb')).toBe('e');
    expect(keyForPad('armoury', 'lt')).toBe('[');
    expect(keyForPad('armoury', 'rt')).toBe(']');
    expect(keyForPad('armoury', 'x')).toBeUndefined();
  });

  it('give every context directions, confirm and back', () => {
    for (const ctx of Object.keys(CONTROLS) as ControlContext[]) {
      for (const input of ['up', 'down', 'left', 'right', 'a', 'b'] as const) {
        expect(keyForPad(ctx, input), `${ctx}/${input}`).toBeDefined();
      }
    }
  });

  it('never bind one pad input or one key to two actions in a context', () => {
    for (const rows of Object.values(CONTROLS)) {
      const inputs = rows.flatMap((r) => r.pad);
      expect(new Set(inputs).size).toBe(inputs.length);
      const keys = rows.map((r) => r.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('prompt with pad glyphs after pad use and with keys otherwise', () => {
    expect(promptFor('attack', 'gamepad')).toBe(PAD_GLYPHS.x);
    expect(promptFor('attack', 'keyboard')).toBe('A');
    expect(promptFor('attack', 'pointer')).toBe('A');
    expect(promptFor('confirm', 'gamepad')).toBe('Ⓐ');
    expect(promptFor('back', 'keyboard')).toBe('Esc');
    expect(promptFor('menu', 'gamepad')).toBe('☰');
    expect(promptFor('prevTab', 'keyboard', 'armoury')).toBe('Q');
    expect(promptFor('move', 'gamepad', 'menu')).toBe('');
  });

  it('list each control once on the help page', () => {
    const rows = helpRows('battle');
    expect(rows.filter((r) => r.label === 'Move the tile cursor')).toHaveLength(1);
    expect(rows.find((r) => r.label === 'Attack')).toEqual({
      label: 'Attack',
      keys: 'A',
      pad: 'Ⓧ',
    });
  });
});
