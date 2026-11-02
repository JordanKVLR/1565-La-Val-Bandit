import {
  Frame,
  K,
  Shape,
  Tube,
  band,
  disc,
  flag,
  flat,
  glow,
  inkR,
  inkU,
  joint,
  mkPath,
  paint,
  paintTube,
  refIn,
  refOut,
  rivetPath,
  rivets,
  seam,
  streak,
  sw,
} from './kit';
import type { LimbStyle, Look } from './types';
import { Boiler, MACH, rr } from './tower';

/**
 * The supply/gun barge (frame barge): a flat-bottomed wooden landing barge with iron bands and
 * rivets, a brass steam boiler and chimney at the stern, a swivel gun on the bow, oars, a rope
 * coil, a lantern post with a pennant, rippling water, and a boatman at the oars who fights with
 * the usual weapons. The hull is a root-frame plate drawn over the crewman's legs; the rig rocks
 * and sinks the whole thing on `fall`. Authored in reference pixels (570 px = 1 unit, y down,
 * waterline at the origin), shares the steam machinery with the siege tower.
 */

const WOOD = sw('#8b5c33', 'matte');
const WOOD_DARK = sw('#5e3d22', 'matte');
const WATER = sw('#3f93a8', 'cloth');
const CLOTH = sw('#d9ccaa', 'cloth');
const JERKIN = sw('#7a4f2c', 'matte');
const TROUSER = sw('#4a3a2c', 'matte');
const SKIN = sw('#cf9a6c', 'matte');
const SKIN_FAR = sw('#a97a52', 'matte');
const STRAW = sw('#d2b366', 'matte');

// ── Hull ──────────────────────────────────────────────────────

const HULL = Shape.d(
  'M -430 -338 L -410 -70 C -400 -16 -360 0 -300 0 L 420 0 C 490 0 530 -24 548 -96 L 592 -338 Z',
  true,
);
const PLANKS = mkPath(
  'M -418 -110 L 560 -110 M -424 -190 L 574 -190 M -428 -265 L 584 -265 M -300 -338 L -300 -4 M -120 -338 L -120 0 M 80 -338 L 80 0 M 280 -338 L 280 0 M 440 -338 L 450 -10',
);
const GUNWALE = Shape.d('M -446 -338 L 604 -338 L 604 -372 L -446 -372 Z', true);
const GUN_RIVETS = rivetPath(
  [-400, -356, -250, -356, -100, -356, 50, -356, 200, -356, 350, -356, 500, -356],
  4.4,
);
const IRON = Shape.d(
  'M -318 -338 L -282 -338 L -282 0 L -318 0 Z M -138 -338 L -102 -338 L -102 0 L -138 0 Z M 262 -338 L 298 -338 L 298 0 L 262 0 Z M 62 -338 L 98 -338 L 98 0 L 62 0 Z',
  true,
);
const IRON_RIVETS = rivetPath(
  [
    -300, -300, -300, -200, -300, -100, -120, -300, -120, -200, -120, -100, 80, -300, 80, -200, 80,
    -100, 280, -300, 280, -200, 280, -100,
  ],
  4,
);
const STRIPE = Shape.d('M -418 -262 L 580 -262 L 574 -200 L -424 -200 Z', true);
const PORTHOLES = (() => {
  const p = mkPath();
  for (const x of [-210, -30, 170, 370]) {
    p.moveTo(x + 22, -150);
    p.arc(x, -150, 22, 0, Math.PI * 2);
  }
  return p;
})();
const BOW_CAP = Shape.circle(596, -355, 26);
const CLEAT = Shape.d('M 470 -372 L 540 -372 L 530 -400 L 480 -400 Z', true);

// ── Fittings on deck ──────────────────────────────────────────

const BOILER = new Boiler(130, 300);
const BARREL = Shape.d(
  'M -80 -372 C -106 -420 -106 -500 -80 -540 L 80 -540 C 106 -500 106 -420 80 -372 Z',
);
const BARREL_HI = mkPath('M -62 -520 C -80 -480 -80 -420 -62 -388');
const BARREL_HOOPS = Shape.d(
  'M -96 -410 L 96 -410 L 96 -430 L -96 -430 Z M -96 -490 L 96 -490 L 96 -510 L -96 -510 Z',
  true,
);
const POST = Shape.d('M -432 -372 L -404 -372 L -410 -690 L -428 -690 Z', true);
const LANTERN = Shape.d(rr(-452, -770, 62, 84, 16), true);
const LANTERN_CAP = Shape.d('M -462 -768 L -380 -768 L -400 -806 L -442 -806 Z', true);
const ROPE_COIL = (() => {
  const p = mkPath();
  for (let i = 0; i < 3; i++) {
    p.moveTo(250 + 56 - i * 10, -386);
    p.ellipse(250, -386, 56 - i * 10, 22 - i * 3, 0, 0, Math.PI * 2);
  }
  return p;
})();
const ROPE_OUT = (() => {
  const p = mkPath();
  p.ellipse(250, -386, 62, 28, 0, 0, Math.PI * 2);
  return new Shape(p, new Frame(188, 0, 312, 0));
})();
const ROPE_RUN = mkPath(
  'M 500 -372 C 470 -250 330 -230 250 -330 M 560 -338 C 580 -240 520 -210 470 -190',
);
// Swivel gun on the bow: a brass barrel on a yoke and a post.
const GUN_POST = Shape.d('M 478 -372 L 528 -372 L 522 -458 L 484 -458 Z', true);
const GUN_YOKE = Shape.d('M 466 -462 L 546 -462 L 536 -496 L 476 -496 Z', true);
const GUN_BARREL = Shape.d('M 450 -520 L 690 -534 L 690 -470 L 450 -484 Z');
const GUN_HI = mkPath('M 462 -512 L 682 -524');
const GUN_BANDS = Shape.d(
  'M 500 -522 L 520 -523 L 520 -482 L 500 -483 Z M 600 -529 L 620 -530 L 620 -474 L 600 -475 Z',
  true,
);
const GUN_MUZZLE = Shape.d('M 686 -542 L 712 -544 L 712 -460 L 686 -462 Z', true);
const GUN_BREECH = Shape.circle(446, -502, 30);
const GUN_PIPE = mkPath('M -330 -340 C -250 -300 0 -300 150 -330 C 300 -355 400 -440 470 -490');
const GUN_PIPE_FR = new Frame(0, -490, 0, -300);
const OAR = Shape.d('M 0 0 L 700 0 L 700 -16 L 0 -16 Z');
const OAR_BLADE = Shape.d('M 640 8 L 840 10 L 840 -34 L 640 -30 Z');
const WAVE_FR = new Frame(0, -60, 0, 80);
const WAVE_N = 14;
const FR_FLAG = new Frame(0, 0.1, 0, -0.1);

// ── Crew (the boatman) ────────────────────────────────────────

const TORSO = Shape.d(
  'M -58 -334 C -74 -270 -64 -180 -54 -66 L 56 -62 C 70 -150 72 -262 56 -334 C 20 -352 -26 -352 -58 -334 Z',
);
const SHIRT = Shape.d(
  'M 10 -340 C 30 -330 56 -330 60 -318 L 62 -230 C 40 -220 20 -230 6 -250 Z',
  true,
);
const JERKIN_OPEN = mkPath('M 10 -342 C 6 -300 8 -260 14 -220');
const BUCKLES = rivetPath([-24, -280, -24, -220, -24, -160], 8);
const CREW_BELT = Shape.d(
  'M -62 -96 C -20 -72 30 -72 66 -96 L 66 -66 C 30 -42 -22 -42 -62 -66 Z',
  true,
);
const CREW_BUCKLE = Shape.d(rr(46, -92, 26, 34, 6));
const NECKERCHIEF = Shape.d('M -20 -354 C 0 -380 44 -380 62 -352 L 40 -312 Z', true);
const NECK = Shape.d('M -28 40 L 32 44 L 46 130 L -36 130 Z', true);
const FACE = Shape.d(
  'M -46 0 C -52 -44 -18 -66 22 -60 C 52 -54 62 -34 64 -16 C 74 -8 84 8 78 20 C 74 24 68 24 64 28 C 66 46 56 64 36 70 C 6 80 -32 64 -46 32 Z',
);
const STACHE = mkPath('M 68 28 C 54 36 38 38 22 32');
const EYE = (() => {
  const p = mkPath();
  p.ellipse(48, 4, 11, 7, -0.1, 0, Math.PI * 2);
  return p;
})();
const IRIS = (() => {
  const p = mkPath();
  p.arc(52, 4, 5.2, 0, Math.PI * 2);
  return p;
})();
const BROW = mkPath('M 28 -12 C 44 -20 58 -20 70 -14');
const EAR = Shape.d('M -12 2 C -24 0 -26 22 -12 28 C -4 30 4 22 2 10 C 0 2 -4 2 -12 2 Z', true);
const HAT_BRIM = Shape.d('M -120 -50 C -50 -26 70 -26 140 -56 C 100 -80 -80 -80 -120 -50 Z', true);
const HAT_CROWN = Shape.d('M -62 -56 C -66 -126 -10 -150 36 -140 C 76 -130 80 -90 76 -58 Z');
const HAT_BAND = mkPath('M -64 -62 C -20 -46 40 -50 78 -64');
const HAT_BAND_FR = new Frame(0, -76, 0, -44);
const GOGGLE_L = Shape.circle(50, -92, 22);
const GOGGLE_STRAP = mkPath('M 28 -88 C -10 -100 -50 -90 -64 -76');
const BRACER = Shape.d('M -33 52 C -37 96 -34 136 -28 164 L 28 164 C 34 136 37 96 33 52 Z');
const BRACER_BANDS = Shape.d(
  'M -36 52 L 36 52 L 35 68 L -35 68 Z M -30 150 L 30 150 L 29 166 L -29 166 Z',
  true,
);
const BRACER_HI = mkPath('M -22 74 C -26 104 -24 130 -18 146');
const GLOVE = Shape.d('M -22 -22 C -26 -4 -22 16 -8 26 L 12 26 C 24 16 26 -4 22 -22 Z');
const CUFF = Shape.d(rr(-28, -34, 56, 14, 6), true);
const ARMBAND = Shape.d('M -34 66 Q 0 78 34 66 L 35 98 Q 0 110 -35 98 Z', true);
const PAULD = Shape.d('M -50 6 C -56 -44 -6 -62 30 -48 C 50 -40 52 -14 48 8 L -46 22 Z');

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    t = new Tube(len, r0, r1, seg === 1 ? 0 : 1, seg === 2 ? 0.03 : 0.01);
    TUBES[i] = t;
  }
  return t;
}

export const barge: Look = {
  model: 'barge',
  headScale: 1.2,
  limbs: (): LimbStyle => ({
    upper: 'cloth',
    fore: 'skin',
    thigh: 'cloth',
    shin: 'leather',
    arm: 0.88,
    leg: 0.9,
  }),
  shieldWith: () => false,

  segment(f, seg, far, len, r0, r1) {
    const mat =
      seg === 0 ? CLOTH : seg === 1 ? (far ? SKIN_FAR : SKIN) : seg === 2 ? TROUSER : WOOD_DARK;
    paintTube(f.ctx, tube(seg, f.cls, len, r0, r1), mat, !far);
  },

  hull(f) {
    const c = f.ctx;
    const t = f.t;
    const lod = K.lod;
    const m = MACH;
    const swell = Math.sin(t * 2.6);
    refIn(c, 0, 0);
    // Lantern post with a glowing lantern, and the stern boiler behind the hull.
    paint(c, POST, WOOD_DARK, inkR(5), true);
    paint(c, LANTERN_CAP, m.brass, inkR(4), true);
    flat(c, LANTERN.p, '#2a1a08');
    glow(c, 'ember', -421, -728, 56, 64, 0.8 + 0.18 * Math.sin(t * 6) + 0.05 * Math.sin(t * 17));
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.grad(c, LANTERN.fr, false);
    c.stroke(LANTERN.p);
    c.save();
    c.translate(-300, -340);
    BOILER.draw(c, t, 1.3);
    c.restore();
    // Barrel and rope coil on the deck.
    c.save();
    c.translate(-110, 0);
    paint(c, BARREL, WOOD, inkR(5));
    if (lod > 0) streak(c, BARREL_HI, inkR(5), 0.35);
    paint(c, BARREL_HOOPS, m.steelFar, inkR(4), true);
    c.restore();
    // The hull: planks, iron straps, an accent stripe, portholes and a brass gunwale.
    paint(c, HULL, WOOD, inkR(6), true);
    if (lod > 0) seam(c, PLANKS, inkR(3.2), 0.5);
    paint(c, STRIPE, f.acc.as('cloth'), inkR(5), true);
    paint(c, IRON, m.steel, inkR(4.5), true);
    rivets(c, IRON_RIVETS, inkR(1.5));
    flat(c, PORTHOLES, '#150a06');
    if (lod > 0) {
      glow(c, 'ember', -210, -150, 26, 26, 0.5 + 0.2 * Math.sin(t * 3.7));
      glow(c, 'ember', 170, -150, 26, 26, 0.5 + 0.2 * Math.sin(t * 3.7 + 2));
    }
    c.lineWidth = inkR(5);
    c.strokeStyle = m.brass.at(0);
    c.stroke(PORTHOLES);
    paint(c, GUNWALE, m.brass, inkR(5.5), true);
    rivets(c, GUN_RIVETS, inkR(1.5));
    paint(c, BOW_CAP, m.brass, inkR(4.5));
    paint(c, CLEAT, m.steel, inkR(4), true);
    // Rope along the side and a coil on the deck.
    c.lineCap = 'round';
    c.lineWidth = inkR(8);
    c.strokeStyle = '#0e1118';
    c.stroke(ROPE_RUN);
    c.lineWidth = inkR(4);
    c.strokeStyle = m.rope.at(0);
    c.stroke(ROPE_RUN);
    paint(c, ROPE_OUT, m.rope, inkR(5));
    if (lod > 0) {
      c.lineWidth = inkR(4);
      c.strokeStyle = '#2c2418';
      c.stroke(ROPE_COIL);
    }
    // Steam pipe from the boiler to the swivel gun, the gun itself on the bow.
    band(c, GUN_PIPE, GUN_PIPE_FR, m.brass, inkR(20), 12);
    paint(c, GUN_POST, m.woodDark, inkR(5), true);
    paint(c, GUN_YOKE, m.brass, inkR(5), true);
    c.save();
    c.translate(446, -502);
    c.rotate(-0.06 + swell * 0.01);
    c.translate(-446, 502);
    paint(c, GUN_BARREL, m.steel, inkR(5.5));
    if (lod > 0) streak(c, GUN_HI, inkR(3.5), 0.7);
    paint(c, GUN_BANDS, m.brass, inkR(4), true);
    paint(c, GUN_MUZZLE, m.iron, inkR(4.5), true);
    paint(c, GUN_BREECH, m.brass, inkR(5));
    c.restore();
    // Oars dipping in the water, swaying.
    for (const [ox, oy, a, k] of [
      [-60, -372, 0.95, 0],
      [250, -372, 0.85, 1],
    ] as const) {
      c.save();
      c.translate(ox, oy);
      c.rotate(a + Math.sin(t * 1.8 + k * 1.4) * 0.05);
      paint(c, OAR, WOOD_DARK, inkR(4.5), true);
      paint(c, OAR_BLADE, WOOD, inkR(4.5), true);
      c.restore();
    }
    refOut(c);
    // Water ripples over the lower hull: one cached gradient, a few lines per frame.
    refIn(c, 0, 0);
    c.beginPath();
    c.moveTo(-640, 90);
    for (let i = 0; i <= WAVE_N; i++) {
      const x = -640 + (i / WAVE_N) * 1360;
      c.lineTo(x, -66 + Math.sin(t * 2.6 + i * 1.1) * 12);
    }
    c.lineTo(720, 90);
    c.closePath();
    c.globalAlpha = 0.86;
    c.fillStyle = WATER.grad(c, WAVE_FR, true);
    c.fill();
    c.globalAlpha = 1;
    c.lineWidth = inkR(5);
    c.strokeStyle = '#0e1118';
    c.stroke();
    if (lod > 0) {
      c.beginPath();
      for (let i = 0; i <= WAVE_N; i++) {
        const x = -640 + (i / WAVE_N) * 1360;
        const y = -50 + Math.sin(t * 2.6 + i * 1.1 + 0.6) * 12;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.lineWidth = inkR(5);
      c.strokeStyle = 'rgba(255,255,255,0.55)';
      c.stroke();
    }
    refOut(c);
    // Pennant on the lantern post.
    flag(
      c,
      f.acc.as('cloth'),
      FR_FLAG,
      -0.74,
      1.22,
      Math.PI * 0.98,
      0.1,
      0.5,
      0.2,
      0.04,
      0.25,
      t,
      0.6,
      f.drag,
      inkU(4.5),
      8,
    );
  },

  torso(f) {
    const c = f.ctx;
    c.save();
    c.scale(f.g * 1.1, 1);
    refIn(c, 0, 0);
    paint(c, TORSO, JERKIN, inkR(6));
    paint(c, SHIRT, CLOTH, inkR(4), true);
    if (K.lod > 0) seam(c, JERKIN_OPEN, inkR(3.5), 0.7);
    rivets(c, BUCKLES, inkR(1.5));
    paint(c, NECKERCHIEF, f.acc.as('cloth'), inkR(4.5), true);
    paint(c, CREW_BELT, MACH.leather, inkR(4.5), true);
    paint(c, CREW_BUCKLE, MACH.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  head(f) {
    const c = f.ctx;
    const lod = K.lod;
    const s = [0.96, 1, 1.05][f.cls] as number;
    c.save();
    c.translate(0, 0.02);
    c.scale(s, s);
    refIn(c, 0, 0);
    paint(c, NECK, SKIN, inkR(5), true);
    paint(c, FACE, SKIN, inkR(5.5));
    paint(c, EAR, SKIN, inkR(3.5), true);
    c.lineCap = 'round';
    c.lineWidth = inkR(13);
    c.strokeStyle = '#0e1118';
    c.stroke(STACHE);
    c.lineWidth = inkR(8);
    c.strokeStyle = '#4a3a28';
    c.stroke(STACHE);
    flat(c, EYE, '#f3ecd6');
    c.lineWidth = inkR(3);
    c.strokeStyle = '#0e1118';
    c.stroke(EYE);
    flat(c, IRIS, '#1a0f0a');
    c.lineWidth = inkR(7);
    c.stroke(BROW);
    // Straw hat with an accent band and brass goggles pushed up on the crown.
    paint(c, HAT_CROWN, STRAW, inkR(5.5), true);
    band(c, HAT_BAND, HAT_BAND_FR, f.acc.as('cloth'), inkR(20), 14);
    paint(c, HAT_BRIM, STRAW, inkR(5.5), true);
    if (lod > 0) {
      c.lineWidth = inkR(9);
      c.strokeStyle = '#0e1118';
      c.stroke(GOGGLE_STRAP);
      c.lineWidth = inkR(5);
      c.strokeStyle = MACH.leather.at(0);
      c.stroke(GOGGLE_STRAP);
      paint(c, GOGGLE_L, MACH.brass, inkR(5));
      c.fillStyle = 'rgba(160,220,235,0.85)';
      c.beginPath();
      c.arc(50, -92, 13, 0, Math.PI * 2);
      c.fill();
    }
    refOut(c);
    c.restore();
  },

  pad(f, far) {
    const c = f.ctx;
    const kk = [0.95, 1.1, 1.25][f.cls] as number;
    const swing = far ? f.pose.sL : f.pose.sR;
    if (!far) {
      c.save();
      c.scale(kk, 1);
      refIn(c, 0, 0);
      paint(c, ARMBAND, f.acc.as('cloth'), inkR(4), true);
      refOut(c);
      c.restore();
    }
    c.save();
    c.rotate(-swing * 0.6);
    c.scale(kk, kk);
    refIn(c, 0, 0);
    paint(c, PAULD, far ? WOOD_DARK : MACH.leather, inkR(5));
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = MACH;
    refIn(c, 0, 0);
    // A brass steam gauntlet on the forearm.
    paint(c, BRACER, far ? m.steelFar : m.steel, inkR(5));
    if (K.lod > 0) streak(c, BRACER_HI, inkR(3.5), 0.5);
    paint(c, BRACER_BANDS, m.brass, inkR(4), true);
    refOut(c);
    joint(c, far ? m.steelFar : m.steel, m.brass, 0, 0, 0.046, inkU(5));
  },

  hand(f, far) {
    const c = f.ctx;
    c.save();
    refIn(c, 0, 2);
    paint(c, GLOVE, far ? WOOD_DARK : MACH.leather, inkR(5));
    paint(c, CUFF, MACH.brass, inkR(4), true);
    refOut(c);
    c.restore();
  },

  boot(f, far) {
    // Mostly hidden below the gunwale: a simple boot.
    const c = f.ctx;
    c.save();
    c.scale(f.g, 1);
    refIn(c, 0, 0);
    paint(c, BOOT, far ? WOOD_DARK : MACH.leather, inkR(5), true);
    refOut(c);
    c.restore();
  },
};

const BOOT = Shape.d('M -34 -20 L 30 -22 C 70 -8 110 6 150 14 L 146 38 L -34 38 Z', true);
void disc;
void rr;
