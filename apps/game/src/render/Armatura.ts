import type { ArmaturaModel, Library } from '@m1565/content';
import type { FrameClass, UnitState, WeaponType } from '@m1565/core';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
} from 'three';
import type { Object3D } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Joint angles for an armatura, all in radians, in its own side view where +x is forward and
 * +y is up.
 * - Arms and legs hang straight down at 0; positive swings them forward/up (π = straight up).
 * - Elbows and wrists bend further forward when positive; knees bend backward when negative.
 * - `lean` tilts the torso (negative = forward), `fall` tips the whole body backward.
 */
export interface Pose {
  x: number;
  y: number;
  lean: number;
  fall: number;
  sR: number;
  eR: number;
  wR: number;
  sL: number;
  eL: number;
  hR: number;
  kR: number;
  hL: number;
  kL: number;
}

export const POSE_KEYS = [
  'x',
  'y',
  'lean',
  'fall',
  'sR',
  'eR',
  'wR',
  'sL',
  'eL',
  'hR',
  'kR',
  'hL',
  'kL',
] as const;

export const MELEE_GUARD: Pose = {
  x: 0,
  y: 0,
  lean: -0.1,
  fall: 0,
  sR: 0.6,
  eR: 1.0,
  wR: 0.9,
  sL: 0.3,
  eL: 0.6,
  hR: 0.25,
  kR: -0.3,
  hL: -0.2,
  kL: -0.2,
};

export const RANGED_GUARD: Pose = {
  ...MELEE_GUARD,
  sR: 1.25,
  eR: 0.3,
  wR: 0.02,
  sL: 1.35,
  eL: 0.25,
};

export function guardFor(weapon: WeaponType): Pose {
  return weapon === 'firearm' ? RANGED_GUARD : MELEE_GUARD;
}

export interface FigureSpec {
  readonly model: ArmaturaModel;
  readonly weaponType: WeaponType;
  readonly frameClass: FrameClass;
  /** Side colour, worn as a plume, sash or arm band. */
  readonly accent: string;
  /** The protagonist's own livery: white and red with gold trim and a half-medallion. */
  readonly hero?: boolean;
}

type Part = 'armour' | 'cloth' | 'trim' | 'skin' | 'dark' | 'hat' | 'leather' | 'metal' | 'wood';
type Palette = Record<Part, string>;

const BASE: Palette = {
  armour: '#b8bdc6',
  cloth: '#6b5a44',
  trim: '#e8e0c8',
  skin: '#c4946c',
  dark: '#2e2a28',
  hat: '#3a3e46',
  leather: '#5e4026',
  metal: '#c9ccd4',
  wood: '#6b4a2b',
};

/** Original liveries: Order red and steel, homespun militia, Ottoman blues and crimsons. */
const PALETTES: Record<ArmaturaModel | 'hero', Partial<Palette>> = {
  knight: { cloth: '#9e1b24', trim: '#f3efe4', dark: '#3a3e46' },
  hero: { armour: '#f2f1ec', cloth: '#c0161f', trim: '#d9ae3c', dark: '#7c1016', hat: '#f2f1ec' },
  militia: {
    armour: '#7a5c3a',
    cloth: '#8d7552',
    trim: '#d8c9a3',
    dark: '#4a3a28',
    hat: '#c8a85a',
  },
  gunner: { cloth: '#5d3b2c', trim: '#c9a24a', dark: '#2f2a26', hat: '#a7adb6' },
  janissary: {
    armour: '#a39a82',
    cloth: '#28498c',
    trim: '#c9a24a',
    dark: '#1d2c55',
    hat: '#efe9dc',
  },
  sipahi: { armour: '#a2a6ad', cloth: '#8a2626', trim: '#d1a640', dark: '#3c3236', hat: '#a2a6ad' },
  corsair: {
    armour: '#5b3d24',
    cloth: '#2f6d68',
    trim: '#d9c27a',
    dark: '#2a2420',
    hat: '#a3302a',
  },
  machine: {
    armour: '#8d6b3d',
    cloth: '#3b3530',
    trim: '#d0a54a',
    dark: '#2c2622',
    hat: '#5a4a38',
  },
  tower: { armour: '#8d6b3d', cloth: '#3b3530', trim: '#d0a54a', dark: '#2c2622', hat: '#5a4a38' },
  barge: { armour: '#7a5c3a', cloth: '#8d7552', trim: '#d8c9a3', dark: '#4a3a28', hat: '#c8a85a' },
};

const LIMB = { upperArm: 0.32, foreArm: 0.3, thigh: 0.48, shin: 0.48, torso: 0.62 };
const HEAD_Y = LIMB.torso + 0.17;
/** Armaturas are war-harnesses: limbs read thicker than a pilot's own. */
const LIMB_BULK = 1.3;

/** Weapon meshes extend along −y from the hand; the wrist angle aims them. */
function weapon(type: WeaponType, metal: MeshLambertMaterial, wood: MeshLambertMaterial): Group {
  const g = new Group();
  const add = (m: Mesh, y: number) => {
    m.position.y = y;
    g.add(m);
  };
  switch (type) {
    case 'blade': {
      add(new Mesh(new BoxGeometry(0.05, 0.12, 0.05), wood), 0.02);
      add(new Mesh(new BoxGeometry(0.24, 0.035, 0.05), metal), -0.05);
      add(new Mesh(new BoxGeometry(0.06, 0.85, 0.018), metal), -0.5);
      break;
    }
    case 'polearm': {
      add(new Mesh(new CylinderGeometry(0.022, 0.022, 1.7, 6), wood), -0.55);
      const tip = new Mesh(new ConeGeometry(0.05, 0.26, 6), metal);
      tip.rotation.z = Math.PI;
      add(tip, -1.52);
      add(new Mesh(new BoxGeometry(0.16, 0.03, 0.03), metal), -1.38);
      break;
    }
    case 'blunt': {
      add(new Mesh(new CylinderGeometry(0.025, 0.025, 0.55, 6), wood), -0.2);
      add(new Mesh(new CylinderGeometry(0.1, 0.1, 0.18, 8), metal), -0.5);
      break;
    }
    case 'firearm': {
      add(new Mesh(new BoxGeometry(0.08, 0.38, 0.06), wood), 0.1);
      add(new Mesh(new CylinderGeometry(0.03, 0.035, 0.95, 8), metal), -0.45);
      break;
    }
    case 'explosive': {
      add(new Mesh(new SphereGeometry(0.1, 10, 8), metal), -0.08);
      add(new Mesh(new CylinderGeometry(0.015, 0.015, 0.08, 4), wood), -0.2);
      break;
    }
  }
  return g;
}

interface Segment {
  pivot: Group;
  end: Group;
}

/**
 * An armatura: the war-harness of 1565 drawn as a low-poly armoured figure (Order knights,
 * militia farmers, gunners, janissaries, sipahis, corsairs and the Scala's machines) on a
 * hierarchy of joints driven by a `Pose`. Our own designs.
 */
export class ArmaturaFighter {
  readonly root = new Group();
  readonly muzzle = new Group();
  readonly hand = new Group();
  readonly weaponType: WeaponType;
  private readonly hips = new Group();
  private readonly spine = new Group();
  private readonly shoulderR: Group;
  private readonly elbowR: Group;
  private readonly wrist = new Group();
  private readonly shoulderL: Group;
  private readonly elbowL: Group;
  private readonly hipR: Group;
  private readonly kneeR: Group;
  private readonly hipL: Group;
  private readonly kneeL: Group;
  private readonly materials = new Map<string, MeshLambertMaterial>();
  private readonly pal: Palette;
  private readonly girth: number;
  pose: Pose;

  constructor(
    private readonly spec: FigureSpec,
    private readonly baseX: number,
    facing: 1 | -1,
  ) {
    this.weaponType = spec.weaponType;
    this.pal = { ...BASE, ...PALETTES[spec.hero ? 'hero' : spec.model] };
    const machine = spec.model === 'machine' || spec.model === 'tower';
    this.girth =
      (spec.frameClass === 'heavy' ? 1.18 : spec.frameClass === 'light' ? 0.9 : 1) *
      (machine ? 1.25 : 1) *
      1.15;

    // Facing −1 mirrors the figure so its weapon arm stays on the camera side (+z).
    this.root.position.x = baseX;
    this.root.scale.set(facing, 1, facing);
    this.hips.position.y = LIMB.thigh + LIMB.shin;
    this.root.add(this.hips);
    this.hips.add(this.spine);

    this.buildTorso();
    this.buildHead();

    const near = this.limbPart();
    const armR = this.segment(this.spine, LIMB.upperArm, 0.05, 0.045, near.upper);
    armR.pivot.position.set(0, LIMB.torso - 0.04, 0.21 * this.girth);
    this.shoulderR = armR.pivot;
    const foreR = this.segment(armR.end, LIMB.foreArm, 0.044, 0.038, near.fore);
    this.elbowR = foreR.pivot;
    foreR.end.add(this.wrist);
    this.wrist.add(this.hand);
    this.gauntlet(foreR.end, false);
    this.wrist.add(weapon(spec.weaponType, this.mat('metal'), this.mat('wood')));
    this.muzzle.position.y =
      spec.weaponType === 'firearm' ? -0.95 : spec.weaponType === 'polearm' ? -1.6 : -0.9;
    this.wrist.add(this.muzzle);

    const armL = this.segment(this.spine, LIMB.upperArm, 0.05, 0.045, near.upper, true);
    armL.pivot.position.set(0, LIMB.torso - 0.04, -0.21 * this.girth);
    this.shoulderL = armL.pivot;
    const foreL = this.segment(armL.end, LIMB.foreArm, 0.044, 0.038, near.fore, true);
    this.elbowL = foreL.pivot;
    this.gauntlet(foreL.end, true);
    this.shoulders(armR.pivot, armL.pivot);
    const shield =
      (spec.model === 'sipahi' || spec.weaponType === 'blunt') &&
      spec.weaponType !== 'firearm' &&
      spec.weaponType !== 'polearm';
    if (shield) this.shield(foreL.end);

    const legR = this.segment(this.hips, LIMB.thigh, 0.065, 0.055, near.thigh);
    legR.pivot.position.z = 0.1 * this.girth;
    this.hipR = legR.pivot;
    const shinR = this.segment(legR.end, LIMB.shin, 0.055, 0.045, near.shin);
    this.kneeR = shinR.pivot;
    this.boot(shinR.end, false);
    const legL = this.segment(this.hips, LIMB.thigh, 0.065, 0.055, near.thigh, true);
    legL.pivot.position.z = -0.1 * this.girth;
    this.hipL = legL.pivot;
    const shinL = this.segment(legL.end, LIMB.shin, 0.055, 0.045, near.shin, true);
    this.kneeL = shinL.pivot;
    this.boot(shinL.end, true);
    if (near.knee) {
      this.add(legR.end, new SphereGeometry(0.065 * this.girth, 8, 6), near.knee);
      this.add(legL.end, new SphereGeometry(0.065 * this.girth, 8, 6), near.knee, 0, 0, 0, true);
    }

    this.buildSkirt();
    if (spec.model === 'tower') this.buildTower();
    if (spec.model === 'barge') this.buildBarge();

    this.pose = { ...guardFor(spec.weaponType) };
    this.apply(this.pose);
  }

  apply(p: Pose): void {
    this.pose = p;
    this.root.position.x = this.baseX + p.x * this.root.scale.x;
    this.root.position.y = p.y;
    this.root.rotation.z = p.fall;
    this.spine.rotation.z = p.lean;
    this.shoulderR.rotation.z = p.sR;
    this.elbowR.rotation.z = p.eR;
    this.wrist.rotation.z = p.wR;
    this.shoulderL.rotation.z = p.sL;
    this.elbowL.rotation.z = p.eL;
    this.hipR.rotation.z = p.hR;
    this.kneeR.rotation.z = p.kR;
    this.hipL.rotation.z = p.hL;
    this.kneeL.rotation.z = p.kL;
  }

  dispose(): void {
    this.root.traverse((o) => {
      if (o instanceof Mesh) (o.geometry as BufferGeometry).dispose();
    });
    for (const m of this.materials.values()) m.dispose();
  }

  // ── Building blocks ─────────────────────────────────────────

  /** Material for a palette part (or a literal colour); far-side parts are a shade darker. */
  private mat(part: Part | `#${string}`, far = false, extra?: { emissive?: string }) {
    const key = `${part}|${far}|${extra?.emissive ?? ''}`;
    let m = this.materials.get(key);
    if (!m) {
      const base = part.startsWith('#') ? part : this.pal[part as Part];
      const color = new Color(base);
      if (far) color.multiplyScalar(0.72);
      m = new MeshLambertMaterial({ color, side: DoubleSide });
      if (extra?.emissive) m.emissive.set(extra.emissive);
      this.materials.set(key, m);
    }
    return m;
  }

  private add(
    parent: Object3D,
    geo: BufferGeometry,
    part: Part | `#${string}`,
    x = 0,
    y = 0,
    z = 0,
    far = false,
  ): Mesh {
    const m = new Mesh(geo, this.mat(part, far));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  private segment(
    parent: Object3D,
    length: number,
    rTop: number,
    rBottom: number,
    part: Part,
    far = false,
  ): Segment {
    const pivot = new Group();
    parent.add(pivot);
    const g = this.girth * LIMB_BULK;
    this.add(
      pivot,
      new CylinderGeometry(rTop * g, rBottom * g, length, 8),
      part,
      0,
      -length / 2,
      0,
      far,
    );
    this.add(pivot, new SphereGeometry(rTop * g * 1.05, 8, 6), part, 0, 0, 0, far);
    const end = new Group();
    end.position.y = -length;
    pivot.add(end);
    return { pivot, end };
  }

  /** Which palette part covers each limb for this model. */
  private limbPart(): { upper: Part; fore: Part; thigh: Part; shin: Part; knee: Part | null } {
    switch (this.spec.model) {
      case 'knight':
      case 'machine':
      case 'tower':
        return { upper: 'armour', fore: 'armour', thigh: 'armour', shin: 'armour', knee: 'dark' };
      case 'gunner':
        return { upper: 'cloth', fore: 'cloth', thigh: 'cloth', shin: 'leather', knee: null };
      case 'janissary':
        return { upper: 'cloth', fore: 'trim', thigh: 'cloth', shin: 'leather', knee: null };
      case 'sipahi':
        return { upper: 'armour', fore: 'armour', thigh: 'cloth', shin: 'armour', knee: null };
      case 'corsair':
        return { upper: 'skin', fore: 'skin', thigh: 'trim', shin: 'skin', knee: null };
      case 'militia':
      case 'barge':
        return { upper: 'trim', fore: 'skin', thigh: 'cloth', shin: 'trim', knee: null };
    }
  }

  private buildTorso(): void {
    const g = this.girth;
    const m = this.spec.model;
    const plated = m === 'knight' || m === 'machine' || m === 'tower';
    if (m === 'machine' || m === 'tower') {
      // Riveted bronze boiler-chest.
      this.add(this.spine, new BoxGeometry(0.3 * g, 0.5, 0.42 * g), 'armour', 0, 0.32, 0);
      this.add(this.spine, new BoxGeometry(0.32 * g, 0.06, 0.44 * g), 'dark', 0, 0.12, 0);
      for (const z of [-0.14, 0, 0.14])
        this.add(this.spine, new SphereGeometry(0.022, 6, 4), 'trim', 0.15 * g, 0.42, z * g);
      // Furnace grille glowing on the chest.
      const grille = new Mesh(
        new BoxGeometry(0.02, 0.12, 0.18 * g),
        this.mat('#ff9a3c', false, { emissive: '#a5420f' }),
      );
      grille.position.set(0.155 * g, 0.28, 0);
      this.spine.add(grille);
      // Chimney on the back.
      this.add(
        this.spine,
        new CylinderGeometry(0.05, 0.06, 0.42, 8),
        'dark',
        -0.18 * g,
        0.62,
        -0.08,
      );
      this.add(
        this.spine,
        new CylinderGeometry(0.07, 0.05, 0.06, 8),
        'trim',
        -0.18 * g,
        0.84,
        -0.08,
      );
      return;
    }
    const torso = this.add(
      this.spine,
      new CylinderGeometry(0.16, 0.125, 0.52, 10),
      plated || m === 'sipahi' ? 'armour' : m === 'corsair' ? 'skin' : 'cloth',
      0,
      0.32,
      0,
    );
    torso.scale.set(0.85 * g, 1, 1.3 * g);
    // Belt
    this.add(
      this.spine,
      new CylinderGeometry(0.13, 0.13, 0.05, 10),
      'leather',
      0,
      0.08,
      0,
    ).scale.set(0.9 * g, 1, 1.32 * g);
    switch (m) {
      case 'knight': {
        // Red surcoat over the cuirass, with a white eight-pointed cross front and side.
        const coat = this.add(
          this.spine,
          new BoxGeometry(0.05, 0.42, 0.3 * g),
          'cloth',
          0.12 * g,
          0.3,
          0,
        );
        coat.rotation.z = -0.08;
        this.cross(this.spine, 0.15 * g, 0.36, 0, 'x');
        if (this.spec.hero) {
          // Half-medallion: a gold half-sun on the chest, Ninu's mark.
          const med = this.add(
            this.spine,
            new CylinderGeometry(0.09, 0.09, 0.03, 16, 1, false, 0, Math.PI),
            'trim',
            0.16 * g,
            0.47,
            0,
          );
          med.rotation.z = Math.PI / 2;
          this.add(this.spine, new BoxGeometry(0.02, 0.015, 0.2 * g), 'trim', 0.165 * g, 0.47, 0);
          // Gold sash across the chest.
          const sash = this.add(
            this.spine,
            new BoxGeometry(0.34 * g, 0.05, 0.03),
            'trim',
            0,
            0.3,
            0.2 * g,
          );
          sash.rotation.z = 0.6;
        }
        break;
      }
      case 'gunner': {
        const strap = this.add(
          this.spine,
          new BoxGeometry(0.05, 0.6, 0.03),
          'leather',
          0,
          0.32,
          0.2 * g,
        );
        strap.rotation.x = 0.7;
        for (const y of [0.2, 0.3, 0.4])
          this.add(
            this.spine,
            new CylinderGeometry(0.02, 0.02, 0.06, 6),
            'trim',
            0.02,
            y,
            0.22 * g,
          );
        this.band(0.24);
        break;
      }
      case 'janissary': {
        // Long blue kaftan with gold frogging.
        for (const y of [0.22, 0.32, 0.42])
          this.add(this.spine, new BoxGeometry(0.02, 0.025, 0.18 * g), 'trim', 0.14 * g, y, 0);
        this.band(0.1, 0.07);
        break;
      }
      case 'sipahi': {
        // Mail shirt with a crimson tunic and gold lames.
        const tunic = this.add(
          this.spine,
          new CylinderGeometry(0.165, 0.135, 0.3, 10),
          'cloth',
          0,
          0.26,
          0,
        );
        tunic.scale.set(0.86 * g, 1, 1.31 * g);
        for (const y of [0.42, 0.48])
          this.add(this.spine, new BoxGeometry(0.25 * g, 0.02, 0.38 * g), 'trim', 0, y, 0);
        this.band(0.1);
        break;
      }
      case 'corsair': {
        // Open vest and a broad sash.
        const vest = this.add(
          this.spine,
          new CylinderGeometry(0.168, 0.135, 0.44, 10, 1, true, Math.PI * 0.62, Math.PI * 1.76),
          'cloth',
          0,
          0.34,
          0,
        );
        vest.scale.set(0.86 * g, 1, 1.31 * g);
        this.band(0.12, 0.09);
        break;
      }
      case 'militia':
      case 'barge': {
        // Linen shirt under a leather jerkin.
        const jerkin = this.add(
          this.spine,
          new CylinderGeometry(0.165, 0.135, 0.36, 10),
          'armour',
          0,
          0.3,
          0,
        );
        jerkin.scale.set(0.86 * g, 1, 1.31 * g);
        this.add(this.spine, new CylinderGeometry(0.06, 0.07, 0.08, 8), 'trim', 0, 0.56, 0);
        this.band(0.1);
        break;
      }
    }
  }

  /** Side-coloured sash at the waist so friend and foe read at a glance. */
  private band(y: number, h = 0.05): void {
    const g = this.girth;
    this.add(
      this.spine,
      new CylinderGeometry(0.14, 0.14, h, 10),
      this.accentPart(),
      0,
      y,
      0,
    ).scale.set(0.92 * g, 1, 1.34 * g);
  }

  private accentPart(): `#${string}` {
    return this.spec.accent as `#${string}`;
  }

  private buildHead(): void {
    const m = this.spec.model;
    const sp = this.spine;
    if (m === 'machine' || m === 'tower') {
      this.add(sp, new BoxGeometry(0.2, 0.18, 0.2), 'dark', 0.02, HEAD_Y - 0.02, 0);
      const eye = new Mesh(
        new BoxGeometry(0.02, 0.035, 0.15),
        this.mat('#ffcf6a', false, { emissive: '#d27a12' }),
      );
      eye.position.set(0.125, HEAD_Y, 0);
      sp.add(eye);
      this.add(sp, new BoxGeometry(0.24, 0.03, 0.24), 'trim', 0.02, HEAD_Y + 0.085, 0);
      this.plume(0.0, HEAD_Y + 0.1);
      return;
    }
    this.add(sp, new CylinderGeometry(0.05, 0.06, 0.08, 8), 'skin', 0, LIMB.torso - 0.01, 0);
    this.add(sp, new SphereGeometry(0.105, 12, 10), 'skin', 0.01, HEAD_Y, 0);
    switch (m) {
      case 'knight': {
        // Close helm with a visor slit and a plume.
        this.add(sp, new SphereGeometry(0.128, 12, 10), 'armour', 0.01, HEAD_Y + 0.01, 0);
        this.add(sp, new BoxGeometry(0.06, 0.1, 0.18), 'armour', 0.11, HEAD_Y - 0.02, 0);
        this.add(sp, new BoxGeometry(0.065, 0.016, 0.16), 'dark', 0.12, HEAD_Y + 0.01, 0);
        this.add(sp, new BoxGeometry(0.2, 0.03, 0.03), 'armour', 0.0, HEAD_Y + 0.12, 0);
        this.plume(-0.03, HEAD_Y + 0.13, this.spec.hero ? 1.4 : 1);
        break;
      }
      case 'gunner': {
        // Morion: dome, crest and a boat-shaped brim.
        this.add(
          sp,
          new SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          'hat',
          0.01,
          HEAD_Y + 0.03,
          0,
        );
        const crest = this.add(
          sp,
          new CylinderGeometry(0.12, 0.12, 0.018, 14, 1, false, Math.PI / 2, Math.PI),
          'hat',
          0.01,
          HEAD_Y + 0.08,
          0,
        );
        crest.rotation.x = Math.PI / 2;
        const brim = this.add(
          sp,
          new CylinderGeometry(0.19, 0.19, 0.015, 16),
          'hat',
          0.01,
          HEAD_Y + 0.03,
          0,
        );
        brim.scale.set(1.25, 1, 0.75);
        break;
      }
      case 'janissary': {
        // Tall white felt cap folding down the back, with a gold band and spoon holder.
        const cap = this.add(
          sp,
          new CylinderGeometry(0.08, 0.11, 0.34, 10),
          'hat',
          -0.04,
          HEAD_Y + 0.22,
          0,
        );
        cap.rotation.z = 0.35;
        const flap = this.add(sp, new BoxGeometry(0.04, 0.3, 0.14), 'hat', -0.15, HEAD_Y + 0.02, 0);
        flap.rotation.z = -0.15;
        this.add(sp, new CylinderGeometry(0.115, 0.115, 0.05, 10), 'trim', 0, HEAD_Y + 0.07, 0);
        this.add(sp, new BoxGeometry(0.03, 0.09, 0.03), 'trim', 0.1, HEAD_Y + 0.1, 0);
        break;
      }
      case 'sipahi': {
        // Spiked turban helm with nasal and mail aventail.
        this.add(
          sp,
          new SphereGeometry(0.128, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
          'hat',
          0.01,
          HEAD_Y + 0.02,
          0,
        );
        this.add(sp, new ConeGeometry(0.1, 0.16, 10), 'hat', 0.01, HEAD_Y + 0.18, 0);
        this.add(sp, new BoxGeometry(0.02, 0.1, 0.02), 'hat', 0.125, HEAD_Y - 0.01, 0);
        this.add(
          sp,
          new CylinderGeometry(0.13, 0.14, 0.1, 10, 1, true),
          'armour',
          0,
          HEAD_Y - 0.06,
          0,
        );
        this.add(sp, new CylinderGeometry(0.13, 0.13, 0.025, 10), 'trim', 0.01, HEAD_Y + 0.03, 0);
        break;
      }
      case 'corsair': {
        // Knotted head scarf with trailing ends.
        const wrap = this.add(
          sp,
          new SphereGeometry(0.118, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
          'hat',
          0.01,
          HEAD_Y + 0.01,
          0,
        );
        wrap.scale.y = 1.05;
        const tail = this.add(
          sp,
          new BoxGeometry(0.03, 0.18, 0.06),
          'hat',
          -0.12,
          HEAD_Y - 0.06,
          0,
        );
        tail.rotation.z = -0.4;
        this.add(sp, new SphereGeometry(0.02, 6, 4), 'trim', 0.02, HEAD_Y - 0.08, 0.1);
        break;
      }
      case 'militia':
      case 'barge': {
        // Wide straw hat.
        this.add(sp, new CylinderGeometry(0.22, 0.22, 0.015, 16), 'hat', 0.01, HEAD_Y + 0.06, 0);
        this.add(sp, new CylinderGeometry(0.085, 0.105, 0.1, 12), 'hat', 0.01, HEAD_Y + 0.11, 0);
        this.add(
          sp,
          new CylinderGeometry(0.106, 0.106, 0.02, 12),
          this.accentPart(),
          0.01,
          HEAD_Y + 0.075,
          0,
        );
        break;
      }
    }
  }

  private plume(x: number, y: number, size = 1): void {
    const part = this.spec.hero ? 'cloth' : this.accentPart();
    const p = this.add(
      this.spine,
      new SphereGeometry(0.06 * size, 8, 6),
      part,
      x - 0.04,
      y + 0.04 * size,
      0,
    );
    p.scale.set(1.8, 0.8, 0.7);
    p.rotation.z = 0.5;
    if (this.spec.hero) {
      const tip = this.add(
        this.spine,
        new SphereGeometry(0.04, 8, 6),
        'trim',
        x - 0.13,
        y + 0.02,
        0,
      );
      tip.scale.set(1.6, 0.7, 0.6);
    }
  }

  /** The Order's white cross: on the chest (facing +x) or on a pauldron (facing +z). */
  private cross(
    parent: Object3D,
    x: number,
    y: number,
    z: number,
    axis: 'x' | 'z',
    size = 1,
  ): void {
    const t = 0.012;
    const [tall, arm, bar] = [0.14 * size, 0.11 * size, 0.035 * size];
    const v = axis === 'x' ? new BoxGeometry(t, tall, bar) : new BoxGeometry(bar, tall, t);
    const h = axis === 'x' ? new BoxGeometry(t, bar, arm) : new BoxGeometry(arm, bar, t);
    this.add(parent, v, 'trim', x, y, z);
    this.add(parent, h, 'trim', x, y + 0.015 * size, z);
  }

  private shoulders(right: Group, left: Group): void {
    const m = this.spec.model;
    if (m === 'corsair' || m === 'militia' || m === 'barge' || m === 'janissary') return;
    const g = this.girth;
    const part: Part = m === 'gunner' ? 'leather' : m === 'sipahi' ? 'trim' : 'armour';
    const r = (m === 'machine' || m === 'tower' ? 0.11 : 0.085) * g;
    const geo = () => new SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const pr = this.add(right, geo(), part, 0, 0.0, 0.02);
    pr.scale.set(1.1, 0.9, 1);
    const pl = this.add(left, geo(), part, 0, 0.0, -0.02, true);
    pl.scale.set(1.1, 0.9, 1);
    // The cross shows on the camera-side pauldron too.
    if (m === 'knight') this.cross(right, 0, 0.02, r + 0.01, 'z', 0.55);
  }

  private gauntlet(end: Group, far: boolean): void {
    const m = this.spec.model;
    const part: Part =
      m === 'knight' || m === 'machine' || m === 'tower' || m === 'sipahi'
        ? 'armour'
        : m === 'gunner'
          ? 'leather'
          : 'skin';
    this.add(end, new BoxGeometry(0.075, 0.08, 0.075), part, 0, -0.02, 0, far);
  }

  private boot(end: Group, far: boolean): void {
    const m = this.spec.model;
    const g = this.girth;
    const part: Part =
      m === 'knight' || m === 'machine' || m === 'tower'
        ? 'armour'
        : m === 'janissary'
          ? 'cloth'
          : 'leather';
    const len = m === 'machine' || m === 'tower' ? 0.24 : 0.18;
    this.add(end, new BoxGeometry(len * g, 0.07, 0.1 * g), part, 0.04, -0.02, 0, far);
  }

  private shield(end: Group): void {
    const s = this.add(
      end,
      new CylinderGeometry(0.2, 0.2, 0.03, 16),
      'trim',
      0.02,
      0.0,
      -0.05,
      true,
    );
    s.rotation.x = Math.PI / 2;
    const boss = this.add(end, new SphereGeometry(0.05, 8, 6), 'metal', 0.02, 0, -0.07, true);
    boss.scale.z = 0.6;
    const face = this.add(
      end,
      new CylinderGeometry(0.16, 0.16, 0.032, 16),
      this.spec.model === 'sipahi' ? 'cloth' : 'dark',
      0.02,
      0,
      -0.051,
      true,
    );
    face.rotation.x = Math.PI / 2;
  }

  /** Skirts, tassets and kaftans hang from the hips, not the legs. */
  private buildSkirt(): void {
    const g = this.girth;
    const h = this.hips;
    const skirt = (top: number, bottom: number, len: number, part: Part | `#${string}`) => {
      const s = this.add(
        h,
        new CylinderGeometry(top, bottom, len, 12, 1, true),
        part,
        0,
        -len / 2 + 0.06,
        0,
      );
      s.scale.set(0.9 * g, 1, 1.25 * g);
    };
    switch (this.spec.model) {
      case 'knight':
        skirt(0.13, 0.17, 0.22, 'armour');
        skirt(0.135, 0.16, 0.12, 'cloth');
        break;
      case 'janissary':
        skirt(0.13, 0.24, 0.62, 'cloth');
        break;
      case 'sipahi':
        skirt(0.13, 0.19, 0.3, 'armour');
        break;
      case 'gunner':
        skirt(0.13, 0.17, 0.18, 'cloth');
        break;
      case 'machine':
      case 'tower':
        skirt(0.17, 0.2, 0.2, 'dark');
        break;
      case 'corsair': {
        const sash = this.add(
          h,
          new BoxGeometry(0.05, 0.28, 0.06),
          this.accentPart(),
          0.04,
          -0.08,
          0.17 * g,
        );
        sash.rotation.z = -0.1;
        break;
      }
      case 'militia':
      case 'barge':
        skirt(0.13, 0.16, 0.14, 'cloth');
        break;
    }
  }

  /** A timber siege tower strapped to the machine's back. */
  private buildTower(): void {
    const t = new Group();
    t.position.set(-0.32, 0.25, 0);
    this.spine.add(t);
    for (const x of [-0.18, 0.18])
      for (const z of [-0.22, 0.22])
        this.add(t, new BoxGeometry(0.05, 1.3, 0.05), 'wood', x, 0.45, z);
    for (const y of [0, 0.45, 0.9]) this.add(t, new BoxGeometry(0.42, 0.04, 0.5), 'wood', 0, y, 0);
    this.add(t, new BoxGeometry(0.44, 0.22, 0.04), 'leather', 0, 1.0, 0.25);
    this.add(t, new BoxGeometry(0.44, 0.22, 0.04), 'leather', 0, 1.0, -0.25);
    this.add(t, new ConeGeometry(0.06, 0.2, 4), this.accentPart(), 0, 1.25, 0);
  }

  /** A supply barge: the crewman stands in a small hull. */
  private buildBarge(): void {
    const hull = new Group();
    hull.position.y = 0.3;
    this.root.add(hull);
    this.add(hull, new BoxGeometry(1.0, 0.56, 0.6), 'wood', 0, 0, 0);
    const bow = this.add(hull, new BoxGeometry(0.4, 0.56, 0.4), 'wood', 0.5, 0.02, 0);
    bow.rotation.y = Math.PI / 4;
    this.add(hull, new BoxGeometry(1.04, 0.05, 0.64), 'trim', 0, 0.29, 0);
    this.add(hull, new BoxGeometry(0.3, 0.2, 0.3), 'leather', -0.32, 0.38, 0);
    this.add(hull, new BoxGeometry(0.62, 0.04, 0.02), this.accentPart(), 0.05, 0.1, 0.31);
  }
}

/**
 * The figure merged into one vertex-coloured mesh in its guard pose, for the map (one draw call
 * per unit). It faces +z, the same way the facing arrow points before rotation.
 */
export function bakeFigure(spec: FigureSpec): BufferGeometry {
  const f = new ArmaturaFighter(spec, 0, 1);
  f.root.rotation.y = -Math.PI / 2;
  f.root.updateMatrixWorld(true);
  const parts: BufferGeometry[] = [];
  f.root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const geo = (o.geometry as BufferGeometry).clone().applyMatrix4(o.matrixWorld);
    const g2 = geo.index ? geo.toNonIndexed() : geo;
    if (g2 !== geo) geo.dispose();
    g2.deleteAttribute('uv');
    const c = (o.material as MeshLambertMaterial).color;
    const n = g2.getAttribute('position').count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3);
    g2.setAttribute('color', new Float32BufferAttribute(colors, 3));
    parts.push(g2);
  });
  f.dispose();
  const merged = mergeGeometries(parts) ?? new BufferGeometry();
  for (const p of parts) p.dispose();
  return merged;
}

/** The figure for a battle unit: its frame's model, its weapon and its side's colour. */
export function figureSpec(
  lib: Pick<Library, 'frameModels' | 'characters'>,
  unit: Pick<UnitState, 'frameId' | 'frameClass' | 'weapon' | 'characterId'>,
  accent: string,
): FigureSpec {
  const hero = !!unit.characterId && lib.characters.get(unit.characterId)?.livery === 'hero';
  return {
    model: lib.frameModels.get(unit.frameId) ?? 'knight',
    weaponType: unit.weapon.type,
    frameClass: unit.frameClass,
    accent,
    ...(hero ? { hero } : {}),
  };
}
