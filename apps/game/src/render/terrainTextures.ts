import { CanvasTexture, LinearMipmapLinearFilter, SRGBColorSpace } from 'three';

/**
 * Procedural terrain textures, painted once into a single atlas so the whole map stays one
 * draw call. Each terrain has a top texture; tile sides use one of a few cliff textures.
 * Real art (see docs/ART_PROMPTS.md) replaces a cell via `paintImage` without other changes.
 */
export const CELL = 128;
const COLS = 8;

const TOPS = [
  'plain',
  'road',
  'field',
  'scrub',
  'sand',
  'rubble',
  'rampart',
  'shallows',
  'sea',
  'floor',
  'wall',
  'deck',
  'trench',
  'ruin',
] as const;
const SIDES = [
  'side-rock',
  'side-soil',
  'side-sand',
  'side-water',
  'side-wood',
  'side-wall',
] as const;
export type SideKind = (typeof SIDES)[number];

const SIDE_OF: Record<string, SideKind> = {
  plain: 'side-soil',
  field: 'side-soil',
  scrub: 'side-soil',
  road: 'side-rock',
  rubble: 'side-rock',
  rampart: 'side-wall',
  wall: 'side-wall',
  floor: 'side-wall',
  ruin: 'side-rock',
  sand: 'side-sand',
  shallows: 'side-water',
  sea: 'side-water',
  deck: 'side-wood',
  trench: 'side-soil',
};

/** Deterministic pseudo-random numbers so the terrain looks the same every visit. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise (wraps at `period`), in 0..1. */
function makeNoise(seed: number, period: number): (x: number, y: number) => number {
  const r = rng(seed);
  const grid = Array.from({ length: period * period }, () => r());
  const at = (x: number, y: number) =>
    grid[(((y % period) + period) % period) * period + (((x % period) + period) % period)]!;
  return (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

/** Fractal noise over a CELL-sized tile, tileable. */
function fbm(seed: number): (x: number, y: number) => number {
  const octaves = [4, 8, 16, 32].map((p, i) => ({
    n: makeNoise(seed + i * 101, p),
    p,
    w: 1 / 2 ** i,
  }));
  const total = octaves.reduce((s, o) => s + o.w, 0);
  return (x, y) =>
    octaves.reduce((s, o) => s + o.n((x / CELL) * o.p, (y / CELL) * o.p) * o.w, 0) / total;
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function fillNoise(img: ImageData, seed: number, dark: RGB, light: RGB, contrast = 1): void {
  const n = fbm(seed);
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      const v = Math.min(1, Math.max(0, (n(x, y) - 0.5) * contrast + 0.5));
      const c = mix(dark, light, v);
      const i = (y * CELL + x) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = 255;
    }
  }
}

function speckle(
  ctx: CanvasRenderingContext2D,
  seed: number,
  count: number,
  colors: string[],
  size: [number, number],
): void {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)]!;
    const s = size[0] + r() * (size[1] - size[0]);
    ctx.beginPath();
    ctx.ellipse(r() * CELL, r() * CELL, s, s * (0.6 + r() * 0.4), r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Honey-coloured limestone blocks with mortar joints (Maltese globigerina). */
function blocks(
  ctx: CanvasRenderingContext2D,
  seed: number,
  rows: number,
  cols: number,
  mortar: string,
): void {
  const r = rng(seed);
  const h = CELL / rows;
  ctx.strokeStyle = mortar;
  ctx.lineWidth = 2;
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? CELL / cols / 2 : 0;
    ctx.beginPath();
    ctx.moveTo(0, row * h);
    ctx.lineTo(CELL, row * h);
    ctx.stroke();
    for (let c = 0; c <= cols; c++) {
      const x = c * (CELL / cols) + offset + (r() - 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(x, row * h);
      ctx.lineTo(x, row * h + h);
      ctx.stroke();
    }
  }
}

function paintTop(ctx: CanvasRenderingContext2D, id: string): void {
  const img = ctx.createImageData(CELL, CELL);
  const seed = [...id].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7);
  switch (id) {
    case 'plain':
      fillNoise(img, seed, [74, 92, 38], [132, 150, 70], 1.6);
      ctx.putImageData(img, 0, 0);
      speckle(ctx, seed + 1, 260, ['#5f7a2c', '#9aac55', '#6e8a36'], [0.6, 1.6]);
      speckle(ctx, seed + 2, 18, ['#8a7658', '#a08c6b'], [1, 2.2]);
      break;
    case 'field': {
      fillNoise(img, seed, [120, 118, 52], [168, 160, 84], 1.3);
      ctx.putImageData(img, 0, 0);
      const r = rng(seed);
      for (let y = 4; y < CELL; y += 10) {
        ctx.strokeStyle = r() > 0.5 ? 'rgba(92,110,40,0.75)' : 'rgba(80,98,34,0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, y + r() * 2);
        ctx.lineTo(CELL, y + r() * 2);
        ctx.stroke();
      }
      speckle(ctx, seed + 3, 60, ['#6f5a3a'], [0.5, 1.2]);
      break;
    }
    case 'scrub':
      fillNoise(img, seed, [96, 88, 60], [150, 138, 100], 1.8);
      ctx.putImageData(img, 0, 0);
      speckle(ctx, seed + 1, 34, ['#4b5a2a', '#5a6a30', '#3f4d24'], [3, 7]);
      speckle(ctx, seed + 2, 40, ['#c9bb9a', '#b5a785'], [1, 2.5]);
      break;
    case 'road': {
      fillNoise(img, seed, [150, 124, 88], [200, 176, 136], 1.4);
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = 'rgba(110,86,58,0.45)';
      ctx.lineWidth = 5;
      for (const x of [CELL * 0.3, CELL * 0.7]) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CELL);
        ctx.stroke();
      }
      speckle(ctx, seed + 1, 70, ['#8c7a60', '#d8c6a2', '#a0907a'], [0.8, 2]);
      break;
    }
    case 'sand': {
      fillNoise(img, seed, [196, 176, 132], [232, 216, 172], 1.2);
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = 'rgba(170,150,110,0.35)';
      ctx.lineWidth = 1.5;
      for (let y = 6; y < CELL; y += 11) {
        ctx.beginPath();
        for (let x = 0; x <= CELL; x += 8)
          ctx.lineTo(x, y + Math.sin((x / CELL) * Math.PI * 4) * 2.5);
        ctx.stroke();
      }
      break;
    }
    case 'rubble':
      fillNoise(img, seed, [120, 110, 96], [176, 164, 146], 1.5);
      ctx.putImageData(img, 0, 0);
      speckle(ctx, seed + 1, 22, ['#b8a988', '#9e917a', '#cfc2a2'], [5, 11]);
      speckle(ctx, seed + 2, 40, ['#6c6254'], [1, 3]);
      break;
    case 'rampart':
    case 'wall':
      fillNoise(img, seed, [184, 152, 98], [222, 196, 142], 1.3);
      ctx.putImageData(img, 0, 0);
      blocks(ctx, seed, 4, 3, 'rgba(120,96,60,0.7)');
      break;
    case 'floor':
      fillNoise(img, seed, [176, 158, 124], [212, 196, 164], 1.2);
      ctx.putImageData(img, 0, 0);
      blocks(ctx, seed, 3, 3, 'rgba(110,94,70,0.6)');
      break;
    case 'ruin':
      fillNoise(img, seed, [150, 128, 96], [206, 184, 140], 1.8);
      ctx.putImageData(img, 0, 0);
      blocks(ctx, seed, 3, 2, 'rgba(90,72,50,0.8)');
      speckle(ctx, seed + 1, 18, ['#8b7858', '#5e5140'], [3, 8]);
      break;
    case 'shallows':
      fillNoise(img, seed, [40, 128, 150], [110, 196, 200], 1.4);
      ctx.putImageData(img, 0, 0);
      speckle(ctx, seed + 1, 30, ['rgba(255,255,255,0.35)'], [2, 5]);
      break;
    case 'sea':
      fillNoise(img, seed, [16, 58, 96], [44, 104, 148], 1.5);
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = 'rgba(200,230,255,0.25)';
      for (let y = 8; y < CELL; y += 16) {
        ctx.beginPath();
        for (let x = 0; x <= CELL; x += 6)
          ctx.lineTo(x, y + Math.sin((x / CELL) * Math.PI * 2 + y) * 3);
        ctx.stroke();
      }
      break;
    case 'deck': {
      fillNoise(img, seed, [96, 66, 40], [140, 100, 62], 1.2);
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = 'rgba(50,32,18,0.7)';
      ctx.lineWidth = 2;
      for (let y = 0; y <= CELL; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CELL, y);
        ctx.stroke();
      }
      speckle(ctx, seed + 1, 12, ['#2e1d10'], [1, 1.6]);
      break;
    }
    case 'trench':
      fillNoise(img, seed, [70, 52, 36], [118, 92, 64], 1.6);
      ctx.putImageData(img, 0, 0);
      speckle(ctx, seed + 1, 30, ['#4a3a28', '#8c745a'], [1, 3]);
      break;
    default:
      fillNoise(img, seed, [120, 120, 120], [180, 180, 180]);
      ctx.putImageData(img, 0, 0);
  }
}

function paintSide(ctx: CanvasRenderingContext2D, kind: SideKind): void {
  const img = ctx.createImageData(CELL, CELL);
  const seed = kind.length * 977;
  const strata = (light: RGB, dark: RGB) => {
    const n = fbm(seed);
    for (let y = 0; y < CELL; y++) {
      const band = 0.5 + 0.5 * Math.sin(y * 0.35 + n(0, y) * 6);
      for (let x = 0; x < CELL; x++) {
        const c = mix(dark, light, Math.min(1, band * 0.6 + n(x, y) * 0.6));
        const i = (y * CELL + x) * 4;
        img.data.set([c[0], c[1], c[2], 255], i);
      }
    }
    ctx.putImageData(img, 0, 0);
  };
  switch (kind) {
    case 'side-rock':
      strata([206, 180, 132], [150, 124, 86]);
      break;
    case 'side-wall':
      fillNoise(img, seed, [170, 140, 92], [210, 184, 132], 1.2);
      ctx.putImageData(img, 0, 0);
      blocks(ctx, seed, 4, 2, 'rgba(110,86,52,0.7)');
      break;
    case 'side-soil':
      strata([196, 170, 124], [140, 116, 80]);
      // A band of Maltese red soil (terra rossa) over the limestone.
      fillNoise(img, seed + 5, [120, 58, 36], [160, 86, 52], 1.4);
      ctx.putImageData(img, 0, 0, 0, 0, CELL, CELL * 0.22);
      break;
    case 'side-sand':
      fillNoise(img, seed, [176, 154, 110], [214, 196, 152], 1.2);
      ctx.putImageData(img, 0, 0);
      break;
    case 'side-water':
      fillNoise(img, seed, [14, 44, 74], [30, 80, 120], 1.2);
      ctx.putImageData(img, 0, 0);
      break;
    case 'side-wood':
      fillNoise(img, seed, [74, 50, 30], [110, 78, 48], 1.2);
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = 'rgba(40,24,12,0.7)';
      for (let y = 0; y < CELL; y += 20) ctx.strokeRect(-1, y, CELL + 2, 20);
      break;
  }
}

export interface TerrainAtlas {
  readonly texture: CanvasTexture;
  /** Atlas UV rectangle [u0, v0, u1, v1] for a terrain's top. */
  top(id: string): [number, number, number, number];
  side(id: string): [number, number, number, number];
  /** Replace a cell with a real image (e.g. from public/art/terrain/<id>.png). */
  paintImage(id: string, image: CanvasImageSource, part: 'top' | 'side'): void;
}

export function createTerrainAtlas(): TerrainAtlas {
  const cells = [...TOPS, ...SIDES];
  const rows = Math.ceil(cells.length / COLS);
  const canvas = document.createElement('canvas');
  canvas.width = COLS * CELL;
  canvas.height = rows * CELL;
  const atlasCtx = canvas.getContext('2d')!;
  const cell = document.createElement('canvas');
  cell.width = CELL;
  cell.height = CELL;
  const ctx = cell.getContext('2d')!;
  const index = new Map<string, number>();
  cells.forEach((id, i) => {
    index.set(id, i);
    ctx.clearRect(0, 0, CELL, CELL);
    if ((SIDES as readonly string[]).includes(id)) paintSide(ctx, id as SideKind);
    else paintTop(ctx, id);
    atlasCtx.drawImage(cell, (i % COLS) * CELL, Math.floor(i / COLS) * CELL);
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;

  // Inset UVs by a pixel so neighbouring cells never bleed in at mip levels.
  const rect = (i: number): [number, number, number, number] => {
    const pad = 2 / canvas.width;
    const u0 = (i % COLS) / COLS + pad;
    const u1 = ((i % COLS) + 1) / COLS - pad;
    const r = Math.floor(i / COLS);
    const v1 = 1 - r / rows - pad * (canvas.width / canvas.height);
    const v0 = 1 - (r + 1) / rows + pad * (canvas.width / canvas.height);
    return [u0, v0, u1, v1];
  };
  return {
    texture,
    top: (id) => rect(index.get(id) ?? 0),
    side: (id) => rect(index.get(SIDE_OF[id] ?? 'side-rock')!),
    paintImage: (id, image, part) => {
      const key = part === 'top' ? id : (SIDE_OF[id] ?? 'side-rock');
      const i = index.get(key);
      if (i === undefined) return;
      atlasCtx.drawImage(image, (i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL);
      texture.needsUpdate = true;
    },
  };
}
