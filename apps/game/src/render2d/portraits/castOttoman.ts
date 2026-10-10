/** The Ottoman army and fleet, the corsairs and the pasha's household. */
import type { CastArt } from './artTypes';
import { FACE_BASE } from './face';
import { type Ctx, alpha, blobs, circle, clipped, ellipse, flat, lightOf, paint, poly, roundRect, shadeOf, spline, taper } from './kit';
import { beard, borkHat, neck, stache, strokes, torso, turban } from './parts';

const pair = (fn: (s: -1 | 1) => void) => {
  fn(-1);
  fn(1);
};
const X = (s: number, dx: number) => 100 + s * dx;

function furCollar(c: Ctx, col: string, y = 142, spread = 66) {
  const cs: [number, number, number][] = [];
  for (let i = 0; i < 7; i++) {
    const dx = 22 + i * (spread - 22) / 6;
    for (const s of [-1, 1]) cs.push([X(s, dx), y + dx * 0.16 + (i % 2) * 3, 10.5 - i * 0.3]);
  }
  blobs(c, cs, col, { light: alpha(lightOf(col, 0.5), 0.7) });
}

function embroidery(c: Ctx, col: string, x0: number, x1: number, y: number, n: number) {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    strokes(c, [[[x - 5, y + 4], [x, y - 4], [x + 5, y + 4]], [[x, y - 4], [x, y + 8]]], col, 1.8);
    flat(c, circle(x, y + 10, 1.6), col);
  }
}

function feather(c: Ctx, base: [number, number], tip: [number, number], bend: number, col: string, tipCol: string) {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const at = (t: number, w: number, b = 1): [number, number] => [base[0] + dx * t + nx * w + bend * Math.sin(t * Math.PI) * b, base[1] + dy * t + ny * w];
  const leaf = spline([at(0, 0), at(0.3, 7), at(0.7, 9), at(1, 0), at(0.7, -6), at(0.3, -5)], true);
  paint(c, leaf, col, { rim: lightOf(col, 0.4), rimW: 1.6, line: 2.6, sh: [-2, -2] });
  strokes(c, [[at(0.05, 0), at(0.5, 1), at(0.95, 0)]], tipCol, 2);
  void taper;
}

// ── Deniz ────────────────────────────────────────────────────────────────────────────────────
const DENIZ_HAIR = '#16111a';
export const deniz: CastArt = {
  id: 'deniz',
  zoom: 1.1,
  accent: '#1f7a8c',
  setting: 'sea',
  face: {
    ...FACE_BASE,
    skin: '#b6794c',
    hair: DENIZ_HAIR,
    headW: 25.5,
    headH: 33,
    chin: 0.5,
    jaw: 0.25,
    eyes: 'almond',
    eyeSize: 1.1,
    iris: '#2e1d12',
    lashes: 0.35,
    browThick: 3.4,
    nose: 'straight',
    age: 0.12,
    stubble: 0.35,
    lipFull: 0.7,
    beard: beard({ col: DENIZ_HAIR, kind: 'goatee', len: 3 }),
    stache: stache({ col: DENIZ_HAIR, kind: 'thin', size: 0.9 }),
  },
  back: (c, f) => {
    const cs: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) cs.push([s * (f.headW + 3 + (i % 2) * 2), -4 + i * 8, 8.2 - i * 0.2]);
    blobs(c, cs, DENIZ_HAIR, { light: alpha(lightOf(DENIZ_HAIR, 0.6), 0.8) });
  },
  body: (c, f) => {
    neck(c, f.skin, 13);
    const tp = torso(c, '#f1e8d4', 82, 132, 15);
    clipped(c, tp, () => {
      pair((s) => {
        const vest = poly([[X(s, 82), 216], [X(s, 82), 162], [X(s, 50), 138], [X(s, 17), 133], [X(s, 14), 180], [X(s, 12), 216]]);
        paint(c, vest, '#2e5d52', { line: 3, rim: lightOf('#2e5d52', 0.3), sh: [-4, -5], shade: '#1b3a33' });
        strokes(c, [[[X(s, 17), 140], [X(s, 14), 214]], [[X(s, 36), 146], [X(s, 66), 164]]], '#d9aa3a', 2.2);
        for (let i = 0; i < 4; i++) flat(c, circle(X(s, 40 + i * 9), 170 + i * 8, 1.6), '#d9aa3a');
      });
      paint(c, roundRect(14, 196, 172, 22, 3), '#a6342f', { line: 3, rim: lightOf('#a6342f', 0.3), sh: [-3, -4], shade: '#6b1f1f' });
    });
    pair((s) => paint(c, poly([[X(s, 12), 128], [X(s, 30), 134], [X(s, 18), 150]]), '#fbf4e2', { line: 2.4, sh: [-2, -2], shade: '#d3c8a8' }));
    // powder horn
    const horn = spline([[56, 150], [74, 156], [94, 176], [90, 188], [72, 172], [58, 162]], true);
    paint(c, horn, '#b88a4a', { line: 2.8, rim: '#e8c98a', rimW: 1.8, sh: [-2, -3], shade: '#7a5528' });
    strokes(c, [[[60, 156], [84, 176]]], alpha('#5a3a14', 0.6), 1.4);
  },
  front: (c, f) => {
    const w = f.headW;
    // fringe locks under the turban
    for (const s of [-1, 1]) paint(c, spline([[s * (w + 1), -14], [s * (w + 3), 8], [s * (w - 6), -8], [s * (w - 3), -18]], true), DENIZ_HAIR, { line: 2.4 });
    turban(c, f, { col: '#efe6d2', fold: '#b9ad90', band: '#b0332c', size: 0.96, tall: 0.78, stripes: '#c0443a' });
  },
};

// ── Leyla ────────────────────────────────────────────────────────────────────────────────────
export const leyla: CastArt = {
  id: 'leyla',
  accent: '#8c5a9c',
  setting: 'tent',
  face: {
    ...FACE_BASE,
    skin: '#e1b38e',
    hair: '#1a1218',
    headW: 24.5,
    headH: 33,
    chin: 0.46,
    jaw: 0.22,
    ear: 0,
    eyes: 'almond',
    eyeSize: 1.18,
    iris: '#2a1c14',
    lashes: 1,
    browThick: 2.5,
    browLen: 9,
    browArch: 1.8,
    nose: 'straight',
    noseSize: 0.88,
    mouthW: 6.6,
    lip: '#a8404e',
    lipFull: 1.1,
    age: 0.2,
    marks: ['kohl', 'rouge'],
  },
  back: (c, f) => {
    const veil = spline([[-f.headW - 18, 52], [-f.headW - 14, -4], [-f.headW + 2, -f.headH - 10], [f.headW - 2, -f.headH - 10], [f.headW + 14, -4], [f.headW + 18, 52], [0, 60]], true);
    paint(c, veil, '#5c3a76', { rim: '#a07ac0', rimW: 2.6, shade: '#3a2350' });
    strokes(c, [[[-f.headW - 8, 10], [-f.headW - 10, 34]], [[f.headW + 8, 10], [f.headW + 10, 34]]], alpha('#241236', 0.7), 1.8);
  },
  body: (c, f) => {
    neck(c, f.skin, 11);
    const tp = torso(c, '#7a4f95', 80, 132, 13);
    clipped(c, tp, () => {
      strokes(c, [[[30, 170], [36, 210]], [[170, 170], [164, 210]]], alpha('#2e1a42', 0.55), 2);
      const panel = poly([[84, 216], [88, 136], [112, 136], [116, 216]]);
      paint(c, panel, '#b6862e', { line: 2.8, rim: '#f0cf72', rimW: 1.6, sh: [-2, -3], shade: '#7a5818' });
      for (let i = 0; i < 6; i++) flat(c, poly([[100, 150 + i * 11], [105, 155 + i * 11], [100, 160 + i * 11], [95, 155 + i * 11]]), '#fff0b8');
      pair((s) => strokes(c, [[[X(s, 30), 150], [X(s, 50), 172], [X(s, 70), 160]], [[X(s, 24), 196], [X(s, 48), 186], [X(s, 74), 198]]], '#e0b650', 2));
    });
    // veil folds over the shoulders
    pair((s) => paint(c, ellipse(X(s, 34), 140, 26, 12, s * -0.4), '#5c3a76', { line: 3, rim: '#a07ac0', sh: [-3, -3], shade: '#3a2350' }));
    // pearls
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.1 + (i / 10) * 0.8);
      const x = 100 + Math.cos(a) * 20 * -1;
      const y = 134 + Math.sin(a) * 20;
      paint(c, circle(x, y, 3.2), '#f6f0e4', { line: 1.6, shade: '#c7bca6', sh: [-1, -1.2] });
    }
    paint(c, circle(100, 156, 5), '#8a1f3a', { line: 2.2, rim: '#d24a6a', rimW: 1.2, sh: [-1.5, -1.5] });
  },
  front: (c, f) => {
    const h = f.headH;
    const w = f.headW;
    // hair parted in the middle, with a white streak
    const hair = (cc: Ctx) => {
      cc.moveTo(-w - 1, 0);
      cc.bezierCurveTo(-w - 2, -h * 0.9, -w * 0.5, -h - 3, 0, -h - 3);
      cc.bezierCurveTo(w * 0.5, -h - 3, w + 2, -h * 0.9, w + 1, 0);
      cc.lineTo(w - 3, -h * 0.2);
      cc.quadraticCurveTo(w * 0.7, -h * 0.62, 1, -h * 0.58);
      cc.quadraticCurveTo(-w * 0.7, -h * 0.62, -w + 3, -h * 0.2);
      cc.closePath();
    };
    paint(c, hair, '#1a1218', { rim: '#6a5a76', rimW: 2.4 });
    taper(c, [-1, -h * 0.58], [-10, -h * 0.84], [-20, -h * 0.5], 4.6, 1.2, '#efe9e4', 1.4);
    taper(c, [-3, -h * 0.6], [-14, -h * 0.9], [-24, -h * 0.35], 2.6, 0.8, '#cfc6c6', 0);
    // the veil over the crown, a gold-edged band at the hairline
    const cover = (cc: Ctx) => {
      cc.moveTo(-w - 4, 4);
      cc.bezierCurveTo(-w - 6, -h * 0.9, -w * 0.5, -h - 9, 0, -h - 9);
      cc.bezierCurveTo(w * 0.5, -h - 9, w + 6, -h * 0.9, w + 4, 4);
      cc.lineTo(w - 1, -h * 0.1);
      cc.quadraticCurveTo(w * 0.8, -h * 0.74, 0, -h * 0.76);
      cc.quadraticCurveTo(-w * 0.8, -h * 0.74, -w + 1, -h * 0.1);
      cc.closePath();
    };
    paint(c, cover, '#6a4688', { rim: '#b08ad0', rimW: 2.8, shade: '#3f2859' });
    strokes(c, [[[-w + 2, -h * 0.12], [-w * 0.8, -h * 0.64], [0, -h * 0.74], [w * 0.8, -h * 0.64], [w - 2, -h * 0.12]]], '#e0b650', 2.2);
    for (let i = -3; i <= 3; i++) flat(c, circle(i * 7, -h * 0.74 + Math.abs(i) * 1.6 - (i === 0 ? 0 : 0), 1.3), '#fff0b8');
    paint(c, poly([[0, -h * 0.74 - 5], [4.4, -h * 0.74], [0, -h * 0.74 + 5], [-4.4, -h * 0.74]]), '#b02a4c', { line: 1.8, shade: false });
  },
};

// ── Yusuf Reis ───────────────────────────────────────────────────────────────────────────────
export const yusuf: CastArt = {
  id: 'yusuf',
  zoom: 1.05,
  accent: '#2c5a6e',
  setting: 'sea',
  face: {
    ...FACE_BASE,
    skin: '#a76f48',
    hair: '#3a3a3e',
    headW: 28,
    headH: 34,
    chin: 0.62,
    jaw: 0.36,
    eyes: 'narrow',
    eyeSize: 1.15,
    iris: '#2a1c12',
    browThick: 4.2,
    browLen: 9.5,
    nose: 'broad',
    noseSize: 1.05,
    age: 0.6,
    marks: ['bags'],
    lipFull: 0.4,
    beard: beard({ col: '#4a4a50', kind: 'full', len: 8, top: 14, spread: 1.1 }),
    stache: stache({ col: '#4a4a50', kind: 'thick', size: 0.9 }),
  },
  body: (c, f) => {
    neck(c, f.skin, 15);
    const tp = torso(c, '#efe3c8', 86, 132, 16);
    clipped(c, tp, () => {
      pair((s) => {
        const coat = poly([[X(s, 86), 216], [X(s, 86), 160], [X(s, 56), 138], [X(s, 22), 130], [X(s, 20), 170], [X(s, 30), 216]]);
        paint(c, coat, '#8a6c46', { line: 3, rim: lightOf('#8a6c46', 0.3), sh: [-4, -5], shade: '#5a4429' });
        const lapel = poly([[X(s, 18), 128], [X(s, 46), 134], [X(s, 36), 172], [X(s, 22), 172]]);
        paint(c, lapel, '#b0916a', { line: 2.6, sh: [-2, -2], shade: '#7a5f3c' });
        strokes(c, [[[X(s, 70), 180], [X(s, 62), 210]]], alpha('#3a2812', 0.5), 1.8);
      });
    });
    // gold ring on a knuckle at chest
    paint(c, circle(124, 186, 6), '#f4d68a', { line: 2, shade: '#c79a3a', sh: [-1, -1.5] });
  },
  front: (c, f) => {
    // grey hair at the sides, the turban over
    for (const s of [-1, 1]) paint(c, spline([[s * (f.headW + 1), -14], [s * (f.headW + 2), 8], [s * (f.headW - 6), -6]], true), '#8a8a8e', { line: 2.4 });
    turban(c, f, { col: '#f1ece0', fold: '#bdb59e', band: '#2c5a6e', size: 1.06, tall: 1.12 });
  },
};

// ── Turgut Reis ──────────────────────────────────────────────────────────────────────────────
export const turgut: CastArt = {
  id: 'turgut',
  zoom: 1.0,
  accent: '#b07a2a',
  setting: 'sea',
  face: {
    ...FACE_BASE,
    skin: '#d6a274',
    hair: '#e9e7e2',
    headW: 27,
    headH: 34,
    chin: 0.5,
    jaw: 0.3,
    eyes: 'narrow',
    eyeSize: 1.12,
    iris: '#3a2c1c',
    browThick: 5,
    browLen: 10,
    nose: 'hook',
    noseSize: 1.1,
    age: 0.85,
    marks: ['bags'],
    lipFull: 0.2,
    beard: beard({ col: '#ecebe6', kind: 'long', len: 20, top: 14, spread: 0.9 }),
    stache: stache({ col: '#ecebe6', kind: 'walrus', size: 0.9 }),
  },
  body: (c, f) => {
    neck(c, f.skin, 14);
    const tp = torso(c, '#8e1f30', 88, 132, 16, { shade: '#5a1220' });
    clipped(c, tp, () => {
      embroidery(c, '#e8bf4a', 26, 80, 176, 4);
      embroidery(c, '#e8bf4a', 120, 174, 176, 4);
      strokes(c, [[[100, 138], [100, 216]]], '#e8bf4a', 3);
      paint(c, roundRect(10, 198, 180, 22, 3), '#b8452e', { line: 3, rim: '#e47a58', sh: [-3, -4], shade: '#7a2a1c' });
      pair((s) => strokes(c, [[[X(s, 20), 134], [X(s, 50), 144], [X(s, 78), 150]]], '#e8bf4a', 3));
    });
    // sword hilt
    paint(c, poly([[144, 168], [152, 164], [158, 196], [150, 198]]), '#d9aa3a', { line: 2.4, sh: [-1.5, -1.5], shade: '#9a7416' });
    paint(c, circle(148, 164, 5), '#e8bf4a', { line: 2.2, shade: '#9a7416' });
  },
  front: (c, f) => {
    turban(c, f, { col: '#f5f1e6', fold: '#c4bba2', band: '#c58a22', size: 1.08, tall: 1.1, jewel: '#c8283c' });
    // a gold-tipped aigrette beside the jewel
    taper(c, [10, -f.headH * 0.58 - 4], [18, -f.headH * 0.9], [14, -f.headH * 1.3], 3, 6, '#e8bf4a', 2);
  },
};

// ── Mustafa Pasha ────────────────────────────────────────────────────────────────────────────
export const mustafa: CastArt = {
  id: 'mustafa',
  zoom: 1.08,
  accent: '#a8322f',
  setting: 'tent',
  face: {
    ...FACE_BASE,
    skin: '#d1a074',
    hair: '#aaa8a4',
    headW: 26,
    headH: 34.5,
    chin: 0.48,
    jaw: 0.28,
    eyes: 'narrow',
    eyeSize: 1.08,
    iris: '#3a2c1c',
    browThick: 4.6,
    browLen: 10,
    nose: 'hook',
    noseSize: 1.18,
    age: 0.8,
    marks: ['bags'],
    lipFull: 0.2,
    beard: beard({ col: '#b4b2ae', kind: 'forked', len: 15, top: 14, spread: 0.9 }),
    stache: stache({ col: '#b4b2ae', kind: 'thick', size: 0.9 }),
  },
  body: (c, f) => {
    neck(c, f.skin, 13);
    const tp = torso(c, '#a8322f', 88, 132, 15, { shade: '#701c1f' });
    clipped(c, tp, () => {
      embroidery(c, '#d9aa3a', 40, 90, 184, 3);
      embroidery(c, '#d9aa3a', 110, 160, 184, 3);
      strokes(c, [[[100, 150], [100, 216]]], '#d9aa3a', 2.6);
    });
    furCollar(c, '#6a4a38', 143, 68);
    paint(c, poly([[134, 166], [142, 162], [150, 192], [142, 196]]), '#d9aa3a', { line: 2.4, sh: [-1.5, -1.5], shade: '#9a7416' });
  },
  front: (c, f) => {
    const h = f.headH;
    // two heron plumes behind the turban's jewel
    feather(c, [4, -h * 1.0], [-22, -h * 2.0], -8, '#3a2c28', '#8a6a4a');
    feather(c, [8, -h * 1.0], [10, -h * 2.2], 12, '#4a3a32', '#c9a46a');
    turban(c, f, { col: '#f3efe4', fold: '#bcb39a', band: '#7a2a2a', size: 1.04, tall: 1.05, jewel: '#2f7a5a' });
  },
};

// ── Piali Pasha ──────────────────────────────────────────────────────────────────────────────
export const piali: CastArt = {
  id: 'piali',
  zoom: 1.08,
  accent: '#b0503a',
  setting: 'sea',
  face: {
    ...FACE_BASE,
    skin: '#c8946a',
    hair: '#1c1618',
    headW: 26.5,
    headH: 33.5,
    chin: 0.58,
    jaw: 0.3,
    eyes: 'almond',
    eyeSize: 1.12,
    iris: '#3a2616',
    lashes: 0.3,
    browThick: 3.8,
    browLen: 9.5,
    nose: 'straight',
    age: 0.35,
    lipFull: 0.5,
    beard: beard({ col: '#1c1618', kind: 'trim', len: 6, top: 15 }),
    stache: stache({ col: '#1c1618', kind: 'curl', size: 1 }),
  },
  body: (c, f) => {
    neck(c, f.skin, 14);
    const tp = torso(c, '#6c4a2a', 88, 132, 15, { shade: '#432c16' });
    clipped(c, tp, () => {
      // brocade
      for (let y = 150; y < 216; y += 12)
        for (let x = 14; x < 190; x += 14) {
          const ox = (Math.floor(y / 12) % 2) * 7;
          flat(c, poly([[x + ox, y - 4], [x + ox + 4, y], [x + ox, y + 4], [x + ox - 4, y]]), alpha('#e0b650', 0.85));
        }
      paint(c, roundRect(78, 168, 44, 50, 6), '#27465a', { line: 2.8, sh: [-3, -3], shade: '#15283a' });
      // anchor motif
      strokes(c, [[[100, 176], [100, 206]], [[90, 186], [110, 186]], [[88, 198], [100, 208], [112, 198]]], '#e8bf4a', 2.4);
      flat(c, circle(100, 175, 2.8), '#e8bf4a');
    });
    furCollar(c, '#2c2428', 143, 68);
  },
  front: (c, f) => {
    const h = f.headH;
    feather(c, [-6, -h * 1.0], [-30, -h * 1.8], -8, '#1c1618', '#e8bf4a');
    feather(c, [0, -h * 1.0], [-8, -h * 2.2], 10, '#2a2230', '#e8bf4a');
    turban(c, f, { col: '#2f4f5e', fold: '#18303c', band: '#c58a22', size: 1.04, tall: 0.95, stripes: '#d9aa3a', jewel: '#d24a2a' });
  },
};

// ── Janissary ────────────────────────────────────────────────────────────────────────────────
export const janissary: CastArt = {
  id: 'janissary',
  zoom: 0.97,
  accent: '#a8322f',
  setting: 'sea',
  face: {
    ...FACE_BASE,
    skin: '#d0a07a',
    hair: '#1a1416',
    headW: 27.5,
    headH: 33.5,
    chin: 0.62,
    jaw: 0.36,
    eyes: 'narrow',
    eyeSize: 1.08,
    iris: '#2e2016',
    browThick: 4.4,
    browLen: 9.5,
    nose: 'broad',
    noseSize: 1.1,
    age: 0.4,
    stubble: 0.25,
    lipFull: 0.3,
    stache: stache({ col: '#1a1416', kind: 'walrus', size: 1.3 }),
  },
  back: (c, f) => {
    // the long felt flap of the börk hanging behind
    paint(c, spline([[-f.headW - 3, -f.headH * 0.5], [-f.headW - 10, 22], [-f.headW - 2, 54], [f.headW + 2, 54], [f.headW + 10, 22], [f.headW + 3, -f.headH * 0.5]], true), '#e2dccb', { rim: '#ffffff', shade: '#b4ad98' });
  },
  body: (c, f) => {
    neck(c, f.skin, 15);
    const tp = torso(c, '#f1ead8', 86, 132, 16);
    clipped(c, tp, () => {
      pair((s) => {
        const coat = poly([[X(s, 86), 216], [X(s, 86), 160], [X(s, 56), 138], [X(s, 24), 132], [X(s, 16), 216]]);
        paint(c, coat, '#2f4a78', { line: 3, rim: lightOf('#2f4a78', 0.3), sh: [-4, -5], shade: '#1b2c4c' });
        paint(c, poly([[X(s, 20), 130], [X(s, 42), 136], [X(s, 30), 176], [X(s, 16), 174]]), '#b73a34', { line: 2.6, sh: [-2, -2], shade: '#7a2420' });
        for (let i = 0; i < 4; i++) flat(c, circle(X(s, 56 - i * 3), 170 + i * 11, 1.8), '#d9aa3a');
      });
      paint(c, roundRect(14, 198, 172, 20, 3), '#b73a34', { line: 3, sh: [-3, -4], shade: '#7a2420' });
    });
    // scimitar hilt over the shoulder
    paint(c, poly([[150, 124], [158, 120], [166, 150], [158, 154]]), '#7a4d2a', { line: 2.6, sh: [-2, -2] });
    paint(c, poly([[142, 120], [166, 108], [170, 116], [148, 130]]), '#e8bf4a', { line: 2.4, sh: [-2, -2], shade: '#9a7416' });
  },
  front: (c, f) => borkHat(c, f),
};

export const OTTOMAN_CAST: readonly CastArt[] = [deniz, leyla, yusuf, turgut, mustafa, piali, janissary];
void shadeOf;
void ellipse;
void clipped;
