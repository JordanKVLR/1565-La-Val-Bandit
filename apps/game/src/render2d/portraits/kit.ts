/**
 * Drawing kit for the vector portraits: a tiny cel-shading toolkit on Canvas 2D.
 * Everything is drawn in a 200 x 200 design space (`U`) and scaled by the caller.
 * Shapes are PathFns: they add sub-paths to the current path and never call beginPath, so the
 * same function can fill, clip, stroke and be re-played with a shift for the shade crescents.
 */
export type Ctx = CanvasRenderingContext2D;
export type PathFn = (c: Ctx) => void;

export const U = 200;
/** The ink colour of all outlines. */
export const INK = '#2a1815';

// ── colour ────────────────────────────────────────────────────────────────────────────────────
function rgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const f = s.length === 3 ? s.replace(/./g, '$&$&') : s;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex(r: number, g: number, b: number): string {
  const p = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`;
}
/** Linear blend of two #rrggbb colours (t = 0 gives a, 1 gives b). */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return hex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
/** The cel-shade tone of a colour: darker with a cool violet cast. */
export const shadeOf = (c: string, t = 0.3) => mix(c, '#34203f', t);
/** A warm shade for skin. */
export const skinShade = (c: string, t = 0.3) => mix(c, '#7a2f3d', t);
/** The highlight tone of a colour. */
export const lightOf = (c: string, t = 0.28) => mix(c, '#fff3d2', t);
export const alpha = (c: string, a: number) => {
  const [r, g, b] = rgb(c);
  return `rgba(${r},${g},${b},${a})`;
};

// ── paths ─────────────────────────────────────────────────────────────────────────────────────
export const ellipse =
  (cx: number, cy: number, rx: number, ry: number, rot = 0): PathFn =>
  (c) => {
    c.moveTo(cx + Math.cos(rot) * rx, cy + Math.sin(rot) * rx);
    c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  };

export const circle = (cx: number, cy: number, r: number): PathFn => ellipse(cx, cy, r, r);

export const poly =
  (pts: readonly (readonly [number, number])[]): PathFn =>
  (c) => {
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  };

export const roundRect =
  (x: number, y: number, w: number, h: number, r: number): PathFn =>
  (c) => {
    const k = Math.min(r, w / 2, h / 2);
    c.moveTo(x + k, y);
    c.lineTo(x + w - k, y);
    c.quadraticCurveTo(x + w, y, x + w, y + k);
    c.lineTo(x + w, y + h - k);
    c.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
    c.lineTo(x + k, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - k);
    c.lineTo(x, y + k);
    c.quadraticCurveTo(x, y, x + k, y);
    c.closePath();
  };

/** Smooth Catmull-Rom curve through points; closed makes a blob. */
export const spline =
  (pts: readonly (readonly [number, number])[], closed = true, tension = 0.5): PathFn =>
  (c) => {
    const n = pts.length;
    if (n < 2) return;
    const at = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]!;
    c.moveTo(pts[0]![0], pts[0]![1]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = at(i - 1);
      const p1 = at(i);
      const p2 = at(i + 1);
      const p3 = at(i + 2);
      const t = tension / 3;
      c.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * t * 2 * 0.5 * 1.0,
        p1[1] + (p2[1] - p0[1]) * t * 2 * 0.5 * 1.0,
        p2[0] - (p3[0] - p1[0]) * t * 2 * 0.5 * 1.0,
        p2[1] - (p3[1] - p1[1]) * t * 2 * 0.5 * 1.0,
        p2[0],
        p2[1],
      );
    }
    if (closed) c.closePath();
  };

/** Several paths as one. */
export const group =
  (...fns: PathFn[]): PathFn =>
  (c) => {
    for (const f of fns) f(c);
  };

/** Mirrors every x of a path about x = 0 (for symmetrical shapes written as half). */
export const mirrored =
  (fn: PathFn): PathFn =>
  (c) => {
    c.save();
    c.scale(-1, 1);
    fn(c);
    c.restore();
  };

// ── painting ──────────────────────────────────────────────────────────────────────────────────
export interface PaintOpts {
  /** Outline width in design units (0 = none). */
  line?: number;
  ink?: string;
  /** Shade colour, or false for flat. */
  shade?: string | false;
  /** Shift of the occluding copy: the shade crescent appears on the opposite side. */
  sh?: readonly [number, number];
  /** Rim light colour on the right edge. */
  rim?: string | false;
  rimW?: number;
}

const BIG = 2000;

/** Fills a shape with a base tone, a shade crescent, an optional rim light, then outlines it. */
export function paint(c: Ctx, path: PathFn, fill: string, o: PaintOpts = {}): void {
  const line = o.line ?? 3;
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  path(c);
  c.fillStyle = fill;
  c.fill();
  const crescent = (color: string, dx: number, dy: number) => {
    c.save();
    c.beginPath();
    path(c);
    c.clip();
    c.beginPath();
    c.rect(-BIG, -BIG, BIG * 2, BIG * 2);
    c.save();
    c.translate(dx, dy);
    path(c);
    c.restore();
    c.fillStyle = color;
    c.fill('evenodd');
    c.restore();
  };
  if (o.shade !== false) {
    const [sx, sy] = o.sh ?? [-5, -5];
    crescent(o.shade ?? shadeOf(fill), sx, sy);
  }
  if (o.rim) crescent(o.rim, -(o.rimW ?? 2.2), 0);
  if (line > 0) {
    c.beginPath();
    path(c);
    c.lineWidth = line;
    c.strokeStyle = o.ink ?? INK;
    c.stroke();
  }
  c.restore();
}

/** Outline only. */
export function ink(c: Ctx, path: PathFn, width = 3, color = INK): void {
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  path(c);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
  c.restore();
}

/** Flat fill, no outline, no shade. */
export function flat(c: Ctx, path: PathFn, fill: string): void {
  c.save();
  c.beginPath();
  path(c);
  c.fillStyle = fill;
  c.fill();
  c.restore();
}

/** Runs `fn` with the drawing clipped to a shape. */
export function clipped(c: Ctx, path: PathFn, fn: () => void): void {
  c.save();
  c.beginPath();
  path(c);
  c.clip();
  fn();
  c.restore();
}

/** A cluster of circles drawn as one merged blob with a single outline (curls, fur, plumes). */
export function blobs(
  c: Ctx,
  circles: readonly (readonly [number, number, number])[],
  fill: string,
  o: { line?: number; shade?: string | false; light?: string } = {},
): void {
  const line = o.line ?? 3;
  c.save();
  c.lineJoin = 'round';
  if (line > 0) {
    c.fillStyle = INK;
    for (const [x, y, r] of circles) {
      c.beginPath();
      c.arc(x, y, r + line / 2, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.fillStyle = fill;
  for (const [x, y, r] of circles) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  if (o.shade !== false) {
    const sc = o.shade ?? shadeOf(fill, 0.34);
    for (const [x, y, r] of circles) {
      clipped(c, circle(x, y, r), () => {
        c.beginPath();
        c.rect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);
        c.save();
        c.translate(-r * 0.32, -r * 0.34);
        c.moveTo(x + r, y);
        c.arc(x, y, r, 0, Math.PI * 2);
        c.restore();
        c.fillStyle = sc;
        c.fill('evenodd');
      });
    }
  }
  if (o.light) {
    c.fillStyle = o.light;
    for (const [x, y, r] of circles) {
      c.beginPath();
      c.ellipse(x - r * 0.35, y - r * 0.4, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** A tapered stroke along a quadratic curve (brows, moustaches, whiskers, feathers). */
export function taper(
  c: Ctx,
  from: readonly [number, number],
  ctrl: readonly [number, number],
  to: readonly [number, number],
  w0: number,
  w1: number,
  fill: string,
  line = 1.6,
  steps = 9,
): void {
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * ctrl[0] + t * t * to[0];
    const y = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * ctrl[1] + t * t * to[1];
    const dx = 2 * (1 - t) * (ctrl[0] - from[0]) + 2 * t * (to[0] - ctrl[0]);
    const dy = 2 * (1 - t) * (ctrl[1] - from[1]) + 2 * t * (to[1] - ctrl[1]);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - (dy / len) * w, y + (dx / len) * w]);
    R.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  const pts = [...L, ...R.reverse()];
  paint(c, poly(pts), fill, { line, shade: false });
}

/** Tiny deterministic random for decorative scatter (never Math.random). */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
