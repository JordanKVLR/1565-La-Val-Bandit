/** Reusable pieces for building characters: torsos, hair, beards, headwear, props. */
import type { FaceDef } from './face';
import { headPath } from './face';
import {
  type Ctx,
  type PathFn,
  INK,
  alpha,
  blobs,
  circle,
  clipped,
  ellipse,
  flat,
  ink,
  lightOf,
  mix,
  paint,
  poly,
  roundRect,
  shadeOf,
  spline,
  taper,
} from './kit';

export const HEAD_X = 100;
export const HEAD_Y = 84;

// ── torso ─────────────────────────────────────────────────────────────────────────────────────
export function torsoPath(w: number, y = 132, nw = 15): PathFn {
  return (c) => {
    c.moveTo(100 - w, 214);
    c.lineTo(100 - w, y + 32);
    c.bezierCurveTo(100 - w, y + 12, 100 - w * 0.55, y + 5, 100 - nw * 1.2, y);
    c.lineTo(100 + nw * 1.2, y);
    c.bezierCurveTo(100 + w * 0.55, y + 5, 100 + w, y + 12, 100 + w, y + 32);
    c.lineTo(100 + w, 214);
    c.closePath();
  };
}

/** Neck in world space; shaded where the chin throws its shadow. */
export function neck(c: Ctx, skin: string, nw = 13, top = 100, bottom = 146): void {
  paint(c, roundRect(100 - nw, top, nw * 2, bottom - top, 4), skin, {
    shade: mix(skin, '#7a2f3d', 0.4),
    sh: [0, 11],
    line: 3,
  });
}

export function torso(
  c: Ctx,
  fill: string,
  w = 82,
  y = 132,
  nw = 15,
  o: { rim?: boolean; shade?: string } = {},
): PathFn {
  const p = torsoPath(w, y, nw);
  paint(c, p, fill, {
    rim: o.rim === false ? false : lightOf(fill, 0.35),
    rimW: 2.4,
    sh: [-6, -5],
    ...(o.shade ? { shade: o.shade } : {}),
  });
  return p;
}

/** Stitched lines, folds, seams: thin dark strokes. */
export function strokes(
  c: Ctx,
  lines: readonly (readonly [number, number][])[],
  color: string,
  w = 1.6,
  smooth = true,
): void {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const pts of lines) {
    c.beginPath();
    if (smooth) spline(pts, false)(c);
    else pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  c.restore();
}

/** The white eight-pointed Cross of the Order, centred at (x, y). */
export function maltese(c: Ctx, x: number, y: number, s: number, fill = '#f4efe3', line = 2): void {
  const path: PathFn = (cc) => {
    // each arm: two points with a notch between them, then the inner corner
    const arms: [number, number][][] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 - Math.PI / 2;
      const p = (r: number, da: number): [number, number] => [
        x + Math.cos(a + da) * r,
        y + Math.sin(a + da) * r,
      ];
      arms.push([
        p(s * 0.2, -0.78),
        p(s * 0.62, -0.3),
        p(s * 0.5, 0),
        p(s * 0.62, 0.3),
        p(s * 0.2, 0.78),
      ]);
    }
    let first = true;
    for (const arm2 of arms)
      for (const [px, py] of arm2) {
        if (first) cc.moveTo(px, py);
        else cc.lineTo(px, py);
        first = false;
      }
    cc.closePath();
  };
  paint(c, path, fill, { line, shade: '#cfc8b6', sh: [-1.2, -1.2] });
}

// ── hair ──────────────────────────────────────────────────────────────────────────────────────
export interface CapOpts {
  grow?: number;
  hairY?: number;
  sideY?: number;
  part?: number;
  bulge?: number;
}
export function capShape(f: FaceDef, o: CapOpts = {}): PathFn {
  const w = f.headW;
  const h = f.headH;
  const g = o.grow ?? 2.4;
  const hy = o.hairY ?? -h * 0.5;
  const sy = o.sideY ?? -h * 0.02;
  const part = o.part ?? -5;
  const b = o.bulge ?? 0;
  return (c) => {
    c.moveTo(-w - g, sy + 4);
    c.bezierCurveTo(-w - g - b, -h * 0.7 - g, -w * 0.62, -h - g - b, 0, -h - g - b * 0.6);
    c.bezierCurveTo(w * 0.62, -h - g - b, w + g + b, -h * 0.7 - g, w + g, sy + 4);
    c.lineTo(w - 1.5, sy);
    c.quadraticCurveTo(w * 0.78, hy + 3, part + w * 0.3, hy);
    c.quadraticCurveTo(part - w * 0.2, hy + 5, -w * 0.5, hy - 1);
    c.quadraticCurveTo(-w * 0.85, hy - 1, -w + 1.5, sy);
    c.closePath();
  };
}

export function hairCap(c: Ctx, f: FaceDef, col: string, o: CapOpts = {}): void {
  const hp = headPath(f);
  // the hair's cast shadow on the forehead
  clipped(c, hp, () => {
    c.save();
    c.translate(0, 3.2);
    flat(c, capShape(f, o), alpha('#5a2a30', 0.28));
    c.restore();
  });
  paint(c, capShape(f, o), col, { rim: lightOf(col, 0.4), rimW: 2.6 });
  // a few strand lines
  const h = f.headH;
  strokes(
    c,
    [
      [
        [-4, -h - 1],
        [-8, -h * 0.78],
        [-15, -h * 0.58],
      ],
      [
        [4, -h - 1],
        [6, -h * 0.8],
        [12, -h * 0.62],
      ],
      [
        [-12, -h * 0.92],
        [-19, -h * 0.7],
        [-23, -h * 0.38],
      ],
    ],
    alpha(shadeOf(col, 0.55), 0.7),
    1.5,
  );
}

export function curlsBack(c: Ctx, f: FaceDef, col: string, r = 8.5, extra = 0): void {
  const w = f.headW + 3;
  const h = f.headH;
  const cs: [number, number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    cs.push([Math.cos(a) * (w + 1), Math.sin(a) * (h * 0.98) - 1, r + (i % 2) * 0.8]);
  }
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 1.15 + (i / 4) * Math.PI * 0.7;
    cs.push([Math.cos(a) * w * 0.8, Math.sin(a) * h * 0.8 - 3, r + 1]);
  }
  for (let k = 0; k < extra; k++) {
    for (const s of [-1, 1]) cs.push([s * (w + 2 + (k % 2) * 2), 4 + k * 8, r - 0.5]);
  }
  blobs(c, cs, col, { light: alpha(lightOf(col, 0.55), 0.8) });
}

export function curlsFringe(c: Ctx, f: FaceDef, col: string, y = -f.headH * 0.58, r = 7): void {
  const w = f.headW;
  const cs: [number, number, number][] = [];
  for (let i = -3; i <= 3; i++)
    cs.push([i * (w / 3.4), y - Math.abs(i) * 1.1 + (i % 2) * 2, r + (i % 2 ? 0 : 1)]);
  cs.push([-w, y + 7, r - 1], [w, y + 7, r - 1]);
  blobs(c, cs, col, { light: alpha(lightOf(col, 0.55), 0.8) });
}

// ── facial hair ───────────────────────────────────────────────────────────────────────────────
export interface BeardOpts {
  col: string;
  len?: number;
  /** y where the beard begins on the cheeks (relative to the head). */
  top?: number;
  /** 'full' | 'goatee' | 'forked' | 'trim' */
  kind?: 'full' | 'goatee' | 'forked' | 'trim' | 'long';
  spread?: number;
}

export function beard(o: BeardOpts): NonNullable<FaceDef['beard']> {
  return (c, f, e) => {
    const w = f.headW;
    const h = f.headH;
    const len = o.len ?? 6;
    const kind = o.kind ?? 'full';
    const top = (o.top ?? f.eyeY + 9) - 2;
    const drop = e.mopen * 0.55;
    const my = f.mouthY;
    const mw = f.mouthW + 5;
    const cw = w * f.chin;
    const sp = o.spread ?? 1;
    let path: PathFn;
    if (kind === 'goatee') {
      path = (cc) => {
        cc.moveTo(-mw * 0.9, my + 3);
        cc.quadraticCurveTo(0, my + 7, mw * 0.9, my + 3);
        cc.quadraticCurveTo(cw + 1, h * 0.8, 3 + cw * 0.3, h + len + drop);
        cc.quadraticCurveTo(0, h + len + 4 + drop, -3 - cw * 0.3, h + len + drop);
        cc.quadraticCurveTo(-cw - 1, h * 0.8, -mw * 0.9, my + 3);
        cc.closePath();
      };
    } else {
      const long = kind === 'long';
      const flare = kind === 'forked' ? 1 : 0;
      path = (cc) => {
        cc.moveTo(-w + 0.5, top);
        cc.bezierCurveTo(-w + 3.5, top + (my - top) * 0.5, -mw - 9, my - 8, -mw, my - 5.5);
        cc.quadraticCurveTo(0, my - 8.5, mw, my - 5.5);
        cc.bezierCurveTo(mw + 9, my - 8, w - 3.5, top + (my - top) * 0.5, w - 0.5, top);
        cc.bezierCurveTo(
          w + 4 * sp,
          my + 4,
          cw + 5 * sp,
          h * 0.9 + drop,
          (long ? 7 : 3) + flare * 3,
          h + len + drop,
        );
        if (long) {
          cc.quadraticCurveTo(0, h + len + 10 + drop, -7, h + len + drop);
        } else if (flare) {
          cc.lineTo(0, h + len - 2 + drop);
          cc.lineTo(-3 - flare * 3, h + len + drop);
        } else {
          cc.quadraticCurveTo(0, h + len + 3 + drop, -3, h + len + drop);
        }
        cc.bezierCurveTo(-cw - 5 * sp, h * 0.9 + drop, -w - 4 * sp, my + 4, -w + 0.5, top);
        cc.closePath();
      };
    }
    const hp = headPath(f);
    void hp;
    paint(c, path, o.col, { rim: lightOf(o.col, 0.4), rimW: 2.4, sh: [-3, -4] });
    strokes(
      c,
      [
        [
          [-8, my + 8],
          [-9, my + 14],
          [-7, h + len * 0.6],
        ],
        [
          [8, my + 8],
          [10, my + 14],
          [8, h + len * 0.6],
        ],
        [
          [0, my + 10],
          [0.5, h * 0.9],
          [0, h + len * 0.8],
        ],
      ],
      alpha(shadeOf(o.col, 0.6), 0.6),
      1.4,
    );
    // skin around the lips
    flat(c, ellipse(0, my + 1.4 + drop * 0.3, f.mouthW * e.mw + 4.2, 6 + drop * 0.5), f.skin);
    flat(c, ellipse(0, my + 4 + drop * 0.5, f.mouthW * e.mw + 2.6, 3.2), alpha(f.skin, 1));
  };
}

export interface StacheOpts {
  col: string;
  kind: 'thick' | 'thin' | 'walrus' | 'curl';
  size?: number;
}
export function stache(o: StacheOpts): NonNullable<FaceDef['stache']> {
  return (c, f, e) => {
    const s = o.size ?? 1;
    const my = f.mouthY - 3.2;
    const mw = f.mouthW * e.mw;
    for (const side of [-1, 1] as const) {
      const endY = my + 7 + (side === -1 ? e.cl : e.cr) * 0.7;
      const thick = { thick: 8, thin: 3.4, walrus: 10, curl: 4.6 }[o.kind] * s;
      const reach = { thick: 13, thin: 11, walrus: 15, curl: 14 }[o.kind];
      const lift = o.kind === 'curl' ? -5 : 0;
      taper(
        c,
        [side * 0.8, my + 1],
        [side * (mw * 0.55), my - 3.5 - thick * 0.2],
        [side * (mw + reach * 0.55), endY + lift],
        thick,
        thick * 0.3,
        o.col,
        2,
      );
      if (o.kind === 'thick' || o.kind === 'walrus') {
        taper(
          c,
          [side * 1, my + 0.5],
          [side * mw * 0.5, my + 1],
          [side * (mw + 4), endY - 1],
          thick * 0.5,
          1,
          shadeOf(o.col, 0.4),
          0,
        );
      }
    }
  };
}

// ── headgear ──────────────────────────────────────────────────────────────────────────────────
export interface TurbanOpts {
  col: string;
  fold: string;
  band?: string;
  size?: number;
  tall?: number;
  jewel?: string;
  tail?: boolean;
  stripes?: string;
}
export function turban(c: Ctx, f: FaceDef, o: TurbanOpts): void {
  const w = f.headW;
  const h = f.headH;
  const sz = o.size ?? 1;
  const baseY = -h * 0.58;
  const tall = o.tall ?? 1;
  const rx = w * 1.3 * sz;
  const cy = baseY - h * 0.42 * tall;
  const ry = h * 0.62 * tall;
  if (o.tail) {
    const t: PathFn = spline(
      [
        [w * 0.7, baseY - 2],
        [w * 1.5, baseY + 14],
        [w * 1.4, baseY + 36],
        [w * 1.15, baseY + 30],
        [w * 1.05, baseY + 8],
      ],
      true,
    );
    paint(c, t, o.col, { rim: lightOf(o.col, 0.4), sh: [-3, -2] });
  }
  const dome: PathFn = (cc) => {
    cc.moveTo(-rx, baseY + 4);
    cc.bezierCurveTo(-rx * 1.04, cy - ry * 0.4, -rx * 0.55, cy - ry * 1.12, 0, cy - ry * 1.1);
    cc.bezierCurveTo(rx * 0.55, cy - ry * 1.12, rx * 1.04, cy - ry * 0.4, rx, baseY + 4);
    cc.bezierCurveTo(rx * 0.7, baseY + 9, -rx * 0.7, baseY + 9, -rx, baseY + 4);
    cc.closePath();
  };
  paint(c, dome, o.col, { rim: lightOf(o.col, 0.45), rimW: 3, sh: [-6, -6], line: 3.2 });
  clipped(c, dome, () => {
    // wound cloth folds
    for (let i = 0; i < 4; i++) {
      const y0 = baseY + 2 - i * (ry * 0.46);
      const a = (i % 2 ? 1 : -1) * 4;
      strokes(
        c,
        [
          [
            [-rx, y0 + a],
            [-rx * 0.4, y0 - 3 - a * 0.4],
            [rx * 0.5, y0 - 2 + a * 0.5],
            [rx, y0 + 4 - a],
          ],
        ],
        o.fold,
        2.2,
      );
      if (o.stripes)
        strokes(
          c,
          [
            [
              [-rx, y0 + a + 3],
              [-rx * 0.4, y0 - 0 - a * 0.4],
              [rx * 0.5, y0 + 1 + a * 0.5],
              [rx, y0 + 7 - a],
            ],
          ],
          o.stripes,
          2.4,
        );
    }
    strokes(
      c,
      [
        [
          [-rx * 0.5, baseY - 4],
          [-rx * 0.1, cy - ry * 0.5],
          [rx * 0.05, cy - ry * 1.05],
        ],
      ],
      alpha(o.fold, 0.8),
      2,
    );
  });
  // band at the brow
  const band: PathFn = (cc) => {
    cc.moveTo(-rx * 0.96, baseY + 1);
    cc.quadraticCurveTo(0, baseY - 4.5, rx * 0.96, baseY + 1);
    cc.lineTo(rx * 0.93, baseY + 8.4);
    cc.quadraticCurveTo(0, baseY + 3.4, -rx * 0.93, baseY + 8.4);
    cc.closePath();
  };
  paint(c, band, o.band ?? shadeOf(o.col, 0.35), {
    rim: lightOf(o.band ?? o.col, 0.35),
    line: 2.6,
  });
  if (o.jewel) {
    const jp: PathFn = poly([
      [0, baseY - 8],
      [6, baseY + 1],
      [0, baseY + 11],
      [-6, baseY + 1],
    ]);
    paint(c, jp, '#e9b73a', { line: 2.4, sh: [-1.5, -1.5] });
    paint(c, circle(0, baseY + 1, 2.8), o.jewel, { line: 1.6, shade: false });
    flat(c, circle(-0.8, baseY + 0.2, 0.9), '#ffffff');
  }
}

export function strawHat(c: Ctx, f: FaceDef, col: string, band: string): void {
  const w = f.headW;
  const h = f.headH;
  const cy = -h * 0.55;
  const crown: PathFn = (cc) => {
    cc.moveTo(-w * 0.98, cy);
    cc.bezierCurveTo(-w * 1.0, cy - h * 0.95, w * 1.0, cy - h * 0.95, w * 0.98, cy);
    cc.closePath();
  };
  paint(c, crown, col, { rim: lightOf(col, 0.4), sh: [-5, -4] });
  const brim: PathFn = ellipse(0, cy + 1, w * 2.05, h * 0.36, 0);
  // underside shadow on the forehead
  clipped(c, headPath(f), () =>
    flat(c, ellipse(0, cy + 8, w * 2, h * 0.34), alpha('#3a1c20', 0.32)),
  );
  paint(c, brim, mix(col, '#ffffff', 0.04), { rim: lightOf(col, 0.45), rimW: 3, sh: [-5, -5] });
  clipped(c, brim, () => {
    for (let i = -7; i <= 7; i++)
      strokes(
        c,
        [
          [
            [i * 8, cy - 12],
            [i * 8 + 2, cy],
            [i * 8 + 4, cy + 12],
          ],
        ],
        alpha(shadeOf(col, 0.5), 0.55),
        1.2,
      );
  });
  const bandP: PathFn = (cc) => {
    cc.moveTo(-w * 0.99, cy - 0.5);
    cc.quadraticCurveTo(0, cy + 6.5, w * 0.99, cy - 0.5);
    cc.lineTo(w * 0.97, cy - 7.5);
    cc.quadraticCurveTo(0, cy - 1, -w * 0.97, cy - 7.5);
    cc.closePath();
  };
  paint(c, bandP, band, { line: 2.2, sh: [-2, -2] });
}

/** Kerchief tied over the hair, with a knot and tails at one side. */
export function kerchief(
  c: Ctx,
  f: FaceDef,
  col: string,
  pat: string,
  o: { side?: 1 | -1; hairY?: number } = {},
): void {
  const s = o.side ?? 1;
  const hy = o.hairY ?? -f.headH * 0.5;
  const w = f.headW;
  const h = f.headH;
  const tails: PathFn = spline(
    [
      [s * (w + 1), -h * 0.25],
      [s * (w + 12), -h * 0.15],
      [s * (w + 14), h * 0.35],
      [s * (w + 8), h * 0.5],
      [s * (w + 4), h * 0.15],
    ],
    true,
  );
  clipped(c, headPath(f), () => {
    c.save();
    c.translate(0, 3);
    flat(c, capShape(f, { grow: 3, hairY: hy, sideY: h * 0.12, part: 0 }), alpha('#5a2a30', 0.3));
    c.restore();
  });
  paint(c, tails, col, { sh: [-3, -3] });
  const cp = capShape(f, { grow: 3.4, hairY: hy, sideY: h * 0.14, part: 0, bulge: 2 });
  paint(c, cp, col, { rim: lightOf(col, 0.4), rimW: 2.6 });
  clipped(c, cp, () => {
    c.fillStyle = pat;
    for (let i = 0; i < 18; i++) {
      c.beginPath();
      c.arc(
        -26 + (i % 6) * 10.4 + (Math.floor(i / 6) % 2) * 5,
        -h + 3 + Math.floor(i / 6) * 11,
        1.5,
        0,
        6.3,
      );
      c.fill();
    }
    strokes(
      c,
      [
        [
          [-w * 0.2, -h - 2],
          [-w * 0.3, -h * 0.7],
          [-w * 0.6, hy],
        ],
      ],
      alpha(shadeOf(col, 0.5), 0.8),
      1.6,
    );
  });
  const knot: PathFn = ellipse(s * (w - 1), -h * 0.28, 5.2, 4.6, 0.4);
  paint(c, knot, col, { sh: [-2, -2], line: 2.6 });
}

/** Brass goggles pushed up over the hair on a leather strap. */
export function goggles(c: Ctx, f: FaceDef, strap: string): void {
  const h = f.headH;
  const y = -h * 0.68;
  const w = f.headW;
  const band: PathFn = (cc) => {
    cc.moveTo(-w - 2.4, y - 5);
    cc.quadraticCurveTo(0, y - 12, w + 2.4, y - 5);
    cc.lineTo(w + 2.2, y + 4);
    cc.quadraticCurveTo(0, y - 3, -w - 2.2, y + 4);
    cc.closePath();
  };
  paint(c, band, strap, { line: 2.6, rim: lightOf(strap, 0.3), sh: [-2, -3] });
  for (const s of [-1, 1] as const) {
    const cx = s * 11.5;
    paint(c, circle(cx, y - 3, 9.4), '#b9852d', { line: 3, rim: '#f0cf72', rimW: 2, sh: [-3, -3] });
    paint(c, circle(cx, y - 3, 6.2), '#b6dbe0', { line: 2.2, shade: '#7fb2bb', sh: [-2.5, -3] });
    flat(c, ellipse(cx - 2, y - 5.2, 1.6, 2.6, 0.7), '#ffffff');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      flat(c, circle(cx + Math.cos(a) * 8.1, y - 3 + Math.sin(a) * 8.1, 0.9), '#6a4a14');
    }
  }
  paint(c, roundRect(-3, y - 6, 6, 6, 1.5), '#8a5f20', { line: 2, shade: false });
}

export function morion(c: Ctx, f: FaceDef, plume: string): void {
  const w = f.headW;
  const h = f.headH;
  const by = -h * 0.5;
  const steel = '#aab3c0';
  const brim: PathFn = (cc) => {
    cc.moveTo(-w * 1.5, by - 12);
    cc.bezierCurveTo(-w * 1.3, by + 4, -w * 0.5, by + 4, 0, by + 2);
    cc.bezierCurveTo(w * 0.5, by + 4, w * 1.3, by + 4, w * 1.5, by - 12);
    cc.bezierCurveTo(w * 1.1, by - 4, w * 0.6, by - 6, 0, by - 6);
    cc.bezierCurveTo(-w * 0.6, by - 6, -w * 1.1, by - 4, -w * 1.5, by - 12);
    cc.closePath();
  };
  // plume first (behind the comb)
  const pl: [number, number, number][] = [];
  for (let i = 0; i < 6; i++)
    pl.push([-8 + i * 7.2, -h * 1.34 - 6 + Math.sin(i * 0.9) * 3 + i * 1.4, 7.5 - i * 0.2]);
  blobs(c, pl, plume, { light: alpha(lightOf(plume, 0.5), 0.8) });
  const bowl: PathFn = (cc) => {
    cc.moveTo(-w * 1.04, by - 2);
    cc.bezierCurveTo(-w * 1.1, -h * 1.15, -w * 0.4, -h * 1.45, 0, -h * 1.4);
    cc.bezierCurveTo(w * 0.4, -h * 1.45, w * 1.1, -h * 1.15, w * 1.04, by - 2);
    cc.closePath();
  };
  paint(c, bowl, steel, { rim: '#eaf1f8', rimW: 3, sh: [-6, -5], shade: '#6f7a90' });
  const comb: PathFn = (cc) => {
    cc.moveTo(-4, -h * 1.4);
    cc.bezierCurveTo(-6, -h * 1.6, 6, -h * 1.6, 5, -h * 1.4);
    cc.lineTo(3, by - 5);
    cc.lineTo(-3, by - 5);
    cc.closePath();
  };
  paint(c, comb, '#c3cbd6', { line: 2.6, sh: [-2, -2], shade: '#7c879b' });
  strokes(
    c,
    [
      [
        [-w * 0.6, -h * 1.0],
        [-w * 0.3, -h * 1.25],
        [-4, -h * 1.34],
      ],
    ],
    'rgba(255,255,255,0.8)',
    2.2,
  );
  paint(c, brim, '#8f99aa', { line: 3, rim: '#e8eef6', sh: [-3, -3], shade: '#5d677c' });
  for (const s of [-1, 1]) flat(c, circle(s * w * 0.8, by - 4, 1.5), '#e9b73a');
}

export function borkHat(c: Ctx, f: FaceDef): void {
  const w = f.headW;
  const h = f.headH;
  const base = -h * 0.55;
  const felt = '#f3eee0';
  const body: PathFn = (cc) => {
    cc.moveTo(-w * 1.05, base + 6);
    cc.bezierCurveTo(-w * 1.15, base - 20, -w * 0.8, -h * 2.2, -w * 0.5, -h * 2.5);
    cc.bezierCurveTo(-w * 0.1, -h * 2.65, w * 0.4, -h * 2.5, w * 0.7, -h * 2.2);
    cc.bezierCurveTo(w * 1.15, -h * 1.6, w * 1.15, base - 10, w * 1.05, base + 6);
    cc.quadraticCurveTo(0, base + 12, -w * 1.05, base + 6);
    cc.closePath();
  };
  paint(c, body, felt, { rim: '#ffffff', rimW: 3, sh: [-7, -5], shade: '#cfc7b3' });
  clipped(c, body, () => {
    for (let i = 0; i < 4; i++)
      strokes(
        c,
        [
          [
            [-w * 1.1 + i * 3, base - 6 - i * 16],
            [0, base - 12 - i * 16],
            [w * 1.1, base - 6 - i * 16 - 6],
          ],
        ],
        'rgba(160,150,125,0.5)',
        1.4,
      );
  });
  const rim: PathFn = (cc) => {
    cc.moveTo(-w * 1.06, base + 7);
    cc.quadraticCurveTo(0, base + 1, w * 1.06, base + 7);
    cc.lineTo(w * 1.04, base - 3);
    cc.quadraticCurveTo(0, base - 9, -w * 1.04, base - 3);
    cc.closePath();
  };
  paint(c, rim, '#b73a34', { line: 2.8, rim: '#e5766b', sh: [-2, -3] });
  // spoon holder
  paint(c, roundRect(-4.5, base - 22, 9, 17, 4), '#e9b73a', {
    line: 2.6,
    shade: '#b78a1f',
    sh: [-2, -2],
  });
  paint(c, ellipse(0, base - 13, 2.3, 4.4), '#9a7416', { line: 1.4, shade: false });
  void ink;
}

export function headband(c: Ctx, f: FaceDef, col: string): void {
  const w = f.headW;
  const y = -f.headH * 0.46;
  const band: PathFn = (cc) => {
    cc.moveTo(-w - 2.4, y - 4);
    cc.quadraticCurveTo(0, y - 8, w + 2.4, y - 4);
    cc.lineTo(w + 2.4, y + 4.4);
    cc.quadraticCurveTo(0, y + 0.4, -w - 2.4, y + 4.4);
    cc.closePath();
  };
  paint(c, band, col, { rim: lightOf(col, 0.4), sh: [-2, -3], line: 2.8 });
  const t: PathFn = spline(
    [
      [w + 1, y - 2],
      [w + 10, y - 4],
      [w + 12, y + 8],
      [w + 5, y + 5],
    ],
    true,
  );
  paint(c, t, col, { line: 2.4, sh: [-2, -2] });
}

export { INK };
