import type { BattleState, Coord } from '@m1565/core';
import { createBattle, unitAt } from '@m1565/core';
import { loadBattle, loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import type { BattleRenderer } from './BattleController';
import { BattleController } from './BattleController';
import type { ScreenCorners } from './cursor';
import { cycleUnit, DEFAULT_CORNERS, stepCursor } from './cursor';

const map = { width: 6, depth: 5 };

describe('stepCursor', () => {
  it('moves one tile per arrow along the screen diagonals of the default view', () => {
    const from = { x: 2, y: 2 };
    expect(stepCursor(from, 'up', DEFAULT_CORNERS, map)).toEqual({ x: 3, y: 2 }); // east
    expect(stepCursor(from, 'right', DEFAULT_CORNERS, map)).toEqual({ x: 2, y: 3 }); // south
    expect(stepCursor(from, 'down', DEFAULT_CORNERS, map)).toEqual({ x: 1, y: 2 }); // west
    expect(stepCursor(from, 'left', DEFAULT_CORNERS, map)).toEqual({ x: 2, y: 1 }); // north
  });

  it('follows the camera when it rotates', () => {
    const turned: ScreenCorners = {
      upLeft: 'east',
      upRight: 'south',
      downLeft: 'north',
      downRight: 'west',
    };
    expect(stepCursor({ x: 2, y: 2 }, 'up', turned, map)).toEqual({ x: 2, y: 3 });
  });

  it('stays on the map', () => {
    expect(stepCursor({ x: 5, y: 0 }, 'up', DEFAULT_CORNERS, map)).toEqual({ x: 5, y: 0 });
    expect(stepCursor({ x: 0, y: 0 }, 'left', DEFAULT_CORNERS, map)).toEqual({ x: 0, y: 0 });
  });

  it('opposite arrows undo each other', () => {
    const from = { x: 3, y: 3 };
    const there = stepCursor(from, 'left', DEFAULT_CORNERS, map);
    expect(stepCursor(there, 'right', DEFAULT_CORNERS, map)).toEqual(from);
    expect(
      stepCursor(stepCursor(from, 'up', DEFAULT_CORNERS, map), 'down', DEFAULT_CORNERS, map),
    ).toEqual(from);
  });
});

describe('cycleUnit', () => {
  const units = [{ pos: { x: 0, y: 0 } }, { pos: { x: 1, y: 1 } }, { pos: { x: 2, y: 2 } }];

  it('steps through units in order and wraps', () => {
    expect(cycleUnit(units, { x: 0, y: 0 }, 1)).toEqual({ x: 1, y: 1 });
    expect(cycleUnit(units, { x: 2, y: 2 }, 1)).toEqual({ x: 0, y: 0 });
    expect(cycleUnit(units, { x: 0, y: 0 }, -1)).toEqual({ x: 2, y: 2 });
  });

  it('starts at either end when the cursor is on no unit', () => {
    expect(cycleUnit(units, { x: 4, y: 4 }, 1)).toEqual({ x: 0, y: 0 });
    expect(cycleUnit(units, undefined, -1)).toEqual({ x: 2, y: 2 });
    expect(cycleUnit([], undefined, 1)).toBeUndefined();
  });
});

/** A renderer that draws nothing and records the selection cursor. */
function fakeRenderer(): BattleRenderer & { selected: Coord | undefined; revealed: Coord[] } {
  return {
    selected: undefined,
    revealed: [],
    syncUnits() {},
    animateMove: () => Promise.resolve(),
    setHighlights() {},
    select(c) {
      this.selected = c;
    },
    focus: () => Promise.resolve(),
    shake() {},
    screenFacings: () => DEFAULT_CORNERS,
    reveal(c) {
      this.revealed.push(c);
    },
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

/** The first battle with every unit under player control, so the first turn is ours. */
async function playerTurn() {
  const lib = loadLibrary();
  const setup = loadBattle('b1-marsaxlokk', lib);
  const base = createBattle(setup).state;
  const state: BattleState = {
    ...base,
    units: base.units.map((u) => ({ ...u, controller: 'human' as const })),
  };
  const ctl = new BattleController(setup, lib, undefined, state);
  const renderer = fakeRenderer();
  ctl.attach(renderer);
  for (let i = 0; i < 20 && ctl.mode.kind !== 'move'; i++) await flush();
  return { ctl, renderer };
}

describe('BattleController cursor', () => {
  it('starts each turn on the active unit and moves with the arrows', async () => {
    const { ctl, renderer } = await playerTurn();
    expect(ctl.mode.kind).toBe('move');
    const start = ctl.active()!.pos;
    expect(ctl.cursor()).toEqual(start);
    expect(ctl.moveCursor('up')).toBe(true);
    const next = stepCursor(start, 'up', DEFAULT_CORNERS, ctl.state.map);
    expect(ctl.cursor()).toEqual(next);
    expect(renderer.selected).toEqual(next);
    expect(renderer.revealed.at(-1)).toEqual(next);
    expect(ctl.view.get().inspected).toEqual(next);
  });

  it('previews a route under the cursor and moves there on confirm', async () => {
    const { ctl } = await playerTurn();
    const mode = ctl.mode;
    if (mode.kind !== 'move') throw new Error('expected move mode');
    const unit = ctl.active()!;
    // Walk the cursor to a reachable tile one step away.
    const dirs = ['up', 'right', 'down', 'left'] as const;
    const dir = dirs.find((d) => {
      const to = stepCursor(unit.pos, d, DEFAULT_CORNERS, ctl.state.map);
      return (mode.reach.get(`${to.x},${to.y}`)?.path.length ?? 0) > 0;
    })!;
    ctl.moveCursor(dir);
    const after = ctl.mode;
    expect(after.kind === 'move' && after.pending?.to).toEqual(ctl.cursor());
    expect(ctl.confirmCursor()).toBe(true);
    for (let i = 0; i < 20 && ctl.mode.kind === 'busy'; i++) await flush();
    expect(ctl.active()!.pos).toEqual(ctl.cursor());
    expect(ctl.canUndo()).toBe(true);
  });

  it('opens Move when confirming on your own unit from the command menu', async () => {
    const { ctl } = await playerTurn();
    ctl.cancel(); // move → command
    expect(ctl.mode.kind).toBe('command');
    expect(ctl.cursor()).toEqual(ctl.active()!.pos);
    ctl.confirmCursor();
    expect(ctl.mode.kind).toBe('move');
  });

  it('cycles the cursor through units', async () => {
    const { ctl } = await playerTurn();
    const first = ctl.cursor()!;
    ctl.cycleCursor(1);
    const second = ctl.cursor()!;
    expect(second).not.toEqual(first);
    expect(unitAt(ctl.state, second)).toBeDefined();
  });

  it('ignores the cursor while nothing on the map can be chosen', async () => {
    const { ctl } = await playerTurn();
    ctl.chooseEndTurn();
    expect(ctl.mode.kind).toBe('facing');
    const before = ctl.cursor();
    expect(ctl.moveCursor('down')).toBe(false);
    expect(ctl.confirmCursor()).toBe(false);
    expect(ctl.cursor()).toEqual(before);
  });
});
