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

/** Level of detail by on-screen scale: 0 map-sized, 1 panel-sized, 2 duel-sized (see FIGURE_STYLE.md). */
export type Lod = 0 | 1 | 2;

/**
 * Global per-draw state, set by the rig before a figure is painted: the hit-flash level (0..6),
 * the canvas pixels per world unit of the figure (`px`), the level of detail derived from it and
 * whether the figure is drawn mirrored (so cylinder gradients keep the light on the upper left).
 */
export const K = { lv: 0, px: 200, lod: 2 as Lod, mir: 0 as 0 | 1 };

/** Canvas pixels per world unit below which a figure is map-sized (LOD 0) and panel-sized (LOD 1). */
export const LOD_MID_PX = 120;
export const LOD_HIGH_PX = 230;

let nextSwatchId = 0;

export const BASE = 0;
export const SHADE = 1;
export const HI = 2;
export const LINE = 3;

/** A colour with its cel-shading companions: base, shade, highlight and outline. */
export class Swatch {
  readonly c: readonly string[];
  readonly id = nextSwatchId++;
  private readonly f: string[][] = [];
  private readonly gc = new WeakMap<Ctx, Map<number, CanvasGradient>>();
  private readonly kinds: Partial<Record<Kind, Swatch>> = {};
  constructor(
    base: string,
    readonly kind: Kind = 'matte',
  ) {
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

  /** The same colour with another gradient profile (metal, cloth, soft or matte). */
  as(kind: Kind): Swatch {
    if (kind === this.kind) return this;
    let s = this.kinds[kind];
    if (!s) {
      s = sw(this.c[0] as string, kind);
      this.kinds[kind] = s;
    }
    return s;
  }

  /**
   * The cached cylinder gradient of this colour over the frame `fr` (see `Frame`). `top` picks the
   * top-lit profile (visors, domes, hanging cloth) instead of the across-the-tube one. Gradients
   * are built once per canvas, flash level, profile and mirror state.
   */
  grad(ctx: Ctx, fr: Frame, top: boolean): CanvasGradient {
    let m = this.gc.get(ctx);
    if (!m) {
      m = new Map();
      this.gc.set(ctx, m);
    }
    const flip = !top && fr.horizontal && K.mir === 1;
    const key = fr.id * 32 + K.lv * 4 + (top ? 2 : 0) + (flip ? 1 : 0);
    let g = m.get(key);
    if (!g) {
      g = ctx.createLinearGradient(fr.x0, fr.y0, fr.x1, fr.y1);
      const prof = (top ? PROFILES[this.kind].y : PROFILES[this.kind].x) as readonly (readonly [
        number,
        number,
      ])[];
      const base = this.at(BASE);
      const n = prof.length;
      for (let i = 0; i < n; i++) {
        const [o, t] = flip ? (prof[n - 1 - i] as readonly [number, number]) : (prof[i] as never);
        g.addColorStop(flip ? 1 - o : o, t >= 0 ? mix(base, DARK, t) : mix(base, LIGHT, -t));
      }
      m.set(key, g);
    }
    return g;
  }
}

/** How a colour is cylinder-shaded: gradient stops as (offset, amount toward dark (+) or light (-)). */
export type Kind = 'metal' | 'enamel' | 'cloth' | 'soft' | 'matte';
type Stops = readonly (readonly [number, number])[];
const DARK = '#0a0b14';
const LIGHT = '#fffaf0';
const PROFILES: Record<Kind, { x: Stops; y: Stops }> = {
  // The reference steel/brass: dark edge, mid, a bright band at a third, soft falloff, dark edge.
  metal: {
    x: [
      [0, 0.8],
      [0.14, 0.44],
      [0.34, -0.74],
      [0.52, 0],
      [0.78, 0.5],
      [1, 0.82],
    ],
    y: [
      [0, -0.75],
      [0.35, -0.05],
      [0.75, 0.5],
      [1, 0.82],
    ],
  },
  // White lacquered plate (the hero): a pale body with a soft grey edge and a clean highlight.
  enamel: {
    x: [
      [0, 0.5],
      [0.14, 0.24],
      [0.34, -0.7],
      [0.52, 0],
      [0.78, 0.2],
      [1, 0.5],
    ],
    y: [
      [0, -0.6],
      [0.35, -0.05],
      [0.75, 0.25],
      [1, 0.5],
    ],
  },
  cloth: {
    x: [
      [0, 0.5],
      [0.3, 0],
      [0.5, -0.28],
      [0.75, 0.12],
      [1, 0.55],
    ],
    y: [
      [0, -0.2],
      [1, 0.55],
    ],
  },
  soft: {
    x: [
      [0, 0.2],
      [0.45, -0.1],
      [1, 0.17],
    ],
    y: [
      [0, -0.1],
      [1, 0.2],
    ],
  },
  matte: {
    x: [
      [0, 0.6],
      [0.4, -0.35],
      [1, 0.6],
    ],
    y: [
      [0, -0.2],
      [1, 0.6],
    ],
  },
};

const SW = new Map<string, Swatch>();
export function sw(hex: string, kind: Kind = 'matte'): Swatch {
  const key = kind === 'matte' ? hex : hex + '|' + kind;
  let s = SW.get(key);
  if (!s) {
    s = new Swatch(hex, kind);
    SW.set(key, s);
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

// ══════════════════════════════════════════════════════════════
// Armatura plate kit: cylinder-shaded steel, brass and cloth (docs/art/FIGURE_STYLE.md)
//
// Static shapes are `Shape`s: a cached Path2D plus a gradient `Frame`, authored in "reference
// pixels" (570 px = 1 world unit, y down) inside `refIn(...)`/`refOut(...)`. Tubes (limbs) are
// built once per size. Painting a shape is one gradient fill and one ink stroke, so a figure costs
// a few dozen canvas calls and no per-frame allocation.
// ══════════════════════════════════════════════════════════════

/** The ink of every outline (the reference Cavaliere's own). */
export const INK = '#0e1118';
/** World units per reference pixel: the Cavaliere reference is 570 px per world unit. */
export const RS = 1 / 570;

const INKS: string[] = [];
/** Outline colour for the current flash level. */
export function ink(): string {
  let c = INKS[K.lv];
  if (!c) {
    c = K.lv === 0 ? INK : mix(INK, '#fff0cc', (K.lv / 6) * 0.92);
    INKS[K.lv] = c;
  }
  return c;
}

/** Smallest outline in canvas pixels (thick when the figure is small, thin enough when large). */
function minInkPx(): number {
  return K.lod === 0 ? 2.7 : K.lod === 1 ? 1.5 : 1.3;
}
/** Outline width in world units for an outline of `refPx` reference pixels (5 is the standard). */
export function inkU(refPx: number): number {
  return Math.max(refPx * RS, minInkPx() / K.px);
}
/** The same, in reference pixels (for use inside `refIn`). */
export function inkR(refPx: number): number {
  return Math.max(refPx, minInkPx() / (K.px * RS));
}

/**
 * Reads the on-screen scale from the current transform and sets the LOD. Call once per figure
 * draw, with the world transform applied and before the figure's own scale: `unit` multiplies
 * the pixel scale (figure scale and zoom).
 */
export function setView(ctx: Ctx, unit: number, mirrored: boolean): void {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : undefined;
  const px = m ? ((Math.hypot(m.a, m.b) + Math.hypot(m.c, m.d)) / 2) * unit : 200;
  K.px = Number.isFinite(px) && px > 0 ? px : 200;
  K.lod = K.px < LOD_MID_PX ? 0 : K.px < LOD_HIGH_PX ? 1 : 2;
  K.mir = mirrored ? 1 : 0;
}

/** Enter reference-pixel space with its origin at reference point (ox, oy). Pair with `refOut`. */
export function refIn(ctx: Ctx, ox: number, oy: number): void {
  ctx.save();
  ctx.scale(RS, -RS);
  ctx.translate(-ox, -oy);
}
export function refOut(ctx: Ctx): void {
  ctx.restore();
}

const NOP_PATH: unknown = new Proxy({}, { get: () => () => undefined });
/** A Path2D (a harmless stub where Path2D does not exist, as in the unit tests). */
export function mkPath(d?: string): Path2D {
  if (typeof Path2D === 'undefined') return NOP_PATH as Path2D;
  return d ? new Path2D(d) : new Path2D();
}

/** Where a gradient runs: from (x0,y0) to (x1,y1) in the space the shape is painted in. */
export class Frame {
  private static n = 0;
  readonly id = ++Frame.n;
  readonly horizontal: boolean;
  constructor(
    readonly x0: number,
    readonly y0: number,
    readonly x1: number,
    readonly y1: number,
  ) {
    this.horizontal = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
  }
}

/** A static plate: path plus gradient frame. */
export class Shape {
  constructor(
    readonly p: Path2D,
    readonly fr: Frame,
  ) {}
  /**
   * From SVG path data (absolute M L C Q Z only). The gradient runs across the bounding box:
   * left to right, or top to bottom with `top`. `pad` widens it (1 = as is).
   */
  static d(d: string, top = false, pad = 1): Shape {
    const n = d.match(/-?\d+(?:\.\d+)?/g) ?? ['0', '0'];
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i + 1 < n.length; i += 2) {
      const x = Number(n[i]);
      const y = Number(n[i + 1]);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const hx = ((x1 - x0) / 2) * pad;
    const hy = ((y1 - y0) / 2) * pad;
    return new Shape(
      mkPath(d),
      top ? new Frame(cx, cy - hy, cx, cy + hy) : new Frame(cx - hx, cy, cx + hx, cy),
    );
  }
  /** A circle. */
  static circle(cx: number, cy: number, r: number, top = false): Shape {
    const p = mkPath();
    p.arc(cx, cy, r, 0, Math.PI * 2);
    return new Shape(
      p,
      top ? new Frame(cx, cy - r, cx, cy + r) : new Frame(cx - r, cy, cx + r, cy),
    );
  }
}

/** Fills a shape with the material's cylinder gradient and outlines it (`lw` in the current space). */
export function paint(ctx: Ctx, sh: Shape, mat: Swatch, lw: number, top = false): void {
  ctx.fillStyle = mat.grad(ctx, sh.fr, top);
  ctx.fill(sh.p);
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = ink();
    ctx.stroke(sh.p);
  }
}

/** A flat fill (no outline), e.g. a dark slot. */
export function flat(ctx: Ctx, p: Path2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fill(p);
}

/** An ink line (seams, panel lines), optionally translucent. */
export function seam(ctx: Ctx, p: Path2D, w: number, alpha = 1): void {
  ctx.globalAlpha = alpha;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink();
  ctx.stroke(p);
  ctx.globalAlpha = 1;
}

/** A specular streak: a white (or tinted) translucent stroke along a plate's bright side. */
export function streak(ctx: Ctx, p: Path2D, w: number, alpha = 0.5, color = '#ffffff'): void {
  ctx.globalAlpha = alpha;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke(p);
  ctx.globalAlpha = 1;
}

/** A stroked band (a brass strip over an ink under-stroke), gradient across the path's frame. */
export function band(
  ctx: Ctx,
  p: Path2D,
  fr: Frame,
  mat: Swatch,
  inkW: number,
  fillW: number,
): void {
  ctx.lineCap = 'round';
  ctx.lineWidth = inkW;
  ctx.strokeStyle = ink();
  ctx.stroke(p);
  ctx.lineWidth = fillW;
  ctx.strokeStyle = mat.grad(ctx, fr, true);
  ctx.stroke(p);
}

const RIVET: string[] = [];
/** Path of rivet heads (small circles) at the coordinate pairs, radius `r`. */
export function rivetPath(pts: readonly number[], r: number): Path2D {
  const p = mkPath();
  for (let i = 0; i + 1 < pts.length; i += 2) {
    p.moveTo((pts[i] as number) + r, pts[i + 1] as number);
    p.arc(pts[i] as number, pts[i + 1] as number, r, 0, Math.PI * 2);
  }
  return p;
}
/** Rivet heads: skipped below LOD 2. */
export function rivets(ctx: Ctx, p: Path2D, lw: number): void {
  if (K.lod < 2) return;
  let c = RIVET[K.lv];
  if (!c) {
    c = K.lv === 0 ? '#c3cbda' : mix('#c3cbda', '#fff0cc', (K.lv / 6) * 0.92);
    RIVET[K.lv] = c;
  }
  ctx.fillStyle = c;
  ctx.fill(p);
  ctx.lineWidth = lw;
  ctx.strokeStyle = ink();
  ctx.stroke(p);
}

const UNIT_DISC = mkPath();
UNIT_DISC.arc(0, 0, 1, 0, Math.PI * 2);
const UNIT_FR = new Frame(-1, 0, 1, 0);

/** A shaded, outlined disc (any space). */
export function disc(ctx: Ctx, mat: Swatch, x: number, y: number, r: number, lw: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r, r);
  ctx.fillStyle = mat.grad(ctx, UNIT_FR, false);
  ctx.fill(UNIT_DISC);
  if (lw > 0) {
    ctx.lineWidth = lw / r;
    ctx.strokeStyle = ink();
    ctx.stroke(UNIT_DISC);
  }
  ctx.restore();
}

/** A riveted brass joint: dark steel cap, brass boss, rivet (a plain brass disc below LOD 1). */
export function joint(
  ctx: Ctx,
  steel: Swatch,
  brass: Swatch,
  x: number,
  y: number,
  r: number,
  lw: number,
): void {
  if (K.lod === 0) {
    disc(ctx, brass, x, y, r * 0.85, lw);
    return;
  }
  disc(ctx, steel, x, y, r, lw);
  disc(ctx, brass, x, y, r * 0.55, lw * 0.6);
  if (K.lod === 2) {
    ctx.fillStyle = '#e6ecf6';
    ctx.beginPath();
    ctx.arc(x - r * 0.12, y + r * 0.12, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
}

const GLOWS = new WeakMap<Ctx, Record<string, CanvasGradient>>();
export type GlowKind = 'ember' | 'steam' | 'eye';

/** A soft radial glow (furnace, eye slit, steam puff) as an ellipse of radii (rx, ry). */
export function glow(
  ctx: Ctx,
  kind: GlowKind,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha: number,
): void {
  let m = GLOWS.get(ctx);
  if (!m) {
    m = {};
    GLOWS.set(ctx, m);
  }
  let g = m[kind];
  if (!g) {
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    if (kind === 'ember') {
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(0.35, '#ffb347');
      g.addColorStop(1, 'rgba(255,106,26,0)');
    } else if (kind === 'eye') {
      g.addColorStop(0, 'rgba(255,226,154,0.95)');
      g.addColorStop(1, 'rgba(255,122,42,0)');
    } else {
      g.addColorStop(0, 'rgba(245,240,232,0.9)');
      g.addColorStop(0.55, 'rgba(245,240,232,0.45)');
      g.addColorStop(1, 'rgba(245,240,232,0)');
    }
    m[kind] = g;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fill(UNIT_DISC);
  ctx.restore();
}

// ── Tubes (limbs) ─────────────────────────────────────────────

/**
 * A tapered armour tube hanging down the -y axis from its joint at the origin: radius `r0` at the
 * joint, `r1` at the far end, an optional belly (`bulge`) and `lames` overlapping plates. Build
 * one per limb size and class once (they hold Path2Ds) and paint it with `paintTube`.
 */
export class Tube {
  readonly body: Shape;
  readonly lames: Path2D;
  readonly lameHi: Path2D;
  /** Specular streak on the left / right (mirrored figures) side. */
  readonly specL: Path2D;
  readonly specR: Path2D;
  readonly rimL: Path2D;
  readonly rimR: Path2D;
  constructor(
    readonly len: number,
    readonly r0: number,
    readonly r1: number,
    nLames = 2,
    bulge = 0,
  ) {
    const body = mkPath();
    body.moveTo(-r0, 0);
    body.bezierCurveTo(-r0 - bulge, -len * 0.3, -r1 - bulge, -len * 0.7, -r1, -len);
    body.arc(0, -len, r1, Math.PI, 0, false);
    body.bezierCurveTo(r1 + bulge, -len * 0.7, r0 + bulge, -len * 0.3, r0, 0);
    body.arc(0, 0, r0, 0, Math.PI, false);
    body.closePath();
    const rm = Math.max(r0, r1) + bulge;
    this.body = new Shape(body, new Frame(-rm, 0, rm, 0));
    const lames = mkPath();
    const hi = mkPath();
    for (let i = 1; i <= nLames; i++) {
      const t = i / (nLames + 1);
      const y = -len * t;
      const w = r0 + (r1 - r0) * t + bulge * 1.2;
      lames.moveTo(-w, y);
      lames.quadraticCurveTo(0, y - 0.034, w, y);
      hi.moveTo(-w + 0.012, y - 0.006);
      hi.quadraticCurveTo(0, y - 0.038, w - 0.012, y - 0.006);
    }
    this.lames = lames;
    this.lameHi = hi;
    const spec = (s: number): Path2D => {
      const p = mkPath();
      p.moveTo(s * r0 * 0.5, -len * 0.07);
      p.lineTo(s * r1 * 0.5, -len * 0.93);
      return p;
    };
    const rim = (s: number): Path2D => {
      const p = mkPath();
      p.moveTo(s * (r0 - 0.012), -len * 0.06);
      p.lineTo(s * (r1 - 0.012), -len * 0.94);
      return p;
    };
    this.specL = spec(-1);
    this.specR = spec(1);
    this.rimL = rim(-1);
    this.rimR = rim(1);
  }
}

/** Paints a tube: gradient body and ink, then lames, specular streak and warm rim by LOD. */
export function paintTube(ctx: Ctx, t: Tube, mat: Swatch, rim = true): void {
  paint(ctx, t.body, mat, inkU(5.5));
  if (K.lod === 0) return;
  seam(ctx, t.lames, inkU(3.2), 0.85);
  if (K.lod === 2) streak(ctx, t.lameHi, inkU(1.6), 0.35);
  streak(ctx, K.mir ? t.specR : t.specL, inkU(2.6), 0.5);
  if (K.lod === 2 && rim) streak(ctx, K.mir ? t.rimL : t.rimR, inkU(2), 0.55, '#ffb866');
}

// ── Flags and plumes ──────────────────────────────────────────

const FX_: number[] = new Array<number>(20).fill(0);
const FY_: number[] = new Array<number>(20).fill(0);

/**
 * A fluttering cloth tongue (plume feather, sash tail, pennon): starts at (x0,y0) heading `ang`
 * (radians, y up), bends by `bend` over its length, tapers from `w0` to `w1`, flutters with time
 * and lags with `drag`. Gradient runs top to bottom over `fr`. Paints fill, ink and a gloss line.
 */
export function flag(
  ctx: Ctx,
  mat: Swatch,
  fr: Frame,
  x0: number,
  y0: number,
  ang: number,
  bend: number,
  len: number,
  w0: number,
  w1: number,
  amp: number,
  t: number,
  phase: number,
  drag: number,
  lw: number,
  segs = 8,
): void {
  let x = x0;
  let y = y0;
  const step = len / segs;
  for (let i = 0; i <= segs; i++) {
    const k = i / segs;
    FX_[i] = x;
    FY_[i] = y;
    const a = ang + bend * k + Math.sin(t * 5 - i * 0.9 + phase) * amp * k + drag * k * 0.9;
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
  }
  ctx.beginPath();
  for (let pass = 0; pass < 2; pass++) {
    for (let q = 0; q <= segs; q++) {
      const i = pass === 0 ? q : segs - q;
      const j = Math.min(i + 1, segs);
      const h = Math.max(i - 1, 0);
      const dx = (FX_[j] as number) - (FX_[h] as number);
      const dy = (FY_[j] as number) - (FY_[h] as number);
      const l = Math.hypot(dx, dy) || 1;
      const w = (w0 + (w1 - w0) * (i / segs)) / 2;
      const s = pass === 0 ? 1 : -1;
      const px = (FX_[i] as number) - (dy / l) * w * s;
      const py = (FY_[i] as number) + (dx / l) * w * s;
      if (q === 0 && pass === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = mat.grad(ctx, fr, true);
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink();
  ctx.stroke();
  if (K.lod > 0) {
    // gloss along the upper edge of the tongue
    ctx.beginPath();
    for (let i = 1; i < segs; i++) {
      const j = Math.min(i + 1, segs);
      const h = i - 1;
      const dx = (FX_[j] as number) - (FX_[h] as number);
      const dy = (FY_[j] as number) - (FY_[h] as number);
      const l = Math.hypot(dx, dy) || 1;
      const w = ((w0 + (w1 - w0) * (i / segs)) / 2) * 0.45;
      const px = (FX_[i] as number) - (dy / l) * w;
      const py = (FY_[i] as number) + (dx / l) * w;
      if (i === 1) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineWidth = lw * 0.6;
    ctx.strokeStyle = mat.at(HI);
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

const STAR = mkPath(
  'M 0 -1 L 0.18 -0.18 L 1 0 L 0.18 0.18 L 0 1 L -0.18 0.18 L -1 0 L -0.18 -0.18 Z',
);
/** A four-pointed glint on a bright plate (LOD 2 only). `s` is the half-size. */
export function glint(ctx: Ctx, x: number, y: number, s: number, alpha: number): void {
  if (K.lod < 2) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.fill(STAR);
  ctx.restore();
}
