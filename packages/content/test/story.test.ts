import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import story from '../story/main.ink';
import { battleSources, loadLibrary, loadMap, mapSources } from '../src';

const lib = loadLibrary();
const speakers = new Set([...lib.cast.values()].map((c) => c.speaker));
const castIds = new Set(lib.cast.keys());
const SPEAKER = /^([A-ZÀ-ÖØ-ÞĠĦŻĊ][A-ZÀ-ÖØ-ÞĠĦŻĊ .'-]{0,23}):\s+/u;
const COMMANDS = [
  'chapter',
  'stage',
  'actor',
  'exit',
  'join',
  'leave',
  'battle',
  'prep',
  'scudi',
  'save',
  'end',
];

/** Every text line in the compiled story, reachable or not (ink stores them as "^text"). */
function allLines(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') {
    if (node.startsWith('^')) out.push(node.slice(1).trim());
  } else if (Array.isArray(node)) {
    for (const n of node) allLines(n, out);
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node)) allLines(v, out);
  }
  return out;
}

function check(line: string): string | null {
  if (line.startsWith('>>>')) {
    const [name, ...args] = line.replace(/^>>>\s*/, '').split(/\s+/);
    if (!COMMANDS.includes(name!)) return `unknown command ${name}`;
    if (name === 'battle' && !(args[0]! in battleSources)) return `unknown battle ${args[0]}`;
    if (name === 'stage' && !(args[0]! in mapSources)) return `unknown stage map ${args[0]}`;
    if (name === 'actor' && !castIds.has(args[0]!)) return `unknown cast ${args[0]}`;
    if (name === 'exit' && args.some((a) => !castIds.has(a))) return `unknown cast in ${line}`;
    if ((name === 'join' || name === 'leave') && !lib.characters.has(args[0]!))
      return `unknown character ${args[0]}`;
    return null;
  }
  const m = line.match(SPEAKER);
  return m && !speakers.has(m[1]!) ? `unknown speaker ${m[1]}` : null;
}

/** Plays the whole story, picking choices whose text matches `prefer` (else the first). */
function playthrough(prefer: RegExp): { battles: string[]; ended: boolean; route: unknown } {
  const s = new Story(story as ConstructorParameters<typeof Story>[0]);
  const battles: string[] = [];
  let ended = false;
  for (let guard = 0; guard < 5000; guard++) {
    while (s.canContinue) {
      const line = (s.Continue() ?? '').trim();
      if (line.startsWith('>>> battle')) battles.push(line.split(/\s+/)[2]!);
      if (line === '>>> end') ended = true;
    }
    const choices = s.currentChoices;
    if (!choices.length) break;
    const pick = choices.findIndex((c) => prefer.test(c.text));
    s.ChooseChoiceIndex(Math.max(0, pick));
  }
  return { battles, ended, route: s.variablesState.$('route') };
}

describe('story script', () => {
  it('every line references real battles, maps, cast and commands', () => {
    const problems = allLines(story)
      .map(check)
      .filter((p): p is string => !!p);
    expect(problems).toEqual([]);
  });

  it.each([
    ['cross', /Stand with the Order/, 'a9-marsa-lines'],
    ['island', /Fight as a Maltese/, 'i9-st-pauls-bay'],
    ['crescent', /Let him go|Cross to the Ottoman/, 'c9-st-pauls-bay'],
  ])('the %s route plays to its ending', (route, prefer, finale) => {
    const r = playthrough(prefer);
    expect(r.route).toBe(route);
    expect(r.ended).toBe(true);
    expect(r.battles).toContain('b9-fall-of-st-elmo');
    expect(r.battles.at(-1)).toBe(finale);
  });

  it('never stands a character on a wall, in the sea or off the stage', () => {
    const dir = resolve(__dirname, '../story');
    const problems: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ink'))) {
      let map: ReturnType<typeof loadMap> | null = null;
      readFileSync(resolve(dir, file), 'utf8')
        .split('\n')
        .forEach((raw, i) => {
          const line = raw.trim();
          const stage = /^>>> stage (\S+)/.exec(line);
          if (stage) {
            const src = mapSources[stage[1] as keyof typeof mapSources];
            map = src ? loadMap(src, lib.terrains) : null;
          }
          const actor = /^>>> actor (\S+) (\d+) (\d+)/.exec(line);
          if (!actor || !map) return;
          const [x, y] = [Number(actor[2]), Number(actor[3])];
          const tile = x < map.width && y < map.depth ? map.tiles[y * map.width + x] : undefined;
          if (!tile || lib.terrains.get(tile.terrain)?.impassable)
            problems.push(`${file}:${i + 1} ${actor[1]} at ${x},${y}`);
        });
    }
    expect(problems).toEqual([]);
  });

  it('uses every battle in the data folder', () => {
    const used = new Set(
      allLines(story)
        .filter((l) => l.startsWith('>>> battle'))
        .map((l) => l.split(/\s+/)[2]),
    );
    expect(Object.keys(battleSources).filter((id) => !used.has(id))).toEqual([]);
  });
});
