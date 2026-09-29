import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Compiler } from 'inkjs/compiler/Compiler';
import { CompilerOptions } from 'inkjs/compiler/CompilerOptions';
import { PosixFileHandler } from 'inkjs/compiler/FileHandler/PosixFileHandler';
import type { Plugin } from 'vite';

/** Every file pulled in via INCLUDE, recursively, so the dev server can watch them. */
function collectIncludes(file: string, seen = new Set<string>()): string[] {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*INCLUDE\s+(.+?)\s*$/);
    if (!m) continue;
    const inc = resolve(dirname(file), m[1]!);
    if (seen.has(inc)) continue;
    seen.add(inc);
    collectIncludes(inc, seen);
  }
  return [...seen];
}

/** Compiles an .ink file (and its INCLUDEs) to the runtime JSON inkjs loads. Throws on errors. */
export function compileInk(file: string): { json: string; includes: string[] } {
  const errors: string[] = [];
  const root = dirname(file) + '/';
  const options = new CompilerOptions(
    file,
    [],
    false,
    (message: string) => {
      if (!message.startsWith('WARNING')) errors.push(message);
    },
    new PosixFileHandler(root),
  );
  const compiler = new Compiler(readFileSync(file, 'utf8'), options);
  let json: string | undefined;
  try {
    json = compiler.Compile().ToJson() ?? undefined;
  } catch {
    // Errors were collected by the handler above.
  }
  if (!json || errors.length)
    throw new Error(`Ink compile failed for ${file}:\n${errors.join('\n')}`);
  return { json, includes: collectIncludes(file) };
}

/** Lets code `import story from './main.ink'` and receive compiled story JSON. */
export function inkPlugin(): Plugin {
  return {
    name: 'm1565-ink',
    transform(_code, id) {
      if (!id.endsWith('.ink')) return null;
      const { json, includes } = compileInk(id);
      for (const inc of includes) this.addWatchFile(inc);
      return { code: `export default ${json};`, map: null };
    },
  };
}
