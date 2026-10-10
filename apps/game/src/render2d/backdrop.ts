/**
 * The 2D duel backdrop: a painted Maltese siege vista in parallax layers. Sky and sun, sea with
 * glitter, a hazy limestone fortress on a headland (bastions, merlons, a dome and bell tower),
 * terraced fields with cypress and olive, then the dusty ground the fighters stand on, tinted by
 * the battle's ground colour. Static layers are baked into offscreen canvases once per size;
 * only clouds, glitter, motes and embers animate. Presentation only.
 */
import { mix, parseColor, rgba } from './fx';

export interface BackdropView {
  /** Canvas size in CSS pixels. */
  readonly w: number;
  readonly h: number;
  /** Screen y of the fighters' feet, and pixels per world unit. */
  readonly groundY: number;
  readonly scale: number;
  /** Camera pan in world units and the zoom factor with its pivot in screen pixels. */
  readonly camX: number;
  readonly zoom: number;
  readonly pivotX: number;
  readonly pivotY: number;
  /** Seconds, for drifting clouds, glitter and embers. */
  readonly time: number;
}

export interface Backdrop {
  /** Sky, sea, fortress, fields and ground (behind the fighters). */
  draw(ctx: CanvasRenderingContext2D, v: BackdropView): void;
  /** Foreground grass and stones (in front of the fighters, at the bottom corners). */
  drawFore(ctx: CanvasRenderingContext2D, v: BackdropView): void;
  dispose(): void;
}

const TAU = Math.PI * 2;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;
type Painter = (g: Ctx, W: number, H: number) => void;

function canvasOf(w: number, h: number): HTMLCanvasElement | null {
  try {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  } catch {
    return null;
  }
}

/** A row of merlons (battlement teeth) along the top edge of a wall. */
function merlons(g: Ctx, x: number, y: number, w: number, tooth: number, color: string): void {
  g.fillStyle = color;
  const n = Math.max(1, Math.floor(w / (tooth * 2)));
  const step = w / n;
  for (let i = 0; i < n; i++) g.fillRect(x + i * step + step * 0.12, y - tooth, step * 0.56, tooth + 1);
}

interface Palette {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  stoneLit: string;
  stoneShade: string;
  haze: string;
  field1: string;
  field2: string;
  groundTop: string;
  groundBot: string;
  path: string;
  grass: string;
  stoneDark: string;
}

function paletteFor(ground: string): Palette {
  const sand = '#d6c18d';
  return {
    skyTop: '#2c68ad',
    skyMid: '#86bde0',
    skyLow: '#fbe3b6',
    stoneLit: '#ecd7a6',
    stoneShade: '#c8aa78',
    haze: '#bdd3df',
    field1: mix(ground, sand, 0.55),
    field2: mix(ground, sand, 0.3),
    groundTop: mix(ground, '#e8d6a2', 0.18),
    groundBot: mix(ground, '#1b1410', 0.5),
    path: mix(ground, sand, 0.62),
    grass: mix(ground, '#1f3a14', 0.45),
    stoneDark: mix(ground, '#3a3128', 0.6),
  };
}

// ───────────────────────────── painters ─────────────────────────────

function paintSky(g: Ctx, W: number, H: number, p: Palette): void {
  const hy = H * 0.47;
  const sky = g.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(0.55, p.skyMid);
  sky.addColorStop(1, p.skyLow);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, hy + 2);
  // Sun with a wide warm halo.
  const sx = W * 0.64;
  const sy = hy * 0.7;
  const halo = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.55);
  halo.addColorStop(0, 'rgba(255,240,200,0.95)');
  halo.addColorStop(0.12, 'rgba(255,226,160,0.55)');
  halo.addColorStop(0.45, 'rgba(255,200,130,0.16)');
  halo.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = halo;
  g.fillRect(0, 0, W, hy + 2);
  g.fillStyle = '#fff8e2';
  g.beginPath();
  g.arc(sx, sy, H * 0.045, 0, TAU);
  g.fill();
}

function paintSea(g: Ctx, W: number, H: number): void {
  const hy = H * 0.47;
  const b = H * 0.56;
  const sea = g.createLinearGradient(0, hy, 0, b);
  sea.addColorStop(0, '#9fd6e2');
  sea.addColorStop(0.25, '#3f9bbb');
  sea.addColorStop(1, '#1b6a93');
  g.fillStyle = sea;
  g.fillRect(0, hy, W, b - hy);
  // Sun glitter column and faint wave lines.
  const r = rng(11);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const y = hy + 2 + r() * (b - hy - 4);
    const spread = 0.04 + ((y - hy) / (b - hy)) * 0.12;
    const x = W * 0.64 + (r() - 0.5) * W * spread * 2;
    g.strokeStyle = `rgba(255,250,220,${0.25 + r() * 0.5})`;
    g.lineWidth = 1 + r() * 1.6;
    g.beginPath();
    g.moveTo(x - 4 - r() * 8, y);
    g.lineTo(x + 4 + r() * 8, y);
    g.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const y = hy + 4 + r() * (b - hy);
    const x = r() * W;
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 8 + r() * 16, y);
    g.stroke();
  }
}

function paintFortress(g: Ctx, W: number, H: number, p: Palette): void {
  const r = rng(77);
  const hy = H * 0.47;
  const seaB = H * 0.56;
  const base = hy + H * 0.045; // waterline of the headland
  const lit = mix(p.stoneLit, p.haze, 0.3);
  const shade = mix(p.stoneShade, p.haze, 0.42);
  const dark = mix('#5b4a38', p.haze, 0.45);

  // Rocky headland.
  const rock = g.createLinearGradient(0, base - H * 0.03, 0, seaB + H * 0.02);
  rock.addColorStop(0, mix('#b99a6c', p.haze, 0.35));
  rock.addColorStop(1, mix('#6a5640', p.haze, 0.3));
  g.fillStyle = rock;
  g.beginPath();
  g.moveTo(W * 0.2, seaB + H * 0.03);
  g.lineTo(W * 0.27, base + H * 0.012);
  for (let x = W * 0.3; x < W; x += W * 0.035) g.lineTo(x, base - H * 0.012 + (r() - 0.5) * H * 0.016);
  g.lineTo(W, seaB + H * 0.03);
  g.closePath();
  g.fill();

  const wallTop = base - H * 0.085;
  // Long curtain wall with a slanted glacis.
  const x0 = W * 0.34;
  const x1 = W * 0.98;
  g.fillStyle = lit;
  g.fillRect(x0, wallTop, x1 - x0, base - wallTop);
  g.fillStyle = shade;
  g.beginPath();
  g.moveTo(x0, base);
  g.lineTo(x0, wallTop);
  g.lineTo(x0 + (x1 - x0) * 0.5, wallTop);
  g.lineTo(x0 + (x1 - x0) * 0.46, base);
  g.closePath();
  g.fill();
  merlons(g, x0, wallTop, x1 - x0, H * 0.009, lit);
  // Stone courses.
  g.strokeStyle = rgba(shade, 0.55);
  g.lineWidth = 1;
  for (let y = wallTop + H * 0.016; y < base; y += H * 0.016) {
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x1, y);
    g.stroke();
  }

  // Bastions and towers.
  const towers: [number, number, number][] = [
    [0.36, 0.05, 0.14],
    [0.5, 0.045, 0.1],
    [0.66, 0.055, 0.17],
    [0.83, 0.048, 0.12],
    [0.95, 0.05, 0.1],
  ];
  for (const [fx, fw, fh] of towers) {
    const w = W * fw;
    const x = W * fx - w / 2;
    const top = base - H * fh;
    g.fillStyle = lit;
    g.fillRect(x, top, w, base - top);
    g.fillStyle = shade;
    g.fillRect(x + w * 0.55, top, w * 0.45, base - top);
    g.fillStyle = lit;
    g.fillRect(x - w * 0.08, top - H * 0.012, w * 1.16, H * 0.014);
    merlons(g, x - w * 0.08, top - H * 0.012, w * 1.16, H * 0.011, lit);
    // Arrow slits.
    g.fillStyle = dark;
    for (let y = top + H * 0.025; y < base - H * 0.02; y += H * 0.035) g.fillRect(x + w * 0.4, y, w * 0.08, H * 0.016);
  }

  // The town behind the wall: flat roofs, a dome and a bell tower (Mdina-ish).
  const tx = W * 0.58;
  g.fillStyle = mix(p.stoneLit, p.haze, 0.38);
  g.fillRect(tx - W * 0.08, wallTop - H * 0.055, W * 0.17, H * 0.056);
  g.fillRect(tx - W * 0.03, wallTop - H * 0.1, W * 0.07, H * 0.05);
  // Bell tower.
  const bx = tx + W * 0.065;
  g.fillStyle = lit;
  g.fillRect(bx, wallTop - H * 0.16, W * 0.026, H * 0.12);
  g.fillStyle = shade;
  g.fillRect(bx + W * 0.015, wallTop - H * 0.16, W * 0.011, H * 0.12);
  g.fillStyle = dark;
  g.beginPath();
  g.arc(bx + W * 0.013, wallTop - H * 0.13, W * 0.006, Math.PI, 0);
  g.fill();
  g.fillStyle = mix('#9a6a4a', p.haze, 0.35);
  g.beginPath();
  g.moveTo(bx - W * 0.002, wallTop - H * 0.16);
  g.lineTo(bx + W * 0.013, wallTop - H * 0.2);
  g.lineTo(bx + W * 0.028, wallTop - H * 0.16);
  g.closePath();
  g.fill();
  // Dome.
  const dx = tx - W * 0.02;
  g.fillStyle = mix('#8f9aa0', p.haze, 0.35);
  g.beginPath();
  g.arc(dx, wallTop - H * 0.1, W * 0.032, Math.PI, 0);
  g.fill();
  g.fillStyle = mix(p.stoneShade, p.haze, 0.3);
  g.beginPath();
  g.arc(dx + W * 0.012, wallTop - H * 0.1, W * 0.02, -Math.PI * 0.5, 0);
  g.lineTo(dx + W * 0.012, wallTop - H * 0.1);
  g.fill();
  g.fillStyle = lit;
  g.fillRect(dx - W * 0.002, wallTop - H * 0.138, W * 0.004, H * 0.016);
  // Windows and a gate arch.
  g.fillStyle = dark;
  for (let i = 0; i < 9; i++) {
    const wx = tx - W * 0.075 + r() * W * 0.15;
    g.fillRect(wx, wallTop - H * 0.04 - r() * H * 0.01, W * 0.004, H * 0.012);
  }
  g.beginPath();
  g.arc(W * 0.755, base, W * 0.012, Math.PI, 0);
  g.fill();

  // Haze at the foot so it sits far away; and a couple of distant smoke columns.
  const fog = g.createLinearGradient(0, base - H * 0.1, 0, base + H * 0.02);
  fog.addColorStop(0, rgba(p.haze, 0));
  fog.addColorStop(1, rgba(p.haze, 0.5));
  g.fillStyle = fog;
  g.fillRect(W * 0.2, base - H * 0.1, W * 0.8, H * 0.12);
  for (const [sx, h] of [
    [W * 0.7, H * 0.34],
    [W * 0.42, H * 0.22],
  ] as const) {
    for (let i = 0; i < 16; i++) {
      const u = i / 15;
      const y = wallTop - u * h;
      const x = sx + Math.sin(u * 3 + sx) * H * 0.02 + u * W * 0.03;
      const rr = H * (0.012 + u * 0.03);
      const grd = g.createRadialGradient(x, y, 0, x, y, rr);
      grd.addColorStop(0, `rgba(70,62,58,${0.32 * (1 - u * 0.7)})`);
      grd.addColorStop(1, 'rgba(70,62,58,0)');
      g.fillStyle = grd;
      g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
  }
}

function paintClouds(g: Ctx, W: number, H: number): void {
  const r = rng(5);
  const hy = H * 0.47;
  for (let i = 0; i < 6; i++) {
    const cx = (i / 6) * W + r() * W * 0.1;
    const cy = hy * (0.18 + r() * 0.45);
    const s = H * (0.05 + r() * 0.05);
    for (let k = 0; k < 6; k++) {
      const ox = (k - 2.5) * s * 0.55;
      const oy = -Math.sin((k / 5) * Math.PI) * s * 0.35;
      const rr = s * (0.55 + Math.sin((k / 5) * Math.PI) * 0.35);
      const grd = g.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rr);
      grd.addColorStop(0, 'rgba(255,252,240,0.95)');
      grd.addColorStop(0.7, 'rgba(255,244,222,0.7)');
      grd.addColorStop(1, 'rgba(255,240,215,0)');
      g.fillStyle = grd;
      g.fillRect(cx + ox - rr, cy + oy - rr, rr * 2, rr * 2);
    }
    // Flat shaded base.
    g.fillStyle = 'rgba(214,190,170,0.35)';
    g.fillRect(cx - s * 1.5, cy + s * 0.1, s * 3, s * 0.12);
  }
}

function paintFields(g: Ctx, W: number, H: number, p: Palette): void {
  const r = rng(303);
  const top = H * 0.53;
  const bot = H * 0.7;
  // Three receding terraces, each lighter and hazier further away.
  for (let band = 0; band < 3; band++) {
    const y0 = top + (band / 3) * (bot - top);
    const y1 = top + ((band + 1) / 3) * (bot - top) + H * 0.02;
    const col = mix(band === 0 ? p.field1 : p.field2, p.groundTop, band / 2.4);
    const grd = g.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, mix(col, p.haze, 0.25 - band * 0.07));
    grd.addColorStop(1, col);
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, y1);
    const amp = H * (0.018 - band * 0.003);
    const ph = r() * 6;
    for (let x = 0; x <= W; x += 24) g.lineTo(x, y0 + Math.sin(x / (W * 0.11) + ph) * amp + Math.sin(x / (W * 0.037) + ph * 2) * amp * 0.4);
    g.lineTo(W, y1);
    g.closePath();
    g.fill();
    // Dry-stone wall along the terrace edge.
    g.strokeStyle = mix(p.stoneShade, p.groundBot, 0.2 + band * 0.1);
    g.lineWidth = 2 + band;
    g.beginPath();
    for (let x = 0; x <= W; x += 24) {
      const y = y0 + Math.sin(x / (W * 0.11) + ph) * amp + Math.sin(x / (W * 0.037) + ph * 2) * amp * 0.4 + 1;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    // Trees on the terrace: cypress spires and round olives.
    const trees = 6 + band * 2;
    for (let i = 0; i < trees; i++) {
      const x = r() * W;
      const y = y0 + 4 + band * 3 + r() * (y1 - y0) * 0.5;
      const s = H * (0.02 + band * 0.012) * (0.7 + r() * 0.6);
      if (r() < 0.45) {
        g.fillStyle = mix('#23401f', p.haze, 0.3 - band * 0.08);
        g.beginPath();
        g.moveTo(x, y - s * 2.6);
        g.quadraticCurveTo(x + s * 0.7, y - s, x + s * 0.5, y);
        g.lineTo(x - s * 0.5, y);
        g.quadraticCurveTo(x - s * 0.7, y - s, x, y - s * 2.6);
        g.fill();
      } else {
        g.fillStyle = mix('#5a2f20', '#2b2018', 0.5);
        g.fillRect(x - s * 0.1, y - s * 0.7, s * 0.2, s * 0.7);
        g.fillStyle = mix('#6f8a55', p.haze, 0.25 - band * 0.06);
        g.beginPath();
        g.ellipse(x, y - s * 1.1, s * 0.95, s * 0.7, 0, 0, TAU);
        g.fill();
        g.fillStyle = 'rgba(255,255,230,0.14)';
        g.beginPath();
        g.ellipse(x - s * 0.25, y - s * 1.3, s * 0.5, s * 0.3, 0, 0, TAU);
        g.fill();
      }
    }
  }
  // A little farmhouse (flat roof, door) to give scale.
  const hx = W * 0.27;
  const hyy = H * 0.62;
  g.fillStyle = mix(p.stoneLit, p.haze, 0.15);
  g.fillRect(hx, hyy - H * 0.04, H * 0.07, H * 0.04);
  g.fillStyle = mix(p.stoneShade, p.haze, 0.15);
  g.fillRect(hx + H * 0.045, hyy - H * 0.04, H * 0.025, H * 0.04);
  g.fillStyle = '#4a3a2a';
  g.fillRect(hx + H * 0.012, hyy - H * 0.022, H * 0.014, H * 0.022);
}

function paintFloor(g: Ctx, W: number, H: number, p: Palette): void {
  const r = rng(909);
  const top = H * 0.655;
  const grd = g.createLinearGradient(0, top, 0, H);
  grd.addColorStop(0, p.groundTop);
  grd.addColorStop(0.35, mix(p.groundTop, p.groundBot, 0.25));
  grd.addColorStop(1, p.groundBot);
  g.fillStyle = grd;
  g.fillRect(0, top, W, H - top);
  // Soft dusty path band where the duel happens.
  const py = H * 0.8;
  const band = g.createRadialGradient(W / 2, py, 0, W / 2, py, W * 0.5);
  band.addColorStop(0, rgba(p.path, 0.75));
  band.addColorStop(0.6, rgba(p.path, 0.3));
  band.addColorStop(1, rgba(p.path, 0));
  g.save();
  g.translate(0, py);
  g.scale(1, 0.2);
  g.translate(0, -py);
  g.fillStyle = band;
  g.fillRect(0, py - W * 0.5, W, W);
  g.restore();
  // Horizon edge shadow where the field meets the floor.
  const edge = g.createLinearGradient(0, top - 2, 0, top + H * 0.05);
  edge.addColorStop(0, 'rgba(0,0,0,0.22)');
  edge.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = edge;
  g.fillRect(0, top - 2, W, H * 0.05);
  // Pebbles and grass tufts, scaled by depth.
  for (let i = 0; i < 90; i++) {
    const y = top + H * 0.02 + Math.pow(r(), 0.8) * (H - top - H * 0.05);
    const depth = (y - top) / (H - top);
    const x = r() * W;
    const s = H * (0.006 + depth * 0.014) * (0.7 + r() * 0.7);
    if (r() < 0.55) {
      g.strokeStyle = mix(p.grass, '#9aa860', r() * 0.5);
      g.lineWidth = Math.max(1, s * 0.22);
      g.lineCap = 'round';
      for (let k = -2; k <= 2; k++) {
        g.beginPath();
        g.moveTo(x + k * s * 0.35, y);
        g.quadraticCurveTo(x + k * s * 0.5, y - s * 1.2, x + k * s * 0.9, y - s * (1.6 - Math.abs(k) * 0.3));
        g.stroke();
      }
    } else {
      g.fillStyle = mix(p.stoneDark, p.stoneLit, 0.25 + r() * 0.3);
      g.beginPath();
      g.ellipse(x, y, s * 1.2, s * 0.7, 0, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.beginPath();
      g.ellipse(x - s * 0.3, y - s * 0.25, s * 0.5, s * 0.22, 0, 0, TAU);
      g.fill();
    }
  }
}

function paintVignette(g: Ctx, W: number, H: number): void {
  const grd = g.createRadialGradient(W / 2, H * 0.52, H * 0.45, W / 2, H * 0.52, Math.hypot(W, H) * 0.56);
  grd.addColorStop(0, 'rgba(20,10,0,0)');
  grd.addColorStop(1, 'rgba(20,10,0,0.45)');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
}

function paintFore(g: Ctx, W: number, H: number, p: Palette): void {
  const r = rng(4242);
  const dark = mix(p.grass, '#0d1a08', 0.6);
  g.lineCap = 'round';
  for (const side of [0, 1]) {
    // Big grass blades in the bottom corners.
    for (let i = 0; i < 26; i++) {
      const edge = side ? W - r() * W * 0.16 : r() * W * 0.16;
      const hgt = H * (0.05 + r() * 0.1);
      const lean = (side ? -1 : 1) * (r() * 0.5 + 0.1) * hgt;
      g.strokeStyle = mix(dark, p.grass, r() * 0.5);
      g.lineWidth = 2 + r() * 3.5;
      g.beginPath();
      g.moveTo(edge, H + 2);
      g.quadraticCurveTo(edge + lean * 0.3, H - hgt * 0.6, edge + lean, H - hgt);
      g.stroke();
    }
    // A boulder.
    const bx = side ? W * 0.95 : W * 0.05;
    const bw = H * 0.11;
    g.fillStyle = mix(p.stoneDark, '#000', 0.25);
    g.beginPath();
    g.ellipse(bx, H + H * 0.01, bw, bw * 0.55, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = 'rgba(255,240,200,0.12)';
    g.beginPath();
    g.ellipse(bx - bw * 0.25, H - bw * 0.35, bw * 0.4, bw * 0.16, -0.3, 0, TAU);
    g.fill();
  }
}

// ───────────────────────────── the backdrop ─────────────────────────────

interface Layer {
  readonly factor: number;
  readonly paint: Painter;
  img: HTMLCanvasElement | null;
}

const PAD = 1.3;

export function createBackdrop(groundColor: string): Backdrop {
  const pal = paletteFor(parseColor(groundColor) ? groundColor : '#5b6b35');
  let size = '';
  const far: Layer = {
    factor: 0.08,
    paint: (g, W, H) => {
      paintSky(g, W, H, pal);
      paintSea(g, W, H);
      paintFortress(g, W, H, pal);
    },
    img: null,
  };
  const fields: Layer = { factor: 0.3, paint: (g, W, H) => paintFields(g, W, H, pal), img: null };
  const floor: Layer = {
    factor: 1,
    paint: (g, W, H) => {
      paintFloor(g, W, H, pal);
    },
    img: null,
  };
  const fore: Layer = { factor: 1.25, paint: (g, W, H) => paintFore(g, W, H, pal), img: null };
  const clouds: Layer = { factor: 0.05, paint: paintClouds, img: null };
  const vignette: Layer = { factor: 0, paint: paintVignette, img: null };
  const layers = [far, clouds, fields, floor, fore, vignette];
  let motesR = rng(31337);
  const motes = Array.from({ length: 34 }, () => ({
    x: motesR(),
    y: 0.3 + motesR() * 0.62,
    s: 0.4 + motesR() * 1.2,
    v: 0.004 + motesR() * 0.012,
    ember: motesR() < 0.28,
    ph: motesR() * TAU,
  }));
  motesR = rng(1);

  function bake(v: BackdropView): void {
    const key = `${Math.round(v.w)}x${Math.round(v.h)}`;
    if (key === size) return;
    size = key;
    for (const l of layers) {
      const isVig = l === vignette;
      const W = isVig ? v.w : v.w * PAD;
      const c = canvasOf(W, v.h);
      const g = c?.getContext('2d');
      if (c && g) {
        l.paint(g, W, v.h);
        l.img = c;
      } else l.img = null;
    }
  }

  function blit(ctx: Ctx, l: Layer, v: BackdropView, dx = 0): void {
    const W = v.w * PAD;
    const ox = -(W - v.w) / 2;
    const z = 1 + (v.zoom - 1) * Math.min(1, l.factor);
    ctx.save();
    ctx.translate(v.pivotX, v.pivotY);
    ctx.scale(z, z);
    ctx.translate(-v.pivotX + ox - v.camX * v.scale * l.factor + dx, -v.pivotY);
    if (l.img) ctx.drawImage(l.img, 0, 0);
    else l.paint(ctx, W, v.h);
    ctx.restore();
  }

  return {
    draw(ctx, v) {
      bake(v);
      blit(ctx, far, v);
      // Clouds drift slowly, wrapping around the layer.
      const W = v.w * PAD;
      const drift = (v.time * 3) % W;
      blit(ctx, clouds, v, drift);
      blit(ctx, clouds, v, drift - W);
      blit(ctx, fields, v);
      // The ground fills below the field; the floor layer's own top edge blends in.
      blit(ctx, floor, v);
      // Floating dust motes and embers drifting through the air.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        const x = (((m.x + v.time * m.v * (m.ember ? 0.5 : 1)) % 1) + 1) % 1;
        const rise = m.ember ? (v.time * 0.03 * m.s) % 0.5 : 0;
        const y = (m.y - rise + Math.sin(v.time * 0.8 + m.ph) * 0.01 + 1) % 1;
        const px = x * v.w;
        const py = y * v.h;
        const flick = 0.55 + 0.45 * Math.sin(v.time * 4 + m.ph);
        ctx.globalAlpha = m.ember ? 0.7 * flick : 0.28;
        ctx.fillStyle = m.ember ? '#ff9d3a' : '#fff0c8';
        ctx.beginPath();
        ctx.arc(px, py, m.s * (m.ember ? 1.3 : 1) * (v.h / 400), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      blit(ctx, vignette, v);
    },
    drawFore(ctx, v) {
      bake(v);
      blit(ctx, fore, v);
    },
    dispose() {
      for (const l of layers) l.img = null;
      size = '';
    },
  };
}
