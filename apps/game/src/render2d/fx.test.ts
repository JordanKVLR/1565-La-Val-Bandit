import { describe, expect, it } from 'vitest';
import { createFx, wordFraction, wordPixels, WORD_MAX_WIDTH } from './fx';
import { fakeCtx } from './testKit';

const run = (fx: ReturnType<typeof createFx>, secs: number) => {
  for (let i = 0; i < secs * 60; i++) fx.update(1 / 60);
};

describe('fx engine', () => {
  it('is deterministic for a seed', () => {
    const a = createFx(7);
    const b = createFx(7);
    const sa = Array.from({ length: 5 }, () => a.rand());
    const sb = Array.from({ length: 5 }, () => b.rand());
    expect(sa).toEqual(sb);
    a.reset(7);
    expect(a.rand()).toBe(sa[0]);
  });

  it('pools: spawning past capacity never grows the live count unbounded', () => {
    const fx = createFx();
    for (let i = 0; i < 50; i++) fx.spark({ x: 0, y: 1 }, { n: 40 });
    expect(fx.liveCount()).toBeLessThanOrEqual(420);
    run(fx, 3);
    expect(fx.liveCount()).toBe(0);
  });

  it('low quality spawns fewer particles', () => {
    const hi = createFx();
    const lo = createFx();
    lo.setLow(true);
    hi.dust({ x: 0, y: 0 }, { n: 20 });
    lo.dust({ x: 0, y: 0 }, { n: 20 });
    expect(lo.liveCount()).toBeLessThan(hi.liveCount());
  });

  it('hit-stop freezes the strike clock for the requested time', () => {
    const fx = createFx();
    fx.hitStop(100);
    fx.update(1 / 60);
    expect(fx.timeScale).toBe(0);
    expect(fx.step).toBe(0);
    run(fx, 0.2);
    expect(fx.timeScale).toBe(1);
    const before = fx.time;
    fx.update(1 / 60);
    expect(fx.time).toBeGreaterThan(before);
  });

  it('slow motion scales the clock then recovers', () => {
    const fx = createFx();
    fx.slowmo(0.25, 0.3);
    fx.update(0.1);
    expect(fx.step).toBeCloseTo(0.025, 5);
    run(fx, 0.5);
    expect(fx.timeScale).toBe(1);
  });

  it('calm mode ignores shake, flash, hit-stop and slow motion', () => {
    const fx = createFx();
    fx.calm = true;
    fx.shake(0.5);
    fx.hitStop(200);
    fx.slowmo(0.1, 1);
    fx.punch({ x: 0, y: 1 }, 1.5);
    fx.update(1 / 60);
    expect(fx.timeScale).toBe(1);
    expect(fx.cam.dx).toBe(0);
    expect(fx.cam.zoom).toBe(1);
  });

  it('shake decays and punch returns to 1', () => {
    const fx = createFx();
    fx.shake(0.3);
    fx.punch({ x: 0, y: 1 }, 1.4, 0.4);
    fx.update(1 / 60);
    expect(Math.abs(fx.cam.dx)).toBeGreaterThan(0);
    expect(fx.cam.zoom).toBeGreaterThan(1);
    run(fx, 2);
    expect(fx.cam.dx).toBe(0);
    expect(fx.cam.zoom).toBe(1);
  });

  it('once and later work on the strike clock', () => {
    const fx = createFx();
    expect(fx.once('a')).toBe(true);
    expect(fx.once('a')).toBe(false);
    let n = 0;
    fx.later(0.1, () => n++);
    run(fx, 0.05);
    expect(n).toBe(0);
    run(fx, 0.1);
    expect(n).toBe(1);
  });

  it('sprites call onEnd once and drawing every primitive is safe', () => {
    const fx = createFx();
    let ended = 0;
    fx.sprite({
      from: { x: 0, y: 1 },
      to: { x: 2, y: 1 },
      life: 0.1,
      trail: '#fff',
      paint: () => undefined,
      onEnd: () => ended++,
    });
    fx.spark({ x: 0, y: 1 });
    fx.dust({ x: 0, y: 0 });
    fx.smoke({ x: 0, y: 0 });
    fx.ember({ x: 0, y: 0 });
    fx.ring({ x: 0, y: 1 });
    fx.burst({ x: 0, y: 1 });
    fx.arc({ x: 0, y: 1 }, { radius: 1, from: 2, to: -1 });
    fx.glow({ x: 0, y: 1 });
    fx.word({ x: 0, y: 1 }, 'POW!');
    fx.layer('front', 0.2, () => undefined);
    fx.flash('#fff', 0.5);
    fx.wash('#000', 0.3);
    fx.speedLines();
    fx.speedLines({ dir: 0 });
    fx.impactFrame();
    for (let i = 0; i < 20; i++) {
      fx.trailPoint('t', { x: i * 0.1, y: 1 });
      fx.update(1 / 60);
      const c = fakeCtx();
      fx.drawWash(c, 640, 360);
      fx.drawBack(c);
      fx.drawFront(c);
      fx.drawScreen(c, 640, 360);
    }
    expect(ended).toBe(1);
  });
});

describe('word sizing', () => {
  /** Draws one word and returns its on-screen font size in pixels (world scale x font size). */
  function drawnPx(text: string, size: number, sw: number, sh: number, px: number): number {
    const fx = createFx(1);
    Object.assign(fx.view, { px, sw, sh, minX: -20, maxX: 20, maxY: 20 });
    fx.word({ x: 0, y: 1 }, text, { size, life: 1 });
    for (let i = 0; i < 18; i++) fx.update(1 / 60); // past the pop-in
    let scaleX = 0;
    const base = fakeCtx();
    const ctx = new Proxy(base, {
      get(t, k: string) {
        if (k === 'scale')
          return (x: number) => {
            scaleX = Math.abs(x);
          };
        return (t as unknown as Record<string, unknown>)[k];
      },
    });
    fx.drawFront(ctx);
    fx.drawBack(ctx);
    return scaleX * 100 * px;
  }

  it('keeps the biggest word near 11% of the canvas height at any size and zoom', () => {
    for (const [w, h] of [
      [640, 300],
      [851, 393],
      [1280, 720],
      [1920, 1080],
    ] as const)
      for (const zoom of [60, 90, 200]) {
        const big = drawnPx('K.O.!', 0.95, w, h, zoom);
        expect(big / h).toBeLessThanOrEqual(0.125);
        expect(big / h).toBeGreaterThan(0.08);
        const small = drawnPx('TAP', 0.34, w, h, zoom);
        expect(small / h).toBeLessThan(0.075);
        expect(small / h).toBeGreaterThan(0.04);
      }
  });

  it('orders emphasis and caps the width at about a third of the canvas', () => {
    expect(wordFraction(0.9)).toBeGreaterThan(wordFraction(0.5));
    expect(wordFraction(5)).toBeLessThanOrEqual(0.115);
    const px = wordPixels(0.95, 12, 640, 300);
    expect(px * 0.56 * 12).toBeLessThanOrEqual(640 * WORD_MAX_WIDTH + 0.01);
  });
});
