import { describe, expect, it } from 'vitest';
import cast from '../../../../../packages/content/data/cast.json';
import {
  CAST_IDS,
  EXPRESSIONS,
  blinkAt,
  drawPortrait,
  expressionForLine,
  hasPortrait,
  isExpression,
} from './index';
import { EXPR, lerpExpr } from './expressions';

/** A recording stand-in for CanvasRenderingContext2D: any method is a no-op. */
function mockCtx() {
  let calls = 0;
  const grad = { addColorStop: () => {} };
  const target: Record<string, unknown> = {};
  const ctx = new Proxy(target, {
    get(t, k: string) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
      return () => {
        calls++;
      };
    },
    set(t, k: string, v) {
      t[k] = v;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, calls: () => calls };
}

describe('portraits', () => {
  it('has a portrait for every cast id', () => {
    for (const c of cast) expect(hasPortrait(c.id), c.id).toBe(true);
    expect(CAST_IDS).toHaveLength(20);
    expect(hasPortrait('nobody')).toBe(false);
  });

  it('draws every cast member in every expression without throwing', () => {
    for (const id of CAST_IDS) {
      for (const ex of EXPRESSIONS) {
        const { ctx, calls } = mockCtx();
        expect(() => drawPortrait(ctx, id, ex, 0, 0, 128), `${id}/${ex}`).not.toThrow();
        expect(calls()).toBeGreaterThan(50);
      }
    }
  });

  it('draws animated frames and blends expressions', () => {
    const { ctx } = mockCtx();
    for (const t of [0, 0.5, 3.2, 17.9])
      drawPortrait(ctx, 'kateri', 'happy', 0, 0, 96, { time: t });
    drawPortrait(ctx, 'ninu', lerpExpr(EXPR.sad, EXPR.angry, 0.5));
    drawPortrait(ctx, 'unknown-id', 'neutral');
  });

  it('blinks briefly and deterministically', () => {
    let blinking = 0;
    for (let i = 0; i < 1000; i++) if (blinkAt(i / 100, 3) > 0) blinking++;
    expect(blinking).toBeGreaterThan(5);
    expect(blinking).toBeLessThan(300);
    expect(blinkAt(4.2, 3)).toBe(blinkAt(4.2, 3));
  });

  it('lists the required expressions', () => {
    for (const e of ['neutral', 'happy', 'angry', 'sad', 'surprised', 'determined', 'smug'])
      expect(isExpression(e)).toBe(true);
    expect(isExpression('bored')).toBe(false);
  });
});

describe('expressionForLine', () => {
  it('reads punctuation and keywords', () => {
    expect(expressionForLine('')).toBe('neutral');
    expect(expressionForLine('The harbour is quiet tonight.')).toBe('neutral');
    expect(expressionForLine('What?!', 'ninu')).toBe('surprised');
    expect(expressionForLine('Coward! Traitor! I will see you hanged!', 'turgut')).toBe('angry');
    expect(expressionForLine('Fire!', 'mustafa')).toBe('angry');
    expect(expressionForLine('Fire!', 'ninu')).toBe('surprised');
    expect(expressionForLine('Where are the others?', 'villager')).toBe('worried');
    expect(expressionForLine('Where are the others?', 'balbi')).toBe('surprised');
    expect(expressionForLine('I am so sorry. They are all dead.', 'kateri')).toBe('sad');
    expect(expressionForLine('Thank you, my friend. Well done.', 'ninu')).toBe('happy');
    expect(expressionForLine('We hold the wall until dawn.', 'luis')).toBe('determined');
    expect(expressionForLine('Of course I knew. Naturally.', 'leyla')).toBe('smug');
    expect(expressionForLine('I am afraid there are too many.', 'ganni')).toBe('worried');
    expect(expressionForLine('And then there was nothing...', 'balbi')).toBe('sad');
  });

  it('is deterministic', () => {
    for (const t of ['Hold!', 'Why?', 'Ha! Well done!'])
      expect(expressionForLine(t, 'rozi')).toBe(expressionForLine(t, 'rozi'));
  });
});
