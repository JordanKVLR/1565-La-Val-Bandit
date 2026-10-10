/**
 * The 2D duel close-up (ADR 0013): same public surface as render/DuelStage.ts. Two rigs on a
 * painted parallax stage, the same choreography as the 3D duel (duelMoves.ts), plus a script per
 * attack for the extra juice: smear arcs, sparks, hit-stop, shake, zooms and slow motion.
 * Only presentation; the result of the strike always comes from the rules engine.
 */
import type { StrikePlay } from '../render/DuelStage';
import type { FigureSpec, Pose } from '../render/Armatura';
import { guardFor, POSE_KEYS } from '../render/Armatura';
import type { Key, Move } from '../render/duelMoves';
import { GAP, moveFor, reactionFor } from '../render/duelMoves';
import { measureCanvas, renderPixelRatio } from '../render/resolution';
import { outcomeOf } from './attacks/styleDefaults';
import { scriptFor } from './attacks';
import { createBackdrop } from './backdrop';
import type { Backdrop, BackdropView } from './backdrop';
import type { AttackScript, FxContext, Rig } from './contract';
import { createFx } from './fx';
import type { FxEngine } from './fx';
import { createRig } from './rig';

export type { StrikePlay };
export type DuelFighter = FigureSpec;

export interface DuelStageOptions {
  /** Do not start the animation loop; the caller steps with `advance` and `render` (harness, tests). */
  manual?: boolean;
  seed?: number;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Writes the pose at time t (partial key poses over `base`, eased between keys) into `out`. */
function sampleInto(out: Pose, base: Pose, keys: readonly Key[], t: number): Pose {
  let prevT = 0;
  let prev: Partial<Pose> | null = null;
  for (const k of keys) {
    if (t <= k.t) {
      const u = ease(clamp01((t - prevT) / (k.t - prevT || 1)));
      for (const key of POSE_KEYS) {
        const a = prev ? (prev[key] ?? base[key]) : base[key];
        const b = k.p[key] ?? base[key];
        out[key] = a + (b - a) * u;
      }
      return out;
    }
    prevT = k.t;
    prev = k.p;
  }
  for (const key of POSE_KEYS) out[key] = prev ? (prev[key] ?? base[key]) : base[key];
  return out;
}

function copyPose(out: Pose, from: Pose): Pose {
  for (const key of POSE_KEYS) out[key] = from[key];
  return out;
}

interface Ghost {
  on: boolean;
  rig: Rig | null;
  pose: Pose;
  life: number;
  max: number;
  alpha: number;
}

interface Run {
  play: StrikePlay;
  atk: Rig;
  def: Rig;
  move: Move;
  script: AttackScript;
  atkGuard: Pose;
  defGuard: Pose;
  defKeys: Key[];
  total: number;
  t: number;
  started: boolean;
  impacted: boolean;
  dustLeft: number[];
  ctx: Mutable<FxContext>;
  nextGhost: number;
  smoked: boolean;
  done: boolean;
  resolve: () => void;
}

const SEED = 1565;

export class DuelStage2D {
  readonly fx: FxEngine;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly leftRig: Rig;
  private readonly rightRig: Rig;
  private readonly backdrop: Backdrop;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly calm: boolean;
  private readonly poseA: Pose;
  private readonly poseD: Pose;
  private readonly ghosts: Ghost[] = [];
  private run: Run | null = null;
  private chain: Promise<void> = Promise.resolve();
  private disposed = false;
  private frame = 0;
  private lastNow = 0;
  private clock = 0;
  private w = 0;
  private h = 0;
  private ratio = 1;
  private camPan = 0;
  private camZoom = 1;
  private camSide = 1;
  private skip = false;
  private readonly seed: number;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    left: FigureSpec,
    right: FigureSpec,
    groundColor = '#5b6b35',
    private readonly speed = 1,
    opts: DuelStageOptions = {},
  ) {
    this.seed = opts.seed ?? SEED;
    this.ctx = canvas.getContext('2d');
    this.calm = safeMatch('(prefers-reduced-motion: reduce)');
    this.fx = createFx(this.seed);
    this.fx.calm = this.calm;
    this.fx.setLow(safeMatch('(pointer: coarse)'));
    this.backdrop = createBackdrop(groundColor);
    this.leftRig = createRig(left, -GAP / 2, 1);
    this.rightRig = createRig(right, GAP / 2, -1);
    this.poseA = { ...guardFor(left.weaponType) };
    this.poseD = { ...guardFor(right.weaponType) };
    this.leftRig.pose = { ...guardFor(left.weaponType) };
    this.rightRig.pose = { ...guardFor(right.weaponType) };
    for (let i = 0; i < 7; i++)
      this.ghosts.push({ on: false, rig: null, pose: { ...this.poseA }, life: 0, max: 1, alpha: 0.4 });
    this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(canvas);
    this.resize();
    this.render();
    if (!opts.manual && typeof requestAnimationFrame !== 'undefined') {
      this.lastNow = typeof performance !== 'undefined' ? performance.now() : 0;
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  /** True while a strike is in progress. */
  get striking(): boolean {
    return this.run !== null;
  }

  /** Strike time reached so far (the full total once it has finished). */
  get strikeTime(): number {
    return this.run ? this.run.t : Number.POSITIVE_INFINITY;
  }

  /** Total seconds (animation time) of the strike being played, or 0. */
  get strikeTotal(): number {
    return this.run?.total ?? 0;
  }

  /** Plays one strike (approach, blow, reaction, return). Resolves when both fighters settle. */
  playStrike(play: StrikePlay): Promise<void> {
    const next = this.chain.then(
      () =>
        new Promise<void>((resolve) => {
          if (this.disposed) return resolve();
          this.beginStrike(play);
          const run = this.run!;
          run.resolve = resolve;
        }),
    );
    this.chain = next;
    return next;
  }

  /** Starts a strike without scheduling frames (the caller drives `advance` and `render`). */
  beginStrike(play: StrikePlay): void {
    this.finishRun();
    const [atk, def] = play.attacker === 'left' ? [this.leftRig, this.rightRig] : [this.rightRig, this.leftRig];
    const power = play.power ?? 1;
    const reach = play.reach ?? 1;
    let move = moveFor({ weapon: atk.spec.weaponType, style: play.style, power, reach });
    const script = scriptFor(play.attackId, play.style);
    if (script.choreograph) move = script.choreograph(move, { hit: play.hit, power, reach, heavy: move.heavy });
    const atkGuard = { ...guardFor(atk.spec.weaponType) };
    const defGuard = def.pose.fall > 0.5 ? { ...def.pose } : { ...guardFor(def.spec.weaponType) };
    const defKeys = reactionFor({
      reaction: play.reaction,
      hit: play.hit,
      defeated: play.defeated,
      weapon: def.spec.weaponType,
      attackStyle: play.style,
      heavy: move.heavy,
    });
    const atkEnd = move.keys[move.keys.length - 1]?.t ?? 0;
    const defEnd = move.impact + (defKeys[defKeys.length - 1]?.t ?? 0);
    const total = Math.max(atkEnd, defEnd) + 0.1;
    this.fx.reset(this.seed);
    for (const g of this.ghosts) g.on = false;
    const dir: 1 | -1 = play.attacker === 'left' ? 1 : -1;
    this.camSide = dir;
    const ctx: Mutable<FxContext> = {
      fx: this.fx,
      attacker: atk,
      defender: def,
      dir,
      hit: play.hit,
      defeated: play.defeated,
      power,
      reach,
      reaction: play.reaction,
      heavy: move.heavy,
      t: 0,
      impact: move.impact,
    };
    this.run = {
      play,
      atk,
      def,
      move,
      script,
      atkGuard,
      defGuard,
      defKeys,
      total,
      t: 0,
      started: false,
      impacted: false,
      dustLeft: [...move.dust],
      ctx,
      nextGhost: 0.12,
      smoked: false,
      done: false,
      resolve: () => undefined,
    };
    this.step(0);
  }

  dispose(): void {
    this.disposed = true;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.backdrop.dispose();
    const r = this.run;
    this.run = null;
    r?.resolve();
  }

  // ── loop ──

  private readonly tick = (now: number): void => {
    this.frame = 0;
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, now - this.lastNow) / 1000);
    this.lastNow = now;
    const striking = this.run !== null;
    if (striking || !this.skip) {
      this.advance(dt);
      this.render();
    }
    // Idle: draw at half rate (breathing, drifting clouds) to spare phone batteries.
    this.skip = !striking && !this.skip;
    if (!this.disposed) this.frame = requestAnimationFrame(this.tick);
  };

  /** Advances the stage by `dt` real seconds (a strike, if one is running, and idle animation). */
  advance(dt: number): void {
    const d = dt * this.speed;
    this.clock += d;
    if (this.run) this.step(dt);
    else {
      this.fx.update(d);
      this.leftRig.time = this.rightRig.time = this.clock;
    }
  }

  private step(realDt: number): void {
    if (this.run) this.stepRun(this.run, realDt);
  }

  private stepRun(run: Run, realDt: number): void {
    const fx = this.fx;
    const { atk, def, move, play, ctx, script } = run;
    const d = Math.min(0.05, realDt) * this.speed;
    fx.update(d);
    run.t = Math.min(run.total, run.t + fx.step);
    const t = run.t;
    atk.time = def.time = this.clock;

    // Poses.
    const sep = this.sep(run, t);
    sampleInto(this.poseA, run.atkGuard, move.keys, t);
    this.poseA.x += sep;
    if (t >= move.impact) sampleInto(this.poseD, run.defGuard, run.defKeys, t - move.impact);
    else copyPose(this.poseD, run.defGuard);
    this.poseD.x += sep;
    if (t >= move.impact && play.defeated) {
      // The body is flung: an extra hop and slide, then it fades away.
      const u = clamp01((t - move.impact) / 0.4);
      this.poseD.y += Math.sin(u * Math.PI) * (move.heavy ? 0.7 : 0.45);
      this.poseD.x -= (1 - (1 - u) * (1 - u)) * 0.2;
    }
    if (fx.timeScale === 0 && !this.calm && !play.defeated) this.poseD.x += (fx.rand() - 0.5) * 0.05;
    atk.pose = this.poseA;
    def.pose = this.poseD;
    def.flash = Math.max(0, def.flash - d * 5);
    atk.flash = Math.max(0, atk.flash - d * 6);

    // Hook context.
    ctx.t = t;
    if (!run.started) {
      run.started = true;
      script.start?.(ctx);
    }
    if (t < move.impact) script.windup?.(ctx);
    for (let i = 0; i < run.dustLeft.length; ) {
      if (t >= run.dustLeft[i]!) {
        run.dustLeft.splice(i, 1);
        const f = atk.anchors().feet;
        fx.dust({ x: f.x - ctx.dir * 0.2, y: 0 }, { n: move.heavy ? 10 : 6 });
      } else i++;
    }
    if (move.trail && t >= move.trail[0] && t <= move.trail[1] + 0.12) {
      fx.trailPoint('tip', atk.anchors().tip, {
        color: script.palette.accent,
        width: move.heavy ? 0.34 : 0.24,
        fade: 0.2,
      });
    }
    // Afterimages for charges, and for a dodge.
    if (play.style === 'charge' && t > 0.12 && t < move.impact && t >= run.nextGhost) {
      run.nextGhost = t + 0.06;
      this.ghost(atk, 0.3, 0.32);
    }
    if (play.reaction === 'avoid' && !play.hit && t >= move.impact && t < move.impact + 0.3 && t >= run.nextGhost) {
      run.nextGhost = t + 0.045;
      this.ghost(def, 0.38, 0.4);
    }
    if (!run.impacted && t >= move.impact) {
      run.impacted = true;
      this.impact(run);
    }
    if (run.impacted) script.follow?.(ctx);
    if (play.defeated && run.impacted && !run.smoked && t >= move.impact + 0.9) {
      run.smoked = true;
      const c = def.anchors().chest;
      fx.smoke({ x: c.x, y: 0.3 }, { n: 7, size: 0.25, rise: 0.7 });
      fx.dust({ x: c.x, y: 0 }, { n: 8 });
    }
    for (const g of this.ghosts) if (g.on && (g.life -= d) <= 0) g.on = false;

    // Camera: push in on the wind-up, ease back after contact.
    if (!this.calm) {
      const push =
        t < move.impact
          ? ease(Math.min(1, t / Math.max(0.01, move.impact)))
          : 1 - ease(Math.min(1, (t - move.impact) / 0.6));
      this.camZoom = 1 + 0.12 * push;
      this.camPan = ctx.dir * 0.22 * push;
    } else {
      this.camZoom = 1;
      this.camPan = 0;
    }

    if (t >= run.total && !run.done) {
      run.done = true;
      this.finishRun();
    }
  }

  private finishRun(): void {
    const run = this.run;
    if (!run) return;
    this.run = null;
    if (!run.impacted) {
      run.impacted = true;
      run.play.onImpact?.();
    }
    if (!run.play.defeated) run.def.pose = { ...guardFor(run.def.spec.weaponType) };
    run.atk.pose = { ...guardFor(run.atk.spec.weaponType) };
    run.def.flash = 0;
    run.atk.flash = 0;
    this.camZoom = 1;
    this.camPan = 0;
    run.resolve();
  }

  private sep(run: Run, t: number): number {
    if (!run.move.standoff) return 0;
    const ramp = Math.min(1, t / 0.2, (run.total - t) / 0.3);
    return (-run.move.standoff / 2) * ease(Math.max(0, ramp));
  }

  private ghost(rig: Rig, life: number, alpha: number): void {
    const g = this.ghosts.find((x) => !x.on) ?? this.ghosts[0]!;
    g.on = true;
    g.rig = rig;
    g.life = g.max = life;
    g.alpha = alpha;
    copyPose(g.pose, rig.pose);
  }

  /** Contact: the script's signature visual, then the outcome feedback every attack shares. */
  private impact(run: Run): void {
    const fx = this.fx;
    const { atk, def, play, ctx, script, move } = run;
    script.impactFx(ctx);
    const chest = def.anchors().chest;
    const at = { x: chest.x - ctx.dir * 0.12, y: chest.y };
    const o = outcomeOf(ctx);
    const pal = script.palette;
    const big = play.defeated ? 2 : move.heavy ? 1 : 0;
    if (o === 'hit') {
      def.flash = 1;
      fx.hitStop(big === 2 ? 150 : big === 1 ? 95 : 60);
      fx.shake(big === 2 ? 0.24 : big === 1 ? 0.14 : 0.07);
      fx.glow(at, { radius: 0.9, color: '#ffffff', life: 0.16 });
      if (big) fx.flash('#ffffff', big === 2 ? 0.4 : 0.22, 0.12);
    } else if (o === 'block') {
      const tip = def.anchors().tip;
      const p = { x: tip.x, y: tip.y };
      def.flash = play.hit ? 0.35 : 0;
      fx.hitStop(40);
      fx.shake(0.05);
      fx.glow(p, { radius: 0.8, color: '#fff6d0', life: 0.18 });
      fx.spark(p, { n: 16, color: pal.accent, speed: 8, dir: ctx.dir === 1 ? Math.PI * 0.5 : Math.PI * 0.5, spread: 3.2 });
      fx.burst(p, { n: 9, color: '#dfe8f0', length: 0.55, life: 0.25 });
      fx.ring(p, { color: '#ffffff', radius: 0.7, life: 0.3 });
      if (!play.hit) fx.word({ x: p.x, y: p.y + 0.65 }, 'CLANG!', { color: '#dfe8f0', size: 0.5, life: 0.7 });
    } else if (o === 'counter') {
      const tip = def.anchors().tip;
      const p = { x: tip.x, y: tip.y };
      fx.hitStop(80);
      fx.shake(0.09);
      fx.flash('#fff2b0', 0.5, 0.2);
      fx.ring(p, { color: '#8fe0ff', radius: 1.6, life: 0.45, width: 0.12 });
      fx.burst(p, { n: 12, color: '#8fe0ff', length: 1.0, life: 0.3 });
      fx.spark(p, { n: 16, color: '#bff0ff', speed: 8 });
      fx.word({ x: p.x, y: p.y + 0.8 }, 'COUNTER!', { color: '#8fe0ff', size: 0.55, life: 0.9 });
      fx.punch(p, 1.12, 0.5);
    } else if (o === 'dodge') {
      fx.speedLines({ dir: ctx.dir === 1 ? Math.PI : 0, color: '#ffffff', life: 0.25, n: 14 });
    }
    if (play.defeated) {
      fx.slowmo(0.28, 0.65);
      fx.impactFrame(0.06);
      fx.flash('#ffffff', 0.65, 0.25);
      fx.shake(0.28, 0.9);
      fx.burst(at, { n: 14, color: '#ff7a3a', length: 1.3, life: 0.5 });
      fx.ring(at, { color: '#ffd7a0', radius: 1.8, life: 0.6, width: 0.14 });
      fx.spark(at, { n: 28, color: '#ffcf5a', speed: 9 });
      fx.word({ x: at.x, y: 2.3 }, 'K.O.!', { color: '#ff5a3a', size: 0.95, life: 1.2, rot: -0.08 });
      fx.punch(at, 1.32, 0.95);
      fx.speedLines({ color: '#ffffff', life: 0.4, n: 40 });
      script.finish?.(ctx);
    }
    void atk;
    play.onImpact?.();
  }

  // ── drawing ──

  private resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    let ratio = 1;
    try {
      ratio = renderPixelRatio(measureCanvas(this.canvas));
    } catch {
      /* no window (tests) */
    }
    this.w = w;
    this.h = h;
    this.ratio = ratio;
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.render();
  }

  /** Draws the current state. */
  render(): void {
    const g = this.ctx;
    if (!g || this.disposed || !this.w) return;
    const { w, h } = this;
    const scale = Math.min(w / 8.6, h * 0.31);
    const groundY = h * 0.8;
    const fx = this.fx;
    const cam = fx.cam;
    const run = this.run;
    const midX = (this.leftRig.baseX + this.rightRig.baseX) / 2;
    const px = w / 2 + (midX + this.camSide * 0.25 * (this.camZoom - 1) * 4) * scale;
    const py = groundY - 0.9 * scale;
    const view: BackdropView = {
      w,
      h,
      groundY,
      scale,
      camX: this.camPan,
      zoom: this.camZoom * cam.zoom,
      pivotX: px,
      pivotY: py,
      time: this.clock,
    };
    const hz = (w / 2 / scale) / (this.camZoom * cam.zoom);
    fx.view.minX = this.camPan - hz + 0.1;
    fx.view.maxX = this.camPan + hz - 0.1;
    fx.view.maxY = Math.min(3.0, 0.9 + (groundY / scale - 0.9) / (this.camZoom * cam.zoom) - 0.1);
    g.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    g.clearRect(0, 0, w, h);
    this.backdrop.draw(g, view);
    fx.drawWash(g, w, h);

    g.save();
    g.translate(cam.dx * scale, -cam.dy * scale);
    g.translate(w / 2, h / 2);
    g.rotate(cam.roll);
    g.translate(-w / 2, -h / 2);
    // Base push-in, then the punch zoom about its own pivot.
    g.translate(px, py);
    g.scale(this.camZoom, this.camZoom);
    g.translate(-px, -py);
    if (cam.zoom > 1) {
      const qx = w / 2 + (cam.px - this.camPan) * scale;
      const qy = groundY - cam.py * scale;
      g.translate(qx, qy);
      g.scale(cam.zoom, cam.zoom);
      g.translate(-qx, -qy);
    }
    g.translate(w / 2 - this.camPan * scale, groundY);
    g.scale(scale, -scale);

    this.shadow(g, this.leftRig);
    this.shadow(g, this.rightRig);
    fx.drawBack(g);
    for (const gh of this.ghosts) {
      if (!gh.on || !gh.rig) continue;
      const rig = gh.rig;
      const keepPose = rig.pose;
      const keepFlash = rig.flash;
      rig.pose = gh.pose;
      rig.flash = 0.85;
      g.globalAlpha = gh.alpha * (gh.life / gh.max);
      rig.draw(g);
      rig.pose = keepPose;
      rig.flash = keepFlash;
    }
    g.globalAlpha = 1;
    // Defender behind, attacker in front.
    const order = run && run.atk === this.leftRig ? [this.rightRig, this.leftRig] : [this.leftRig, this.rightRig];
    for (const rig of order) {
      if (run && run.play.defeated && rig === run.def && run.impacted) {
        const fade = 1 - clamp01((run.t - run.move.impact - 0.65) / 0.45);
        g.globalAlpha = fade;
        if (fade > 0) rig.draw(g);
        g.globalAlpha = 1;
      } else rig.draw(g);
    }
    fx.drawFront(g);
    g.restore();
    this.backdrop.drawFore(g, view);
    fx.drawScreen(g, w, h);
  }

  private shadow(g: CanvasRenderingContext2D, rig: Rig): void {
    const a = rig.anchors();
    const lying = clamp01(rig.pose.fall / 1.4);
    const x = a.feet.x * (1 - lying) + a.chest.x * lying;
    const lift = Math.max(0, Math.min(1, rig.pose.y / 0.8));
    const rx = (0.55 + lying * 0.55) * (1 - lift * 0.35);
    g.save();
    g.translate(x, 0);
    g.scale(1, 0.2);
    g.fillStyle = `rgba(20,12,4,${0.2 * (1 - lift * 0.5)})`;
    g.beginPath();
    g.arc(0, 0, rx * 1.25, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgba(20,12,4,${0.3 * (1 - lift * 0.5)})`;
    g.beginPath();
    g.arc(0, 0, rx * 0.85, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

function safeMatch(q: string): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia(q).matches;
  } catch {
    return false;
  }
}
