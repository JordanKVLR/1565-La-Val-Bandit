import { Story } from 'inkjs';

/**
 * One thing the story wants to do next:
 * - `line`: dialogue ("NINU: text") or narration (no speaker)
 * - `choices`: the player must pick one
 * - `command`: a game action written in the script as `>>> name arg1 arg2`
 * - `end`: the story has finished
 */
export type StoryStep =
  | { readonly kind: 'line'; readonly speaker: string | null; readonly text: string }
  | { readonly kind: 'choices'; readonly choices: readonly string[] }
  | { readonly kind: 'command'; readonly name: string; readonly args: readonly string[] }
  | { readonly kind: 'end' };

const SPEAKER = /^([A-ZÀ-ÖØ-ÞĠĦŻĊ][A-ZÀ-ÖØ-ÞĠĦŻĊ .'-]{0,23}):\s+(.+)$/u;

/** Splits `>>> name a "b c" d` into name + args, honouring double quotes. */
export function parseCommand(line: string): { name: string; args: string[] } {
  const parts = [...line.replace(/^>>>\s*/, '').matchAll(/"([^"]*)"|(\S+)/g)].map(
    (m) => m[1] ?? m[2] ?? '',
  );
  const [name = '', ...args] = parts;
  return { name, args };
}

export function parseLine(raw: string): StoryStep {
  const text = raw.trim();
  if (text.startsWith('>>>')) {
    const { name, args } = parseCommand(text);
    return { kind: 'command', name, args };
  }
  const m = text.match(SPEAKER);
  return m ? { kind: 'line', speaker: m[1]!, text: m[2]! } : { kind: 'line', speaker: null, text };
}

/** Thin, typed wrapper over an inkjs Story with save/restore. */
export class StoryRunner {
  private readonly story: Story;

  constructor(json: object, savedState?: string) {
    this.story = new Story(json as ConstructorParameters<typeof Story>[0]);
    if (savedState) this.story.state.LoadJson(savedState);
  }

  next(): StoryStep {
    while (this.story.canContinue) {
      const raw = this.story.Continue() ?? '';
      if (raw.trim()) return parseLine(raw);
    }
    if (this.story.currentChoices.length) {
      return { kind: 'choices', choices: this.story.currentChoices.map((c) => c.text) };
    }
    return { kind: 'end' };
  }

  choose(index: number): void {
    this.story.ChooseChoiceIndex(index);
  }

  jumpTo(path: string): void {
    this.story.ChoosePathString(path);
  }

  getVar(name: string): unknown {
    return this.story.variablesState.$(name);
  }

  setVar(name: string, value: string | number | boolean): void {
    this.story.variablesState.$(name, value);
  }

  saveState(): string {
    return this.story.state.ToJson();
  }
}
