import { useEffect, useRef } from 'preact/hooks';
import { type ExprParams, type Expression, EXPR, lerpExpr } from './expressions';
import { drawPortrait } from './index';

interface Props {
  castId: string;
  expression?: Expression;
  /** Breathing, blinking and a small sway. Off for reduced motion regardless. */
  animated?: boolean;
  /** CSS pixels; omit to fill the parent box. */
  size?: number;
  class?: string;
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const TWEEN = 0.18;
const FRAME_MS = 1000 / 15 - 2;

/**
 * A vector portrait on a canvas. Decorative: always aria-hidden (the dialogue text carries the
 * meaning). Expression changes blend over a moment; when animated it breathes and blinks.
 */
export function Portrait({
  castId,
  expression = 'neutral',
  animated = false,
  size,
  class: cls,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cur = useRef<ExprParams>(EXPR[expression]);
  const from = useRef<ExprParams>(EXPR[expression]);
  const target = useRef<ExprParams>(EXPR[expression]);
  const tween = useRef(1);
  const redraw = useRef<(t?: number) => void>(() => {});

  const dpr = () => Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

  // Draw function, rebuilt when the character changes.
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const fit = () => {
      const box = size ?? cv.clientWidth ?? 96;
      const px = Math.max(48, Math.round((box || 96) * dpr()));
      if (cv.width !== px) {
        cv.width = cv.height = px;
      }
      return px;
    };
    redraw.current = (time?: number) => {
      const px = fit();
      ctx.clearRect(0, 0, px, px);
      drawPortrait(ctx, castId, cur.current, 0, 0, px, time === undefined ? {} : { time });
    };
    redraw.current(animated && !reducedMotion() ? 0 : undefined);
  }, [castId, size, animated]);

  // Expression changes: blend from the current face to the new one.
  useEffect(() => {
    from.current = cur.current;
    target.current = EXPR[expression];
    tween.current = 0;
    if (reducedMotion() || !animated) {
      cur.current = target.current;
      tween.current = 1;
      redraw.current();
    }
  }, [expression, animated, castId]);

  // The animation loop (about 15 fps, paused while hidden; none for reduced motion).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const live = animated && !reducedMotion();
    if (!live && tween.current >= 1) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = performance.now();
    const t0 = last;
    const loop = () => {
      timer = undefined;
      if (document.hidden) {
        // Paused while hidden: look again in a moment.
        timer = setTimeout(loop, 250);
        return;
      }
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (tween.current < 1) {
        tween.current = Math.min(1, tween.current + Math.min(dt, 0.1) / TWEEN);
        cur.current = lerpExpr(from.current, target.current, ease(tween.current));
      }
      redraw.current(live ? (now - t0) / 1000 : undefined);
      if (live || tween.current < 1) timer = setTimeout(loop, FRAME_MS);
    };
    timer = setTimeout(loop, 0);
    return () => clearTimeout(timer);
  }, [animated, expression, castId]);

  return (
    <canvas
      ref={ref}
      class={cls ?? 'portrait2d'}
      aria-hidden="true"
      data-cast={castId}
      data-expression={expression}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    />
  );
}

const ease = (t: number) => t * t * (3 - 2 * t);
