import {
  Frame,
  K,
  Shape,
  Tube,
  band,
  disc,
  flag,
  flat,
  glint,
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
import type { Ctx, Swatch } from './kit';
import type { F, LimbStyle, Look } from './types';

/**
 * Scala's siege tower (frame siege-tower): a huge iron-banded timber tower on a steam-driven
 * tracked base, with a boiler and chimney at the back, a boarding ramp on ropes, banners in the
 * side colour, and a crewman on the fighting platform. The two gun arms come out of a bay in the
 * top storey. The legs are replaced by tracks that roll when the figure walks. Static plates are
 * authored in reference pixels (570 px = 1 unit, y down, feet at the origin) like knight.ts.
 * The steam machinery helpers (`Boiler`, `MACH`) are shared with the barge.
 */

// ── Shared steam machinery ────────────────────────────────────

export interface MachMats {
  brass: Swatch;
  brassFar: Swatch;
  steel: Swatch;
  steelFar: Swatch;
  iron: Swatch;
  wood: Swatch;
  woodDark: Swatch;
  leather: Swatch;
  rope: Swatch;
  white: Swatch;
  skin: Swatch;
}
export const MACH: MachMats = {
  brass: sw('#d9a443', 'metal'),
  brassFar: sw('#a97d2c', 'metal'),
  steel: sw('#a4adbd', 'metal'),
  steelFar: sw('#6f7787', 'metal'),
  iron: sw('#4f5766', 'metal'),
  wood: sw('#9a6a3a', 'matte'),
  woodDark: sw('#6a4526', 'matte'),
  leather: sw('#6b4226', 'matte'),
  rope: sw('#d8c690', 'matte'),
  white: sw('#f3ecd6', 'soft'),
  skin: sw('#cf9a6c', 'matte'),
};

export function rr(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} ` +
    `L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  );
}

/**
 * A brass boiler with steel hoops, rivets, a glowing furnace door, a pressure gauge and a
 * chimney that puffs steam. Authored with its base centre at the origin, y down, in reference px.
 */
export class Boiler {
  private readonly body: Shape;
  private readonly bands: Shape;
  private readonly rivs: Path2D;
  private readonly cap: Shape;
  private readonly stack: Shape;
  private readonly door: Shape;
  private readonly doorDark: Path2D;
  private readonly gauge: Shape;
  private readonly hi: Path2D;
  private readonly gy: number;
  private readonly dy: number;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    const hw = w / 2;
    this.body = Shape.d(rr(-hw, -h, w, h, w * 0.34));
    const ys = [0.28, 0.55, 0.82].map((k) => -h * k);
    this.bands = Shape.d(ys.map((y) => rr(-hw - 4, y - 8, w + 8, 16, 7)).join(' '), false);
    this.rivs = rivetPath(
      ys.flatMap((y) => [-hw * 0.7, y, 0, y, hw * 0.7, y]),
      3.6,
    );
    this.cap = Shape.d(rr(-hw * 0.5, -h - 30, w * 0.5 * 2, 36, 12), true);
    this.stack = Shape.d(rr(-hw * 0.22, -h - 130, hw * 0.44, 110, 6), true);
    this.dy = -h * 0.14;
    this.door = Shape.circle(0, this.dy, hw * 0.36);
    this.doorDark = mkPath();
    this.doorDark.arc(0, this.dy, hw * 0.27, 0, Math.PI * 2);
    this.gy = -h * 0.68;
    this.gauge = Shape.circle(0, 0, hw * 0.24);
    this.hi = mkPath(
      `M ${-hw * 0.62} ${-h * 0.9} C ${-hw * 0.7} ${-h * 0.6}, ${-hw * 0.7} ${-h * 0.3}, ${-hw * 0.6} ${-h * 0.06}`,
    );
  }
  draw(c: Ctx, t: number, phase = 0, puffs = true): void {
    const m = MACH;
    const lod = K.lod;
    const hw = this.w / 2;
    paint(c, this.stack, m.iron, inkR(5), true);
    paint(c, this.body, m.brass, inkR(6));
    if (lod > 0) {
      streak(c, this.hi, inkR(5), 0.4);
      paint(c, this.bands, m.steelFar, inkR(4));
    }
    rivets(c, this.rivs, inkR(1.5));
    paint(c, this.cap, m.steel, inkR(5), true);
    flat(c, this.doorDark, '#1a0e08');
    glow(
      c,
      'ember',
      0,
      this.dy,
      hw * 0.5,
      hw * 0.5,
      0.75 + 0.2 * Math.sin(t * 3.4 + phase) + 0.05 * Math.sin(t * 13),
    );
    c.lineWidth = inkR(5);
    c.strokeStyle = m.steel.grad(c, this.door.fr, false);
    c.stroke(this.door.p);
    if (lod > 0) {
      c.save();
      c.translate(0, this.gy);
      paint(c, this.gauge, m.white, inkR(4));
      c.lineWidth = inkR(4);
      c.strokeStyle = m.brass.grad(c, this.gauge.fr, false);
      c.stroke(this.gauge.p);
      const a = -0.8 + Math.sin(t * 1.7 + phase) * 0.4 + Math.sin(t * 7) * 0.05;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.sin(a) * hw * 0.2, -Math.cos(a) * hw * 0.2);
      c.lineWidth = inkR(3.5);
      c.strokeStyle = '#b01c24';
      c.stroke();
      c.restore();
    }
    if (puffs) {
      const n = lod === 0 ? 2 : lod === 1 ? 3 : 5;
      for (let i = 0; i < n; i++) {
        const ph = (t * 0.5 + i / n + phase * 0.1) % 1;
        const r = 28 + ph * 80;
        glow(
          c,
          'steam',
          Math.sin(t * 2 + i * 2) * 10 - ph * 70,
          -this.h - 140 - ph * 300,
          r,
          r,
          Math.min(1, (1 - ph) * 1.4) * 0.9,
        );
      }
    }
  }
}

// ── Tracked base ──────────────────────────────────────────────

const TRACK = Shape.d(rr(-470, -190, 930, 190, 95), true);
const TRACK_LINKS = mkPath(rr(-470, -190, 930, 190, 95));
const DASH_A = [26, 14];
const MUDGUARD = Shape.d('M -480 -200 L 470 -200 L 440 -250 L -440 -250 Z', true);
const GUARD_RIVETS = rivetPath(
  [
    -400, -224, -300, -224, -200, -224, -100, -224, 0, -224, 100, -224, 200, -224, 300, -224, 400,
    -224,
  ],
  4,
);
const WHEELS = [-360, -180, 0, 180, 360];
const WHEEL_R = 54;
const SPOKES = (() => {
  const p = mkPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    p.moveTo(0, 0);
    p.lineTo(Math.cos(a) * 46, Math.sin(a) * 46);
  }
  return p;
})();
const SPROCKET = (() => {
  const p = mkPath();
  const n = 10;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 86 : 70;
    if (i === 0) p.moveTo(r, 0);
    else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.closePath();
  return new Shape(p, new Frame(-86, 0, 86, 0));
})();

// ── Tower body ────────────────────────────────────────────────

const BODY = Shape.d('M -330 -250 L 250 -250 L 196 -990 L -276 -990 Z');
const BODY_PLANKS = (() => {
  const p = mkPath();
  for (let i = 1; i < 8; i++) {
    const k = i / 8;
    p.moveTo(-330 + 580 * k, -250);
    p.lineTo(-276 + 472 * k, -990);
  }
  return p;
})();
const POST_L = Shape.d('M -330 -250 L -296 -250 L -246 -990 L -276 -990 Z', true);
const POST_R = Shape.d('M 250 -250 L 214 -250 L 168 -990 L 196 -990 Z', true);
const IRON_BANDS = Shape.d(
  [
    'M -326 -380 L 244 -380 L 238 -420 L -322 -420 Z',
    'M -308 -600 L 228 -600 L 222 -640 L -304 -640 Z',
    'M -290 -820 L 210 -820 L 204 -860 L -286 -860 Z',
  ].join(' '),
  true,
);
const BAND_RIVETS = rivetPath(
  [
    -300, -400, -200, -400, -100, -400, 0, -400, 100, -400, 200, -400, -280, -620, -180, -620, -80,
    -620, 20, -620, 120, -620, 200, -620,
  ],
  4.4,
);
const BRACE = mkPath('M -300 -430 L 220 -590 M 220 -430 L -300 -590');
const BAY = Shape.d('M -90 -940 L 160 -940 L 160 -790 L -90 -790 Z', true);
const BAY_FRAME = Shape.d(
  'M -104 -954 L 174 -954 L 174 -776 L -104 -776 Z M -90 -940 L -90 -790 L 160 -790 L 160 -940 Z',
  false,
);
const LOOPS = [
  [-170, -520],
  [-170, -720],
  [90, -520],
] as const;
const LOOP_SHAPES = LOOPS.map(([x, y]) => Shape.d(rr(x - 22, y - 46, 44, 92, 10), true));
const PLATFORM = Shape.d('M -350 -990 L 270 -990 L 292 -1034 L -372 -1034 Z', true);
const PLAT_RIVETS = rivetPath([-300, -1010, -150, -1010, 0, -1010, 150, -1010, 230, -1010], 4);
const CORBELS = Shape.d(
  'M -300 -990 L -250 -990 L -276 -950 Z M 150 -990 L 200 -990 L 176 -950 Z',
  true,
);
const MERLONS = [-330, -190, -50, 90, 220] as const;
const MERLON_SHAPES = MERLONS.map((x) =>
  Shape.d(`M ${x} -1034 L ${x + 90} -1034 L ${x + 90} -1079 L ${x} -1079 Z`),
);
const MERLON_SLITS = (() => {
  const p = mkPath();
  for (const x of MERLONS) {
    p.moveTo(x + 45, -1046);
    p.lineTo(x + 45, -1068);
  }
  return p;
})();

// Ramp hanging on ropes from the front of the platform.
const RAMP = Shape.d('M 214 -990 L 286 -1000 L 492 -520 L 410 -500 Z');
const RAMP_PLANKS = mkPath(
  'M 248 -990 L 452 -510 M 230 -950 L 296 -940 M 270 -880 L 340 -870 M 310 -790 L 380 -780 M 350 -700 L 420 -690 M 390 -610 L 458 -600',
);
const RAMP_TIP = Shape.d('M 396 -526 L 500 -544 L 506 -500 L 408 -480 Z', true);
const RAMP_SPIKES = Shape.d(
  'M 410 -480 L 420 -452 L 432 -482 Z M 452 -490 L 462 -462 L 474 -492 Z',
  true,
);
const ROPES = mkPath('M 218 -1034 L 430 -640 M 270 -1034 L 478 -600');
const HINGE = Shape.circle(250, -994, 20);
const FR_FLAG = new Frame(0, 0.1, 0, -0.1);

// Pipes and the rear boiler.
const BOILER = new Boiler(150, 400);
const PIPE_A = mkPath('M -396 -300 C -440 -330 -400 -420 -330 -440');
const PIPE_B = mkPath('M -350 -510 C -330 -640 -270 -700 -260 -900');
const PIPE_FR = new Frame(0, -900, 0, -300);
const CHIMNEY_ARM = mkPath('M -396 -620 C -380 -700 -330 -740 -276 -760');

// ── Crewman (reference origin: the crewman's head, at its own fixed spot) ────────────────

const MORION = Shape.d('M -62 -6 C -70 -62 -20 -100 24 -92 C 56 -84 76 -50 70 -6 Z');
const MORION_BRIM = Shape.d('M -84 -4 C -40 8 40 8 98 -8 L 94 10 C 40 24 -40 24 -84 6 Z', true);
const MORION_COMB = mkPath('M -52 -62 C -18 -118 36 -112 66 -62');
const MORION_COMB_FR = new Frame(0, -118, 0, -62);
const CREW_FACE = Shape.d('M -40 4 L 54 4 C 58 40 40 74 6 76 C -30 74 -44 40 -40 4 Z');
const CREW_EYE = (() => {
  const p = mkPath();
  p.ellipse(28, 26, 9, 6, 0, 0, Math.PI * 2);
  return p;
})();
const CREW_BEARD = Shape.d('M -40 40 C -32 80 30 96 52 56 C 40 62 10 60 -6 48 Z');
const CREW_BUST = Shape.d(
  'M -90 150 C -94 90 -50 66 0 66 C 50 66 94 90 90 150 L 90 260 L -90 260 Z',
);
const CREW_STRAP = mkPath('M -60 90 L 70 220');
const FR_PLUME = new Frame(0, 0.25, 0, -0.25);

// ── Limbs ─────────────────────────────────────────────────────

const TUBES: (Tube | undefined)[] = [];
function tube(seg: number, cls: number, len: number, r0: number, r1: number): Tube {
  const i = seg * 3 + cls;
  let t = TUBES[i];
  if (!t || t.r0 !== r0 || t.len !== len) {
    t = new Tube(len, r0, r1, 2, 0.006);
    TUBES[i] = t;
  }
  return t;
}

const ROLL = new WeakMap<object, { t: number; ph: number }>();
/** Track phase: advances while the figure is walking (its legs would swing) or being shoved. */
function rollPhase(f: F): number {
  let s = ROLL.get(f);
  if (!s) {
    s = { t: f.t, ph: 0 };
    ROLL.set(f, s);
  }
  const dt = f.t - s.t;
  s.t = f.t;
  if (dt > 0 && dt < 0.25) {
    const swing = Math.abs(f.pose.hR - f.pose.hL);
    s.ph += dt * (Math.min(1, swing) * 9 + Math.abs(f.drag) * 7);
  }
  return s.ph;
}

const BOB = 0.014;

export const tower: Look = {
  model: 'tower',
  headScale: 1,
  limbs: (): LimbStyle => ({
    upper: 'armour',
    fore: 'armour',
    thigh: 'armour',
    shin: 'armour',
    arm: 1.15,
    leg: 0.01,
  }),

  segment(f, seg, far, len, r0, r1) {
    // The legs are the tracks: only the gun arms are drawn here.
    if (seg > 1) return;
    paintTube(
      f.ctx,
      tube(seg, f.cls, len, r0, r1),
      seg === 0 ? (far ? MACH.brassFar : MACH.brass) : far ? MACH.steelFar : MACH.steel,
      !far,
    );
  },

  hull(f) {
    const c = f.ctx;
    const m = MACH;
    const t = f.t;
    const lod = K.lod;
    const ph = rollPhase(f);
    refIn(c, 0, 0);
    // Rear boiler, chimney and pipes.
    c.save();
    c.translate(-450, -230);
    BOILER.draw(c, t, 0);
    c.restore();
    band(c, CHIMNEY_ARM, PIPE_FR, m.steel, inkR(20), 12);
    // Tower body: timber with iron bands.
    paint(c, BODY, m.wood, inkR(6), true);
    if (lod > 0) seam(c, BODY_PLANKS, inkR(3), 0.4);
    paint(c, POST_L, m.woodDark, inkR(5), true);
    paint(c, POST_R, m.woodDark, inkR(5), true);
    if (lod > 0) seam(c, BRACE, inkR(10), 0.9);
    if (lod > 0) {
      c.lineWidth = inkR(6);
      c.strokeStyle = m.woodDark.at(0);
      c.stroke(BRACE);
    }
    paint(c, IRON_BANDS, m.steel, inkR(5), true);
    rivets(c, BAND_RIVETS, inkR(1.5));
    // Loopholes with furnace light inside.
    for (let i = 0; i < LOOP_SHAPES.length; i++) {
      const s = LOOP_SHAPES[i] as Shape;
      const [lx, ly] = LOOPS[i] as readonly [number, number];
      flat(c, s.p, '#150a06');
      glow(c, 'ember', lx, ly, 34, 60, 0.5 + 0.25 * Math.sin(t * 4 + i * 1.7));
      c.lineWidth = inkR(5);
      c.strokeStyle = '#0e1118';
      c.stroke(s.p);
    }
    // The gun bay in the top storey, where the arms come out.
    flat(c, BAY.p, '#150a06');
    glow(c, 'ember', 36, -890, 150, 80, 0.35 + 0.1 * Math.sin(t * 3));
    paint(c, BAY_FRAME, m.brass, inkR(5), false);
    flat(c, BAY.p, 'rgba(21,10,6,0.78)');
    c.lineWidth = inkR(4);
    c.strokeStyle = '#0e1118';
    c.stroke(BAY.p);
    // Platform, corbels and the pipes up the back.
    paint(c, CORBELS, m.woodDark, inkR(4.5), true);
    paint(c, PLATFORM, m.wood, inkR(5.5), true);
    rivets(c, PLAT_RIVETS, inkR(1.5));
    band(c, PIPE_B, PIPE_FR, m.brass, inkR(20), 12);
    band(c, PIPE_A, PIPE_FR, m.brass, inkR(20), 12);
    // Boarding ramp hung on ropes.
    c.lineCap = 'round';
    c.lineWidth = inkR(7);
    c.strokeStyle = '#0e1118';
    c.stroke(ROPES);
    c.lineWidth = inkR(3.5);
    c.strokeStyle = m.rope.at(0);
    c.stroke(ROPES);
    paint(c, RAMP, m.wood, inkR(5.5));
    if (lod > 0) seam(c, RAMP_PLANKS, inkR(3), 0.55);
    paint(c, RAMP_TIP, m.steel, inkR(5), true);
    paint(c, RAMP_SPIKES, m.iron, inkR(4), true);
    paint(c, HINGE, m.brass, inkR(4));
    // Tracks: links, road wheels with spokes, sprockets, mudguard.
    paint(c, TRACK, m.iron, inkR(6.5), true);
    if (lod > 0) {
      c.setLineDash(DASH_A);
      c.lineDashOffset = -ph * 40;
      c.lineWidth = inkR(7);
      c.strokeStyle = m.steelFar.at(0);
      c.stroke(TRACK_LINKS);
      c.setLineDash([]);
    }
    for (let i = 0; i < WHEELS.length; i++) {
      const x = WHEELS[i] as number;
      c.save();
      c.translate(x, -96);
      c.rotate(ph * (i % 2 ? 1 : 1));
      if (lod === 0) {
        disc(c, m.brass, 0, 0, WHEEL_R, inkR(5));
      } else {
        disc(c, m.steel, 0, 0, WHEEL_R + 6, inkR(5));
        c.lineWidth = inkR(5);
        c.strokeStyle = m.iron.at(0);
        c.stroke(SPOKES);
        disc(c, m.brass, 0, 0, WHEEL_R * 0.45, inkR(4));
      }
      c.restore();
    }
    for (const x of [-420, 410]) {
      c.save();
      c.translate(x, -96);
      c.rotate(ph);
      paint(c, SPROCKET, m.steel, inkR(5));
      disc(c, m.brass, 0, 0, 36, inkR(4));
      c.restore();
    }
    paint(c, MUDGUARD, m.brass, inkR(5), true);
    rivets(c, GUARD_RIVETS, inkR(1.5));
    refOut(c);
    // Banners: a mast pennon and a streaming banner in the side colour.
    const acc = f.acc.as('cloth');
    const mx = -250 / 570;
    c.lineWidth = inkU(6);
    c.strokeStyle = '#0e1118';
    c.beginPath();
    c.moveTo(mx, 1034 / 570);
    c.lineTo(mx, 2.1);
    c.stroke();
    c.lineWidth = inkU(3);
    c.strokeStyle = m.brass.at(0);
    c.stroke();
    flag(
      c,
      acc,
      FR_FLAG,
      mx,
      2.0,
      Math.PI * 0.98,
      0.15,
      0.62,
      0.22,
      0.04,
      0.26,
      t,
      0.5,
      f.drag,
      inkU(4.5),
      8,
    );
    flag(
      c,
      acc,
      FR_FLAG,
      mx,
      2.12,
      Math.PI * 0.99,
      0.1,
      0.34,
      0.12,
      0.03,
      0.2,
      t,
      1.7,
      f.drag,
      inkU(4),
      6,
    );
    disc(c, m.brass, mx, 2.1, 0.03, inkU(3.5));
    // A hanging banner at the front of the platform.
    flag(
      c,
      acc,
      FR_FLAG,
      0.4,
      1.7,
      -Math.PI / 2 + 0.05,
      0.05,
      0.4,
      0.2,
      0.2,
      0.1,
      t,
      2.4,
      -f.drag * 0.5,
      inkU(4.5),
      6,
    );
    disc(c, m.brass, 0.4, 1.58, 0.034, inkU(3.5));
  },

  torso(f) {
    // The gun carriage: a brass rail across the bay on which the shoulders slide.
    const c = f.ctx;
    const m = MACH;
    c.save();
    c.rotate(-f.pose.lean);
    refIn(c, 0, 0);
    paint(c, RAIL, m.steel, inkR(5), true);
    rivets(c, RAIL_RIVETS, inkR(1.5));
    refOut(c);
    c.restore();
  },

  front(f) {
    // The crewman on the platform and the near merlons, held steady while the spine leans.
    const c = f.ctx;
    const m = MACH;
    const lod = K.lod;
    const t = f.t;
    const bob = Math.sin(t * 3.1) * BOB;
    c.save();
    c.rotate(-f.pose.lean);
    c.save();
    refIn(c, 0, -0.96 * 570);
    c.translate(40, -1090 + Math.sin(t * 2.2) * 6);
    paint(c, CREW_BUST, m.leather, inkR(5), true);
    c.lineWidth = inkR(8);
    c.strokeStyle = '#0e1118';
    c.stroke(CREW_STRAP);
    c.lineWidth = inkR(4);
    c.strokeStyle = m.brass.at(0);
    c.stroke(CREW_STRAP);
    paint(c, CREW_FACE, m.skin, inkR(5));
    paint(c, CREW_BEARD, sw('#2a2420'), inkR(4));
    flat(c, CREW_EYE, '#f3ecd6');
    c.lineWidth = inkR(3);
    c.strokeStyle = '#0e1118';
    c.stroke(CREW_EYE);
    c.fillStyle = '#1a0f0a';
    c.beginPath();
    c.arc(31, 26, 4.5, 0, Math.PI * 2);
    c.fill();
    paint(c, MORION_BRIM, m.steel, inkR(4.5), true);
    paint(c, MORION, m.steel, inkR(5.5));
    band(c, MORION_COMB, MORION_COMB_FR, m.brass, inkR(14), 9);
    if (lod > 0) glint(c, 30, -60, 12, 0.5 + 0.4 * Math.sin(t * 2.7));
    refOut(c);
    flag(
      c,
      f.acc.as('cloth'),
      FR_PLUME,
      0.07,
      1.12,
      3.5,
      0.5,
      0.26,
      0.1,
      0.02,
      0.16,
      t,
      0.9,
      f.drag,
      inkU(4.5),
      7,
    );
    c.restore();
    // Near merlons in front of the crewman.
    c.save();
    c.translate(0, -bob);
    refIn(c, 0, -0.96 * 570);
    for (const s of MERLON_SHAPES) paint(c, s, m.wood, inkR(5.5), true);
    if (lod > 0) seam(c, MERLON_SLITS, inkR(5), 0.8);
    refOut(c);
    c.restore();
    c.restore();
    void bob;
  },

  head() {
    // The crewman is drawn in `front` (a fixed spot on the platform).
  },

  pad(f, far) {
    // Round brass socket where the gun arm joins the carriage.
    const c = f.ctx;
    const m = MACH;
    const kk = [0.95, 1.1, 1.25][f.cls] as number;
    const swing = far ? f.pose.sL : f.pose.sR;
    c.save();
    c.rotate(-swing);
    c.scale(kk, kk);
    refIn(c, 0, 0);
    paint(c, SOCKET, far ? m.brassFar : m.brass, inkR(5.5));
    if (!far) {
      rivets(c, SOCKET_RIVETS, inkR(1.5));
      paint(c, SOCKET_HUB, m.steel, inkR(4));
      if (K.lod > 0) glint(c, -12, -14, 14, 0.5 + 0.4 * Math.sin(f.t * 2.4));
    }
    refOut(c);
    c.restore();
  },

  fore(f, far) {
    const c = f.ctx;
    const m = MACH;
    const r = 0.06;
    refIn(c, 0, 0);
    if (!far) {
      paint(c, PISTON, m.brass, inkR(5));
      paint(c, PISTON_RING, m.steelFar, inkR(3.5), true);
      paint(c, ROD, m.steel, inkR(4));
    }
    refOut(c);
    joint(c, far ? m.steelFar : m.steel, m.brass, 0, 0, r, inkU(5));
    void f;
  },

  hand(f, far) {
    // A clamp claw around the grip.
    const c = f.ctx;
    const m = MACH;
    c.save();
    refIn(c, 0, 2);
    paint(c, CLAW, far ? m.steelFar : m.steel, inkR(5));
    if (K.lod > 0) seam(c, CLAW_LINES, inkR(3));
    paint(c, CLAW_CUFF, m.brass, inkR(4), true);
    refOut(c);
    c.restore();
    void f;
  },

  boot() {
    // Tracks instead of feet.
  },

  over(f) {
    // Steam hissing from the gun bay.
    const c = f.ctx;
    const n = K.lod === 0 ? 1 : 3;
    c.save();
    c.rotate(-f.pose.lean);
    c.translate(0, -0.96);
    for (let i = 0; i < n; i++) {
      const ph = (f.t * 0.7 + i / n) % 1;
      const r = 0.05 + ph * 0.12;
      glow(c, 'steam', 0.42 + ph * 0.1, 1.55 + ph * 0.4, r, r, (1 - ph) * 0.7);
    }
    c.restore();
  },
};

// ── Gun carriage and arm plates ───────────────────────────────

const RAIL = Shape.d(rr(-300, -350, 600, 40, 12), true);
const RAIL_RIVETS = rivetPath(
  [-250, -330, -150, -330, -50, -330, 50, -330, 150, -330, 250, -330],
  4.2,
);
const SOCKET = Shape.circle(0, 0, 62);
const SOCKET_HUB = Shape.circle(0, 0, 26, true);
const SOCKET_RIVETS = rivetPath(
  Array.from({ length: 8 }, (_, i) => [
    Math.cos((i / 8) * Math.PI * 2) * 48,
    Math.sin((i / 8) * Math.PI * 2) * 48,
  ]).flat(),
  4,
);
const PISTON = Shape.d(rr(18, 20, 28, 120, 8));
const PISTON_RING = Shape.d(rr(14, 50, 36, 9, 4) + ' ' + rr(14, 100, 36, 9, 4), true);
const ROD = Shape.d(rr(25, 130, 14, 36, 5));
const CLAW = Shape.d('M -30 -26 C -36 -4, -34 24, -14 34 L 18 34 C 36 24, 36 -4, 30 -26 Z');
const CLAW_LINES = mkPath('M -32 -8 Q 0 -1 32 -8 M -32 8 Q 0 15 32 8 M -32 22 Q 0 29 32 22');
const CLAW_CUFF = Shape.d(rr(-36, -38, 72, 16, 6), true);
