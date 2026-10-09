import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const UI = new URL('.', import.meta.url).pathname;

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name), ext) : ext.test(e.name) ? [join(dir, e.name)] : [],
  );
}

/** A number followed by a viewport unit (vw, vh, dvh, svh, lvh, vmin, vmax). */
const RAW_VIEWPORT_UNIT = /(?<![\w-])\d*\.?\d+[dsl]?v(?:w|h|min|max)\b/g;

describe('stylesheets', () => {
  it('use the zoom-safe --vw/--vh/--dvh units instead of raw viewport units (ADR 0010)', () => {
    // Under the TV layout's CSS zoom, 100vh would be zoom × the screen: see tv.css.
    const offenders = files(UI, /\.(css|tsx)$/)
      .filter((f) => !f.endsWith('tv.css'))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .flatMap((line, i) =>
            line.match(RAW_VIEWPORT_UNIT) ? [`${relative(UI, f)}:${i + 1}: ${line.trim()}`] : [],
          ),
      );
    expect(offenders).toEqual([]);
  });

  it('the guard recognises raw units and leaves the variables alone', () => {
    expect('height: 100vh;'.match(RAW_VIEWPORT_UNIT)).not.toBeNull();
    expect('width: min(300px, 40vw);'.match(RAW_VIEWPORT_UNIT)).not.toBeNull();
    expect('max-height: calc(100dvh - 24px);'.match(RAW_VIEWPORT_UNIT)).not.toBeNull();
    expect('max-height: calc(100 * var(--dvh) - 24px);'.match(RAW_VIEWPORT_UNIT)).toBeNull();
  });
});
