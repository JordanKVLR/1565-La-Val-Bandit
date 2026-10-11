/**
 * The 2D effects engine (ADR 0013). One instance per duel stage. Everything is pooled and
 * preallocated: spawning an effect never allocates, drawing never allocates (beyond the
 * occasional gradient for the full-screen washes). Randomness is a seeded generator so a strike
 * replays identically (tests, the duel harness, screenshots).
 *
 * Coordinates: effects live in WORLD space (x right, y up, ~1.8 units per figure; the stage
 * applies a y-flipped transform, so text and images are un-flipped locally here). Screen effects
 * (flash, speed lines, impact frame, wash) are drawn in CSS pixels by `drawScreen`/`drawWash`.
 *
 * Time model: the stage calls `update(dt)` with real seconds. The engine decides how fast the
 * strike runs (`timeScale`: 0 during a hit-stop, <1 in slow motion) and exposes the scaled
 * step as `step`; the stage advances the strike clock by it. Particles (sparks, dust, smoke)
 * hang almost still during a hit-stop; comic shapes (bursts, rings, words) keep popping.
 */
import type { Fx, V2 } from './contract';

/** Engine-only extensions that scripts may use by casting (`fx as FxEngine`). */
export interface FxEngine extends Fx {
  /** Strike clock in seconds (advanced by `update`, scaled by hit-stop and slow motion). */
  time: number;
  /** Reduced motion: no shake, zoom, flashing, hit-stop or slow motion. */
  calm: boolean;
  /** 1 normally, 0 in a hit-stop, the slow-mo factor otherwise. */
  readonly timeScale: number;
  /** Scaled seconds the strike clock moved in the last `update`. */
  readonly step: number;
  /** Camera offsets from shake and punch (world units / zoom). Read after `update`. */
  readonly cam: { dx: number; dy: number; roll: number; zoom: number; px: number; py: number };
  ring(
    at: V2,
    o?: { color?: string; radius?: number; life?: number; width?: number; flat?: number },
  ): void;
  sprite(o: Parameters<Fx['sprite']>[0] & { onStep?: (p: V2, k: number) => void }): void;
  update(dt: number): void;
  drawWash(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  drawBack(ctx: CanvasRenderingContext2D): void;
  drawFront(ctx: CanvasRenderingContext2D): void;
  drawScreen(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  /** Clears everything and reseeds the generator. */
  reset(seed?: number): void;
  /** True the first time it is called with `key` since the last reset (one-shots inside per-frame hooks). */
  once(key: string): boolean;
  /** Runs `fn` after `delay` strike-clock seconds. */
  later(delay: number, fn: () => void): void;
  /** A high-contrast white frame with black radial wedges for `life` seconds (finishers). */
  impactFrame(life?: number): void;
  /** Visible world rectangle (set by the stage each frame); words are kept inside it. */
  readonly view: { minX: number; maxX: number; maxY: number };
  /** Fewer, cheaper particles (phones). */
  setLow(low: boolean): void;
  /** Number of live pooled effects, for tests and budgets. */
  liveCount(): number;
}

// ───────────────────────────── helpers ─────────────────────────────

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeOutBack = (t: number) => {
  const c = 1.9;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

/** mulberry32: tiny, fast, deterministic. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgbCache = new Map<string, readonly [number, number, number]>();
/** Parses #rgb, #rrggbb and rgb()/rgba() colours (anything else is white). */
export function parseColor(c: string): readonly [number, number, number] {
  const hit = rgbCache.get(c);
  if (hit) return hit;
  let out: readonly [number, number, number] = [255, 255, 255];
  if (c.startsWith('#')) {
    const h = c.length === 4 ? c.slice(1).replace(/./g, '$&$&') : c.slice(1, 7);
    const n = parseInt(h, 16);
    if (Number.isFinite(n)) out = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(c);
    if (m) out = [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  if (rgbCache.size > 200) rgbCache.clear();
  rgbCache.set(c, out);
  return out;
}

export function rgba(c: string, a: number): string {
  const [r, g, b] = parseColor(c);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

/** Mixes two colours (t = 0 gives a, 1 gives b). */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(ar, br)},${m(ag, bg)},${m(ab, bb)})`;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  try {
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
  } catch {
    /* no DOM */
  }
  return null;
}

const spriteCache = new Map<string, HTMLCanvasElement | null>();
/** A soft radial blob in `color` (white-hot core), cached per colour. Null without a DOM. */
export function softSprite(color: string): HTMLCanvasElement | null {
  if (spriteCache.has(color)) return spriteCache.get(color) ?? null;
  const c = makeCanvas(64, 64);
  const g = c?.getContext('2d');
  if (c && g) {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, rgba(color, 1));
    grd.addColorStop(0.35, rgba(color, 0.55));
    grd.addColorStop(0.7, rgba(color, 0.14));
    grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  }
  const out = c && g ? c : null;
  if (spriteCache.size > 60) spriteCache.clear();
  spriteCache.set(color, out);
  return out;
}

/** Soft blob at world (x, y) of radius r. Falls back to a flat disc without a DOM. */
function blob(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, r: number): void {
  const s = softSprite(color);
  if (s) ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
  else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, TAU);
    ctx.fill();
  }
}

// ───────────────────────────── pooled records ─────────────────────────────

const enum Kind {
  Spark,
  Dust,
  Smoke,
  Ember,
}

interface Part {
  alive: boolean;
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  grow: number;
  grav: number;
  drag: number;
  color: string;
  alpha: number;
  phase: number;
}
interface Ring {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
  radius: number;
  width: number;
  color: string;
  flat: number;
}
interface Burst {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
  len: number;
  n: number;
  color: string;
  rot: number;
  lens: Float32Array;
}
interface Arc {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
  radius: number;
  from: number;
  to: number;
  width: number;
  color: string;
}
interface Glow {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
  radius: number;
  color: string;
}
interface Word {
  alive: boolean;
  x: number;
  y: number;
  age: number;
  life: number;
  text: string;
  color: string;
  size: number;
  rot: number;
}
const TRAIL_N = 14;
interface Spr {
  alive: boolean;
  age: number;
  life: number;
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  arc: number;
  trail: string;
  paint: ((ctx: CanvasRenderingContext2D, p: V2, angle: number, k: number) => void) | null;
  onEnd: (() => void) | null;
  onStep: ((p: V2, k: number) => void) | null;
  px: Float32Array;
  py: Float32Array;
  n: number;
  pos: V2;
}
interface Trail {
  alive: boolean;
  id: string;
  px: Float32Array;
  py: Float32Array;
  pt: Float32Array;
  head: number;
  count: number;
  color: string;
  width: number;
  fade: number;
  fed: number;
}
interface Layer {
  alive: boolean;
  where: 'back' | 'front';
  age: number;
  life: number;
  paint: ((ctx: CanvasRenderingContext2D, k: number) => void) | null;
}
interface Lines {
  alive: boolean;
  age: number;
  life: number;
  dir: number;
  radial: boolean;
  color: string;
  n: number;
  data: Float32Array; // per line: offset, length, speed, thickness
}
interface Screen {
  alive: boolean;
  age: number;
  life: number;
  color: string;
  strength: number;
}

function pool<T extends { alive: boolean }>(
  n: number,
  make: () => T,
): { items: T[]; cursor: number } {
  const items: T[] = [];
  for (let i = 0; i < n; i++) items.push(make());
  return { items, cursor: 0 };
}
function alloc<T extends { alive: boolean }>(p: { items: T[]; cursor: number }): T {
  const n = p.items.length;
  for (let i = 0; i < n; i++) {
    const idx = (p.cursor + i) % n;
    const it = p.items[idx]!;
    if (!it.alive) {
      p.cursor = (idx + 1) % n;
      it.alive = true;
      return it;
    }
  }
  // Full: recycle the next one in line (the oldest, since the cursor walks in order).
  const it = p.items[p.cursor]!;
  p.cursor = (p.cursor + 1) % n;
  it.alive = true;
  return it;
}

const MAX_PARTS = 420;

// ───────────────────────────── the engine ─────────────────────────────

class FxImpl implements FxEngine {
  time = 0;
  calm = false;
  step = 0;
  timeScale = 1;
  readonly view = { minX: -4, maxX: 4, maxY: 3 };
  readonly cam = { dx: 0, dy: 0, roll: 0, zoom: 1, px: 0, py: 1 };

  private rng: () => number = makeRng(1565);
  private seed = 1565;
  private low = false;
  /** Comic-shape clock (keeps running through a hit-stop). */
  private clock = 0;
  private hitLeft = 0;
  private slowF = 1;
  private slowLeft = 0;
  private shakeAmt = 0;
  private shakeDecay = 0.86;
  private punchK = 1;
  private punchAge = 0;
  private punchLife = 0;
  private punchX = 0;
  private punchY = 1;
  private frameLeft = 0;
  private frameLife = 0;
  private onceKeys = new Set<string>();
  private laters: { at: number; fn: () => void }[] = [];

  private readonly parts = pool<Part>(MAX_PARTS, () => ({
    alive: false,
    kind: Kind.Spark,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    age: 0,
    life: 1,
    size: 0.03,
    grow: 0,
    grav: 0,
    drag: 0,
    color: '#fff',
    alpha: 1,
    phase: 0,
  }));
  private readonly rings = pool<Ring>(16, () => ({
    alive: false,
    x: 0,
    y: 0,
    age: 0,
    life: 0.4,
    radius: 1,
    width: 0.05,
    color: '#fff',
    flat: 1,
  }));
  private readonly bursts = pool<Burst>(10, () => ({
    alive: false,
    x: 0,
    y: 0,
    age: 0,
    life: 0.3,
    len: 1,
    n: 12,
    color: '#ffd24a',
    rot: 0,
    lens: new Float32Array(32),
  }));
  private readonly arcs = pool<Arc>(10, () => ({
    alive: false,
    x: 0,
    y: 0,
    age: 0,
    life: 0.3,
    radius: 1,
    from: 0,
    to: 1,
    width: 0.3,
    color: '#fff',
  }));
  private readonly glows = pool<Glow>(24, () => ({
    alive: false,
    x: 0,
    y: 0,
    age: 0,
    life: 0.3,
    radius: 1,
    color: '#fff',
  }));
  private readonly words = pool<Word>(8, () => ({
    alive: false,
    x: 0,
    y: 0,
    age: 0,
    life: 0.8,
    text: '',
    color: '#fff',
    size: 0.5,
    rot: 0,
  }));
  private readonly sprites = pool<Spr>(10, () => ({
    alive: false,
    age: 0,
    life: 1,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    arc: 0,
    trail: '',
    paint: null,
    onEnd: null,
    onStep: null,
    px: new Float32Array(10),
    py: new Float32Array(10),
    n: 0,
    pos: { x: 0, y: 0 },
  }));
  private readonly trails = pool<Trail>(8, () => ({
    alive: false,
    id: '',
    px: new Float32Array(TRAIL_N),
    py: new Float32Array(TRAIL_N),
    pt: new Float32Array(TRAIL_N),
    head: 0,
    count: 0,
    color: '#fff',
    width: 0.2,
    fade: 0.2,
    fed: 0,
  }));
  private readonly layers = pool<Layer>(24, () => ({
    alive: false,
    where: 'back',
    age: 0,
    life: 1,
    paint: null,
  }));
  private readonly lines = pool<Lines>(4, () => ({
    alive: false,
    age: 0,
    life: 0.5,
    dir: 0,
    radial: true,
    color: '#fff',
    n: 0,
    data: new Float32Array(64 * 4),
  }));
  private readonly flashes = pool<Screen>(4, () => ({
    alive: false,
    age: 0,
    life: 0.2,
    color: '#fff',
    strength: 1,
  }));
  private readonly washes = pool<Screen>(3, () => ({
    alive: false,
    age: 0,
    life: 0.5,
    color: '#000',
    strength: 0.3,
  }));

  private readonly scratchX = new Float32Array(TRAIL_N + 12);
  private readonly scratchY = new Float32Array(TRAIL_N + 12);
  private readonly scratchW = new Float32Array(TRAIL_N + 12);

  constructor(seed = 1565) {
    this.reset(seed);
  }

  rand(): number {
    return this.rng();
  }

  reset(seed = this.seed): void {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.time = 0;
    this.clock = 0;
    this.step = 0;
    this.timeScale = 1;
    this.hitLeft = 0;
    this.slowF = 1;
    this.slowLeft = 0;
    this.shakeAmt = 0;
    this.punchLife = 0;
    this.punchK = 1;
    this.frameLeft = 0;
    this.cam.dx = this.cam.dy = this.cam.roll = 0;
    this.cam.zoom = 1;
    this.onceKeys.clear();
    this.laters.length = 0;
    for (const p of [
      this.parts,
      this.rings,
      this.bursts,
      this.arcs,
      this.glows,
      this.words,
      this.sprites,
      this.trails,
      this.layers,
      this.lines,
      this.flashes,
      this.washes,
    ] as { items: { alive: boolean }[]; cursor: number }[]) {
      for (const it of p.items) it.alive = false;
      p.cursor = 0;
    }
  }

  setLow(low: boolean): void {
    this.low = low;
  }

  once(key: string): boolean {
    if (this.onceKeys.has(key)) return false;
    this.onceKeys.add(key);
    return true;
  }

  later(delay: number, fn: () => void): void {
    this.laters.push({ at: this.time + delay, fn });
  }

  liveCount(): number {
    let n = 0;
    for (const p of [
      this.parts,
      this.rings,
      this.bursts,
      this.arcs,
      this.glows,
      this.words,
      this.sprites,
      this.layers,
    ] as { items: { alive: boolean }[] }[])
      for (const it of p.items) if (it.alive) n++;
    return n;
  }

  // ── spawning ──

  private count(n: number): number {
    return this.low ? Math.max(1, Math.round(n * 0.55)) : n;
  }

  private part(
    kind: Kind,
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
  ): Part {
    const p = alloc(this.parts);
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.age = 0;
    p.life = life;
    p.size = size;
    p.grow = 0;
    p.grav = 0;
    p.drag = 0;
    p.alpha = 1;
    p.phase = this.rng() * TAU;
    return p;
  }

  spark(
    at: V2,
    o: {
      n?: number;
      color?: string;
      speed?: number;
      dir?: number;
      spread?: number;
      size?: number;
    } = {},
  ): void {
    const n = this.count(o.n ?? 10);
    const speed = o.speed ?? 5;
    const spread = o.spread ?? (o.dir === undefined ? TAU : 1.1);
    const dir = o.dir ?? 0;
    const color = o.color ?? '#ffcf5a';
    for (let i = 0; i < n; i++) {
      const a = o.dir === undefined ? this.rng() * TAU : dir + (this.rng() - 0.5) * spread;
      const sp = speed * (0.35 + this.rng() * 0.9);
      const p = this.part(
        Kind.Spark,
        at.x,
        at.y,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        0.28 + this.rng() * 0.35,
        (o.size ?? 0.035) * (0.6 + this.rng() * 0.8),
      );
      p.grav = 7;
      p.drag = 1.6;
      p.color = this.rng() < 0.35 ? '#fff6d8' : color;
    }
  }

  dust(at: V2, o: { n?: number; color?: string; size?: number } = {}): void {
    const n = this.count(o.n ?? 6);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const p = this.part(
        Kind.Dust,
        at.x + (this.rng() - 0.5) * 0.3,
        at.y + 0.03 + this.rng() * 0.06,
        side * (0.3 + this.rng() * 1.4),
        0.1 + this.rng() * 0.55,
        0.55 + this.rng() * 0.45,
        (o.size ?? 0.16) * (0.7 + this.rng() * 0.7),
      );
      p.grow = 1.4;
      p.drag = 2.2;
      p.alpha = 0.55;
      p.color = o.color ?? '#cdb98e';
    }
  }

  smoke(at: V2, o: { n?: number; color?: string; size?: number; rise?: number } = {}): void {
    const n = this.count(o.n ?? 5);
    for (let i = 0; i < n; i++) {
      const p = this.part(
        Kind.Smoke,
        at.x + (this.rng() - 0.5) * 0.15,
        at.y + (this.rng() - 0.5) * 0.1,
        (this.rng() - 0.5) * 0.7,
        (o.rise ?? 0.6) * (0.6 + this.rng() * 0.8),
        0.9 + this.rng() * 0.7,
        (o.size ?? 0.18) * (0.7 + this.rng() * 0.6),
      );
      p.grow = 1.2;
      p.drag = 1.0;
      p.alpha = 0.5;
      p.color = o.color ?? '#a9a49c';
    }
  }

  ember(at: V2, o: { n?: number; color?: string } = {}): void {
    const n = this.count(o.n ?? 6);
    for (let i = 0; i < n; i++) {
      const p = this.part(
        Kind.Ember,
        at.x + (this.rng() - 0.5) * 0.3,
        at.y + (this.rng() - 0.5) * 0.2,
        (this.rng() - 0.5) * 1.2,
        0.5 + this.rng() * 1.2,
        0.7 + this.rng() * 0.8,
        0.022 + this.rng() * 0.02,
      );
      p.grav = -0.4;
      p.drag = 0.8;
      p.color = o.color ?? (this.rng() < 0.5 ? '#ffb02e' : '#ff6a1f');
    }
  }

  ring(
    at: V2,
    o: { color?: string; radius?: number; life?: number; width?: number; flat?: number } = {},
  ): void {
    const r = alloc(this.rings);
    r.x = at.x;
    r.y = at.y;
    r.age = 0;
    r.life = o.life ?? 0.42;
    r.radius = o.radius ?? 1.1;
    r.width = o.width ?? 0.09;
    r.color = o.color ?? '#fff1c4';
    r.flat = o.flat ?? 1;
  }

  burst(at: V2, o: { n?: number; color?: string; length?: number; life?: number } = {}): void {
    const b = alloc(this.bursts);
    b.x = at.x;
    b.y = at.y;
    b.age = 0;
    b.life = o.life ?? 0.34;
    b.len = o.length ?? 1;
    b.n = Math.min(16, Math.max(5, o.n ?? 11));
    b.color = o.color ?? '#ffd24a';
    b.rot = this.rng() * TAU;
    for (let i = 0; i < b.n; i++) b.lens[i] = 0.62 + this.rng() * 0.55;
  }

  arc(
    at: V2,
    o: { radius: number; from: number; to: number; width?: number; color?: string; life?: number },
  ): void {
    const a = alloc(this.arcs);
    a.x = at.x;
    a.y = at.y;
    a.age = 0;
    a.life = o.life ?? 0.26;
    a.radius = o.radius;
    a.from = o.from;
    a.to = o.to;
    a.width = o.width ?? o.radius * 0.35;
    a.color = o.color ?? '#fff3c4';
  }

  glow(at: V2, o: { radius?: number; color?: string; life?: number } = {}): void {
    const g = alloc(this.glows);
    g.x = at.x;
    g.y = at.y;
    g.age = 0;
    g.life = o.life ?? 0.3;
    g.radius = o.radius ?? 0.8;
    g.color = o.color ?? '#fff1b8';
  }

  word(
    at: V2,
    text: string,
    o: { color?: string; size?: number; life?: number; rot?: number } = {},
  ): void {
    const w = alloc(this.words);
    w.x = at.x;
    w.y = at.y;
    w.age = 0;
    w.life = o.life ?? 0.85;
    w.text = text;
    w.color = o.color ?? '#ffd24a';
    w.size = o.size ?? 0.55;
    w.rot = o.rot ?? (this.rng() - 0.5) * 0.3;
  }

  sprite(o: {
    from: V2;
    to: V2;
    life: number;
    arc?: number;
    trail?: string;
    paint: (ctx: CanvasRenderingContext2D, p: V2, angle: number, k: number) => void;
    onEnd?: () => void;
    onStep?: (p: V2, k: number) => void;
  }): void {
    const s = alloc(this.sprites);
    s.age = 0;
    s.life = Math.max(0.02, o.life);
    s.fx = o.from.x;
    s.fy = o.from.y;
    s.tx = o.to.x;
    s.ty = o.to.y;
    s.arc = o.arc ?? 0;
    s.trail = o.trail ?? '';
    s.paint = o.paint;
    s.onEnd = o.onEnd ?? null;
    s.onStep = o.onStep ?? null;
    s.n = 0;
    s.pos.x = o.from.x;
    s.pos.y = o.from.y;
  }

  trailPoint(id: string, p: V2, o: { color?: string; width?: number; fade?: number } = {}): void {
    let t: Trail | undefined;
    for (const it of this.trails.items) if (it.alive && it.id === id) t = it;
    if (!t) {
      t = alloc(this.trails);
      t.id = id;
      t.count = 0;
      t.head = 0;
    }
    t.color = o.color ?? '#fff3c4';
    t.width = o.width ?? 0.18;
    t.fade = o.fade ?? 0.2;
    t.fed = this.clock;
    const i = t.head;
    t.px[i] = p.x;
    t.py[i] = p.y;
    t.pt[i] = this.clock;
    t.head = (i + 1) % TRAIL_N;
    if (t.count < TRAIL_N) t.count++;
  }

  shake(amount: number, decay = 0.86): void {
    if (this.calm) return;
    this.shakeAmt = Math.min(0.7, Math.max(this.shakeAmt, amount));
    this.shakeDecay = decay;
  }

  flash(color: string, strength: number, life = 0.18): void {
    if (this.calm) return;
    const f = alloc(this.flashes);
    f.age = 0;
    f.life = life;
    f.color = color;
    f.strength = strength;
  }

  hitStop(ms: number): void {
    if (this.calm) return;
    this.hitLeft = Math.max(this.hitLeft, Math.min(0.35, ms / 1000));
  }

  speedLines(o: { dir?: number; color?: string; life?: number; n?: number } = {}): void {
    if (this.calm) return;
    const l = alloc(this.lines);
    l.age = 0;
    l.life = o.life ?? 0.5;
    l.radial = o.dir === undefined;
    l.dir = o.dir ?? 0;
    l.color = o.color ?? '#ffffff';
    l.n = Math.min(64, this.count(o.n ?? 30));
    for (let i = 0; i < l.n; i++) {
      l.data[i * 4] = this.rng();
      l.data[i * 4 + 1] = 0.12 + this.rng() * 0.3;
      l.data[i * 4 + 2] = 0.8 + this.rng() * 1.6;
      l.data[i * 4 + 3] = 0.4 + this.rng() * 1.6;
    }
  }

  punch(at: V2, k: number, life = 0.5): void {
    if (this.calm) return;
    if (this.punchLife > 0 && this.punchAge < this.punchLife * 0.5 && k < this.punchK) return;
    this.punchK = Math.min(1.8, Math.max(1, k));
    this.punchAge = 0;
    this.punchLife = life;
    this.punchX = at.x;
    this.punchY = at.y;
  }

  wash(color: string, strength: number, life = 0.5): void {
    const w = alloc(this.washes);
    w.age = 0;
    w.life = life;
    w.color = color;
    w.strength = this.calm ? strength * 0.5 : strength;
  }

  slowmo(factor: number, life: number): void {
    if (this.calm) return;
    this.slowF = Math.max(0.08, Math.min(1, factor));
    this.slowLeft = life;
  }

  layer(
    where: 'back' | 'front',
    life: number,
    paint: (ctx: CanvasRenderingContext2D, k: number) => void,
  ): void {
    const l = alloc(this.layers);
    l.where = where;
    l.age = 0;
    l.life = Math.max(0.01, life);
    l.paint = paint;
  }

  impactFrame(life = 0.07): void {
    if (this.calm) return;
    this.frameLeft = life;
    this.frameLife = life;
  }

  // ── simulation ──

  update(dt: number): void {
    dt = Math.min(0.1, Math.max(0, dt));
    // Strike speed: hit-stop freezes it, slow motion scales it.
    let scale = 1;
    if (this.hitLeft > 0) {
      scale = 0;
      this.hitLeft -= dt;
    } else if (this.slowLeft > 0) {
      scale = this.slowF;
    }
    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      if (this.slowLeft <= 0) this.slowF = 1;
    }
    this.timeScale = scale;
    this.step = dt * scale;
    this.time += this.step;
    const dtUi = this.hitLeft > 0 || scale === 0 ? dt : dt * scale;
    const dtPart = scale === 0 ? dt * 0.07 : dt * scale;
    this.clock += dtUi;

    // Scheduled callbacks.
    for (let i = this.laters.length - 1; i >= 0; i--) {
      const l = this.laters[i]!;
      if (this.time >= l.at) {
        this.laters.splice(i, 1);
        l.fn();
      }
    }

    // Particles.
    for (const p of this.parts.items) {
      if (!p.alive) continue;
      p.age += dtPart;
      if (p.age >= p.life) {
        p.alive = false;
        continue;
      }
      const damp = Math.max(0, 1 - p.drag * dtPart);
      p.vx *= damp;
      p.vy = p.vy * damp - p.grav * dtPart;
      if (p.kind === Kind.Ember) p.vx += Math.sin(p.age * 9 + p.phase) * 0.9 * dtPart;
      p.x += p.vx * dtPart;
      p.y += p.vy * dtPart;
      if (p.kind === Kind.Spark && p.y < 0.01 && p.vy < 0) {
        p.y = 0.01;
        p.vy *= -0.3;
      }
    }
    for (const r of this.rings.items) if (r.alive && (r.age += dtUi) >= r.life) r.alive = false;
    for (const b of this.bursts.items) if (b.alive && (b.age += dtUi) >= b.life) b.alive = false;
    for (const a of this.arcs.items) if (a.alive && (a.age += dtUi) >= a.life) a.alive = false;
    for (const g of this.glows.items) if (g.alive && (g.age += dtUi) >= g.life) g.alive = false;
    for (const w of this.words.items) if (w.alive && (w.age += dtUi) >= w.life) w.alive = false;
    for (const f of this.flashes.items) if (f.alive && (f.age += dt) >= f.life) f.alive = false;
    for (const w of this.washes.items) if (w.alive && (w.age += dt) >= w.life) w.alive = false;
    for (const l of this.lines.items) if (l.alive && (l.age += dt) >= l.life) l.alive = false;
    for (const l of this.layers.items) {
      if (!l.alive) continue;
      l.age += dtUi;
      if (l.age >= l.life) {
        l.alive = false;
        l.paint = null;
      }
    }
    for (const t of this.trails.items) if (t.alive && this.clock - t.fed > t.fade) t.alive = false;

    // Flying sprites (positions advance with the strike so they stay locked to the choreography).
    const sdt = dtUi;
    for (const s of this.sprites.items) {
      if (!s.alive) continue;
      s.age += sdt;
      const k = Math.min(1, s.age / s.life);
      s.pos.x = s.fx + (s.tx - s.fx) * k;
      s.pos.y = s.fy + (s.ty - s.fy) * k + s.arc * 4 * k * (1 - k);
      if (s.trail) {
        const last = Math.min(s.n, 10);
        if (last < 10) s.n++;
        else {
          s.px.copyWithin(0, 1);
          s.py.copyWithin(0, 1);
        }
        const idx = Math.min(s.n, 10) - 1;
        s.px[idx] = s.pos.x;
        s.py[idx] = s.pos.y;
      }
      s.onStep?.(s.pos, k);
      if (k >= 1) {
        s.alive = false;
        const cb = s.onEnd;
        s.paint = null;
        s.onEnd = null;
        s.onStep = null;
        cb?.();
      }
    }

    // Camera: shake (frame-rate independent decay) and the punch zoom.
    const cam = this.cam;
    if (this.shakeAmt > 0.002) {
      cam.dx = (this.rng() * 2 - 1) * this.shakeAmt;
      cam.dy = (this.rng() * 2 - 1) * this.shakeAmt * 0.8;
      cam.roll = (this.rng() * 2 - 1) * this.shakeAmt * 0.035;
      this.shakeAmt *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeAmt = 0;
      cam.dx = cam.dy = cam.roll = 0;
    }
    if (this.punchLife > 0) {
      this.punchAge += dt;
      const u = this.punchAge / this.punchLife;
      if (u >= 1) {
        this.punchLife = 0;
        cam.zoom = 1;
      } else {
        const up = easeOut(clamp01(u / 0.14));
        const down = u < 0.4 ? 0 : easeOut(clamp01((u - 0.4) / 0.6));
        cam.zoom = 1 + (this.punchK - 1) * up * (1 - down);
        cam.px = this.punchX;
        cam.py = this.punchY;
      }
    } else cam.zoom = 1;
    if (this.frameLeft > 0) this.frameLeft -= dt;
  }

  // ── drawing ──

  drawBack(ctx: CanvasRenderingContext2D): void {
    for (const l of this.layers.items)
      if (l.alive && l.where === 'back' && l.paint) this.paintLayer(ctx, l);
    // Soft things first: smoke, then dust.
    for (const kind of [Kind.Smoke, Kind.Dust]) {
      for (const p of this.parts.items) {
        if (!p.alive || p.kind !== kind) continue;
        const u = p.age / p.life;
        const r = p.size * (1 + p.grow * u);
        ctx.globalAlpha = p.alpha * (1 - u) * Math.min(1, u * 8 + 0.2);
        blob(ctx, p.color, p.x, p.y, r);
      }
    }
    ctx.globalAlpha = 1;
  }

  private paintLayer(ctx: CanvasRenderingContext2D, l: Layer): void {
    ctx.save();
    l.paint?.(ctx, Math.min(1, l.age / l.life));
    ctx.restore();
  }

  drawFront(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Weapon trails and flying sprites.
    for (const t of this.trails.items) if (t.alive) this.drawTrail(ctx, t);
    for (const s of this.sprites.items) if (s.alive) this.drawSprite(ctx, s);

    for (const l of this.layers.items)
      if (l.alive && l.where === 'front' && l.paint) this.paintLayer(ctx, l);

    // Additive glows, arcs, rings.
    ctx.globalCompositeOperation = 'lighter';
    for (const g of this.glows.items) {
      if (!g.alive) continue;
      const u = g.age / g.life;
      ctx.globalAlpha = Math.min(1, u * 9) * (1 - u) * (1 - u) * 1.2;
      blob(ctx, g.color, g.x, g.y, g.radius * (0.55 + 0.6 * easeOut(u)));
    }
    ctx.globalAlpha = 1;
    for (const a of this.arcs.items) if (a.alive) this.drawArc(ctx, a);
    for (const r of this.rings.items) if (r.alive) this.drawRing(ctx, r);

    // Embers and sparks (streaks).
    for (const p of this.parts.items) {
      if (!p.alive) continue;
      const u = p.age / p.life;
      if (p.kind === Kind.Ember) {
        ctx.globalAlpha = (1 - u) * (0.65 + 0.35 * Math.sin(p.age * 30 + p.phase));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - u * 0.5), 0, TAU);
        ctx.fill();
      } else if (p.kind === Kind.Spark) {
        const k = 0.045;
        ctx.globalAlpha = Math.min(1, (1 - u) * 1.6);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 2.2 * (1 - u * 0.6);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * k, p.y - p.vy * k);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = p.size * 0.9;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * k * 0.55, p.y - p.vy * k * 0.55);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    for (const b of this.bursts.items) if (b.alive) this.drawBurst(ctx, b);
    for (const w of this.words.items) if (w.alive) this.drawWord(ctx, w);
    ctx.restore();
  }

  private drawRing(ctx: CanvasRenderingContext2D, r: Ring): void {
    const u = r.age / r.life;
    const e = easeOut(u);
    const fade = 1 - u;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.scale(1, r.flat);
    // Fading fill.
    ctx.globalAlpha = 0.16 * fade;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(0, 0, r.radius * e, 0, TAU);
    ctx.fill();
    // Outer ring, then a lagging inner ring in white.
    ctx.globalAlpha = Math.min(1, fade * 1.5);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = Math.max(0.004, r.width * fade * 1.3);
    ctx.beginPath();
    ctx.arc(0, 0, r.radius * e, 0, TAU);
    ctx.stroke();
    const e2 = easeOut(clamp01((u - 0.07) / 0.93));
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.003, r.width * 0.5 * fade);
    ctx.beginPath();
    ctx.arc(0, 0, r.radius * 0.8 * e2, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  private arcPath(
    ctx: CanvasRenderingContext2D,
    a: Arc,
    tail: number,
    head: number,
    wScale: number,
  ): void {
    const N = 22;
    const span = a.to - a.from;
    // Outer edge forward, inner edge back: a crescent that is thick in the middle.
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const ang = a.from + span * (tail + (head - tail) * s);
      const f = Math.pow(Math.sin(Math.PI * s), 0.75);
      const ro = a.radius + a.width * 0.3 * f * wScale;
      const x = a.x + Math.cos(ang) * ro;
      const y = a.y + Math.sin(ang) * ro;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const s = i / N;
      const ang = a.from + span * (tail + (head - tail) * s);
      const f = Math.pow(Math.sin(Math.PI * s), 0.75);
      const ri = a.radius - a.width * 0.7 * f * wScale;
      ctx.lineTo(a.x + Math.cos(ang) * ri, a.y + Math.sin(ang) * ri);
    }
    ctx.closePath();
  }

  private drawArc(ctx: CanvasRenderingContext2D, a: Arc): void {
    const u = a.age / a.life;
    const head = easeOut(clamp01(u / 0.42));
    const tail = u < 0.12 ? 0 : easeOut(clamp01((u - 0.12) / 0.88)) * 0.97;
    if (head - tail < 0.02) return;
    const alpha = u < 0.55 ? 1 : 1 - Math.pow((u - 0.55) / 0.45, 1.6);
    if (alpha <= 0) return;
    // Coloured body, bright core, hot edge.
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = a.color;
    this.arcPath(ctx, a, tail, head, 1);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    this.arcPath(ctx, a, Math.min(head - 0.01, tail + (head - tail) * 0.18), head, 0.5);
    ctx.fill();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = Math.max(0.012, a.width * 0.08);
    ctx.globalAlpha = alpha * 0.9;
    this.arcPath(ctx, a, tail, head, 1.0);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawBurst(ctx: CanvasRenderingContext2D, b: Burst): void {
    const u = b.age / b.life;
    const pop = easeOutBack(clamp01(u / 0.28));
    const fade = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45;
    if (fade <= 0) return;
    const R = b.len * pop * (1 + u * 0.18);
    const n = b.n;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot + u * 0.18);
    ctx.globalAlpha = fade;
    // Outer star: dark outline under the coloured fill.
    for (let pass = 0; pass < 3; pass++) {
      const s = pass === 0 ? 1 : pass === 1 ? 0.97 : 0.58;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const spike = i % 2 === 0;
        const ang = (i / (n * 2)) * TAU;
        const rr = spike ? R * (b.lens[i >> 1] ?? 1) * s : R * 0.3 * s;
        const x = Math.cos(ang) * rr;
        const y = Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (pass === 0) {
        ctx.fillStyle = '#2a1308';
        ctx.fill();
      } else if (pass === 1) {
        ctx.fillStyle = b.color;
        ctx.fill();
      } else {
        ctx.fillStyle = '#fffbe8';
        ctx.fill();
      }
    }
    ctx.restore();
    // Streaks flying off the star.
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.globalAlpha = fade * 0.9;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 0.035 * b.len;
    for (let i = 0; i < n; i++) {
      const ang = ((i + 0.5) / n) * TAU;
      const r0 = R * 1.08;
      const r1 = R * (1.3 + (b.lens[i] ?? 1) * 0.5) * (0.7 + 0.3 * u);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
      ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawWord(ctx: CanvasRenderingContext2D, w: Word): void {
    const u = w.age / w.life;
    const pop = easeOutBack(clamp01(u / 0.16));
    const fade = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
    if (fade <= 0 || pop <= 0) return;
    const sc = (w.size / 100) * pop * (1 + 0.06 * u);
    const hw = w.text.length * 0.3 * w.size + 0.1;
    const wx = Math.max(this.view.minX + hw, Math.min(this.view.maxX - hw, w.x));
    const wy = Math.min(this.view.maxY - w.size * 0.7, w.y + u * 0.35);
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(w.rot);
    ctx.scale(sc, -sc); // un-flip the y-up world so the text reads normally
    ctx.globalAlpha = fade;
    ctx.font = '900 100px Impact, "Arial Black", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    // Sticker look: dark outer outline, white rim, colour fill, glossy highlight.
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#1c0e08';
    ctx.strokeText(w.text, 4, 6);
    ctx.strokeText(w.text, 0, 0);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#fffaf0';
    ctx.strokeText(w.text, 0, 0);
    ctx.fillStyle = w.color;
    ctx.fillText(w.text, 0, 0);
    ctx.globalAlpha = fade * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.beginPath();
    ctx.rect(-400, -60, 800, 52);
    ctx.clip();
    ctx.fillText(w.text, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  private drawSprite(ctx: CanvasRenderingContext2D, s: Spr): void {
    const k = Math.min(1, s.age / s.life);
    if (s.trail && s.n > 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const n = Math.min(s.n, 10);
      for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = pass === 0 ? s.trail : '#ffffff';
        for (let i = 1; i < n; i++) {
          const f = i / n;
          ctx.globalAlpha = f * (pass === 0 ? 0.7 : 0.8);
          ctx.lineWidth = (pass === 0 ? 0.11 : 0.04) * f;
          ctx.beginPath();
          ctx.moveTo(s.px[i - 1]!, s.py[i - 1]!);
          ctx.lineTo(s.px[i]!, s.py[i]!);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (s.paint) {
      const k2 = Math.min(1, k + 0.02);
      const nx = s.fx + (s.tx - s.fx) * k2;
      const ny = s.fy + (s.ty - s.fy) * k2 + s.arc * 4 * k2 * (1 - k2);
      const ang = Math.atan2(ny - s.pos.y, nx - s.pos.x);
      ctx.save();
      s.paint(ctx, s.pos, ang, k);
      ctx.restore();
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D, t: Trail): void {
    // Collect live points oldest -> newest.
    let n = 0;
    for (let i = 0; i < t.count; i++) {
      const idx = (t.head - t.count + i + TRAIL_N * 2) % TRAIL_N;
      const age = this.clock - t.pt[idx]!;
      if (age > t.fade) continue;
      this.scratchX[n] = t.px[idx]!;
      this.scratchY[n] = t.py[idx]!;
      this.scratchW[n] = 1 - age / t.fade;
      n++;
    }
    if (n < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      const wd = t.width * (pass === 0 ? 1 : 0.38);
      ctx.fillStyle = pass === 0 ? t.color : '#ffffff';
      ctx.globalAlpha = pass === 0 ? 0.7 : 0.85;
      ctx.beginPath();
      // Left edge forward, right edge back.
      for (let side = 0; side < 2; side++) {
        for (let j = 0; j < n; j++) {
          const i = side === 0 ? j : n - 1 - j;
          const a = Math.max(0, i - 1);
          const b = Math.min(n - 1, i + 1);
          let nx = -(this.scratchY[b]! - this.scratchY[a]!);
          let ny = this.scratchX[b]! - this.scratchX[a]!;
          const len = Math.hypot(nx, ny) || 1;
          nx /= len;
          ny /= len;
          const taper = this.scratchW[i]! * (0.25 + 0.75 * (i / (n - 1)));
          const sgn = side === 0 ? 1 : -1;
          const x = this.scratchX[i]! + nx * wd * 0.5 * taper * sgn;
          const y = this.scratchY[i]! + ny * wd * 0.5 * taper * sgn;
          if (side === 0 && j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawWash(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const s of this.washes.items) {
      if (!s.alive) continue;
      const u = s.age / s.life;
      const a = s.strength * Math.min(1, u * 8) * (1 - u);
      if (a <= 0.003) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = s.color;
      ctx.fillRect(0, 0, w, h);
      // Darker toward the edges.
      const g = ctx.createRadialGradient(
        w / 2,
        h * 0.55,
        h * 0.25,
        w / 2,
        h * 0.55,
        Math.hypot(w, h) * 0.6,
      );
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  drawScreen(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    // Speed lines.
    for (const l of this.lines.items) {
      if (!l.alive) continue;
      const u = l.age / l.life;
      const env = Math.min(1, u * 7) * (1 - u * u);
      ctx.strokeStyle = l.color;
      ctx.lineCap = 'round';
      const diag = Math.hypot(w, h) * 0.5;
      const cx = w / 2;
      const cy = h * 0.5;
      const dx = Math.cos(l.dir);
      const dy = -Math.sin(l.dir);
      for (let i = 0; i < l.n; i++) {
        const off = l.data[i * 4]!;
        const len = l.data[i * 4 + 1]!;
        const spd = l.data[i * 4 + 2]!;
        const th = l.data[i * 4 + 3]!;
        ctx.globalAlpha = env * 0.55;
        ctx.lineWidth = th * (h / 260);
        ctx.beginPath();
        if (l.radial) {
          const ang = off * TAU;
          const r0 = diag * (0.42 + 0.35 * ((off * 7.31) % 1)) + u * diag * 0.25 * spd;
          const r1 = r0 + diag * len * 0.6;
          ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
          ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        } else {
          const perp = (off - 0.5) * 2 * diag * 0.9;
          const prog = ((u * spd * 1.4 + off * 3.7) % 1) * 2 - 0.5;
          const along = prog * diag * 2;
          const ex = cx - dx * diag + dx * along + -dy * perp;
          const ey = cy - dy * diag + dy * along + dx * perp;
          const L = diag * len * 1.6;
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - dx * L, ey - dy * L);
        }
        ctx.stroke();
      }
    }
    // Colour flashes.
    for (const f of this.flashes.items) {
      if (!f.alive) continue;
      const u = f.age / f.life;
      ctx.globalAlpha = Math.min(1, f.strength * (1 - u) * (1 - u));
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, w, h);
    }
    // Impact frame: stark white with black wedges.
    if (this.frameLeft > 0) {
      const u = 1 - this.frameLeft / this.frameLife;
      ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0b0b0f';
      const cx = w / 2;
      const cy = h * 0.5;
      const R = Math.hypot(w, h);
      const wedges = 16;
      for (let i = 0; i < wedges; i++) {
        const a0 = (i / wedges) * TAU;
        const a1 = a0 + (TAU / wedges) * (0.18 + (0.22 * ((i * 37) % 5)) / 5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a0) * h * 0.12, cy + Math.sin(a0) * h * 0.12);
        ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
        ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/** Creates the effects engine. `seed` fixes the particle randomness. */
export function createFx(seed = 1565): FxEngine {
  return new FxImpl(seed);
}
