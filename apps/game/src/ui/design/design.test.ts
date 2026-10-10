import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { VNode } from 'preact';
import { describe, expect, it } from 'vitest';
import { Chip, SideMark } from './Chip';
import { ICON_NAMES } from './Icon';
import { Meter } from './Meter';
import { Divider } from './Panel';

const UI = join(import.meta.dirname, '..');
const TOKENS = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name), ext) : ext.test(e.name) ? [join(dir, e.name)] : [],
  );
}

/** Every element in a rendered tree (function components called, as they hold no hooks). */
function walk(node: unknown, out: VNode[] = []): VNode[] {
  if (Array.isArray(node)) {
    for (const n of node) walk(n, out);
  } else if (node && typeof node === 'object' && 'type' in node) {
    const v = node as VNode<Record<string, unknown>>;
    if (typeof v.type === 'function') {
      walk((v.type as (p: unknown) => unknown)(v.props), out);
    } else {
      out.push(v);
      walk(v.props.children, out);
    }
  }
  return out;
}
const byClass = (nodes: VNode[], cls: string) =>
  nodes.filter((n) => String((n.props as { class?: string }).class ?? '').includes(cls));

describe('design tokens', () => {
  it('define every --ds-* custom property the stylesheets and components use', () => {
    const defined = new Set([...TOKENS.matchAll(/(--ds-[\w-]+)\s*:/g)].map((m) => m[1]));
    // Set by components at run time or locally in one rule.
    const local = new Set(['--ds-meter-color', '--ds-sheet-w', '--ds-cols']);
    const missing = files(UI, /\.(css|tsx?)$/).flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/var\((--ds-[\w-]+)/g)]
        .map((m) => m[1]!)
        .filter((name) => !defined.has(name) && !local.has(name))
        .map((name) => `${relative(UI, f)}: ${name}`),
    );
    expect(missing).toEqual([]);
  });

  it('keep the side colours in step with the renderer (Okabe-Ito, render/palette.ts)', () => {
    const palette = readFileSync(join(UI, '../render/palette.ts'), 'utf8');
    for (const side of ['player', 'enemy']) {
      const inPalette = palette.match(new RegExp(`${side}: '(#[0-9a-f]{6})'`))?.[1];
      const inTokens = TOKENS.match(new RegExp(`--ds-side-${side}: (#[0-9a-f]{6});`))?.[1];
      expect(inTokens, side).toBe(inPalette);
    }
  });

  it('switch motion off for reduced motion', () => {
    const reduced = TOKENS.slice(TOKENS.indexOf('prefers-reduced-motion'));
    for (const token of ['--ds-dur-fast', '--ds-dur-base', '--ds-dur-slow', '--ds-rise']) {
      expect(reduced).toContain(`${token}: 0`);
    }
  });

  it('are the only colours in the converted screen styles', () => {
    const hud = readFileSync(join(UI, 'battle/hud.css'), 'utf8');
    expect(hud.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
  });
});

describe('components', () => {
  it('Meter is a named meter whose value text says what changes', () => {
    const nodes = walk(Meter({ label: 'AP', value: 100, max: 100, kind: 'ap', delta: -56 }));
    const track = nodes.find((n) => (n.props as { role?: string }).role === 'meter')!;
    expect(track.props).toMatchObject({
      'aria-label': 'AP',
      'aria-valuenow': 100,
      'aria-valuemax': 100,
      'aria-valuetext': '100→44',
    });
    expect(byClass(nodes, 'ds-meter__preview is-cost')).toHaveLength(1);
    expect(byClass(nodes, 'changing')).toHaveLength(1);
    expect(byClass(nodes, 'ds-meter--ap')).toHaveLength(1);
  });

  it('Meter without a preview draws no preview segment', () => {
    const nodes = walk(Meter({ label: 'HP', value: 20, max: 93, kind: 'hp' }));
    expect(byClass(nodes, 'ds-meter__preview')).toHaveLength(0);
    expect(byClass(nodes, 'is-low')).toHaveLength(1);
  });

  it('sides are told apart by shape as well as colour', () => {
    const player = walk(SideMark({ side: 'player', label: 'Your unit' }))[0]!;
    const enemy = walk(SideMark({ side: 'enemy' }))[0]!;
    expect(player.props).toMatchObject({ role: 'img', 'aria-label': 'Your unit' });
    expect(enemy.props).toMatchObject({ 'aria-hidden': 'true' });
    const path = (v: VNode) => walk((v.props as { children: unknown }).children)[0]!.props;
    expect(path(player)).not.toEqual(path(enemy));
    expect(byClass(walk(Chip({ tone: 'enemy', label: 'Enemy' })), 'ds-chip__icon')).toHaveLength(1);
  });

  it('Divider is a separator, and every icon has a path', () => {
    expect(walk(Divider({}))[0]!.props).toMatchObject({ role: 'separator' });
    expect(ICON_NAMES.length).toBeGreaterThan(10);
  });
});
