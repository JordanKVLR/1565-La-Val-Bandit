import { describe, expect, it } from 'vitest';
import { confirmStep, cx, meterModel, nextTrapIndex, placeBeside } from './logic';

describe('cx', () => {
  it('joins the truthy class names', () => {
    expect(cx('ds-btn', false, 'is-on', null, undefined, '')).toBe('ds-btn is-on');
    expect(cx()).toBe('');
  });
});

describe('meterModel', () => {
  it('shows value/max with no preview', () => {
    const m = meterModel(93, 93);
    expect(m).toMatchObject({ fill: 100, preview: null, previewWidth: 0, text: '93/93' });
    expect(m.low).toBe(false);
  });

  it('cuts a cost out of the bar and reads before→after', () => {
    const m = meterModel(100, 100, -56);
    expect(m.after).toBe(44);
    expect(m.fill).toBe(44);
    expect(m.preview).toBe('cost');
    expect(m.previewFrom).toBe(44);
    expect(m.previewWidth).toBe(56);
    expect(m.text).toBe('100→44');
  });

  it('hatches a gain after the fill', () => {
    const m = meterModel(20, 100, 35);
    expect(m).toMatchObject({ fill: 20, preview: 'gain', previewFrom: 20 });
    expect(m.previewWidth).toBeCloseTo(35);
    expect(m.text).toBe('20→55');
  });

  it('clamps to 0..max, and a change that clamps to nothing is no preview', () => {
    expect(meterModel(10, 100, -50)).toMatchObject({ after: 0, fill: 0, text: '10→0' });
    expect(meterModel(100, 100, 20)).toMatchObject({ after: 100, preview: null, text: '100/100' });
    expect(meterModel(5, 0).fill).toBe(0);
  });

  it('can drop the max and flags a quarter or less as low', () => {
    expect(meterModel(14, 32, 0, { showMax: false }).text).toBe('14');
    expect(meterModel(25, 100).low).toBe(true);
    expect(meterModel(26, 100).low).toBe(false);
  });
});

describe('confirmStep', () => {
  it('fires at once without a confirm step', () => {
    expect(confirmStep('idle', 'press', false)).toEqual({ state: 'idle', fire: true });
  });

  it('arms on the first press and fires on the second', () => {
    const first = confirmStep('idle', 'press', true);
    expect(first).toEqual({ state: 'armed', fire: false });
    expect(confirmStep(first.state, 'press', true)).toEqual({ state: 'idle', fire: true });
  });

  it('disarms on timeout or blur without firing', () => {
    expect(confirmStep('armed', 'timeout', true)).toEqual({ state: 'idle', fire: false });
    expect(confirmStep('armed', 'blur', true)).toEqual({ state: 'idle', fire: false });
  });
});

describe('placeBeside', () => {
  const area = { width: 1000, height: 600 };
  const bar = { width: 150, height: 200 };
  const insets = { top: 60, right: 10, bottom: 10, left: 10 };

  it('goes on the side towards the nearer edge, vertically centred on the lifted point', () => {
    expect(placeBeside({ x: 700, y: 300 }, bar, area, insets, { gap: 40, lift: 20 })).toEqual({
      x: 740,
      y: 180,
      side: 'right',
    });
    expect(placeBeside({ x: 300, y: 300 }, bar, area, insets, { gap: 40 })).toEqual({
      x: 110,
      y: 200,
      side: 'left',
    });
  });

  it('honours an explicit side when it fits, and flips when it does not', () => {
    expect(placeBeside({ x: 300, y: 300 }, bar, area, insets, { prefer: 'right' }).side).toBe(
      'right',
    );
    expect(placeBeside({ x: 900, y: 300 }, bar, area, insets, { prefer: 'right' })).toMatchObject({
      x: 710,
      side: 'left',
    });
  });

  it('stays inside the insets near the top and bottom', () => {
    expect(placeBeside({ x: 700, y: 20 }, bar, area, insets).y).toBe(60);
    expect(placeBeside({ x: 700, y: 590 }, bar, area, insets).y).toBe(390);
  });

  it('takes the side that covers fewer of the points to avoid', () => {
    const avoid = [{ x: 800, y: 300 }];
    expect(placeBeside({ x: 700, y: 300 }, bar, area, insets, { avoid })).toMatchObject({
      side: 'left',
      x: 510,
    });
    // A tie keeps the preferred side.
    const both = [...avoid, { x: 600, y: 300 }];
    expect(placeBeside({ x: 700, y: 300 }, bar, area, insets, { avoid: both }).side).toBe('right');
  });

  it('still prefers a side that fits over one that covers fewer points', () => {
    const avoid = [{ x: 150, y: 300 }];
    // Left of x=120 does not fit (it would be pushed back over the point).
    expect(placeBeside({ x: 120, y: 300 }, bar, area, insets, { avoid }).side).toBe('right');
  });

  /** A grid of tile centres, `step` apart, from (x0, y0) to (x1, y1). */
  const tiles = (x0: number, x1: number, y0: number, y1: number, step = 40) => {
    const out: { x: number; y: number }[] = [];
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) out.push({ x, y });
    return out;
  };

  it('takes the side off the movement range when the outward side would cover it', () => {
    // The range lies left of the unit, towards the nearer edge.
    const keepClear = tiles(120, 280, 220, 380);
    expect(placeBeside({ x: 300, y: 300 }, bar, area, insets, { keepClear })).toEqual({
      x: 340,
      y: 200,
      side: 'right',
    });
  });

  it('stands just past the edge of a range that surrounds the unit, level with it', () => {
    const keepClear = tiles(380, 620, 260, 340);
    // Right beside the unit would hide nine tiles on either side; past the edge hides none.
    expect(placeBeside({ x: 500, y: 300 }, bar, area, insets, { keepClear })).toEqual({
      x: 633,
      y: 200,
      side: 'right',
    });
  });

  it('docks in the bottom-right corner when every spot beside the unit hides the range', () => {
    // One row of range across the whole map: no spot past its edge fits on screen.
    const keepClear = tiles(20, 980, 300, 300);
    const opts = { keepClear, dockAbove: 2 };
    expect(placeBeside({ x: 500, y: 300 }, bar, area, insets, opts)).toEqual({
      x: 840,
      y: 390,
      side: 'dock',
    });
    // Without a threshold it stays beside the unit; under the threshold it does not dock.
    expect(placeBeside({ x: 500, y: 300 }, bar, area, insets, { keepClear }).side).toBe('right');
    const few = tiles(560, 600, 300, 300);
    expect(
      placeBeside({ x: 500, y: 300 }, bar, area, insets, { keepClear: few, dockAbove: 2 }).side,
    ).not.toBe('dock');
  });

  it('weighs a covered unit above a covered tile', () => {
    // Left of the unit: one other unit. Right: two range tiles, and no room past them.
    const avoid = [{ x: 420, y: 300 }];
    const keepClear = [
      { x: 600, y: 300 },
      { x: 860, y: 300 },
    ];
    expect(placeBeside({ x: 500, y: 300 }, bar, area, insets, { avoid, keepClear })).toMatchObject({
      side: 'right',
    });
  });
});

describe('nextTrapIndex', () => {
  it('wraps forwards and backwards', () => {
    expect(nextTrapIndex(0, 3, false)).toBe(1);
    expect(nextTrapIndex(2, 3, false)).toBe(0);
    expect(nextTrapIndex(0, 3, true)).toBe(2);
  });

  it('enters from outside at the first or last control', () => {
    expect(nextTrapIndex(-1, 3, false)).toBe(0);
    expect(nextTrapIndex(-1, 3, true)).toBe(2);
  });

  it('has nowhere to go in an empty dialog', () => {
    expect(nextTrapIndex(-1, 0, false)).toBe(-1);
  });
});
