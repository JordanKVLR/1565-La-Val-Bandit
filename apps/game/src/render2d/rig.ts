import type { FighterAnchors, Pose, PersonFigureSpec, Rig, RigSpec, V2 } from './contract';
import { MELEE_GUARD, guardFor } from '../render/Armatura';
import { K, OW, ell, limb, sw } from './figures/kit';
import { drawShield, drawWeapon, lookFor, paletteFor, styleFor, tipUV } from './figures/index';
import type { F, LimbStyle, Look, PersonLook, WeaponStyle } from './figures/index';
import {
  PERSON_GIRTH,
  PERSON_LEGS,
  PERSON_SCALE,
  personLookFor,
  personPose,
} from './figures/people';

/**
 * Side-view 2D skeleton driven by the same `Pose` as the 3D rig (render/Armatura.ts). Limb
 * proportions match the 3D rig so duelMoves keyframes read identically. Figure-local space:
 * feet at the origin, +x forward, +y up. The world transform adds baseX, pose.x (mirrored by
 * `facing`), pose.y, the fall, the fake spin (horizontal squash) and the sidestep depth scale.
 */

const UPPER = 0.32;
const FORE = 0.3;
const THIGH = 0.48;
const SHIN = 0.48;
const HIP_Y = THIGH + SHIN;
const SHOULDER_Y = 0.58;
const HEAD_X = 0.01;
const HEAD_Y = 0.8;

const GIRTH = [0.88, 1, 1.22] as const;

interface Joints {
  hipY: number;
  sa: number;
  sx: number;
  sy: number;
  // weapon arm
  ex: number;
  ey: number;
  hx: number;
  hy: number;
  wa: number;
  // off arm
  lex: number;
  ley: number;
  lhx: number;
  lhy: number;
}

function newJoints(): Joints {
  return {
    hipY: HIP_Y,
    sa: 0,
    sx: 0,
    sy: 0,
    ex: 0,
    ey: 0,
    hx: 0,
    hy: 0,
    wa: 0,
    lex: 0,
    ley: 0,
    lhx: 0,
    lhy: 0,
  };
}

const num = (v: number): number => (Number.isFinite(v) ? v : 0);

class Rig2D implements Rig {
  readonly spec: RigSpec;
  baseX: number;
  facing: 1 | -1;
  pose: Pose;
  time = 0;
  flash = 0;

  private readonly look: Look;
  private readonly style: WeaponStyle;
  private readonly limbs: LimbStyle;
  private readonly f: F;
  private readonly j = newJoints();
  private readonly tuv = { u: 0, v: 0 };
  private readonly shielded: boolean;
  private readonly barge: boolean;
  /** Set for plain people (story diorama): no weapon, own scale and look. */
  private readonly person: PersonLook | undefined;
  /** Uniform figure scale (people are smaller than armaturas). */
  private readonly sc: number;
  /** Leg length multiplier (people have shorter legs than armaturas). */
  private readonly legK: number;
  /** Arm and leg girth multiplier. */
  private readonly armG: number;
  private lastT = Number.NaN;
  private lastX = 0;
  private drag = 0;
  // world transform of the current frame
  private tx = 0;
  private ty = 0;
  private sx = 1;
  private sy = 1;
  private rot = 0;
  private pivY = 0;

  constructor(spec: RigSpec, baseX = 0, facing: 1 | -1 = 1) {
    this.spec = spec;
    this.baseX = baseX;
    this.facing = facing;
    const person = (spec as Partial<PersonFigureSpec>).person;
    this.person = person;
    this.pose = person ? personPose(person) : { ...MELEE_GUARD, ...guardFor(spec.weaponType) };
    this.look = person ? personLookFor(person) : lookFor(spec.model);
    this.legK = person ? PERSON_LEGS : 1;
    this.sc = person ? PERSON_SCALE * (person.height ?? 1) : 1;
    this.style = styleFor(spec.model, spec.weaponType);
    this.barge = spec.model === 'barge';
    const cls = spec.frameClass === 'heavy' ? 2 : spec.frameClass === 'light' ? 0 : 1;
    const machine = spec.model === 'machine' || spec.model === 'tower';
    this.armG = person ? PERSON_GIRTH[person.build] : (GIRTH[cls] ?? 1);
    const w = spec.weaponType;
    this.shielded =
      !person &&
      (spec.model === 'sipahi' || w === 'blunt') &&
      w !== 'firearm' &&
      w !== 'polearm' &&
      !!this.look.shield?.({} as F);
    this.f = {
      ctx: null as unknown as CanvasRenderingContext2D,
      spec,
      g: person ? this.armG : this.armG * (machine ? 1.1 : 1),
      cls,
      hero: !!spec.hero,
      t: 0,
      drag: 0,
      acc: sw(spec.accent),
      p: this.look.palette ?? paletteFor(spec),
      pose: this.pose,
      down: 0,
      armAngR: 0,
      armAngL: 0,
      wAng: 0,
    };
    this.limbs = this.look.limbs(this.f);
    tipUV(this.style, this.tuv);
  }

  // ── Skeleton ──────────────────────────────────────────────

  private solve(): void {
    const p = this.pose;
    const j = this.j;
    const t = this.time;
    const machine = this.spec.model === 'machine' || this.spec.model === 'tower';
    const breath = Math.sin(t * 2.2);
    const bob = machine ? Math.sin(t * 3.1) * 0.014 : breath * (this.person ? 0.012 : 0.008);
    j.hipY = (THIGH + SHIN) * this.legK + bob;
    j.sa = num(p.lean) + Math.sin(t * 2.2) * 0.012;
    const sn = Math.sin(j.sa);
    const cs = Math.cos(j.sa);
    // Spine-local (x, y) to figure-local.
    j.sx = -sn * SHOULDER_Y;
    j.sy = j.hipY + cs * SHOULDER_Y;
    const sway = breath * 0.02;
    const a1 = j.sa + num(p.sR) + sway;
    const a2 = a1 + num(p.eR);
    const a3 = a2 + num(p.wR);
    j.ex = j.sx + Math.sin(a1) * UPPER;
    j.ey = j.sy - Math.cos(a1) * UPPER;
    j.hx = j.ex + Math.sin(a2) * FORE;
    j.hy = j.ey - Math.cos(a2) * FORE;
    j.wa = a3;
    const b1 = j.sa + num(p.sL) - sway;
    const b2 = b1 + num(p.eL);
    j.lex = j.sx + Math.sin(b1) * UPPER;
    j.ley = j.sy - Math.cos(b1) * UPPER;
    j.lhx = j.lex + Math.sin(b2) * FORE;
    j.lhy = j.ley - Math.cos(b2) * FORE;
    this.f.wAng = a3;

    // World transform.
    const spin = num(p.spin);
    let spinX = Math.cos(spin);
    if (Math.abs(spinX) < 0.08) spinX = spinX < 0 ? -0.08 : 0.08;
    const zoom = 1 + num(p.z) * 0.12;
    const fall = num(p.fall);
    this.tx = this.baseX + num(p.x) * this.facing;
    this.sx = this.facing * spinX * zoom;
    this.sy = zoom;
    if (this.barge) {
      // The boat tips and sinks instead of lying down, and rocks on the swell.
      this.pivY = 0.3;
      this.rot = fall * 0.5 + Math.sin(t * 1.7) * 0.025;
      this.ty = num(p.y) - Math.min(1, fall) * 0.25 + Math.sin(t * 2.3) * 0.015;
    } else {
      this.pivY = 0;
      this.rot = fall;
      this.ty = num(p.y) + Math.min(1, Math.abs(Math.sin(fall))) * 0.14;
    }
    this.f.down = Math.min(1, Math.abs(fall) / 1.4);
  }

  /** Figure-local to world. */
  private world(lx: number, ly: number, out: V2): V2 {
    lx *= this.sc;
    const dy = ly * this.sc - this.pivY;
    const c = Math.cos(this.rot);
    const s = Math.sin(this.rot);
    const x = lx * c - dy * s;
    const y = lx * s + dy * c + this.pivY;
    out.x = this.tx + x * this.sx;
    out.y = this.ty + y * this.sy;
    return out;
  }

  anchors(): FighterAnchors {
    this.solve();
    const j = this.j;
    const sn = Math.sin(j.sa);
    const cs = Math.cos(j.sa);
    const at = (x: number, y: number): V2 =>
      this.world(x * cs - y * sn, x * sn + y * cs + j.hipY, { x: 0, y: 0 });
    const a = j.wa;
    const u = this.tuv.u;
    const v = this.tuv.v;
    return {
      chest: at(0.05, 0.36),
      head: at(HEAD_X, HEAD_Y),
      hand: this.world(j.hx, j.hy, { x: 0, y: 0 }),
      offHand: this.world(j.lhx, j.lhy, { x: 0, y: 0 }),
      tip: this.person
        ? this.world(j.hx, j.hy, { x: 0, y: 0 })
        : this.world(
            j.hx + v * Math.cos(a) + u * Math.sin(a),
            j.hy + v * Math.sin(a) - u * Math.cos(a),
            { x: 0, y: 0 },
          ),
      feet: this.world(0, 0, { x: 0, y: 0 }),
    };
  }

  // ── Drawing ───────────────────────────────────────────────

  private updateDrag(): void {
    const t = this.time;
    const x = num(this.pose.x);
    const dt = t - this.lastT;
    if (Number.isFinite(this.lastT) && dt > 0 && dt < 0.2) {
      const target = Math.max(-1, Math.min(1, ((x - this.lastX) / dt) * 0.3));
      this.drag += (target - this.drag) * Math.min(1, dt * 9);
      this.lastT = t;
      this.lastX = x;
    } else if (!(dt === 0)) {
      this.drag = 0;
      this.lastT = t;
      this.lastX = x;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const f = this.f;
    const p = this.pose;
    const look = this.look;
    K.lv = Math.max(0, Math.min(6, Math.round(num(this.flash) * 6)));
    this.updateDrag();
    this.solve();
    f.ctx = ctx;
    f.t = this.time;
    f.drag = this.drag;
    f.pose = p;
    const j = this.j;

    ctx.save();
    ctx.translate(this.tx, this.ty);
    ctx.scale(this.sx, this.sy);
    ctx.translate(0, this.pivY);
    ctx.rotate(this.rot);
    ctx.translate(0, -this.pivY);
    ctx.scale(this.sc, this.sc);
    // Re-apply the facing so that scale is (facing*spin*zoom) but the translate stays in world.
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    look.world?.(f);
    this.arm(true);
    this.leg(true);
    ctx.save();
    ctx.translate(0, j.hipY);
    ctx.rotate(j.sa);
    look.back?.(f);
    ctx.restore();
    this.leg(false);
    look.hull?.(f);

    // Torso, head and the pieces on top of them in the spine frame.
    ctx.save();
    ctx.translate(0, j.hipY);
    ctx.rotate(j.sa);
    look.torso(f);
    ctx.save();
    ctx.translate(HEAD_X, HEAD_Y);
    const hs = look.headScale ?? 1.12;
    ctx.scale(hs, hs);
    look.head(f);
    ctx.restore();
    look.front?.(f);
    ctx.restore();
    if (look.skirt) {
      ctx.save();
      ctx.translate(0, j.hipY);
      look.skirt(f);
      ctx.restore();
    }

    if (this.shielded) {
      ctx.save();
      ctx.translate(j.lhx, j.lhy);
      drawShield(f);
      ctx.restore();
    }
    this.arm(false);
    this.offHandOverlay();
    look.over?.(f);
    ctx.restore();
    K.lv = 0;
  }

  /** A two-handed grip: the off hand closes over the weapon so the hold reads. */
  private offHandOverlay(): void {
    const w = this.spec.weaponType;
    if (this.person) return;
    if (w !== 'polearm' && w !== 'firearm') return;
    const j = this.j;
    const dx = Math.sin(j.wa);
    const dy = -Math.cos(j.wa);
    const rx = j.lhx - j.hx;
    const ry = j.lhy - j.hy;
    const u = rx * dx + ry * dy;
    const perp = Math.abs(rx * dy - ry * dx);
    if (perp > 0.16 || u < -0.2 || u > 1.5) return;
    const ctx = this.f.ctx;
    ctx.save();
    ctx.translate(j.lhx, j.lhy);
    this.look.hand(this.f, true);
    ctx.restore();
  }

  private arm(far: boolean): void {
    const f = this.f;
    const ctx = f.ctx;
    const p = this.pose;
    const j = this.j;
    const look = this.look;
    const L = this.limbs;
    const g = this.armG * L.arm;
    const sway = Math.sin(this.time * 2.2) * 0.02;
    ctx.save();
    ctx.translate(0, j.hipY);
    ctx.rotate(j.sa);
    ctx.translate(0, SHOULDER_Y);
    ctx.rotate(far ? num(p.sL) - sway : num(p.sR) + sway);
    const ru = 0.078 * g;
    limb(ctx, f.p[L.upper], 0, 0, 0, -UPPER, ru, ru * 0.82, 0.026);
    look.pad?.(f, far);
    ctx.translate(0, -UPPER);
    ctx.rotate(far ? num(p.eL) : num(p.eR));
    const rf = 0.066 * g;
    limb(ctx, f.p[L.fore], 0, 0, 0, -FORE, rf, rf * 0.82, 0.024);
    look.fore?.(f, far);
    ctx.translate(0, -FORE);
    if (!far) {
      ctx.rotate(num(p.wR));
      if (!this.person) drawWeapon(f, this.style);
      look.hand(f, false);
    } else {
      look.hand(f, true);
    }
    ctx.restore();
  }

  private leg(far: boolean): void {
    const f = this.f;
    const ctx = f.ctx;
    const p = this.pose;
    const j = this.j;
    const look = this.look;
    const L = this.limbs;
    const g = this.armG * L.leg;
    const h = far ? num(p.hL) : num(p.hR);
    const k = far ? num(p.kL) : num(p.kR);
    ctx.save();
    ctx.translate(0, j.hipY);
    ctx.rotate(h);
    const rt = 0.11 * g;
    limb(ctx, f.p[L.thigh], 0, 0, 0, -THIGH * this.legK, rt, rt * 0.78, 0.03);
    look.thigh?.(f, far);
    ctx.translate(0, -THIGH * this.legK);
    ctx.rotate(k);
    const rs = 0.084 * g;
    limb(ctx, f.p[L.shin], 0, 0, 0, -SHIN * this.legK, rs, rs * 0.78, 0.028);
    ell(ctx, f.p[L.shin], 0, 0, rs * 0.9, rs * 0.9, 0, 0.02, 0);
    look.shin?.(f, far);
    ctx.translate(0, -SHIN * this.legK);
    // The foot stays mostly flat while the shin swings.
    ctx.rotate(-(h + k) * 0.75);
    look.boot(f, far);
    ctx.restore();
  }
}

void OW;

/** Creates the 2D rig for a figure spec. */
export function createRig(spec: RigSpec, baseX = 0, facing: 1 | -1 = 1): Rig {
  return new Rig2D(spec, baseX, facing);
}
