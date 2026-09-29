import type { BattleState, Command } from '@m1565/core';
import { applyCommand, chooseReaction, createBattle, planAiTurn } from '@m1565/core';
import { describe, expect, it } from 'vitest';
import { battleSources, loadBattle, loadLibrary } from '../src';

const lib = loadLibrary();
const SEEDS = 16;

/** AI plays both sides. A human does better than the player-side AI, so this is a floor. */
function playOut(id: string, seed: number): { outcome: BattleState['outcome']; rounds: number } {
  const setup = loadBattle(id, lib);
  // A careful player keeps must-survive units out of harm's way; model that with 'defensive'.
  const protectedIds = new Set((setup.defeat ?? []).map((d) => d.unitId));
  const units = setup.units.map((u) =>
    u.side === 'player' && protectedIds.has(u.id) ? { ...u, ai: 'defensive' as const } : u,
  );
  let { state } = createBattle({ ...setup, units, seed });
  for (let n = 0; state.outcome === 'ongoing' && n < 3000;) {
    const actor = state.turn!.unitId;
    for (const planned of planAiTurn(state, actor)) {
      let cmd: Command = planned;
      if (cmd.type === 'attack')
        cmd = { ...cmd, reaction: chooseReaction(state, cmd.targetId, actor) };
      try {
        state = applyCommand(state, cmd).state;
      } catch {
        state = applyCommand(state, { type: 'endTurn', unitId: actor }).state;
      }
      n++;
      if (state.outcome !== 'ongoing' || state.turn?.unitId !== actor) break;
    }
  }
  return { outcome: state.outcome, rounds: state.round };
}

describe('battle balance (AI vs AI)', () => {
  it.each(Object.keys(battleSources))('%s finishes and is winnable', (id) => {
    let wins = 0;
    let rounds = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = playOut(id, seed);
      expect(r.outcome, `seed ${seed} stalled`).not.toBe('ongoing');
      if (r.outcome === 'victory') wins++;
      rounds += r.rounds;
    }

    console.log(
      `${id}: player-side AI won ${wins}/${SEEDS}, avg ${(rounds / SEEDS).toFixed(1)} rounds`,
    );
    // The player-side AI is a weak stand-in for a human: 2+ wins in 16 means a person can win.
    expect(wins).toBeGreaterThanOrEqual(2);
  });
});
