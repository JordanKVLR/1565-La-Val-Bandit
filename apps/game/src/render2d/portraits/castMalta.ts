/** The Order, the militia and the villagers of Malta. */
import type { CastArt } from './artTypes';
import { FACE_BASE } from './face';
import {
  type Ctx,
  INK,
  alpha,
  blobs,
  circle,
  clipped,
  ellipse,
  flat,
  lightOf,
  mix,
  paint,
  poly,
  roundRect,
  shadeOf,
  spline,
} from './kit';
import {
  beard,
  capShape,
  curlsBack,
  curlsFringe,
  goggles,
  hairCap,
  headband,
  kerchief,
  maltese,
  morion,
  neck,
  stache,
  strawHat,
  strokes,
  torso,
  torsoPath,
} from './parts';

/** Draws `fn` for the left (-1) and right (+1) side. */
const pair = (fn: (s: -1 | 1) => void) => {
  fn(-1);
  fn(1);
};
const X = (s: number, dx: number) => 100 + s * dx;

function pendant(c: Ctx, y: number, col: string, shape: 'jade' | 'cross' | 'round', cord = '#3a2418') {
  strokes(c, [[[88, 134], [93, 158], [100, y - 6]], [[112, 134], [107, 158], [100, y - 6]]], cord, 2);
  if (shape === 'jade') {
    paint(c, ellipse(100, y + 3, 7.5, 10, 0), col, { line: 2.4, rim: lightOf(col, 0.5), rimW: 1.6, sh: [-2, -3] });
    strokes(c, [[[97, y], [101, y - 2], [103, y + 3], [99, y + 6]]], alpha('#173a30', 0.9), 1.6);
  } else if (shape === 'cross') {
    paint(c, poly([[98, y - 6], [102, y - 6], [102, y - 1], [107, y - 1], [107, y + 3], [102, y + 3], [102, y + 11], [98, y + 11], [98, y + 3], [93, y + 3], [93, y - 1], [98, y - 1]]), col, { line: 2, sh: [-1, -1] });
  } else {
    paint(c, circle(100, y + 2, 6.5), col, { line: 2.4, rim: lightOf(col, 0.5), rimW: 1.4, sh: [-2, -2] });
    flat(c, circle(100, y + 2, 2.6), shadeOf(col, 0.4));
  }
}

function bandolier(c: Ctx, strap: string, flaskCol: string) {
  const path = (cc: Ctx) => {
    cc.moveTo(48, 142);
    cc.lineTo(60, 136);
    cc.lineTo(176, 214);
    cc.lineTo(150, 214);
    cc.closePath();
  };
  paint(c, path, strap, { line: 2.8, rim: lightOf(strap, 0.3), sh: [-2, -3] });
  for (let i = 0; i < 6; i++) {
    const x = 70 + i * 17;
    const y = 150 + i * 11.6;
    paint(c, roundRect(x - 3.6, y, 7.2, 15, 3), flaskCol, { line: 2, sh: [-1.5, -1.5] });
    flat(c, roundRect(x - 2, y - 2.5, 4, 3.4, 1), '#2a1815');
  }
}

function gunBarrel(c: Ctx) {
  const barrel = poly([[130, 104], [138, 100], [206, 150], [200, 158]]);
  paint(c, barrel, '#6d7684', { line: 2.8, rim: '#c8d0dc', rimW: 1.6, sh: [-2, -2] });
  const stock = poly([[162, 150], [172, 142], [206, 176], [196, 186]]);
  paint(c, stock, '#7a4d2a', { line: 2.8, sh: [-2, -2] });
}

function fabricFolds(c: Ctx, col: string, y0 = 160) {
  strokes(c, [[[40, y0], [46, y0 + 20], [42, y0 + 44]], [[160, y0 + 4], [154, y0 + 24], [158, y0 + 46]], [[72, y0 + 22], [78, y0 + 40]]], col, 2);
}

// ── Ninu ─────────────────────────────────────────────────────────────────────────────────────
const NINU_HAIR = '#1c1416';
export const ninu: CastArt = {
  id: 'ninu',
  accent: '#2f5fa8',
  setting: 'sky',
  face: {
    ...FACE_BASE,
    skin: '#d79e66',
    hair: NINU_HAIR,
    headW: 26.5,
    chin: 0.52,
    jaw: 0.28,
    eyes: 'almond',
    eyeSize: 1.08,
    iris: '#4b2c1a',
    lashes: 0.2,
    browThick: 3.4,
    nose: 'straight',
    age: 0.05,
    lip: '#b4584f',
    lipFull: 0.7,
    stubble: 0.12,
  },
  back: (c, f) => curlsBack(c, f, NINU_HAIR, 8.8),
  body: (c, f) => {
    neck(c, f.skin);
    const tp = torso(c, '#efe3c8', 82, 132, 15);
    clipped(c, tp, () => {
      pair((s) => {
        const panel = poly([[X(s, 82), 216], [X(s, 82), 160], [X(s, 52), 137], [X(s, 17), 132], [X(s, 12), 172], [X(s, 8), 216]]);
        paint(c, panel, '#87552f', { line: 3, rim: lightOf('#87552f', 0.3), sh: [-4, -5], shade: '#5b3920' });
        flat(c, ellipse(X(s, 52), 176, 5, 3.5, 0.5), alpha('#3a2212', 0.45));
        strokes(c, [[[X(s, 70), 190], [X(s, 62), 205]], [[X(s, 34), 150], [X(s, 30), 190]]], alpha('#3a2212', 0.55), 1.6);
      });
    });
    pair((s) => paint(c, poly([[X(s, 12), 128], [X(s, 32), 134], [X(s, 17), 156]]), '#f5ecd6', { line: 2.6, sh: [-2, -2], shade: '#d3c4a2' }));
    strokes(c, [[[96, 150], [100, 156], [104, 150]], [[100, 156], [100, 168]]], '#7a6a4a', 1.6);
    pendant(c, 178, '#4d8a78', 'jade');
  },
  front: (c, f) => curlsFringe(c, f, NINU_HAIR, -f.headH * 0.6, 7.2),
};

// ── Pawlu ────────────────────────────────────────────────────────────────────────────────────
const PAWLU_GREY = '#b9b6ae';
export const pawlu: CastArt = {
  id: 'pawlu',
  zoom: 1.1,
  accent: '#6b7a4a',
  setting: 'sky',
  face: {
    ...FACE_BASE,
    skin: '#c18a58',
    hair: '#8e8a84',
    headW: 27.5,
    chin: 0.58,
    jaw: 0.34,
    eyes: 'narrow',
    eyeSize: 1.05,
    iris: '#4a3a24',
    browThick: 4,
    browLen: 9,
    nose: 'broad',
    noseSize: 1.05,
    age: 0.85,
    marks: ['bags'],
    stubble: 0.2,
    lipFull: 0.3,
    beard: beard({ col: PAWLU_GREY, kind: 'trim', len: 4, top: 16 }),
  },
  back: (c, f) => {
    // grey hair at the sides, below the brim
    for (const s of [-1, 1]) blobs(c, [[s * (f.headW + 1), 2, 6], [s * (f.headW + 1), -6, 7]], '#a9a59d', {});
  },
  body: (c, f) => {
    neck(c, f.skin, 14);
    const tp = torso(c, '#7f94ad', 84, 132, 16);
    clipped(c, tp, () => {
      fabricFolds(c, alpha('#33445c', 0.5));
      strokes(c, [[[100, 150], [100, 214]]], alpha('#2c3a50', 0.7), 2);
      for (let i = 0; i < 4; i++) flat(c, circle(100, 164 + i * 15, 1.9), '#ebe3d0');
    });
    pair((s) => paint(c, poly([[X(s, 12), 128], [X(s, 34), 134], [X(s, 30), 152], [X(s, 4), 148]]), '#92a7c0', { line: 2.8, sh: [-2, -2], shade: '#5c718e' }));
    // sweat stain & sun-faded patch
    flat(c, ellipse(60, 190, 12, 7, 0.4), alpha('#5c718e', 0.3));
  },
  front: (c, f) => strawHat(c, f, '#d8b560', '#7a4a2a'),
};

// ── Kateri ───────────────────────────────────────────────────────────────────────────────────
const KATERI_HAIR = '#1a1316';
export const kateri: CastArt = {
  id: 'kateri',
  accent: '#3f8a6a',
  setting: 'workshop',
  face: {
    ...FACE_BASE,
    skin: '#c88e5e',
    hair: KATERI_HAIR,
    headW: 25.5,
    headH: 32,
    chin: 0.5,
    jaw: 0.25,
    ear: 0.8,
    eyes: 'almond',
    eyeSize: 1.1,
    iris: '#3b2616',
    lashes: 0.7,
    browThick: 2.9,
    browLen: 8,
    nose: 'straight',
    noseSize: 0.9,
    lip: '#b0504a',
    lipFull: 1,
    age: 0.15,
    marks: ['soot'],
  },
  back: (c, f) => curlsBack(c, f, KATERI_HAIR, 8.6, 5),
  body: (c, f) => {
    neck(c, f.skin, 12);
    const tp = torso(c, '#4f8a5a', 80, 132, 14);
    clipped(c, tp, () => {
      strokes(c, [[[40, 160], [44, 176]], [[160, 160], [156, 176]]], alpha('#27502f', 0.6), 1.8);
    });
    pair((s) => paint(c, poly([[X(s, 13), 130], [X(s, 24), 134], [X(s, 14), 146]]), '#efe3c8', { line: 2.2, shade: false }));
    // apron + straps
    const apron = poly([[X(-1, 40), 150], [X(1, 40), 150], [X(1, 54), 214], [X(-1, 54), 214]]);
    paint(c, apron, '#6e4a2c', { line: 3, rim: lightOf('#6e4a2c', 0.3), sh: [-4, -4], shade: '#46301b' });
    pair((s) => paint(c, poly([[X(s, 40), 150], [X(s, 30), 136], [X(s, 20), 132], [X(s, 14), 134], [X(s, 24), 146], [X(s, 30), 152]]), '#6e4a2c', { line: 2.6, sh: [-1, -2], shade: '#46301b' }));
    // pocket + wrench
    paint(c, roundRect(84, 178, 30, 24, 4), '#7c5632', { line: 2.6, sh: [-2, -2], shade: '#4d341d' });
    const wrench = poly([[104, 160], [110, 160], [111, 182], [103, 182]]);
    paint(c, wrench, '#aeb5c0', { line: 2.4, sh: [-2, -1], shade: '#6d7684' });
    paint(c, circle(107, 156, 6), '#aeb5c0', { line: 2.4, sh: [-2, -2], shade: '#6d7684' });
    flat(c, poly([[104, 148], [110, 148], [107, 156]]), '#6e4a2c');
    strokes(c, [[[84, 180], [114, 180]]], alpha('#2a1a0c', 0.55), 1.4);
    pendant(c, 168, '#d8a438', 'round', '#4b3320');
  },
  mid: (c, f) => {
    // ponytail over the right shoulder
    const tail = spline([[f.headW - 2, 4], [f.headW + 9, 18], [f.headW + 14, 40], [f.headW + 6, 56], [f.headW - 2, 44], [f.headW - 4, 20]], true);
    paint(c, tail, KATERI_HAIR, { rim: lightOf(KATERI_HAIR, 0.5), line: 3 });
    strokes(c, [[[f.headW + 2, 14], [f.headW + 6, 30], [f.headW + 4, 46]]], alpha('#5a4a58', 0.7), 1.6);
  },
  front: (c, f) => {
    const w = f.headW;
    const h = f.headH;
    // wavy side-parted fringe, in curls swept over the forehead
    const cs: [number, number, number][] = [];
    for (let i = -4; i <= 4; i++) cs.push([i * 6.2 + 2, -h * 0.66 + Math.abs(i) * 1.2 - (i === -2 ? 2 : 0), 7.3]);
    cs.push([-w + 1, -h * 0.35, 7], [w - 1, -h * 0.35, 7], [-w, -h * 0.05, 6], [w, -h * 0.05, 6]);
    blobs(c, cs, KATERI_HAIR, { light: alpha(lightOf(KATERI_HAIR, 0.6), 0.8) });
    goggles(c, f, '#5b3a22');
  },
};

// ── Fra Luis ─────────────────────────────────────────────────────────────────────────────────
const LUIS_HAIR = '#5c4a3c';
export const luis: CastArt = {
  id: 'luis',
  accent: '#7a2f3a',
  setting: 'stone',
  face: {
    ...FACE_BASE,
    skin: '#e0b48c',
    hair: LUIS_HAIR,
    headW: 28,
    headH: 34,
    chin: 0.7,
    jaw: 0.42,
    eyes: 'round',
    eyeSize: 0.98,
    iris: '#5d7a8a',
    browThick: 3.8,
    browLen: 9,
    nose: 'straight',
    noseSize: 1.05,
    age: 0.4,
    marks: ['scar'],
    stubble: 0.35,
    lipFull: 0.35,
    beard: beard({ col: '#6a584a', kind: 'trim', len: 3, top: 14 }),
    stache: stache({ col: '#6a584a', kind: 'thick', size: 0.75 }),
  },
  body: (c, f) => {
    neck(c, f.skin, 14);
    const tp = torso(c, '#2a2830', 84, 132, 15, { shade: '#16151b' });
    clipped(c, tp, () => {
      strokes(c, [[[34, 170], [40, 200]], [[166, 170], [160, 200]]], alpha('#000', 0.5), 2);
    });
    maltese(c, 100, 184, 46);
    // gorget
    const gorget = (cc: Ctx) => {
      cc.moveTo(72, 134);
      cc.quadraticCurveTo(100, 160, 128, 134);
      cc.lineTo(124, 124);
      cc.quadraticCurveTo(100, 140, 76, 124);
      cc.closePath();
    };
    paint(c, gorget, '#b3bcc9', { line: 3, rim: '#f0f5fb', rimW: 2.2, sh: [-3, -4], shade: '#707a8f' });
    // pauldrons
    pair((s) => {
      const p = ellipse(X(s, 64), 150, 25, 18, s * 0.45);
      paint(c, p, '#b3bcc9', { line: 3, rim: '#f0f5fb', rimW: 2.4, sh: [-4, -4], shade: '#707a8f' });
      strokes(c, [[[X(s, 48), 142], [X(s, 66), 138], [X(s, 82), 150]]], 'rgba(255,255,255,0.7)', 2);
      flat(c, circle(X(s, 70), 160, 1.8), '#e9b73a');
    });
  },
  front: (c, f) => hairCap(c, f, LUIS_HAIR, { hairY: -f.headH * 0.58, sideY: -f.headH * 0.12, part: -3, grow: 1.6 }),
};

// ── La Valette ───────────────────────────────────────────────────────────────────────────────
const VAL_WHITE = '#ece9e2';
export const valette: CastArt = {
  id: 'valette',
  accent: '#8c1c1c',
  setting: 'night',
  face: {
    ...FACE_BASE,
    skin: '#e4bd9c',
    hair: '#cfcdc8',
    headW: 26.5,
    headH: 34,
    chin: 0.5,
    jaw: 0.3,
    eyes: 'round',
    eyeSize: 0.95,
    iris: '#6a8fa6',
    browThick: 3.6,
    browLen: 9.5,
    nose: 'long',
    noseSize: 0.95,
    age: 0.8,
    marks: ['bags'],
    lipFull: 0.2,
    beard: beard({ col: VAL_WHITE, kind: 'long', len: 15, top: 15, spread: 0.7 }),
    stache: stache({ col: VAL_WHITE, kind: 'thick', size: 0.8 }),
  },
  back: (c, f) => {
    // the hood, lying on the shoulders behind the head
    const hood = spline([[-f.headW - 14, 30], [-f.headW - 12, -8], [-f.headW + 2, -f.headH - 6], [f.headW - 2, -f.headH - 6], [f.headW + 12, -8], [f.headW + 14, 30], [0, 48]], true);
    paint(c, hood, '#24222a', { rim: '#5a5766', rimW: 2.6, shade: '#121116' });
  },
  body: (c, f) => {
    neck(c, f.skin, 13);
    const tp = torso(c, '#26242c', 88, 132, 15, { shade: '#121116' });
    clipped(c, tp, () => strokes(c, [[[30, 160], [38, 205]], [[170, 160], [162, 205]], [[70, 170], [66, 210]], [[130, 170], [134, 210]]], alpha('#000', 0.55), 2));
    // hood roll around the neck
    pair((s) => paint(c, ellipse(X(s, 30), 140, 24, 12, s * -0.35), '#2e2c36', { line: 3, rim: '#6a6779', sh: [-3, -3], shade: '#14131a' }));
    const collar = poly([[88, 128], [112, 128], [110, 142], [90, 142]]);
    paint(c, collar, '#f4f0e6', { line: 2.6, shade: '#cfc8b6', sh: [-1, -2] });
    maltese(c, 100, 186, 52);
  },
  front: (c, f) => {
    // swept-back white hair, receding temples
    hairCap(c, f, '#d8d6d0', { hairY: -f.headH * 0.78, sideY: -f.headH * 0.16, part: -2, grow: 1.4 });
    strokes(c, [[[-18, -f.headH * 0.5], [-10, -f.headH * 0.8], [-2, -f.headH + 2]], [[18, -f.headH * 0.5], [10, -f.headH * 0.8], [2, -f.headH + 2]]], alpha('#8a8a92', 0.7), 1.5);
  },
};

// ── Balbi ────────────────────────────────────────────────────────────────────────────────────
export const balbi: CastArt = {
  id: 'balbi',
  accent: '#8a7a56',
  setting: 'stone',
  face: {
    ...FACE_BASE,
    skin: '#d3a078',
    hair: '#a8a8a8',
    headW: 27,
    chin: 0.6,
    jaw: 0.36,
    eyes: 'narrow',
    eyeSize: 1.1,
    iris: '#5a4a30',
    browThick: 3.8,
    nose: 'hook',
    age: 0.65,
    marks: ['bags'],
    stubble: 0.1,
    lipFull: 0.3,
    beard: beard({ col: '#b7b5b0', kind: 'trim', len: 4.5, top: 15 }),
    stache: stache({ col: '#b7b5b0', kind: 'walrus', size: 0.7 }),
  },
  body: (c, f) => {
    gunBarrel(c);
    neck(c, f.skin, 14);
    const tp = torso(c, '#a64a2e', 84, 132, 15);
    clipped(c, tp, () => {
      const jerkin = poly([[22, 216], [22, 170], [48, 142], [84, 133], [100, 150], [116, 133], [152, 142], [178, 170], [178, 216]]);
      paint(c, jerkin, '#b48652', { line: 3, rim: lightOf('#b48652', 0.3), sh: [-4, -5], shade: '#7c5a30' });
      strokes(c, [[[100, 150], [100, 214]]], alpha('#3a2412', 0.7), 2);
      for (let i = 0; i < 5; i++) flat(c, circle(100, 162 + i * 11, 1.8), '#5a3a1e');
      flat(c, ellipse(54, 190, 11, 6, 0.4), alpha('#3a2412', 0.25));
    });
    pair((s) => paint(c, poly([[X(s, 12), 128], [X(s, 32), 134], [X(s, 20), 152], [X(s, 4), 142]]), '#f4eedb', { line: 2.6, sh: [-2, -2], shade: '#cfc4a4' }));
    bandolier(c, '#5b3a22', '#c79a5a');
  },
  front: (c, f) => {
    hairCap(c, f, '#a8a8a8', { hairY: -f.headH * 0.7, sideY: -f.headH * 0.1, part: -4, grow: 1.6 });
    // quill behind the ear
    const q = poly([[-f.headW + 2, -4], [-f.headW - 12, -22], [-f.headW - 9, -24], [-f.headW + 4, -6]]);
    paint(c, q, '#f1ece0', { line: 2, sh: [-1, -1], shade: '#c9c0aa' });
  },
};

// ── Ġanni ────────────────────────────────────────────────────────────────────────────────────
const GANNI_HAIR = '#16121a';
export const ganni: CastArt = {
  id: 'ganni',
  accent: '#4d6fa0',
  setting: 'stone',
  face: {
    ...FACE_BASE,
    skin: '#dfa56e',
    hair: GANNI_HAIR,
    headW: 30,
    headH: 33,
    chin: 0.72,
    jaw: 0.44,
    eyes: 'round',
    eyeSize: 1.02,
    eyeSep: 13.5,
    iris: '#33231a',
    browThick: 3.8,
    browLen: 9.5,
    nose: 'broad',
    mouthW: 8.6,
    lip: '#b4584f',
    lipFull: 0.55,
    age: 0.15,
    stubble: 0.3,
  },
  body: (c, f) => {
    // spear shaft over the shoulder
    paint(c, poly([[148, 214], [156, 214], [196, 70], [189, 66]]), '#7d5630', { line: 2.8, sh: [-2, -2], shade: '#4e341c' });
    neck(c, f.skin, 17);
    // bare shoulders and arms
    const tp = torso(c, f.skin, 86, 130, 18, { shade: skinTone(f.skin) });
    clipped(c, tp, () => {
      flat(c, ellipse(100, 150, 18, 5), alpha('#7a2f3d', 0.12));
      strokes(c, [[[36, 160], [30, 180]], [[164, 160], [170, 180]]], alpha('#7a2f3d', 0.35), 2);
      pair((s) => {
        const panel = poly([[X(s, 62), 216], [X(s, 64), 156], [X(s, 38), 138], [X(s, 22), 132], [X(s, 14), 216]]);
        paint(c, panel, '#6e5c3e', { line: 3, rim: lightOf('#6e5c3e', 0.3), sh: [-4, -5], shade: '#463a26' });
        for (let i = 0; i < 4; i++) strokes(c, [[[X(s, 18 + i * 12), 140 + i * 2], [X(s, 16 + i * 12), 214]]], alpha('#2c2418', 0.55), 1.6);
        strokes(c, [[[X(s, 20), 168], [X(s, 62), 168]], [[X(s, 17), 190], [X(s, 62), 190]]], alpha('#2c2418', 0.55), 1.6);
      });
    });
  },
  front: (c, f) => {
    // a neat quiff
    hairCap(c, f, GANNI_HAIR, { hairY: -f.headH * 0.62, sideY: -f.headH * 0.12, part: 6, grow: 2, bulge: 2 });
    paint(c, spline([[-6, -f.headH - 1], [8, -f.headH - 7], [20, -f.headH + 2], [10, -f.headH * 0.78], [-4, -f.headH * 0.82]], true), GANNI_HAIR, { rim: lightOf(GANNI_HAIR, 0.5), line: 3 });
  },
};

function skinTone(skin: string) {
  return mix(skin, '#7a2f3d', 0.32);
}

// ── Rożi ─────────────────────────────────────────────────────────────────────────────────────
export const rozi: CastArt = {
  id: 'rozi',
  accent: '#5a86b8',
  setting: 'stone',
  face: {
    ...FACE_BASE,
    skin: '#c9926a',
    hair: '#2a1d1a',
    headW: 24.5,
    headH: 32,
    chin: 0.5,
    jaw: 0.24,
    ear: 0.8,
    eyes: 'almond',
    eyeSize: 1.1,
    iris: '#3a2616',
    lashes: 0.6,
    browThick: 3.4,
    browLen: 8.5,
    nose: 'straight',
    noseSize: 0.9,
    mouthW: 7,
    lip: '#a84e48',
    lipFull: 0.9,
    age: 0.15,
    marks: ['dirt'],
  },
  back: (c, f) => {
    for (const s of [-1, 1]) blobs(c, [[s * (f.headW + 1), 0, 6], [s * (f.headW + 2), 12, 6]], '#2a1d1a', {});
  },
  body: (c, f) => {
    gunBarrel(c);
    neck(c, f.skin, 12);
    const tp = torso(c, '#e8dcc0', 78, 132, 14);
    clipped(c, tp, () => {
      pair((s) => {
        const panel = poly([[X(s, 64), 216], [X(s, 64), 160], [X(s, 42), 140], [X(s, 20), 134], [X(s, 14), 216]]);
        paint(c, panel, '#6c7a4a', { line: 3, rim: lightOf('#6c7a4a', 0.3), sh: [-4, -5], shade: '#444f2d' });
        for (let i = 0; i < 4; i++) strokes(c, [[[X(s, 22 + i * 12), 142 + i * 2], [X(s, 20 + i * 12), 214]]], alpha('#262d17', 0.5), 1.5);
      });
      flat(c, poly([[24, 176], [34, 168], [38, 180], [28, 190]]), alpha('#c9b998', 1));
    });
    bandolier(c, '#5b3a22', '#c79a5a');
  },
  front: (c, f) => {
    const w = f.headW;
    // dark strands escaping the kerchief
    paint(c, spline([[-w + 1, -4], [-w - 3, 14], [-w - 1, 30], [-w + 4, 16]], true), '#2a1d1a', { line: 2.4 });
    kerchief(c, f, '#b0915e', '#6e5530', { side: -1, hairY: -f.headH * 0.5 });
  },
};

// ── Scala ────────────────────────────────────────────────────────────────────────────────────
export const scala: CastArt = {
  id: 'scala',
  zoom: 1.1,
  accent: '#b8742a',
  setting: 'stone',
  face: {
    ...FACE_BASE,
    skin: '#d8a578',
    hair: '#2a1d18',
    headW: 25.5,
    headH: 34,
    chin: 0.46,
    jaw: 0.22,
    eyes: 'almond',
    eyeSize: 1,
    eyeSep: 12,
    iris: '#4a3a24',
    browThick: 3,
    browLen: 9,
    nose: 'long',
    noseSize: 0.95,
    age: 0.35,
    lipFull: 0.35,
    beard: beard({ col: '#2a1d18', kind: 'goatee', len: 4 }),
    stache: stache({ col: '#2a1d18', kind: 'curl', size: 0.8 }),
  },
  body: (c, f) => {
    neck(c, f.skin, 13);
    // dark doublet and a small ruff
    const tp = torso(c, '#3a2430', 84, 132, 15);
    clipped(c, tp, () => {
      const plate = poly([[24, 216], [30, 166], [56, 140], [82, 134], [100, 146], [118, 134], [144, 140], [170, 166], [176, 216]]);
      paint(c, plate, '#aeb7c4', { line: 3, rim: '#f0f5fb', rimW: 2.4, sh: [-6, -6], shade: '#6f7a90' });
      strokes(c, [[[100, 146], [100, 216]]], '#6f7a90', 2.4);
      // engraved lion shield
      paint(c, poly([[84, 164], [116, 164], [116, 186], [100, 198], [84, 186]]), '#c9d1dc', { line: 2.4, sh: [-2, -2], shade: '#8892a5' });
      strokes(c, [[[91, 190], [92, 174], [98, 170], [104, 176], [108, 172]], [[95, 180], [106, 184]]], '#5a6478', 1.8);
      // engraving flourishes
      strokes(c, [[[40, 186], [50, 176], [60, 182], [68, 174]], [[160, 186], [150, 176], [140, 182], [132, 174]]], 'rgba(90,100,120,0.8)', 1.6);
    });
    pair((s) => {
      paint(c, ellipse(X(s, 66), 148, 22, 15, s * 0.4), '#aeb7c4', { line: 3, rim: '#f0f5fb', rimW: 2.2, sh: [-4, -4], shade: '#6f7a90' });
      strokes(c, [[[X(s, 54), 142], [X(s, 70), 140], [X(s, 82), 150]]], 'rgba(255,255,255,0.75)', 2);
    });
    // ruff
    const ruff = poly([[74, 128], [126, 128], [124, 142], [76, 142]]);
    paint(c, ruff, '#f4efe0', { line: 2.8, shade: '#cdc4a8', sh: [-2, -3] });
    for (let i = 0; i < 7; i++) strokes(c, [[[78 + i * 7.5, 130], [78 + i * 7.5, 141]]], alpha('#8a7a5a', 0.7), 1.2);
  },
  front: (c, f) => {
    // a little dark hair at the temples, below the helmet
    for (const s of [-1, 1]) paint(c, spline([[s * (f.headW + 1), -14], [s * (f.headW + 2), 6], [s * (f.headW - 5), -6]], true), '#2a1d18', { line: 2.2 });
    morion(c, f, '#c0302a');
  },
};

// ── Anastagi ─────────────────────────────────────────────────────────────────────────────────
const ANA_HAIR = '#5a3f2a';
export const anastagi: CastArt = {
  id: 'anastagi',
  accent: '#5c3a6e',
  setting: 'sky',
  face: {
    ...FACE_BASE,
    skin: '#d4a482',
    hair: ANA_HAIR,
    headW: 27.5,
    headH: 34,
    chin: 0.66,
    jaw: 0.4,
    eyes: 'narrow',
    eyeSize: 1.08,
    iris: '#6a7a6a',
    browThick: 3.8,
    nose: 'straight',
    age: 0.45,
    marks: ['bags', 'dirt'],
    stubble: 0.7,
    lipFull: 0.3,
  },
  body: (c, f) => {
    neck(c, f.skin, 14);
    const tp = torso(c, '#6a4a30', 84, 132, 15);
    clipped(c, tp, () => {
      // chainmail at the neck and shoulders
      flat(c, poly([[24, 216], [24, 160], [60, 138], [100, 150], [140, 138], [176, 160], [176, 216]]), '#8b9098');
      for (let y = 140; y < 175; y += 5)
        for (let x = 30 + ((y / 5) % 2) * 3; x < 172; x += 6) flat(c, circle(x, y + Math.abs(x - 100) * 0.12, 1.3), alpha('#2a2f38', 0.55));
      const plate = poly([[34, 216], [40, 176], [66, 156], [100, 170], [134, 156], [160, 176], [166, 216]]);
      paint(c, plate, '#9ea6b3', { line: 3, rim: '#eaf0f7', rimW: 2.4, sh: [-6, -6], shade: '#626d82' });
      strokes(c, [[[100, 170], [100, 216]]], '#626d82', 2.4);
      strokes(c, [[[56, 190], [70, 180]], [[144, 190], [130, 180]]], 'rgba(255,255,255,0.55)', 2);
    });
    pair((s) => {
      paint(c, ellipse(X(s, 68), 152, 19, 12, s * 0.4), '#8a92a2', { line: 3, rim: '#dfe6ef', rimW: 2, sh: [-3, -3], shade: '#555f74' });
      paint(c, roundRect(X(s, 52) - 3, 150, 6, 36, 2), '#6a4a30', { line: 2.4, shade: false });
    });
    pendant(c, 188, '#d8d2c2', 'cross');
  },
  front: (c, f) => {
    hairCap(c, f, ANA_HAIR, { hairY: -f.headH * 0.55, sideY: -f.headH * 0.08, part: 4, grow: 2.2, bulge: 1.5 });
    strokes(c, [[[-6, -f.headH * 0.55], [-2, -f.headH * 0.8], [4, -f.headH * 0.95]]], alpha('#2a1a10', 0.7), 1.6);
  },
};

// ── villagers and soldier ────────────────────────────────────────────────────────────────────
export const villager: CastArt = {
  id: 'villager',
  accent: '#7a6a4a',
  setting: 'stone',
  face: {
    ...FACE_BASE,
    skin: '#d1a07a',
    hair: '#7a7068',
    headW: 25,
    headH: 32,
    chin: 0.5,
    jaw: 0.26,
    ear: 0.8,
    eyes: 'round',
    eyeSize: 1.08,
    iris: '#5a4a34',
    lashes: 0.25,
    browThick: 2.6,
    browLen: 8,
    nose: 'button',
    noseSize: 1.1,
    mouthW: 7,
    lip: '#b0645c',
    lipFull: 0.5,
    age: 0.78,
    marks: ['bags'],
  },
  body: (c, f) => {
    neck(c, f.skin, 12);
    const tp = torso(c, '#7b5a3d', 80, 132, 14);
    clipped(c, tp, () => {
      fabricFolds(c, alpha('#3a2616', 0.5));
      // shawl
      const shawl = poly([[18, 216], [24, 168], [54, 140], [100, 168], [146, 140], [176, 168], [182, 216]]);
      paint(c, shawl, '#a29078', { line: 3, rim: lightOf('#a29078', 0.3), sh: [-5, -5], shade: '#6f5f4a' });
      for (let i = 0; i < 6; i++) strokes(c, [[[40 + i * 24, 180], [44 + i * 24, 214]]], alpha('#5a4a34', 0.6), 1.6);
    });
    pendant(c, 176, '#9a6a3a', 'cross', '#3a2418');
  },
  front: (c, f) => {
    const w = f.headW;
    kerchief(c, f, '#6f7f96', '#d8dfe8', { side: 1, hairY: -f.headH * 0.46 });
    // grey hair strand at the temple
    strokes(c, [[[-w + 3, -f.headH * 0.4], [-w + 1, -f.headH * 0.2], [-w + 3, 0]]], '#9a948c', 3);
  },
};

export const villagerMan: CastArt = {
  id: 'villager-man',
  accent: '#7a6a4a',
  setting: 'sky',
  face: {
    ...FACE_BASE,
    skin: '#dfad84',
    hair: '#1c1a1e',
    headW: 27,
    headH: 32,
    chin: 0.54,
    jaw: 0.22,
    ear: 1.2,
    eyes: 'round',
    eyeSize: 1.12,
    iris: '#3a2a20',
    browThick: 3.2,
    nose: 'button',
    noseSize: 1.05,
    age: 0,
    marks: ['ruddy', 'freckles'],
    lipFull: 0.5,
  },
  body: (c, f) => {
    neck(c, f.skin, 13);
    const tp = torso(c, '#bba679', 80, 132, 15);
    clipped(c, tp, () => {
      fabricFolds(c, alpha('#5c4c2c', 0.5));
      strokes(c, [[[100, 138], [100, 160]]], alpha('#5c4c2c', 0.7), 2);
      paint(c, roundRect(18, 192, 164, 14, 3), '#5b3a22', { line: 2.8, shade: false });
      paint(c, roundRect(92, 190, 16, 18, 3), '#c99a3a', { line: 2.2, shade: false });
    });
    pair((s) => paint(c, poly([[X(s, 13), 130], [X(s, 30), 136], [X(s, 14), 150]]), '#cdb98a', { line: 2.4, sh: [-2, -2], shade: '#8a7a54' }));
    pendant(c, 174, '#8a5a30', 'cross', '#3a2418');
  },
  front: (c, f) => {
    hairCap(c, f, '#1c1a1e', { hairY: -f.headH * 0.5, sideY: f.headH * 0.0, part: 2, grow: 2.8, bulge: 2 });
    headband(c, f, '#2a2830');
    for (const s of [-1, 1]) strokes(c, [[[s * 8, -f.headH - 2], [s * 14, -f.headH * 0.8], [s * 20, -f.headH * 0.6]]], alpha('#6a6a7a', 0.6), 1.6);
  },
};

export const soldier: CastArt = {
  id: 'soldier',
  accent: '#5a5a6a',
  setting: 'sea',
  face: {
    ...FACE_BASE,
    skin: '#d3a07b',
    hair: '#6a4a30',
    headW: 27,
    headH: 33,
    chin: 0.62,
    jaw: 0.36,
    eyes: 'narrow',
    eyeSize: 1.08,
    iris: '#5a6a5a',
    browThick: 3.6,
    nose: 'straight',
    age: 0.5,
    marks: ['bags'],
    stubble: 0.55,
    lipFull: 0.3,
  },
  body: (c, f) => {
    neck(c, f.skin, 14);
    const tp = torso(c, '#8b9098', 84, 132, 15);
    clipped(c, tp, () => {
      for (let y = 140; y < 180; y += 5)
        for (let x = 24 + ((y / 5) % 2) * 3; x < 178; x += 6) flat(c, circle(x, y + Math.abs(x - 100) * 0.12, 1.3), alpha('#2a2f38', 0.55));
      const bri = poly([[30, 216], [36, 172], [62, 150], [100, 166], [138, 150], [164, 172], [170, 216]]);
      paint(c, bri, '#6a4a32', { line: 3, rim: lightOf('#6a4a32', 0.3), sh: [-5, -5], shade: '#42301f' });
      for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) flat(c, circle(48 + i * 20 + (r % 2) * 10, 180 + r * 9, 1.8), '#c9ccd4');
      strokes(c, [[[100, 166], [100, 216]]], '#2a1c10', 2.2);
    });
    pair((s) => paint(c, ellipse(X(s, 68), 152, 18, 12, s * 0.4), '#9aa2b0', { line: 3, rim: '#e6ecf4', rimW: 2, sh: [-3, -3], shade: '#5d677c' }));
    pendant(c, 190, '#d8d2c2', 'cross');
  },
  front: (c, f) => {
    hairCap(c, f, '#6a4a30', { hairY: -f.headH * 0.56, sideY: -f.headH * 0.05, part: -2, grow: 2.4, bulge: 1.5 });
    strokes(c, [[[2, -f.headH * 0.56], [8, -f.headH * 0.82], [14, -f.headH * 0.96]]], alpha('#2a1a10', 0.7), 1.6);
  },
};

export const MALTA_CAST: readonly CastArt[] = [ninu, pawlu, kateri, luis, valette, balbi, ganni, rozi, scala, anastagi, villager, villagerMan, soldier];
void INK;
void torsoPath;
void capShape;
