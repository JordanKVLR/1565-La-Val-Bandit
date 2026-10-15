import type { Coord } from './grid';
import { getTile, neighbors } from './grid';
import { coordKey } from './pathfinding';
import type { BattleEvent } from './events';
import type { ScriptAction, ScriptTrigger, BattleState } from './state';
import { createUnit } from './units';
import type { UnitSpec } from './units';

const fires = (when: ScriptTrigger, trigger: ScriptTrigger): boolean =>
  when.type === trigger.type &&
  (when.type === 'round'
    ? when.round === (trigger as typeof when).round
    : when.unitId === (trigger as typeof when).unitId);

/** The tile itself if it is free and walkable, else the nearest such tile (null if none). */
function freeTileNear(state: BattleState, at: Coord): Coord | null {
  const seen = new Set([coordKey(at)]);
  let ring: Coord[] = [at];
  for (let depth = 0; depth < 6 && ring.length; depth++) {
    const next: Coord[] = [];
    for (const c of ring) {
      const tile = getTile(state.map, c);
      const terrain = tile && state.terrains[tile.terrain];
      const taken = state.units.some((u) => !u.defeated && u.pos.x === c.x && u.pos.y === c.y);
      if (terrain && !terrain.impassable && !taken) return c;
      for (const n of neighbors(state.map, c)) {
        if (!seen.has(coordKey(n))) {
          seen.add(coordKey(n));
          next.push(n);
        }
      }
    }
    ring = next;
  }
  return null;
}

function apply(
  state: BattleState,
  action: ScriptAction,
  out: {
    messages: { text: string; speaker?: string }[];
    reinforced: string[];
    terrain: { tiles: Coord[]; terrain: string }[];
  },
): void {
  switch (action.type) {
    case 'message':
      out.messages.push({
        text: action.text,
        ...(action.speaker ? { speaker: action.speaker } : {}),
      });
      return;
    case 'terrain': {
      if (!state.terrains[action.terrain]) throw new Error(`Unknown terrain "${action.terrain}"`);
      const tiles = state.map.tiles as { terrain: string; height: number }[];
      const changed: Coord[] = [];
      for (const c of action.tiles) {
        const i = c.y * state.map.width + c.x;
        if (!getTile(state.map, c)) continue;
        tiles[i] = { ...tiles[i]!, terrain: action.terrain };
        changed.push({ x: c.x, y: c.y });
      }
      out.terrain.push({ tiles: changed, terrain: action.terrain });
      return;
    }
    case 'reinforce':
      for (const spec of action.units as readonly UnitSpec[]) {
        if (state.units.some((u) => u.id === spec.id)) continue;
        const at = freeTileNear(state, spec.at);
        if (!at) continue;
        state.units.push(createUnit({ ...spec, at }, state.balance));
        out.reinforced.push(spec.id);
      }
      return;
  }
}

/**
 * Fires every scripted event whose trigger matches (once each). A reinforcement arrives on its
 * tile or the nearest free one, ground changes rewrite the map, and messages are reported for
 * the player to read. Units that arrive mid-round take their first turn next round.
 */
export function runScript(state: BattleState, events: BattleEvent[], trigger: ScriptTrigger): void {
  const pending = state.script;
  if (!pending?.length) return;
  const due = pending.filter((s) => fires(s.when, trigger));
  if (!due.length) return;
  state.script = pending.filter((s) => !due.includes(s));
  for (const script of due) {
    const out = {
      messages: [] as { text: string; speaker?: string }[],
      reinforced: [] as string[],
      terrain: [] as { tiles: Coord[]; terrain: string }[],
    };
    for (const action of script.actions) apply(state, action, out);
    events.push({ type: 'scriptEvent', id: script.id, ...out });
  }
}
