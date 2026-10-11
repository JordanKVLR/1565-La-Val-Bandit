/**
 * The shared parametric face: head and jaw shapes, ears, eyes, brows, nose and mouth, all
 * driven by a FaceDef (who this is) and ExprParams (how they feel right now). Drawn in head
 * space: origin at the centre of the head, 1 unit = 1 design unit.
 */
import type { ExprParams } from './expressions';
import {
  type Ctx,
  type PathFn,
  INK,
  alpha,
  circle,
  clipped,
  ellipse,
  flat,
  lightOf,
  mix,
  paint,
  poly,
  rng,
  skinShade,
  taper,
} from './kit';

export type EyeStyle = 'round' | 'almond' | 'narrow' | 'wide';
export type NoseStyle = 'button' | 'straight' | 'hook' | 'broad' | 'long';
export type Mark = 'soot' | 'freckles' | 'scar' | 'dirt' | 'ruddy' | 'kohl' | 'bags' | 'rouge';

export interface FaceDef {
  skin: string;
  headW: number;
  headH: number;
  /** Chin half-width as a fraction of headW (0.4 pointed .. 0.8 square). */
  chin: number;
  /** Where the jaw starts to turn in, as a fraction of headH (0.15 round .. 0.55 square). */
  jaw: number;
  /** Ear size (0 hides them). */
  ear: number;
  eyes: EyeStyle;
  eyeSize: number;
  eyeSep: number;
  eyeY: number;
  iris: string;
  /** Lashes and a flick at the outer corner, 0..1. */
  lashes: number;
  hair: string;
  browThick: number;
  browLen: number;
  browGap: number;
  browArch: number;
  nose: NoseStyle;
  noseY: number;
  noseSize: number;
  mouthY: number;
  mouthW: number;
  lip: string;
  lipFull: number;
  blush: string;
  /** 0 young .. 1 old: wrinkles. */
  age: number;
  marks: readonly Mark[];
  /** Dark jaw stubble, 0..1. */
  stubble: number;
  /** Drawn between the nose and the mouth (beards). */
  beard?: (c: Ctx, f: FaceDef, e: ExprParams) => void;
  /** Drawn over the mouth (moustaches). */
  stache?: (c: Ctx, f: FaceDef, e: ExprParams) => void;
}

export const FACE_BASE: Omit<FaceDef, 'skin' | 'hair'> = {
  headW: 27,
  headH: 33,
  chin: 0.56,
  jaw: 0.3,
  ear: 1,
  eyes: 'round',
  eyeSize: 1,
  eyeSep: 12.5,
  eyeY: 2,
  iris: '#4a2e1c',
  lashes: 0,
  browThick: 3.2,
  browLen: 8.5,
  browGap: 6.5,
  browArch: 1.2,
  nose: 'straight',
  noseY: 12,
  noseSize: 1,
  mouthY: 22,
  mouthW: 7.5,
  lip: '#b8605a',
  lipFull: 0.5,
  blush: '#e8806e',
  age: 0.2,
  marks: [],
  stubble: 0,
};

export const INTERIOR = '#5a1c26';
export const TEETH = '#fbf4e6';

/** Outline of the head (face and jaw), in head space. */
export function headPath(f: FaceDef): PathFn {
  const w = f.headW;
  const h = f.headH;
  const cw = w * f.chin;
  const jy = h * f.jaw;
  return (c) => {
    c.moveTo(0, -h);
    c.bezierCurveTo(w * 0.6, -h, w, -h * 0.64, w, -h * 0.18);
    c.bezierCurveTo(w, jy, cw + (w - cw) * 0.55, h * 0.86, cw, h * 0.95);
    c.bezierCurveTo(cw * 0.55, h * 1.04, -cw * 0.55, h * 1.04, -cw, h * 0.95);
    c.bezierCurveTo(-cw - (w - cw) * 0.55, h * 0.86, -w, jy, -w, -h * 0.18);
    c.bezierCurveTo(-w, -h * 0.64, -w * 0.6, -h, 0, -h);
    c.closePath();
  };
}

/** The lower part of the face (below `y`), for stubble and beards. */
export function lowerFace(f: FaceDef, y: number): PathFn {
  return (c) => {
    c.rect(-f.headW - 4, y, f.headW * 2 + 8, f.headH * 2);
  };
}

// ── eyes ──────────────────────────────────────────────────────────────────────────────────────
interface EyeGeom {
  ew: number;
  eh: number;
  /** vertical offset of the outer corner (negative = tilted up) */
  tilt: number;
  wide: number;
}
function eyeGeom(f: FaceDef): EyeGeom {
  const s = f.eyeSize;
  switch (f.eyes) {
    case 'almond':
      return { ew: 7.4 * s, eh: 4.5 * s, tilt: -1.4 * s, wide: 0.5 };
    case 'narrow':
      return { ew: 7 * s, eh: 3.4 * s, tilt: -0.4 * s, wide: 0.55 };
    case 'wide':
      return { ew: 6.8 * s, eh: 6.4 * s, tilt: 0, wide: 0.78 };
    default:
      return { ew: 6.6 * s, eh: 5.4 * s, tilt: 0, wide: 0.7 };
  }
}

function eyePath(g: EyeGeom, o: number): PathFn {
  const { ew, eh, tilt, wide } = g;
  const top = eh * o * 1.32;
  return (c) => {
    c.moveTo(-ew, 0);
    c.bezierCurveTo(-ew * wide, -top, ew * wide, -top * 1.02, ew, tilt);
    c.bezierCurveTo(ew * wide * 0.8, eh * 1.0, -ew * wide * 0.8, eh * 1.0, -ew, 0);
    c.closePath();
  };
}

function drawEye(c: Ctx, f: FaceDef, e: ExprParams, side: -1 | 1, blink: number): void {
  const g = eyeGeom(f);
  const { ew, eh } = g;
  const o = Math.max(0.25, e.open);
  c.save();
  c.translate(side * f.eyeSep, f.eyeY);
  c.scale(side, 1);
  const shape = eyePath(g, o);
  const lidCover = Math.min(1, e.lid + blink * (1 - e.lid));
  // eye white
  paint(c, shape, '#fffaf0', { line: 0, shade: '#e3d6dc', sh: [0, 2.2] });
  clipped(c, shape, () => {
    const ir = Math.min(eh * 1.0, ew * 0.78) * (f.eyes === 'narrow' ? 1.1 : 1);
    const ix = e.gx * ew * 0.42 * side * side + (side === 1 ? 0 : 0);
    const iy = e.gy * eh * 0.45 - 0.2;
    const px = ix;
    const pr = ir * 0.52 * e.pupil;
    // iris: darker rim, mid tone, lighter lower half
    flat(c, circle(px, iy, ir), mix(f.iris, '#1a0f0c', 0.35));
    flat(c, circle(px, iy + ir * 0.06, ir * 0.84), f.iris);
    flat(c, ellipse(px, iy + ir * 0.5, ir * 0.62, ir * 0.36), lightOf(f.iris, 0.32));
    flat(c, circle(px, iy, pr), '#150c0b');
    // highlights
    flat(c, circle(px - ir * 0.34, iy - ir * 0.36, Math.max(1.5, ir * 0.3)), '#ffffff');
    flat(
      c,
      circle(px + ir * 0.36, iy + ir * 0.34, Math.max(0.8, ir * 0.14)),
      'rgba(255,255,255,0.85)',
    );
    if (e.tear > 0.2) {
      flat(c, ellipse(px, iy + ir * 0.78, ir * 0.85, ir * 0.22), alpha('#cfeaff', 0.85 * e.tear));
    }
    // upper lid shadow from the lashes
    flat(c, ellipse(0, -eh * o * 1.15, ew * 1.2, eh * 0.5), 'rgba(40,20,30,0.14)');
    // lids
    if (lidCover > 0.01) {
      const total = eh * o * 0.95 + eh * 0.75;
      const yb = -eh * o * 0.95 + lidCover * total;
      const yi = yb + e.slant * eh * 0.9;
      const yo = yb - e.slant * eh * 0.5;
      const cover: PathFn = poly([
        [-ew - 4, -eh * 4],
        [ew + 4, -eh * 4],
        [ew + 4, yo],
        [-ew - 4, yi],
      ]);
      paint(c, cover, f.skin, { line: 0, shade: skinShade(f.skin, 0.2), sh: [0, 3] });
      c.save();
      c.beginPath();
      c.moveTo(-ew - 3, yi);
      c.lineTo(ew + 3, yo);
      c.lineWidth = 3.4;
      c.strokeStyle = INK;
      c.lineCap = 'round';
      c.stroke();
      c.restore();
    }
    if (e.lower > 0.01) {
      const yl = eh * 0.8 - e.lower * eh * 1.05;
      const cover: PathFn = (cc) => {
        cc.moveTo(-ew - 4, yl + 1.2);
        cc.quadraticCurveTo(0, yl - e.lower * 2.2, ew + 4, yl + 0.6);
        cc.lineTo(ew + 4, eh * 3);
        cc.lineTo(-ew - 4, eh * 3);
        cc.closePath();
      };
      paint(c, cover, f.skin, { line: 0, shade: false });
      c.save();
      c.beginPath();
      c.moveTo(-ew - 4, yl + 1.2);
      c.quadraticCurveTo(0, yl - e.lower * 2.2, ew + 4, yl + 0.6);
      c.lineWidth = 1.8;
      c.strokeStyle = alpha(INK, 0.8);
      c.stroke();
      c.restore();
    }
  });
  // outline: thin lower lid, heavy upper lash line
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.beginPath();
  c.moveTo(-ew, 0);
  c.bezierCurveTo(ew * g.wide * 0.8 * -1, eh * 1.0, ew * g.wide * 0.8, eh * 1.0, ew, g.tilt);
  c.lineWidth = 1.5;
  c.globalAlpha = 0.75;
  c.stroke();
  c.globalAlpha = 1;
  const top = eh * o * 1.32;
  const lidTop = (1 - lidCover) * 1;
  c.beginPath();
  c.moveTo(-ew - 0.6, 0.2);
  c.bezierCurveTo(
    -ew * g.wide,
    -top * (0.6 + 0.4 * lidTop),
    ew * g.wide,
    -top * (0.6 + 0.4 * lidTop),
    ew,
    g.tilt,
  );
  if (f.lashes > 0) {
    c.lineTo(ew + 3.4 * f.lashes, g.tilt - 2.6 * f.lashes);
  }
  c.lineWidth = 3.2 + f.lashes * 1.2;
  c.stroke();
  // brow-bone crease
  if (f.lashes > 0 || f.age > 0.5) {
    c.beginPath();
    c.moveTo(-ew * 0.8, -eh * o * 1.5 - 1);
    c.quadraticCurveTo(0, -eh * o * 2.2 - 1.5, ew * 0.9, -eh * o * 1.4 - 0.5 + g.tilt);
    c.lineWidth = 1.2;
    c.strokeStyle = alpha(skinShade(f.skin, 0.55), 0.8);
    c.stroke();
  }
  c.restore();
  c.restore();
}

// ── brows ─────────────────────────────────────────────────────────────────────────────────────
function drawBrow(c: Ctx, f: FaceDef, e: ExprParams, side: -1 | 1): void {
  const g = eyeGeom(f);
  const lift = e.brow + (side === 1 ? e.browR : 0);
  const cx = side * (f.eyeSep + 0.8);
  const by = f.eyeY - g.eh * 1.4 - f.browGap + 3 + lift;
  const L = f.browLen;
  const inner = [cx - side * L, by + e.tilt * 5.2];
  const outer = [cx + side * L * 0.95, by - e.tilt * 2.6 + 1.2];
  const ctrl = [
    cx - side * L * 0.1,
    by - f.browArch * 2 - Math.abs(e.tilt) * 0.5 + (e.tilt < 0 ? -1.2 : 0),
  ];
  const col = f.hair;
  const thick = f.browThick;
  taper(
    c,
    [inner[0]!, inner[1]!],
    [ctrl[0]!, ctrl[1]!],
    [outer[0]!, outer[1]!],
    thick * 1.05,
    thick * 0.55,
    col,
    1.5,
  );
}

// ── nose ──────────────────────────────────────────────────────────────────────────────────────
function drawNose(c: Ctx, f: FaceDef): void {
  const s = f.noseSize;
  const L = { button: 7, straight: 10, hook: 11, broad: 8.5, long: 13 }[f.nose] * s;
  const W = { button: 3.6, straight: 4.2, hook: 4.3, broad: 6.4, long: 4.4 }[f.nose] * s;
  c.save();
  c.translate(0, f.noseY);
  const sh = alpha(skinShade(f.skin, 0.5), 0.55);
  // flat shadow along the right side of the bridge and under the tip
  flat(
    c,
    (cc) => {
      cc.moveTo(1.2, -L * 0.95);
      cc.quadraticCurveTo(W * 0.5 + 1.2, -L * 0.4, W * 0.9, L * 0.1);
      cc.quadraticCurveTo(W * 0.8, L * 0.35, 0.2, L * 0.34);
      cc.quadraticCurveTo(1.4, L * 0.1, 0.9, -L * 0.3);
      cc.closePath();
    },
    sh,
  );
  flat(c, ellipse(1.2, L * 0.62, W * 0.8, 1.7), alpha(skinShade(f.skin, 0.5), 0.35));
  c.strokeStyle = alpha(INK, 0.95);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = 2;
  // bridge, light stroke on the left
  c.beginPath();
  c.moveTo(-1.4, -L * 0.8);
  if (f.nose === 'hook') {
    c.quadraticCurveTo(-3.1, -L * 0.1, -W * 0.52, L * 0.16);
  } else if (f.nose === 'broad') {
    c.quadraticCurveTo(-2.2, -L * 0.2, -W * 0.52, L * 0.14);
  } else {
    c.quadraticCurveTo(-1.9, -L * 0.2, -W * 0.5, L * 0.18);
  }
  c.lineWidth = 1.4;
  c.globalAlpha = 0.5;
  c.stroke();
  c.globalAlpha = 1;
  // tip and wings
  c.beginPath();
  c.moveTo(-W * 0.62, L * 0.14);
  c.quadraticCurveTo(-W * 0.52, L * 0.42, -W * 0.05, L * 0.38);
  c.quadraticCurveTo(W * 0.52, L * 0.42, W * 0.62, L * 0.12);
  c.lineWidth = 2.1;
  c.stroke();
  // nostrils
  flat(c, ellipse(-W * 0.3, L * 0.34, 0.9, 0.55, 0.4), INK);
  flat(c, ellipse(W * 0.34, L * 0.34, 0.9, 0.55, -0.4), INK);
  c.restore();
}

// ── mouth ─────────────────────────────────────────────────────────────────────────────────────
export function mouthGeom(f: FaceDef, e: ExprParams) {
  return { mw: f.mouthW * e.mw, cl: e.cl, cr: e.cr, y: f.mouthY };
}

function drawMouth(c: Ctx, f: FaceDef, e: ExprParams): void {
  const { mw, cl, cr, y } = mouthGeom(f, e);
  c.save();
  c.translate(0, y);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const mid = (cl + cr) / 2;
  const sag = e.curve;
  if (e.mopen < 0.8) {
    // closed: a lower lip below, a firm line on top
    const ctrlY = mid + sag * 2;
    const lipDepth = 2.2 + f.lipFull * 2.6;
    const lowerLip: PathFn = (cc) => {
      cc.moveTo(-mw * 0.78, cl + (ctrlY - cl) * 0.34);
      cc.quadraticCurveTo(0, ctrlY + lipDepth * 2.1, mw * 0.78, cr + (ctrlY - cr) * 0.34);
      cc.quadraticCurveTo(0, ctrlY - 0.6, -mw * 0.78, cl + (ctrlY - cl) * 0.34);
      cc.closePath();
    };
    flat(c, lowerLip, f.lip);
    flat(
      c,
      (cc) => {
        cc.moveTo(-mw * 0.5, ctrlY + lipDepth * 0.95);
        cc.quadraticCurveTo(0, ctrlY + lipDepth * 1.45, mw * 0.5, ctrlY + lipDepth * 0.95);
        cc.quadraticCurveTo(0, ctrlY + lipDepth * 1.9, -mw * 0.5, ctrlY + lipDepth * 0.95);
      },
      alpha('#ffffff', 0.18),
    );
    c.beginPath();
    c.moveTo(-mw, cl);
    c.quadraticCurveTo(0, ctrlY, mw, cr);
    c.lineWidth = 2.6;
    c.strokeStyle = INK;
    c.stroke();
    // little corner ticks
    c.lineWidth = 1.6;
    for (const [sx, cy] of [
      [-1, cl],
      [1, cr],
    ] as const) {
      c.beginPath();
      c.moveTo(sx * mw, cy);
      c.lineTo(sx * (mw + 1.2), cy + (sag > 0 ? -1.2 : 1.2));
      c.stroke();
    }
  } else {
    const open = e.mopen;
    const upMid = mid + sag - open * 0.12;
    const lowMid = mid + sag + open;
    const k = e.k;
    const Mu = (upMid - 0.125 * (cl + cr)) / 0.75;
    const Ml = (lowMid - 0.125 * (cl + cr)) / 0.75;
    const shape: PathFn = (cc) => {
      cc.moveTo(-mw, cl);
      cc.bezierCurveTo(-mw * k, Mu, mw * k, Mu, mw, cr);
      cc.bezierCurveTo(mw * k, Ml, -mw * k, Ml, -mw, cl);
      cc.closePath();
    };
    flat(c, shape, INTERIOR);
    clipped(c, shape, () => {
      if (e.tongue > 0.05) {
        flat(c, ellipse(0, lowMid + 0.5, mw * 0.65, open * 0.42 + 0.6, 0), '#d8627a');
        flat(c, ellipse(0, lowMid - open * 0.1, mw * 0.4, open * 0.16, 0), alpha('#ff9aa8', 0.7));
      }
      if (e.teeth > 0.05) {
        const th = Math.min(open * 0.5, 3.8) * e.teeth + 0.6;
        flat(
          c,
          poly([
            [-mw - 1, upMid - 6],
            [mw + 1, upMid - 6],
            [mw + 1, upMid - 6 + th + 6.4],
            [-mw - 1, upMid - 6 + th + 6.4],
          ]),
          TEETH,
        );
        c.save();
        c.strokeStyle = alpha('#8a6a60', 0.5);
        c.lineWidth = 0.9;
        for (let i = -2; i <= 2; i++) {
          c.beginPath();
          c.moveTo(i * mw * 0.3, upMid);
          c.lineTo(i * mw * 0.3, upMid + th + 0.4);
          c.stroke();
        }
        c.restore();
        if (e.mopen > 6 && e.teeth > 0.5) {
          flat(
            c,
            poly([
              [-mw, lowMid - 3.6],
              [mw, lowMid - 3.6],
              [mw, lowMid + 3],
              [-mw, lowMid + 3],
            ]),
            TEETH,
          );
        }
      }
    });
    c.beginPath();
    shape(c);
    c.lineWidth = 2.8;
    c.strokeStyle = INK;
    c.stroke();
    // lower lip rim
    c.beginPath();
    c.moveTo(-mw * 0.62, lowMid * 0.86 + mid * 0.14 + 1.8);
    c.quadraticCurveTo(
      0,
      lowMid + 3.4 + f.lipFull * 2,
      mw * 0.62,
      lowMid * 0.86 + mid * 0.14 + 1.8,
    );
    c.lineWidth = 2.2;
    c.strokeStyle = alpha(mix(f.lip, INK, 0.35), 0.8);
    c.stroke();
  }
  c.restore();
}

// ── details ───────────────────────────────────────────────────────────────────────────────────
function drawAge(c: Ctx, f: FaceDef): void {
  const a = f.age;
  if (a < 0.3) return;
  const col = alpha(skinShade(f.skin, 0.62), 0.75);
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = col;
  c.lineWidth = 1.5;
  const n = a > 0.7 ? 3 : a > 0.5 ? 2 : 1;
  // forehead lines
  for (let i = 0; i < n; i++) {
    const y = -f.headH * 0.62 + i * 3.4;
    c.beginPath();
    c.moveTo(-9 + i, y);
    c.quadraticCurveTo(0, y - 1.4, 9 - i, y);
    c.stroke();
  }
  // crow's feet and nasolabial folds
  for (const s of [-1, 1] as const) {
    const ex = s * (f.eyeSep + 8);
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(ex, f.eyeY + i * 3);
      c.lineTo(ex + s * 3.8, f.eyeY + i * 3.8 + 0.5);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(s * 7, f.noseY + 4);
    c.quadraticCurveTo(s * 11.5, f.mouthY - 5, s * (f.mouthW + 5), f.mouthY + 1);
    c.stroke();
    if (a > 0.55) {
      c.beginPath();
      c.moveTo(s * (f.eyeSep - 5), f.eyeY + 8);
      c.quadraticCurveTo(s * f.eyeSep, f.eyeY + 10.2, s * (f.eyeSep + 5), f.eyeY + 8.4);
      c.stroke();
    }
  }
  c.restore();
}

function drawMarks(c: Ctx, f: FaceDef): void {
  for (const m of f.marks) {
    switch (m) {
      case 'soot':
        flat(c, ellipse(-17, 11, 5.5, 3, -0.5), 'rgba(40,24,18,0.38)');
        flat(c, ellipse(9, -17, 5, 2.2, 0.2), 'rgba(40,24,18,0.28)');
        break;
      case 'dirt':
        flat(c, ellipse(15, 15, 5, 2.6, 0.5), 'rgba(60,40,24,0.25)');
        break;
      case 'freckles': {
        const r = rng(7);
        c.save();
        c.fillStyle = alpha(skinShade(f.skin, 0.7), 0.7);
        for (const s of [-1, 1]) {
          for (let i = 0; i < 6; i++) {
            c.beginPath();
            c.arc(s * (f.eyeSep + (r() - 0.5) * 12), f.eyeY + 9 + r() * 6, 0.7, 0, 6.3);
            c.fill();
          }
        }
        c.restore();
        break;
      }
      case 'ruddy':
        flat(c, circle(-17, 12, 6.5), alpha('#e0584a', 0.45));
        flat(c, circle(17, 12, 6.5), alpha('#e0584a', 0.45));
        break;
      case 'rouge':
        flat(c, ellipse(-15, 12, 5.5, 3.5), alpha('#e07a7a', 0.3));
        flat(c, ellipse(15, 12, 5.5, 3.5), alpha('#e07a7a', 0.3));
        break;
      case 'kohl':
        for (const s of [-1, 1] as const) {
          c.save();
          c.strokeStyle = alpha('#1c1015', 0.55);
          c.lineWidth = 2.2;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(s * (f.eyeSep - 6.5), f.eyeY + 4);
          c.quadraticCurveTo(s * f.eyeSep, f.eyeY + 7.2, s * (f.eyeSep + 7.8), f.eyeY + 1.2);
          c.stroke();
          c.restore();
        }
        break;
      case 'bags':
        for (const s of [-1, 1] as const) {
          c.save();
          c.strokeStyle = alpha(skinShade(f.skin, 0.6), 0.55);
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(s * (f.eyeSep - 6), f.eyeY + 8.4);
          c.quadraticCurveTo(s * f.eyeSep, f.eyeY + 10.6, s * (f.eyeSep + 6), f.eyeY + 8.2);
          c.stroke();
          c.restore();
        }
        break;
      case 'scar': {
        c.save();
        c.lineCap = 'round';
        c.strokeStyle = alpha('#b4524e', 0.7);
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(12, f.eyeY - 13);
        c.lineTo(20, f.eyeY + 10);
        c.stroke();
        c.strokeStyle = alpha('#f0c9bd', 0.8);
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(12.5, f.eyeY - 12);
        c.lineTo(20.4, f.eyeY + 10);
        c.stroke();
        c.strokeStyle = alpha('#7a2f2f', 0.8);
        c.lineWidth = 1;
        for (const t of [0.25, 0.5, 0.75]) {
          const x = 12 + 8 * t;
          const y = f.eyeY - 13 + 23 * t;
          c.beginPath();
          c.moveTo(x - 2, y);
          c.lineTo(x + 2, y + 0.4);
          c.stroke();
        }
        c.restore();
        break;
      }
    }
  }
}

function drawExtras(c: Ctx, f: FaceDef, e: ExprParams): void {
  if (e.blush > 0.02) {
    flat(
      c,
      ellipse(-f.headW * 0.58, f.eyeY + 11, 6.2, 3.6),
      alpha(f.blush, 0.5 * Math.min(1, e.blush)),
    );
    flat(
      c,
      ellipse(f.headW * 0.58, f.eyeY + 11, 6.2, 3.6),
      alpha(f.blush, 0.5 * Math.min(1, e.blush)),
    );
  }
  if (e.tear > 0.3) {
    for (const s of [-1, 1] as const) {
      const x = s * (f.eyeSep + 3.4);
      const y = f.eyeY + 7.6;
      const drop: PathFn = (cc) => {
        cc.moveTo(x, y);
        cc.bezierCurveTo(x + 3.1, y + 5, x + 2.8, y + 8.8, x, y + 8.8);
        cc.bezierCurveTo(x - 2.8, y + 8.8, x - 3.1, y + 5, x, y);
      };
      paint(c, drop, '#cfeaff', { line: 1.6, shade: '#8fc2ea', sh: [-1.5, -1.5] });
    }
  }
}

function drawOutside(c: Ctx, f: FaceDef, e: ExprParams): void {
  if (e.sweat > 0.3) {
    const x = f.headW + 9;
    const y = -f.headH * 0.3;
    const s = 0.7 + 0.3 * e.sweat;
    const drop: PathFn = (cc) => {
      cc.moveTo(x, y - 6 * s);
      cc.bezierCurveTo(x + 5 * s, y + 1 * s, x + 4.6 * s, y + 6.2 * s, x, y + 6.2 * s);
      cc.bezierCurveTo(x - 4.6 * s, y + 6.2 * s, x - 5 * s, y + 1 * s, x, y - 6 * s);
    };
    paint(c, drop, '#d6f0ff', { line: 2, shade: '#8cc6ee', sh: [-2, -2] });
    flat(c, ellipse(x - 1.6 * s, y + 1.4 * s, 0.9, 1.6, 0.3), '#ffffff');
  }
  if (e.vein > 0.3) {
    const x = f.headW + 9;
    const y = -f.headH * 0.7;
    c.save();
    c.lineCap = 'round';
    for (const col of [INK, '#e0412f']) {
      c.strokeStyle = col;
      c.lineWidth = col === INK ? 4.6 : 2.4;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(x + s * 2.4 - 4.5, y - 4.2);
        c.quadraticCurveTo(x + s * 2.4, y - 1.4 * s, x + s * 2.4 + 4.5, y + 4.2 - 0.2);
        c.stroke();
      }
    }
    // second pair crossing the first, forming the classic mark
    for (const col of [INK, '#e0412f']) {
      c.strokeStyle = col;
      c.lineWidth = col === INK ? 4.6 : 2.4;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(x - 4.5, y + s * 2.4 + 4.2);
        c.quadraticCurveTo(x - 1.4 * s, y + s * 2.4, x + 4.5, y + s * 2.4 - 4.2);
        c.stroke();
      }
    }
    c.restore();
  }
}

/** Draws the bare face: ears, head, expression and features (hair and headgear come later). */
export function drawFace(c: Ctx, f: FaceDef, e: ExprParams, blink = 0): void {
  const hp = headPath(f);
  const skin = f.skin;
  if (f.ear > 0) {
    for (const s of [-1, 1] as const) {
      const ear: PathFn = ellipse(s * (f.headW - 0.5), f.eyeY + 3.5, 4.4 * f.ear, 7 * f.ear, 0);
      paint(c, ear, skin, { shade: skinShade(skin, 0.3), sh: [0, -4], line: 2.6 });
      flat(
        c,
        ellipse(s * (f.headW + 0.2), f.eyeY + 4, 1.6 * f.ear, 3.6 * f.ear),
        alpha(skinShade(skin, 0.55), 0.8),
      );
    }
  }
  paint(c, hp, skin, {
    shade: skinShade(skin, 0.3),
    sh: [-2.6, -2],
    rim: lightOf(skin, 0.42),
    rimW: 2.6,
    line: 3.2,
  });
  clipped(c, hp, () => {
    flat(c, ellipse(-0.5, f.eyeY - 7.5, f.headW * 0.9, 3.4), alpha(skinShade(skin, 0.55), 0.16));
    drawMarks(c, f);
    drawAge(c, f);
    if (f.stubble > 0) {
      const sh = alpha('#3a2a2a', 0.06 + f.stubble * 0.2);
      clipped(c, lowerFace(f, f.noseY + 6), () => flat(c, hp, sh));
      c.save();
      c.fillStyle = alpha('#2a1d1d', 0.45 * f.stubble);
      const r = rng(11);
      for (let i = 0; i < 70; i++) {
        const x = (r() - 0.5) * f.headW * 1.9;
        const y = f.noseY + 8 + r() * (f.headH - f.noseY - 6);
        c.beginPath();
        c.arc(x, y, 0.55, 0, 6.3);
        c.fill();
      }
      c.restore();
    }
    drawExtras(c, f, e);
  });
  drawOutside(c, f, e);
  drawNose(c, f);
  f.beard?.(c, f, e);
  drawMouth(c, f, e);
  f.stache?.(c, f, e);
  for (const s of [-1, 1] as const) drawEye(c, f, e, s, blink);
  for (const s of [-1, 1] as const) drawBrow(c, f, e, s);
}
