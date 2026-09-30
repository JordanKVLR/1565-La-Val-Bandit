import type { AttackStyle, FrameClass, Reaction, WeaponType } from '@m1565/core';
import {
  AmbientLight,
  CircleGeometry,
  Color,
  DirectionalLight,
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
import type { Pose } from './StickFighter';
import { guardFor, POSE_KEYS, StickFighter } from './StickFighter';

export interface DuelFighter {
  readonly color: string;
  readonly weaponType: WeaponType;
  readonly frameClass: FrameClass;
}

export interface StrikePlay {
  readonly attacker: 'left' | 'right';
  readonly style: AttackStyle;
  readonly hit: boolean;
  readonly defeated: boolean;
  /** The defender's reaction; 'none' for a counter-strike. */
  readonly reaction: Reaction | 'none';
  /** Called at the moment of contact (update HP bars, play the hit sound). */
  readonly onImpact?: () => void;
}

type Key = { t: number; p: Partial<Pose> };

const GAP = 3.2;
const RANGED: ReadonlySet<AttackStyle> = new Set(['shot', 'volley', 'throw']);

/** Attacker keyframes per style, relative to its guard pose. `impact` is the contact time (s). */
function attackKeys(style: AttackStyle, reach: number): { keys: Key[]; impact: number } {
  const adv = GAP - reach;
  switch (style) {
    case 'slash':
      return {
        impact: 0.55,
        keys: [
          { t: 0.35, p: { x: adv, sR: 2.6, eR: 0.4, wR: 1.2, lean: 0.1, hR: 0.6, kR: -0.5 } },
          { t: 0.55, p: { x: adv, sR: 0.8, eR: 0.1, wR: 1.6, lean: -0.35 } },
          { t: 0.8, p: { x: adv, sR: 0.2, eR: 0.3, wR: 1.9, lean: -0.25 } },
          { t: 1.15, p: {} },
        ],
      };
    case 'overhead':
      return {
        impact: 0.6,
        keys: [
          {
            t: 0.35,
            p: {
              x: adv - 0.2,
              y: 0.15,
              sR: 3.0,
              eR: 0.2,
              wR: 0.15,
              sL: 2.8,
              eL: 0.3,
              lean: 0.2,
              hR: 0.7,
              kR: -0.8,
            },
          },
          {
            t: 0.6,
            p: { x: adv, y: 0, sR: 1.2, eR: 0, wR: 1.3, sL: 1.0, lean: -0.55, hR: 0.5, kR: -0.6 },
          },
          { t: 0.85, p: { x: adv, sR: 0.9, wR: 1.6, lean: -0.4 } },
          { t: 1.2, p: {} },
        ],
      };
    case 'thrust':
    case 'charge': {
      const run = style === 'charge' ? 0.5 : 0.35;
      return {
        impact: run + 0.15,
        keys: [
          {
            t: run,
            p: { x: adv - 0.3, sR: 0.6, eR: 1.9, wR: 1.2, lean: 0.05, hR: 0.7, kR: -0.9, hL: -0.5 },
          },
          {
            t: run + 0.15,
            p: {
              x: adv + 0.15,
              sR: 1.5,
              eR: 0,
              wR: 0.05,
              sL: 1.2,
              eL: 0.2,
              lean: -0.45,
              hR: 0.9,
              kR: -0.3,
              hL: -0.6,
            },
          },
          { t: run + 0.45, p: { x: adv, sR: 1.2, eR: 0.3, wR: 0.3, lean: -0.2 } },
          { t: run + 0.8, p: {} },
        ],
      };
    }
    case 'sweep':
      return {
        impact: 0.55,
        keys: [
          {
            t: 0.35,
            p: {
              x: adv,
              y: -0.18,
              sR: 2.2,
              eR: 0.3,
              wR: 1.3,
              lean: 0.1,
              hR: 1.0,
              kR: -1.4,
              hL: -0.1,
              kL: -1.0,
            },
          },
          {
            t: 0.55,
            p: { x: adv, y: -0.22, sR: 0.5, eR: 0.1, wR: 2.0, lean: -0.5, hR: 1.0, kR: -1.4 },
          },
          { t: 0.8, p: { x: adv, y: -0.1, sR: 0.2, wR: 2.2, lean: -0.3 } },
          { t: 1.15, p: {} },
        ],
      };
    case 'bash':
      return {
        impact: 0.45,
        keys: [
          {
            t: 0.3,
            p: { x: adv - 0.3, sR: 1.2, eR: 1.4, sL: 1.2, eL: 1.4, lean: -0.1, hR: 0.6, kR: -0.8 },
          },
          {
            t: 0.45,
            p: { x: adv + 0.2, lean: -0.7, sR: 1.6, eR: 0.8, hR: 0.9, kR: -0.3, hL: -0.7 },
          },
          { t: 0.75, p: { x: adv, lean: -0.3 } },
          { t: 1.1, p: {} },
        ],
      };
    case 'shot':
    case 'volley':
      return {
        impact: 0.55,
        keys: [
          { t: 0.3, p: { lean: -0.05, sR: 1.45, eR: 0.1, sL: 1.5, eL: 0.1 } },
          { t: 0.45, p: {} },
          { t: 0.5, p: { x: -0.12, lean: 0.25, sR: 1.75, sL: 1.8 } },
          { t: 0.9, p: {} },
        ],
      };
    case 'throw':
      return {
        impact: 0.85,
        keys: [
          { t: 0.3, p: { sR: -0.6, eR: 1.8, wR: 0.5, lean: 0.25, hR: -0.3, hL: 0.4 } },
          { t: 0.45, p: { sR: 2.6, eR: 0.3, lean: -0.35, hR: 0.5, hL: -0.4 } },
          { t: 0.65, p: { sR: 1.4, eR: 0.3, lean: -0.2 } },
          { t: 1.05, p: {} },
        ],
      };
  }
}

/** Defender keyframes from the moment of impact (times relative to impact). */
function reactionKeys(play: StrikePlay): Key[] {
  if (play.defeated) {
    return [
      { t: 0.12, p: { x: -0.3, lean: 0.5, sR: 2.2, sL: 2.0 } },
      {
        t: 0.6,
        p: { x: -0.7, y: 0.1, fall: 1.45, lean: 0.3, sR: 2.8, sL: 2.6, hR: 0.8, hL: 0.6, kR: -0.2 },
      },
      { t: 1.0, p: { x: -0.75, y: 0.12, fall: 1.52 } },
    ];
  }
  if (play.hit && play.reaction === 'defend') {
    return [
      { t: 0.02, p: { x: -0.2, sR: 1.8, eR: 1.6, wR: 0.3, sL: 1.6, eL: 1.4, lean: 0.2 } },
      { t: 0.35, p: { x: -0.25, lean: 0.1 } },
      { t: 0.7, p: {} },
    ];
  }
  if (play.hit) {
    return [
      { t: 0.1, p: { x: -0.35, lean: 0.55, sR: 1.3, sL: 1.1, hR: 0.5, kR: -0.8 } },
      { t: 0.45, p: { x: -0.3, lean: 0.25 } },
      { t: 0.8, p: {} },
    ];
  }
  if (play.reaction === 'avoid') {
    return [
      { t: 0.12, p: { x: -0.7, y: 0.3, lean: 0.35, hR: 0.9, kR: -1.4, hL: 0.4, kL: -1.2 } },
      { t: 0.35, p: { x: -0.8, y: 0 } },
      { t: 0.8, p: {} },
    ];
  }
  return [
    { t: 0.1, p: { x: -0.1, lean: 0.25 } },
    { t: 0.5, p: {} },
  ];
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * The duel close-up: two stick-figure pilots on a small stage, animated per attack style and
 * per reaction. Only presentation; results come from the rules engine.
 */
export class DuelStage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 100);
  private readonly left: StickFighter;
  private readonly right: StickFighter;
  private readonly fx = new Group();
  private readonly resizeObserver: ResizeObserver;
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    this.left = new StickFighter(left.color, left.weaponType, left.frameClass, -GAP / 2, 1);
    this.right = new StickFighter(right.color, right.weaponType, right.frameClass, GAP / 2, -1);
    this.scene.add(this.left.root, this.right.root, this.fx);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.render();
  }

  /** Plays one strike (approach, blow, reaction, return). Resolves when both fighters settle. */
  async playStrike(play: StrikePlay): Promise<void> {
    const [atk, def] = play.attacker === 'left' ? [this.left, this.right] : [this.right, this.left];
    const reach = atk.weaponType === 'polearm' ? 1.7 : 1.25;
    const { keys, impact } = attackKeys(play.style, reach);
    const ranged = RANGED.has(play.style);
    const atkGuard = guardFor(atk.weaponType);
    const defGuard = def.pose.fall > 0.5 ? def.pose : guardFor(def.weaponType);
    const defKeys = reactionKeys(play);
    const defEnd = impact + (defKeys[defKeys.length - 1]?.t ?? 0);
    const total = Math.max(keys[keys.length - 1]!.t, defEnd) + 0.1;
    let impacted = false;
    let projectile: Mesh | null = null;

    await this.animate(total, (t) => {
      atk.apply(sample(atkGuard, keys, t));
      if (t >= impact) def.apply(sample(defGuard, defKeys, t - impact));
      if (ranged && t >= impact - 0.35 && t < impact) {
        projectile ??= this.spawnProjectile(play.style === 'throw');
        const from = atk.muzzle.getWorldPosition(new Vector3());
        const to = def.root.position.clone().add(new Vector3(0, play.hit ? 1.25 : 1.9, 0));
        const k = (t - (impact - 0.35)) / 0.35;
        projectile.position.lerpVectors(from, to, k);
        if (play.style === 'throw') projectile.position.y += Math.sin(k * Math.PI) * 0.9;
      }
      if (!impacted && t >= impact) {
        impacted = true;
        if (projectile) this.fx.remove(projectile);
        if (play.hit)
          this.spark(
            def.root.position
              .clone()
              .add(new Vector3(-0.2 * Math.sign(def.root.scale.x), 1.25, 0.2)),
          );
        play.onImpact?.();
      }
    });
    if (!play.defeated) def.apply({ ...guardFor(def.weaponType) });
    atk.apply({ ...atkGuard });
    this.render();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.left.dispose();
    this.right.dispose();
    this.renderer.dispose();
  }

  private animate(seconds: number, step: (t: number) => void): Promise<void> {
    const duration = (seconds * 1000) / this.speed;
    const start = performance.now();
    return new Promise((resolve) => {
      const tick = (now: number) => {
        if (this.disposed) return resolve();
        const t = (Math.max(0, now - start) / duration) * seconds;
        step(Math.min(t, seconds));
        this.updateFx();
        this.render();
        if (t >= seconds) resolve();
        else this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    });
  }

  private spawnProjectile(big: boolean): Mesh {
    const m = new Mesh(
      new SphereGeometry(big ? 0.1 : 0.05, 8, 6),
      new MeshBasicMaterial({ color: big ? '#3a3a3a' : '#ffe9a8' }),
    );
    this.fx.add(m);
    return m;
  }

  private spark(at: Vector3): void {
    for (let i = 0; i < 8; i++) {
      const m = new Mesh(
        new SphereGeometry(0.035, 5, 4),
        new MeshBasicMaterial({ color: i % 2 ? '#fff4c2' : '#ffb347', transparent: true }),
      );
      m.position.copy(at);
      m.userData.v = new Vector3(Math.cos(i) * 0.06, 0.03 + (i % 3) * 0.02, Math.sin(i * 2) * 0.05);
      m.userData.life = 1;
      this.fx.add(m);
    }
  }

  private updateFx(): void {
    for (const m of [...this.fx.children]) {
      if (!(m instanceof Mesh) || !m.userData.v) continue;
      m.position.add(m.userData.v as Vector3);
      (m.userData.v as Vector3).y -= 0.004;
      m.userData.life = (m.userData.life as number) - 0.05;
      (m.material as MeshBasicMaterial).opacity = Math.max(0, m.userData.life as number);
      if ((m.userData.life as number) <= 0) {
        this.fx.remove(m);
        m.geometry.dispose();
      }
    }
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep both fighters in frame on narrow screens.
    this.camera.position.z = Math.max(6.2, 9.5 / this.camera.aspect);
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
