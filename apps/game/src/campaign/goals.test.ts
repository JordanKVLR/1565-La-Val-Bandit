import { loadLibrary } from '@m1565/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { resultLineText } from '../ui/results';
import { describeBonus } from '../ui/battle/objectives';
import { createBattle } from '@m1565/core';
import { GameSession } from './GameSession';
import { installFakePlatform, playUntil, wonState } from './testkit';

const lib = loadLibrary();

beforeEach(() => {
  installFakePlatform();
});

function firstBattle(): {
  s: GameSession;
  setup: Extract<GameSession['state']['screen'], { kind: 'battle' }>['setup'];
} {
  const s = new GameSession(lib, undefined, { difficulty: 'knight' });
  playUntil(s, (v) => v.screen.kind === 'battle');
  const screen = s.state.screen;
  if (screen.kind !== 'battle') throw new Error('no battle');
  return { s, setup: screen.setup };
}

describe('optional goals', () => {
  it('every battle offers at least one, with a reward', () => {
    const { setup } = firstBattle();
    expect(setup.bonus?.length).toBeGreaterThan(0);
    for (const g of setup.bonus ?? []) expect(g.scudi + g.parts).toBeGreaterThan(0);
  });

  it('are listed in the HUD with their rewards', () => {
    const { setup } = firstBattle();
    const lines = describeBonus(createBattle(setup).state);
    expect(lines.length).toBe(setup.bonus!.length);
    expect(lines[0]).toMatch(/scudi/);
    expect(lines[0]).toMatch(/parts/);
  });

  it('pay out when met and say so on the results screen, with and without colour', () => {
    const { s, setup } = firstBattle();
    const scudiBefore = s.state.scudi;
    const partsBefore = s.state.parts;
    s.finishBattle('victory', wonState(setup));
    const screen = s.state.screen;
    expect(screen.kind).toBe('results');
    if (screen.kind !== 'results') return;
    const goals = screen.lines.filter((l) => l.kind === 'goal');
    expect(goals).toHaveLength(setup.bonus!.length);
    const metScudi = goals.reduce((n, l) => n + (l.kind === 'goal' && l.met ? l.goal.scudi : 0), 0);
    expect(metScudi).toBeGreaterThan(0);
    expect(s.state.scudi).toBeGreaterThanOrEqual(scudiBefore + metScudi);
    expect(s.state.parts).toBeGreaterThan(partsBefore);
    expect(goals.map((l) => resultLineText(l))[0]).toMatch(/^Goal met:/);
  });

  it('a missed goal pays nothing and reads "Goal missed"', () => {
    const { s, setup } = firstBattle();
    const won = wonState(setup);
    // Dragged out past any round limit, and the first player unit lost.
    const late = {
      ...won,
      round: 99,
      units: won.units.map((u, i) =>
        u.side === 'player' && i === 1 ? { ...u, defeated: true } : u,
      ),
    };
    s.finishBattle('victory', late);
    const screen = s.state.screen;
    if (screen.kind !== 'results') throw new Error('no results');
    const missed = screen.lines.filter((l) => l.kind === 'goal' && !l.met);
    expect(missed.length).toBeGreaterThan(0);
    expect(resultLineText(missed[0]!)).toMatch(/^Goal missed:/);
  });
});
