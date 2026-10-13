/**
 * Animated 2D unit sprites for the battle map (ADR 0013). A `MapFigure` draws the side-view rig
 * (render2d/rig.ts) onto a canvas used as the texture of a billboarded Sprite. It idles at about
 * 12 fps, and plays walk, lunge, hurt and knock-out poses on top of the unit's guard pose.
 * Presentation only: BattleView tells it what happened.
 */
import { CanvasTexture, LinearFilter, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';
import type { Facing } from '@m1565/core';
import { DIRECTIONS } from '@m1565/core';
import type { Pose } from '../render/Armatura';
import { POSE_KEYS, guardFor } from '../render/Armatura';
import type { PersonFigureSpec, Rig, RigSpec } from './contract';
import { PEOPLE, FALLBACK_PERSON } from './figures/peopleCast';
import { personPose } from './figures/people';
import { createRig } from './rig';

/** Figure-space extent of a sprite cell (units are ~0.55 of a figure's height). */
export const CELL_W = 2.5;
export const CELL_H = 2.3;
export const FOOT = 0.1;
/** World size of one figure unit on the map. */
export const FIGURE_UNIT = 0.64;
export const IDLE_MS = 1000 / 12;

export const LUNGE_S = 0.38;
export const HURT_S = 0.4;
export const KO_FALL_S = 0.55;
export const KO_FADE_S = 0.4;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export interface MapAnim {
  /** Walk phase in radians, or null when standing. */
  walk: number | null;
  /** Seconds into the lunge, or -1. */
  lunge: number;
  hurt: number;
  /** Seconds since being knocked out, or -1. */
  ko: number;
}

/** Writes the pose for the current animation state over `base` into `out`. */
export function mapPose(out: Pose, base: Pose, a: MapAnim, person = false): Pose {
  for (const k of POSE_KEYS) out[k] = base[k];
  if (a.walk !== null) {
    const s = Math.sin(a.walk);
    const c = Math.cos(a.walk);
    out.hR = base.hR + s * 0.62;
    out.hL = base.hL - s * 0.62;
    out.kR = base.kR - Math.max(0, c) * 0.7;
    out.kL = base.kL - Math.max(0, -c) * 0.7;
    out.y += Math.abs(s) * 0.05;
    out.lean += 0.07;
    out.sL = base.sL + s * 0.25;
    if (person) out.sR = base.sR - s * 0.25;
  }
  if (a.lunge >= 0) {
    const u = clamp01(a.lunge / LUNGE_S);
    // Wind back for the first third, then snap forward and recover.
    const bell = u < 0.3 ? -(u / 0.3) * 0.35 : Math.sin(((u - 0.3) / 0.7) * Math.PI);
    out.x += bell * 0.5;
    out.lean += bell * 0.22;
    out.sR += bell * 0.9;
    out.hR += bell * 0.3;
    out.kR -= bell * 0.2;
  }
  if (a.hurt >= 0) {
    const u = clamp01(a.hurt / HURT_S);
    const bell = Math.sin(Math.min(1, u * 1.6) * Math.PI) * (1 - u * 0.4);
    out.x -= bell * 0.22;
    out.lean -= bell * 0.3;
    out.sR -= bell * 0.4;
    out.y += bell * 0.04;
  }
  if (a.ko >= 0) {
    const u = clamp01(a.ko / KO_FALL_S);
    const e = 1 - (1 - u) * (1 - u);
    out.fall = e * 1.52;
    out.x -= e * 0.4;
    out.y += Math.sin(u * Math.PI) * 0.25;
    out.sR += e * 1.4;
    out.sL += e * 1.2;
  }
  return out;
}

/** Flash level for the hurt/KO state (white-hot, then fading). */
export function mapFlash(a: MapAnim): number {
  if (a.ko >= 0) return clamp01(1 - a.ko / 0.3);
  if (a.hurt >= 0) return clamp01(1 - a.hurt / (HURT_S * 0.85));
  return 0;
}

export class MapFigure {
  readonly sprite: Sprite;
  /** Mirror the side view (the unit faces screen-left). */
  mirror = false;
  /** The unit faces away from the camera: drawn slightly shaded. */
  away = false;
  walking = false;
  /** Set whenever the texture was redrawn; the view clears it after reading. */
  redrawn = false;
  readonly anim: MapAnim = { walk: null, lunge: -1, hurt: -1, ko: -1 };
  private readonly rig: Rig;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly texture: CanvasTexture;
  private readonly base: Pose;
  private readonly isPerson: boolean;
  private readonly pose: Pose;
  private readonly ppu: number;
  private clock: number;
  private last = 0;
  /** Minimum gap between idle redraws; BattleView stretches it when many units stand on the map. */
  idleMs = IDLE_MS;
  private lastDraw = -1e9;
  private phase: number;
  private dirty = true;
  private lastMirror = false;
  private lastAway = false;
  private disposed = false;

  constructor(spec: RigSpec, ppu = 96, seed = 0) {
    this.ppu = ppu;
    this.rig = createRig(spec, 0, 1);
    const person = (spec as Partial<PersonFigureSpec>).person;
    this.isPerson = !!person;
    this.base = person ? personPose(person) : { ...guardFor(spec.weaponType) };
    this.pose = { ...this.base };
    this.clock = seed * 1.7;
    this.phase = (seed * 0.37) % 1;
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.round(CELL_W * ppu);
    this.canvas.height = Math.round(CELL_H * ppu);
    this.ctx = this.canvas.getContext('2d');
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.minFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    this.sprite = new Sprite(
      new SpriteMaterial({ map: this.texture, transparent: true, depthWrite: false }),
    );
    this.sprite.scale.set(CELL_W * FIGURE_UNIT, CELL_H * FIGURE_UNIT, 1);
    this.sprite.center.set(0.5, FOOT / CELL_H);
    this.sprite.renderOrder = 1;
    this.draw();
  }

  lunge(): void {
    this.anim.lunge = 0;
  }
  hurt(): void {
    this.anim.hurt = 0;
  }
  ko(): void {
    this.anim.ko = 0;
    this.walking = false;
  }
  get knockedOut(): boolean {
    return this.anim.ko >= 0;
  }
  /** True once the knock-out has fully faded. */
  get gone(): boolean {
    return this.anim.ko >= KO_FALL_S + KO_FADE_S;
  }
  /** True while any one-shot or walk animation runs. */
  get busy(): boolean {
    const a = this.anim;
    return this.walking || a.lunge >= 0 || a.hurt >= 0 || (a.ko >= 0 && !this.gone);
  }

  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Steps the animation. Redraws at 12 fps when idling (only if `idle` and `visible`), every
   * call while a one-shot plays. Returns true while the figure still needs frames.
   */
  update(nowMs: number, idle: boolean, visible: boolean): boolean {
    const dt = this.last ? Math.min(0.1, Math.max(0, (nowMs - this.last) / 1000)) : 0;
    this.last = nowMs;
    const a = this.anim;
    const busy = this.busy;
    if (busy || idle) this.clock += dt;
    if (this.walking) a.walk = ((a.walk ?? 0) + dt * 11) % (Math.PI * 2);
    else a.walk = null;
    if (a.lunge >= 0) {
      a.lunge += dt;
      if (a.lunge >= LUNGE_S) a.lunge = -1;
    }
    if (a.hurt >= 0) {
      a.hurt += dt;
      if (a.hurt >= HURT_S) a.hurt = -1;
    }
    if (a.ko >= 0 && !this.gone) a.ko += dt;
    if (this.mirror !== this.lastMirror || this.away !== this.lastAway) this.dirty = true;
    if (a.ko >= KO_FALL_S) {
      this.sprite.material.opacity = clamp01(1 - (a.ko - KO_FALL_S) / KO_FADE_S);
    }
    const due = busy || this.dirty || (idle && nowMs - this.lastDraw >= this.idleMs);
    if (due && (visible || busy)) {
      this.draw();
      // Spread the idle redraws of many units over time instead of all landing on one frame.
      this.lastDraw = nowMs - (this.lastDraw < 0 ? this.phase * this.idleMs : 0);
    }
    return busy || (a.ko >= 0 && !this.gone);
  }

  draw(): void {
    const ctx = this.ctx;
    if (!ctx || this.disposed) return;
    const { canvas, rig } = this;
    this.dirty = false;
    this.lastMirror = this.mirror;
    this.lastAway = this.away;
    mapPose(this.pose, this.base, this.anim, this.isPerson);
    rig.pose = this.pose;
    rig.time = this.clock;
    rig.facing = this.mirror ? -1 : 1;
    rig.flash = mapFlash(this.anim);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height - FOOT * this.ppu);
    ctx.scale(this.ppu, -this.ppu);
    rig.draw(ctx);
    ctx.restore();
    if (this.away) {
      // Seen from behind: the same silhouette, a little darker.
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(18,14,30,0.26)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    this.texture.needsUpdate = true;
    this.redrawn = true;
  }

  dispose(): void {
    this.disposed = true;
    this.texture.dispose();
    this.sprite.material.dispose();
  }
}

/**
 * Whether a unit facing `facing` shows its right or left side to a camera looking from `angle`
 * (radians, as in BattleView.updateCamera) and whether it faces towards the camera.
 */
export function cameraFacing(facing: Facing, angle: number): { mirror: boolean; away: boolean } {
  const d = DIRECTIONS[facing];
  const screenX = d.x * Math.cos(angle) - d.y * Math.sin(angle);
  const toward = d.x * Math.sin(angle) + d.y * Math.cos(angle);
  return { mirror: screenX < 0, away: toward < 0 };
}

// ── Story actors without a figure ───────────────────────────

/**
 * A figure for a story actor: the cast member as a plain person (never an armatura; those belong
 * to battles). Unknown ids become an ordinary villager. The side colour shows as a sash tail and
 * an armband.
 */
export function storyFigureSpec(id: string, color: string): PersonFigureSpec {
  return {
    model: 'militia',
    weaponType: 'blade',
    frameClass: 'medium',
    accent: color,
    person: PEOPLE[id] ?? FALLBACK_PERSON,
  };
}

// ── Flat ground ring (shadow + side marker) ─────────────────

const ringCache = new Map<string, CanvasTexture>();

/** Shadow with a team ring: circle for the player's side, diamond for enemies. */
export function ringTexture(color: string, enemy: boolean): CanvasTexture {
  const key = `${color}|${enemy ? 1 : 0}`;
  const hit = ringCache.get(key);
  if (hit) return hit;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  if (g) {
    const m = S / 2;
    const sh = g.createRadialGradient(m, m, 4, m, m, m * 0.8);
    sh.addColorStop(0, 'rgba(0,0,0,0.5)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.fillRect(0, 0, S, S);
    const path = () => {
      g.beginPath();
      if (enemy) {
        const r = m * 0.78;
        g.moveTo(m, m - r);
        g.lineTo(m + r, m);
        g.lineTo(m, m + r);
        g.lineTo(m - r, m);
        g.closePath();
      } else g.arc(m, m, m * 0.66, 0, Math.PI * 2);
    };
    g.lineJoin = 'round';
    path();
    g.lineWidth = 15;
    g.strokeStyle = 'rgba(14,10,8,0.9)';
    g.stroke();
    path();
    g.lineWidth = 8;
    g.strokeStyle = color;
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  ringCache.set(key, tex);
  return tex;
}

export function disposeRingTextures(): void {
  for (const t of ringCache.values()) t.dispose();
  ringCache.clear();
}
