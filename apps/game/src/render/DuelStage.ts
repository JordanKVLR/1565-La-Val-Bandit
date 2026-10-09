import type { AttackStyle, Reaction } from '@m1565/core';
import {
  AmbientLight,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { FigureSpec, Pose } from './Armatura';
import { ArmaturaFighter, guardFor, POSE_KEYS } from './Armatura';
import type { Key } from './duelMoves';
import { GAP, moveFor, reactionFor } from './duelMoves';
import { measureCanvas, renderPixelRatio } from './resolution';

export type DuelFighter = FigureSpec;

export interface StrikePlay {
  readonly attacker: 'left' | 'right';
  readonly style: AttackStyle;
  /** Technique power (1 = plain Thrust); scales the wind-up, knockback and shake. */
  readonly power?: number;
  /** Tiles the technique reaches (2 for Long Thrust: the fighters start further apart). */
  readonly reach?: number;
  readonly hit: boolean;
  readonly defeated: boolean;
  /** The defender's reaction; 'none' for a blow struck back or reflected. */
  readonly reaction: Reaction;
  /** Called at the moment of contact (update HP bars, play the hit sound). */
  readonly onImpact?: () => void;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const CAMERA_HOME = new Vector3(0, 1.35, 6.2);
const LOOK = new Vector3(0, 0.95, 0);
const TRAIL_SAMPLES = 10;

interface Particle {
  mesh: Mesh;
  v: Vector3;
  life: number;
  decay: number;
  grow: number;
  gravity: number;
}

/**
 * The duel close-up: two armaturas on a small stage. Every weapon and attack style has its own
 * animation (see duelMoves.ts), with weapon trails, sparks, dust, muzzle smoke and a camera that
 * pushes in and shakes on impact. Only presentation; results come from the rules engine.
 */
export class DuelStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 100);
  private readonly left: ArmaturaFighter;
  private readonly right: ArmaturaFighter;
  private readonly fx = new Group();
  private readonly particles: Particle[] = [];
  private readonly resizeObserver: ResizeObserver;
  private readonly calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private home = CAMERA_HOME.clone();
  private disposed = false;
  private frame = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    left: DuelFighter,
    right: DuelFighter,
    groundColor = '#5b6b35',
    private readonly speed = 1,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.camera.position.set(0, 1.35, 6.2);
    this.camera.lookAt(0, 0.95, 0);

    this.scene.add(new HemisphereLight(0xdfe8ff, 0x3a2e1e, 1.2));
    this.scene.add(new AmbientLight(0xffffff, 0.5));
    const sun = new DirectionalLight(0xfff0d0, 1.8);
    sun.position.set(-3, 6, 5);
    this.scene.add(sun);

    const ground = new Mesh(
      new CircleGeometry(9, 40),
      new MeshLambertMaterial({ color: groundColor }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    const shade = new Color(groundColor).multiplyScalar(0.7);
    for (let i = 0; i < 40; i++) {
      // Scattered tufts and stones so the ground reads as terrain, not a flat disc.
      const tuft = new Mesh(
        new SphereGeometry(0.05 + (i % 3) * 0.03, 6, 4),
        new MeshLambertMaterial({ color: shade }),
      );
      tuft.position.set(Math.sin(i * 12.9898) * 6, 0.02, Math.cos(i * 78.233) * 3 - 1);
      tuft.scale.y = 0.4;
      this.scene.add(tuft);
    }

    this.left = new ArmaturaFighter(left, -GAP / 2, 1);
    this.right = new ArmaturaFighter(right, GAP / 2, -1);
    this.scene.add(this.left.root, this.right.root, this.fx);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.render();
  }

  /** Plays one strike (approach, blow, reaction, return). Resolves when both fighters settle. */
  async playStrike(play: StrikePlay): Promise<void> {
    const [atk, def] = play.attacker === 'left' ? [this.left, this.right] : [this.right, this.left];
    const move = moveFor({
      weapon: atk.weaponType,
      style: play.style,
      power: play.power ?? 1,
      reach: play.reach ?? 1,
    });
    const atkGuard = guardFor(atk.weaponType);
    const defGuard = def.pose.fall > 0.5 ? def.pose : guardFor(def.weaponType);
    const defKeys = reactionFor({
      reaction: play.reaction,
      hit: play.hit,
      defeated: play.defeated,
      weapon: def.weaponType,
      attackStyle: play.style,
      heavy: move.heavy,
    });
    const atkEnd = move.keys[move.keys.length - 1]!.t;
    const defEnd = move.impact + (defKeys[defKeys.length - 1]?.t ?? 0);
    const total = Math.max(atkEnd, defEnd) + 0.1;
    // Long Thrust, guns and throws: both fighters stand further apart for the exchange.
    const sep = (t: number) => {
      if (!move.standoff) return 0;
      const ramp = Math.min(1, t / 0.2, (total - t) / 0.3);
      return (-move.standoff / 2) * ease(Math.max(0, ramp));
    };
    const side = play.attacker === 'left' ? -1 : 1;
    let impacted = false;
    let released = false;
    let projectile: Mesh | null = null;
    const trail: { tip: Vector3; hand: Vector3 }[] = [];
    const trailMesh = this.makeTrail();
    const dustLeft = [...move.dust];
    let shake = 0;

    await this.animate(
      total,
      (t) => {
        const a = sample(atkGuard, move.keys, t);
        atk.apply({ ...a, x: a.x + sep(t) });
        const d = t >= move.impact ? sample(defGuard, defKeys, t - move.impact) : defGuard;
        def.apply({ ...d, x: d.x + sep(t) });

        // Weapon trail through the swing.
        if (move.trail && t >= move.trail[0] && t <= move.trail[1] + 0.12) {
          if (t <= move.trail[1]) {
            trail.push({
              tip: atk.muzzle.getWorldPosition(new Vector3()),
              hand: atk.hand.getWorldPosition(new Vector3()),
            });
            if (trail.length > TRAIL_SAMPLES) trail.shift();
          } else trail.shift();
          this.updateTrail(trailMesh, trail);
        } else if (trail.length) {
          trail.length = 0;
          this.updateTrail(trailMesh, trail);
        }

        while (dustLeft.length && t >= dustLeft[0]!) {
          dustLeft.shift();
          this.dust(atk.root.position.clone().setY(0.02), move.heavy ? 10 : 6);
        }

        if (move.projectile && !released && t >= move.release) {
          released = true;
          const muzzle = atk.muzzle.getWorldPosition(new Vector3());
          if (move.projectile === 'shot') this.muzzleFlash(muzzle, side);
          projectile = this.spawnProjectile(move.projectile === 'bomb');
        }
        if (projectile && t < move.impact) {
          const from = atk.muzzle.getWorldPosition(new Vector3());
          const to = def.root.position.clone().add(new Vector3(0, play.hit ? 1.2 : 1.95, 0));
          const k = Math.min(1, (t - move.release) / Math.max(0.01, move.impact - move.release));
          projectile.position.lerpVectors(from, to, k);
          if (move.projectile === 'bomb') projectile.position.y += Math.sin(k * Math.PI) * 1.1;
        }

        if (!impacted && t >= move.impact) {
          impacted = true;
          if (projectile) {
            this.fx.remove(projectile);
            projectile.geometry.dispose();
            projectile = null;
          }
          const at = def.root.position.clone().add(new Vector3(-0.25 * side * -1, 1.2, 0.2));
          if (move.projectile === 'bomb') this.explosion(def.root.position.clone().setY(0.4));
          if (play.hit) {
            this.spark(at, move.heavy ? 16 : 10);
            shake = move.heavy || play.defeated ? 0.14 : 0.06;
          } else if (play.reaction === 'counter' || play.reaction === 'defend') {
            this.spark(def.hand.getWorldPosition(new Vector3()), 8);
            shake = 0.04;
          }
          if (play.defeated) this.dust(def.root.position.clone().setY(0.02), 12);
          play.onImpact?.();
        }

        // Camera: push in on the wind-up, shake on contact, ease back home.
        if (!this.calm) {
          const push =
            t < move.impact
              ? ease(Math.min(1, t / Math.max(0.01, move.impact)))
              : 1 - ease(Math.min(1, (t - move.impact) / 0.6));
          const target = this.home
            .clone()
            .add(new Vector3(side * 0.45 * push, -0.1 * push, -0.9 * push));
          if (shake > 0.002) {
            target.x += (Math.random() - 0.5) * shake;
            target.y += (Math.random() - 0.5) * shake;
            shake *= 0.86;
          }
          this.camera.position.copy(target);
          this.camera.lookAt(LOOK.clone().add(new Vector3(side * 0.2 * push, 0, 0)));
        }
      },
      // A defeating blow plays in slow motion for a moment.
      (t) => (play.defeated && !this.calm && t > move.impact && t < move.impact + 0.45 ? 0.35 : 1),
    );
    this.fx.remove(trailMesh);
    trailMesh.geometry.dispose();
    (trailMesh.material as MeshBasicMaterial).dispose();
    if (!play.defeated) def.apply({ ...guardFor(def.weaponType) });
    atk.apply({ ...atkGuard });
    this.camera.position.copy(this.home);
    this.camera.lookAt(LOOK);
    this.render();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.left.dispose();
    this.right.dispose();
    this.fx.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
    this.renderer.dispose();
  }

  /** Runs `step` each frame for `seconds` of animation time; `rate` can slow time down. */
  private animate(
    seconds: number,
    step: (t: number) => void,
    rate: (t: number) => number = () => 1,
  ): Promise<void> {
    let last = performance.now();
    let t = 0;
    return new Promise((resolve) => {
      const tick = (now: number) => {
        if (this.disposed) return resolve();
        const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
        last = now;
        t = Math.min(seconds, t + dt * this.speed * rate(t));
        step(t);
        this.updateFx(dt * this.speed);
        this.render();
        if (t >= seconds) resolve();
        else this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    });
  }

  private makeTrail(): Mesh {
    const geo = new BufferGeometry();
    const m = new Mesh(
      geo,
      new MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
      }),
    );
    m.frustumCulled = false;
    this.fx.add(m);
    return m;
  }

  /** A ribbon between the hand and the weapon tip over the last few frames, fading out. */
  private updateTrail(mesh: Mesh, samples: readonly { tip: Vector3; hand: Vector3 }[]): void {
    const pos: number[] = [];
    const col: number[] = [];
    const n = samples.length;
    for (let i = 0; i < n - 1; i++) {
      const a = samples[i]!;
      const b = samples[i + 1]!;
      const fa = (i / n) * 0.75;
      const fb = ((i + 1) / n) * 0.75;
      // Only the outer part of the blade leaves a streak.
      const ma = a.hand.clone().lerp(a.tip, 0.35);
      const mb = b.hand.clone().lerp(b.tip, 0.35);
      for (const [p, f] of [
        [ma, fa],
        [a.tip, fa],
        [b.tip, fb],
        [ma, fa],
        [b.tip, fb],
        [mb, fb],
      ] as const) {
        pos.push(p.x, p.y, p.z);
        col.push(1, 0.97, 0.85, f);
      }
    }
    mesh.geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
    mesh.geometry.setAttribute('color', new Float32BufferAttribute(col, 4));
    mesh.geometry.computeBoundingSphere();
  }

  private spawnProjectile(bomb: boolean): Mesh {
    const m = new Mesh(
      new SphereGeometry(bomb ? 0.11 : 0.045, 8, 6),
      new MeshBasicMaterial({ color: bomb ? '#2e2e2e' : '#fff1b0' }),
    );
    if (!bomb) m.scale.set(3, 1, 1);
    this.fx.add(m);
    return m;
  }

  private particle(
    at: Vector3,
    color: string,
    size: number,
    v: Vector3,
    opts: { decay?: number; grow?: number; gravity?: number; opacity?: number } = {},
  ): void {
    const mesh = new Mesh(
      new SphereGeometry(size, 6, 5),
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: opts.opacity ?? 1,
        depthWrite: false,
      }),
    );
    mesh.position.copy(at);
    this.fx.add(mesh);
    this.particles.push({
      mesh,
      v,
      life: opts.opacity ?? 1,
      decay: opts.decay ?? 2.2,
      grow: opts.grow ?? 0,
      gravity: opts.gravity ?? 3,
    });
  }

  private spark(at: Vector3, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.particle(
        at,
        i % 2 ? '#fff4c2' : '#ffb347',
        0.03,
        new Vector3(Math.cos(a) * 2.2, 1 + (i % 3) * 0.6, Math.sin(a) * 1.4),
        { decay: 2.6, gravity: 6 },
      );
    }
  }

  private dust(at: Vector3, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      this.particle(
        at.clone().add(new Vector3(Math.cos(a) * 0.15, 0.02, Math.sin(a) * 0.15)),
        '#b8a67a',
        0.07,
        new Vector3(Math.cos(a) * 0.7, 0.35, Math.sin(a) * 0.5),
        { decay: 1.3, grow: 1.6, gravity: 0.3, opacity: 0.6 },
      );
    }
  }

  private muzzleFlash(at: Vector3, side: number): void {
    this.particle(at, '#fff6c8', 0.16, new Vector3(-side * 1.5, 0, 0), {
      decay: 7,
      grow: 2,
      gravity: 0,
    });
    this.particle(at, '#ff9b2f', 0.1, new Vector3(-side * 0.8, 0, 0), {
      decay: 6,
      grow: 1.5,
      gravity: 0,
    });
    for (let i = 0; i < 6; i++) {
      this.particle(
        at,
        '#cfcac0',
        0.09,
        new Vector3(-side * (0.4 + i * 0.12), 0.15 + i * 0.05, (i % 2 ? 1 : -1) * 0.1),
        { decay: 0.6, grow: 1.8, gravity: -0.1, opacity: 0.55 },
      );
    }
  }

  private explosion(at: Vector3): void {
    this.particle(at, '#ffd36b', 0.3, new Vector3(), { decay: 3, grow: 5, gravity: 0 });
    this.particle(at, '#ff7a1a', 0.25, new Vector3(), { decay: 2.4, grow: 4, gravity: 0 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      this.particle(
        at,
        '#5a544c',
        0.14,
        new Vector3(Math.cos(a) * 0.8, 0.8 + (i % 3) * 0.3, Math.sin(a) * 0.5),
        { decay: 0.7, grow: 1.5, gravity: 0.2, opacity: 0.7 },
      );
    }
    this.spark(at, 14);
  }

  private updateFx(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.mesh.position.addScaledVector(p.v, dt);
      p.v.y -= p.gravity * dt;
      p.life -= p.decay * dt;
      if (p.grow) p.mesh.scale.multiplyScalar(1 + p.grow * dt);
      (p.mesh.material as MeshBasicMaterial).opacity = Math.max(0, p.life);
      if (p.life <= 0) {
        this.fx.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as MeshBasicMaterial).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    // Screen density, TV zoom and the 4K cap (ADR 0010).
    this.renderer.setPixelRatio(renderPixelRatio(measureCanvas(this.canvas)));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep both fighters in frame on narrow screens.
    this.home = CAMERA_HOME.clone().setZ(Math.max(6.2, 9.5 / this.camera.aspect));
    this.camera.position.copy(this.home);
    this.camera.lookAt(LOOK);
    this.camera.updateProjectionMatrix();
    this.render();
  }

  private render(): void {
    if (!this.disposed) this.renderer.render(this.scene, this.camera);
  }
}

/** Pose at time t from keyframes (partial poses on top of `base`), eased between keys. */
function sample(base: Pose, keys: readonly Key[], t: number): Pose {
  let prev: { t: number; p: Pose } = { t: 0, p: base };
  for (const k of keys) {
    const pose = { ...base, ...k.p };
    if (t <= k.t) {
      const span = k.t - prev.t || 1;
      const u = ease(Math.min(1, Math.max(0, (t - prev.t) / span)));
      const out = { ...base };
      for (const key of POSE_KEYS) out[key] = prev.p[key] + (pose[key] - prev.p[key]) * u;
      return out;
    }
    prev = { t: k.t, p: pose };
  }
  return prev.p;
}
