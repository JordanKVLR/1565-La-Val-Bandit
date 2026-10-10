/**
 * Vector character portraits with expressions (ADR 0013).
 *
 *   portraitFor('kateri', 'happy', 256)  -> cached HTMLCanvasElement
 *   portraitDataUrl('kateri', 'happy')   -> cached PNG data URL
 *   drawPortrait(ctx, id, expr, x, y, size, { time })  -> draw straight into any canvas
 */
import { EXPR, type ExprParams, type Expression } from './expressions';
import { type DrawOpts, CAST_IDS, drawPortraitU, hasPortrait } from './render';
import { U } from './kit';

export { EXPRESSIONS, type Expression, type ExprParams, EXPR, expressionForLine, isExpression, lerpExpr } from './expressions';
export { CAST_IDS, hasPortrait, blinkAt, type DrawOpts } from './render';

/** Draws a portrait into the square (x, y, size, size) of a 2D context. */
export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  id: string,
  expression: Expression | ExprParams = 'neutral',
  x = 0,
  y = 0,
  size = 256,
  opts: Omit<DrawOpts, 'params'> = {},
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / U, size / U);
  if (typeof expression === 'string') drawPortraitU(ctx, id, expression, opts);
  else drawPortraitU(ctx, id, 'neutral', { ...opts, params: expression });
  ctx.restore();
}

const canvases = new Map<string, HTMLCanvasElement>();
const urls = new Map<string, string>();

/** A still portrait on its own canvas, cached per (id, expression, size). Do not mutate it. */
export function portraitFor(id: string, expression: Expression = 'neutral', size = 256): HTMLCanvasElement {
  const key = `${id}|${expression}|${size}`;
  let cv = canvases.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    if (ctx) drawPortrait(ctx, id, expression, 0, 0, size);
    canvases.set(key, cv);
  }
  return cv;
}

/** The same as a PNG data URL (for <img> and CSS), cached. */
export function portraitDataUrl(id: string, expression: Expression = 'neutral', size = 256): string {
  const key = `${id}|${expression}|${size}`;
  let u = urls.get(key);
  if (u === undefined) {
    u = portraitFor(id, expression, size).toDataURL('image/png');
    urls.set(key, u);
  }
  return u;
}

export function expressionParams(e: Expression): ExprParams {
  return EXPR[e];
}

export const PORTRAIT_IDS = CAST_IDS;
export const knowsPortrait = hasPortrait;
