import { expect } from 'vitest';
import type { BattleState, Command } from '../src';
import { applyCommand, chooseReaction, createBattle, planAiTurn } from '../src';
import { GUN, makeMap, setup, unit } from './fixtures';

/** Plays a battle to the end with the AI controlling both sides. */
export function simulate(
  seed: number,
  maxCommands = 2000,
): { state: BattleState; commands: number } {
  // Mirror-symmetric map and armies, so only initiative and dice decide the winner.
  const top = ['pppppppppp', 'ppgggppppp', 'pprrrrrrpp', 'pppppgggpp'];
  const topH = ['0000011000', '0001111000', '0000000000', '0000000110'];
  const map = makeMap([...top, ...[...top].reverse()], [...topH, ...[...topH].reverse()]);
  let { state } = createBattle(
    setup({
      seed,
      map,
      units: [
        unit({ id: 'p1', at: { x: 2, y: 7 } }),
        unit({ id: 'p2', at: { x: 5, y: 7 }, weapon: GUN }),
        unit({ id: 'p3', at: { x: 8, y: 7 }, ai: 'defensive' }),
        unit({ id: 'e1', side: 'enemy', at: { x: 2, y: 0 }, facing: 'south' }),
        unit({ id: 'e2', side: 'enemy', at: { x: 5, y: 0 }, facing: 'south', weapon: GUN }),
        unit({ id: 'e3', side: 'enemy', at: { x: 8, y: 0 }, facing: 'south', ai: 'defensive' }),
      ],
    }),
  );
  let commands = 0;
  while (state.outcome === 'ongoing' && commands < maxCommands) {
    const actor = state.turn!.unitId;
    for (const planned of planAiTurn(state, actor)) {
      let cmd: Command = planned;
      if (cmd.type === 'attack')
        cmd = { ...cmd, reaction: chooseReaction(state, cmd.targetId, actor) };
      state = applyCommand(state, cmd).state;
      commands++;
      assertInvariants(state);
      if (state.outcome !== 'ongoing' || state.turn?.unitId !== actor) break;
    }
  }
  return { state, commands };
}

function assertInvariants(s: BattleState): void {
  const seen = new Set<string>();
  for (const u of s.units) {
    expect(u.hp).toBeGreaterThanOrEqual(0);
    expect(u.hp).toBeLessThanOrEqual(u.maxHp);
    expect(u.ap).toBeLessThanOrEqual(s.balance.apMax);
    expect(u.fp).toBeGreaterThanOrEqual(0);
    expect(u.fp).toBeLessThanOrEqual(s.balance.fpMax);
    expect(u.defeated).toBe(u.hp === 0);
    if (!u.defeated) {
      const k = `${u.pos.x},${u.pos.y}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  }
}
