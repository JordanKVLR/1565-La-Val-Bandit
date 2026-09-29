import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import story from '../story/main.ink';
import { battleSources, loadLibrary, mapSources } from '../src';

const lib = loadLibrary();
const speakers = new Set([...lib.cast.values()].map((c) => c.speaker));
const castIds = new Set(lib.cast.keys());
const SPEAKER = /^([A-ZÀ-ÖØ-ÞĠĦŻĊ][A-ZÀ-ÖØ-ÞĠĦŻĊ .'-]{0,23}):\s+/u;

/**
 * Walks every branch of the story (depth-first over choices, bounded) and checks each line and
 * command it produces. Catches typos in battle ids, map ids, cast ids and speaker names.
 */
function walk(onLine: (line: string) => void, maxPaths = 400): number {
  let paths = 0;
  const visit = (state: string | null) => {
    if (paths >= maxPaths) return;
    const s = new Story(story as ConstructorParameters<typeof Story>[0]);
    if (state) s.state.LoadJson(state);
    while (s.canContinue) onLine((s.Continue() ?? '').trim());
    const choices = s.currentChoices.length;
    if (!choices) {
      paths++;
      return;
    }
    const saved = s.state.ToJson();
    for (let i = 0; i < choices; i++) {
      const branch = new Story(story as ConstructorParameters<typeof Story>[0]);
      branch.state.LoadJson(saved);
      branch.ChooseChoiceIndex(i);
      visit(branch.state.ToJson());
    }
  };
  visit(null);
  return paths;
}

describe('story script', () => {
  it('compiles, reaches an end, and only references real content', () => {
    const problems: string[] = [];
    const battles = new Set<string>();
    const paths = walk((line) => {
      if (!line) return;
      if (line.startsWith('>>>')) {
        const [name, ...args] = line.replace(/^>>>\s*/, '').split(/\s+/);
        if (name === 'battle') {
          battles.add(args[0]!);
          if (!(args[0]! in battleSources)) problems.push(`unknown battle ${args[0]}`);
        }
        if (name === 'stage' && !(args[0]! in mapSources))
          problems.push(`unknown stage map ${args[0]}`);
        if (
          (name === 'actor' || name === 'exit') &&
          args.some((a, i) => (name === 'exit' || i === 0) && !castIds.has(a))
        ) {
          problems.push(`unknown cast in: ${line}`);
        }
        if (name === 'join' && !lib.characters.has(args[0]!))
          problems.push(`unknown character ${args[0]}`);
        const known = [
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
        if (!known.includes(name!)) problems.push(`unknown command ${name}`);
        return;
      }
      const m = line.match(SPEAKER);
      if (m && !speakers.has(m[1]!)) problems.push(`unknown speaker ${m[1]}`);
    });
    expect(problems).toEqual([]);
    expect(paths).toBeGreaterThan(1);
    expect(battles.size).toBeGreaterThanOrEqual(5);
  });
});
