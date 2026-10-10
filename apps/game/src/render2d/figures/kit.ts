/**
 * Cel-shading drawing kit for the 2D rig. Everything is flat-vector: a shade fill, a lit fill
 * shifted toward the light (leaving a crescent of shadow), a thin rim light, then a bold dark
 * outline tinted by the part's own colour. Shapes are described through the shared scratch `S`
 * so a frame allocates (almost) nothing.
 *
 * Local space of every shape: +x forward, +y up, world units (a figure is ~1.8 tall).
 */
export type Ctx = CanvasRenderingContext2D;

/** Outline width in world units (about 1.5px at the 80px phone size, 12px in a duel). */
export const OW = 0.034;

const RGB = new Map<string, readonly [number, number, number]>();

export function parse(hex: string): readonly [number, number, number] {
  let v = RGB.get(hex);
  if (v) return v;
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3)
    h = h
      .split('')
      .map((ch) => ch + ch)
      .join('');
  const n = h.length === 6 ? parseInt(h, 16) : NaN;
  v = Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128];
  RGB.set(hex, v);
  return v;
}

const H2 = (n: number): string => {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return (v < 16 ? '0' : '') + v.toString(16);
};

/** Linear mix of two colours, `t` = 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return '#' + H2(ar + (br - ar) * t) + H2(ag + (bg - ag) * t) + H2(ab + (bb - ab) * t);
}

/** Global per-draw state: the hit-flash level (0..6). */
export const K = { lv: 0 };

export const BASE = 0;
export const SHADE = 1;
export const HI = 2;
export const LINE = 3;

/** A colour with its cel-shading companions: base, shade, highlight and outline. */
export class Swatch {
  readonly c: readonly string[];
  private readonly f: string[][] = [];
  constructor(base: string) {
    this.c = [
      base,
      mix(base, '#2a1c3e', 0.42),
      mix(base, '#fff6dc', 0.42),
      mix(base, '#0e080c', 0.86),
    ];
  }
  /** The colour at index (BASE, SHADE, HI, LINE) with the current flash applied. */
  at(i: number): string {
    if (K.lv === 0) return this.c[i] as string;
    let t = this.f[K.lv];
    if (!t) {
      const k = (K.lv / 6) * 0.92;
      t = this.c.map((c) => mix(c, '#fff0cc', k));
      this.f[K.lv] = t;
    }
    return t[i] as string;
  }
}

const SW = new Map<string, Swatch>();
export function sw(hex: string): Swatch {
  let s = SW.get(hex);
  if (!s) {
    s = new Swatch(hex);
    SW.set(hex, s);
  }
  return s;
}

type PathFn = (ctx: Ctx) => void;

/** Shared scratch for shape painters. */
export const S = {
  a: 0,
  b: 0,
  c: 0,
  d: 0,
  e: 0,
  f: 0,
  g: 0,
  h: 0,
  pts: [] as readonly number[],
  n: 0,
};

/** Light comes from the upper front. */
const LX = 0.6;
const LY = 0.8;

function cel(ctx: Ctx, path: PathFn, s: Swatch, d: number, lw: number, rim: boolean): void {
  ctx.beginPath();
  path(ctx);
  ctx.fillStyle = s.at(SHADE);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.translate(LX * d, LY * d);
  ctx.beginPath();
  path(ctx);
  ctx.fillStyle = s.at(BASE);
  ctx.fill();
  if (rim) {
    const w = d * 0.75;
    const k = d + w / 2;
    ctx.translate(-LX * k, -LY * k);
    ctx.lineWidth = w;
    ctx.strokeStyle = s.at(HI);
    ctx.beginPath();
    path(ctx);
    ctx.stroke();
  }
  ctx.restore();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = s.at(LINE);
    ctx.beginPath();
    path(ctx);
    ctx.stroke();
  }
}

function pLimb(ctx: Ctx): void {
  const dx = S.c - S.a;
  const dy = S.d - S.b;
  const len = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / len;
  const ny = dx / len;
  const ang = Math.atan2(ny, nx);
  ctx.moveTo(S.a + nx * S.e, S.b + ny * S.e);
  ctx.lineTo(S.c + nx * S.f, S.d + ny * S.f);
  ctx.arc(S.c, S.d, S.f, ang, ang + Math.PI, true);
  ctx.lineTo(S.a - nx * S.e, S.b - ny * S.e);
  ctx.arc(S.a, S.b, S.e, ang + Math.PI, ang + Math.PI * 2, true);
  ctx.closePath();
}

function pEll(ctx: Ctx): void {
  ctx.ellipse(S.a, S.b, S.c, S.d, S.e, 0, Math.PI * 2);
}

function pBlob(ctx: Ctx): void {
  const p = S.pts;
  const n = S.n;
  const lx = p[(n - 1) * 2] as number;
  const ly = p[(n - 1) * 2 + 1] as number;
  ctx.moveTo((lx + (p[0] as number)) / 2, (ly + (p[1] as number)) / 2);
  for (let i = 0; i < n; i++) {
    const x = p[i * 2] as number;
    const y = p[i * 2 + 1] as number;
    const j = (i + 1) % n;
    ctx.quadraticCurveTo(x, y, (x + (p[j * 2] as number)) / 2, (y + (p[j * 2 + 1] as number)) / 2);
  }
  ctx.closePath();
}

function pPoly(ctx: Ctx): void {
  const p = S.pts;
  ctx.moveTo(p[0] as number, p[1] as number);
  for (let i = 1; i < S.n; i++) ctx.lineTo(p[i * 2] as number, p[i * 2 + 1] as number);
  ctx.closePath();
}

/** A tapered capsule from (x0,y0) radius r0 to (x1,y1) radius r1. */
export function limb(
  ctx: Ctx,
  s: Swatch,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r0: number,
  r1: number,
  d = 0.03,
  lw = OW,
): void {
  S.a = x0;
  S.b = y0;
  S.c = x1;
  S.d = y1;
  S.e = r0;
  S.f = r1;
  cel(ctx, pLimb, s, d, lw, true);
}

export function ell(
  ctx: Ctx,
  s: Swatch,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
  d = 0.03,
  lw = OW,
): void {
  S.a = cx;
  S.b = cy;
  S.c = rx;
  S.d = ry;
  S.e = rot;
  cel(ctx, pEll, s, d, lw, d > 0.02);
}

/** Smooth closed blob through the points (control polygon, quadratic midpoint smoothing). */
export function blob(
  ctx: Ctx,
  s: Swatch,
  pts: readonly number[],
  d = 0.03,
  lw = OW,
  n = pts.length >> 1,
): void {
  S.pts = pts;
  S.n = n;
  cel(ctx, pBlob, s, d, lw, d > 0.02);
}

/** Sharp-cornered polygon. */
export function poly(
  ctx: Ctx,
  s: Swatch,
  pts: readonly number[],
  d = 0.03,
  lw = OW,
  n = pts.length >> 1,
): void {
  S.pts = pts;
  S.n = n;
  cel(ctx, pPoly, s, d, lw, d > 0.02);
}

/** Flat fills (details on top of shaded parts): no outline, no shading. */
export function fillBlob(
  ctx: Ctx,
  s: Swatch,
  i: number,
  pts: readonly number[],
  n = pts.length >> 1,
): void {
  S.pts = pts;
  S.n = n;
  ctx.beginPath();
  pBlob(ctx);
  ctx.fillStyle = s.at(i);
  ctx.fill();
}

export function fillPoly(
  ctx: Ctx,
  s: Swatch,
  i: number,
  pts: readonly number[],
  n = pts.length >> 1,
): void {
  S.pts = pts;
  S.n = n;
  ctx.beginPath();
  pPoly(ctx);
  ctx.fillStyle = s.at(i);
  ctx.fill();
}

export function fillEll(
  ctx: Ctx,
  s: Swatch,
  i: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = s.at(i);
  ctx.fill();
}

/** A stroked line in a swatch colour. */
export function line(
  ctx: Ctx,
  s: Swatch,
  i: number,
  w: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.strokeStyle = s.at(i);
  ctx.stroke();
}

/** A smooth open stroke through the points. */
export function trace(
  ctx: Ctx,
  s: Swatch,
  i: number,
  w: number,
  pts: readonly number[],
  n = pts.length >> 1,
): void {
  ctx.beginPath();
  ctx.moveTo(pts[0] as number, pts[1] as number);
  for (let k = 1; k < n - 1; k++) {
    const x = pts[k * 2] as number;
    const y = pts[k * 2 + 1] as number;
    ctx.quadraticCurveTo(
      x,
      y,
      (x + (pts[k * 2 + 2] as number)) / 2,
      (y + (pts[k * 2 + 3] as number)) / 2,
    );
  }
  ctx.lineTo(pts[n * 2 - 2] as number, pts[n * 2 - 1] as number);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = s.at(i);
  ctx.stroke();
}

// ── Gears ─────────────────────────────────────────────────────

const GEARS = new Map<number, number[]>();

function gearShape(teeth: number): number[] {
  let g = GEARS.get(teeth);
  if (!g) {
    g = [];
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const w = (Math.PI * 2) / teeth;
      const pts: [number, number][] = [
        [a - w * 0.28, 0.78],
        [a - w * 0.16, 1],
        [a + w * 0.16, 1],
        [a + w * 0.28, 0.78],
      ];
      for (const [aa, r] of pts) g.push(Math.cos(aa) * r, Math.sin(aa) * r);
    }
    GEARS.set(teeth, g);
  }
  return g;
}

/** A toothed gear of outer radius `r`, spun to angle `rot`. */
export function gear(
  ctx: Ctx,
  s: Swatch,
  hole: Swatch,
  cx: number,
  cy: number,
  r: number,
  teeth: number,
  rot: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(r, r);
  poly(ctx, s, gearShape(teeth), 0.05 / r > 0.5 ? 0.3 : 0.05 / r, OW / r);
  ctx.restore();
  fillEll(ctx, hole, SHADE, cx, cy, r * 0.32, r * 0.32);
  fillEll(ctx, s, HI, cx - r * 0.04, cy + r * 0.04, r * 0.14, r * 0.14);
}

// ── Cloth ─────────────────────────────────────────────────────

const RIB = new Array<number>(64).fill(0);

/**
 * A trailing ribbon (plume, pennant, scarf end, cape): starts at (x0,y0), streams along `ang`
 * for `len`, fluttering with time. `drag` bends it back when the body moves forward.
 */
export function ribbon(
  ctx: Ctx,
  s: Swatch,
  x0: number,
  y0: number,
  ang: number,
  len: number,
  w0: number,
  w1: number,
  amp: number,
  t: number,
  phase: number,
  drag: number,
  d = 0.03,
  lw = OW,
  segs = 6,
): void {
  const n = segs + 1;
  let x = x0;
  let y = y0;
  const step = len / segs;
  // spine points
  const sx: number[] = SPX;
  const sy: number[] = SPY;
  const nw: number[] = SPW;
  for (let i = 0; i <= segs; i++) {
    const k = i / segs;
    sx[i] = x;
    sy[i] = y;
    nw[i] = (w0 + (w1 - w0) * k) / 2;
    const a = ang + Math.sin(t * 5 - i * 0.9 + phase) * amp * k + drag * k * 0.9;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
  }
  let m = 0;
  for (let i = 0; i < n; i++) {
    const j = Math.min(i + 1, n - 1);
    const k = Math.max(i - 1, 0);
    const dx = (sx[j] as number) - (sx[k] as number);
    const dy = (sy[j] as number) - (sy[k] as number);
    const l = Math.hypot(dx, dy) || 1;
    RIB[m++] = (sx[i] as number) - (dy / l) * (nw[i] as number);
    RIB[m++] = (sy[i] as number) + (dx / l) * (nw[i] as number);
  }
  for (let i = n - 1; i >= 0; i--) {
    const j = Math.min(i + 1, n - 1);
    const k = Math.max(i - 1, 0);
    const dx = (sx[j] as number) - (sx[k] as number);
    const dy = (sy[j] as number) - (sy[k] as number);
    const l = Math.hypot(dx, dy) || 1;
    RIB[m++] = (sx[i] as number) + (dy / l) * (nw[i] as number);
    RIB[m++] = (sy[i] as number) - (dx / l) * (nw[i] as number);
  }
  blob(ctx, s, RIB, d, lw, m >> 1);
}
const SPX: number[] = new Array<number>(12).fill(0);
const SPY: number[] = new Array<number>(12).fill(0);
const SPW: number[] = new Array<number>(12).fill(0);

/** End point of the most recent ribbon call is not tracked: use `ribbonTip` for attachments. */
export function ribbonTip(
  x0: number,
  y0: number,
  ang: number,
  len: number,
  amp: number,
  t: number,
  phase: number,
  drag: number,
  out: { x: number; y: number },
  segs = 6,
): void {
  let x = x0;
  let y = y0;
  const step = len / segs;
  for (let i = 0; i <= segs; i++) {
    const k = i / segs;
    const a = ang + Math.sin(t * 5 - i * 0.9 + phase) * amp * k + drag * k * 0.9;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
  }
  out.x = x;
  out.y = y;
}

/** A soft round puff (steam, smoke) with alpha. */
export function puff(ctx: Ctx, s: Swatch, x: number, y: number, r: number, alpha: number): void {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = s.at(BASE);
  ctx.fill();
  ctx.lineWidth = OW * 0.7;
  ctx.strokeStyle = s.at(HI);
  ctx.globalAlpha = alpha * 0.6;
  ctx.stroke();
  ctx.globalAlpha = 1;
}
