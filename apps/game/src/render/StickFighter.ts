import type { FrameClass, WeaponType } from '@m1565/core';
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
} from 'three';

/**
 * Joint angles for a stick-figure fighter, all in radians, in the fighter's own side view where
 * +x is forward and +y is up.
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

const LIMB = { upperArm: 0.32, foreArm: 0.3, thigh: 0.48, shin: 0.48, torso: 0.62 };

function limb(
  length: number,
  radius: number,
  material: MeshLambertMaterial,
): { pivot: Group; end: Group } {
  const pivot = new Group();
  const mesh = new Mesh(new CylinderGeometry(radius, radius * 0.85, length, 8), material);
  mesh.position.y = -length / 2;
  pivot.add(mesh);
  const joint = new Mesh(new SphereGeometry(radius * 1.25, 8, 6), material);
  pivot.add(joint);
  const end = new Group();
  end.position.y = -length;
  pivot.add(end);
  return { pivot, end };
}

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
      add(new Mesh(new BoxGeometry(0.22, 0.03, 0.04), metal), -0.05);
      add(new Mesh(new BoxGeometry(0.05, 0.85, 0.015), metal), -0.5);
      break;
    }
    case 'polearm': {
      add(new Mesh(new CylinderGeometry(0.022, 0.022, 1.7, 6), wood), -0.55);
      const tip = new Mesh(new ConeGeometry(0.05, 0.22, 6), metal);
      tip.rotation.z = Math.PI;
      add(tip, -1.5);
      break;
    }
    case 'blunt': {
      add(new Mesh(new CylinderGeometry(0.025, 0.025, 0.55, 6), wood), -0.2);
      add(new Mesh(new BoxGeometry(0.16, 0.2, 0.16), metal), -0.5);
      break;
    }
    case 'firearm': {
      add(new Mesh(new BoxGeometry(0.07, 0.35, 0.06), wood), 0.1);
      add(new Mesh(new CylinderGeometry(0.03, 0.03, 0.95, 8), metal), -0.45);
      break;
    }
    case 'explosive': {
      add(new Mesh(new SphereGeometry(0.1, 10, 8), metal), -0.08);
      break;
    }
  }
  return g;
}

/** An original stick-figure Armatura pilot: hierarchical joints driven by a `Pose`. */
export class StickFighter {
  readonly root = new Group();
  readonly muzzle = new Group();
  readonly hand = new Group();
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
  private readonly materials: MeshLambertMaterial[] = [];
  pose: Pose;

  constructor(
    color: string,
    readonly weaponType: WeaponType,
    frameClass: FrameClass,
    private readonly baseX: number,
    facing: 1 | -1,
  ) {
    const body = this.material(color);
    const dark = this.material(new Color(color).multiplyScalar(0.55).getStyle());
    const metal = this.material('#c9ccd4');
    const wood = this.material('#6b4a2b');
    const thick = frameClass === 'heavy' ? 0.075 : frameClass === 'medium' ? 0.06 : 0.048;

    // Facing −1 mirrors the figure so its weapon arm stays on the camera side.
    this.root.position.x = baseX;
    this.root.scale.set(facing, 1, facing);

    const hips = new Group();
    hips.position.y = LIMB.thigh + LIMB.shin;
    this.root.add(hips);
    hips.add(this.spine);
    const torso = new Mesh(new CylinderGeometry(thick * 1.2, thick, LIMB.torso, 8), body);
    torso.position.y = LIMB.torso / 2;
    this.spine.add(torso);
    if (frameClass !== 'light') {
      const plate = new Mesh(new BoxGeometry(0.2, 0.3, 0.26), dark);
      plate.position.set(0.02, LIMB.torso * 0.7, 0);
      this.spine.add(plate);
    }
    const head = new Mesh(new SphereGeometry(0.13, 12, 10), body);
    head.position.y = LIMB.torso + 0.2;
    this.spine.add(head);
    const visor = new Mesh(new BoxGeometry(0.08, 0.04, 0.2), dark);
    visor.position.set(0.1, LIMB.torso + 0.22, 0);
    this.spine.add(visor);

    const armR = limb(LIMB.upperArm, thick * 0.8, body);
    armR.pivot.position.set(0, LIMB.torso - 0.04, 0.2);
    this.spine.add(armR.pivot);
    this.shoulderR = armR.pivot;
    const foreR = limb(LIMB.foreArm, thick * 0.7, body);
    armR.end.add(foreR.pivot);
    this.elbowR = foreR.pivot;
    foreR.end.add(this.wrist);
    this.wrist.add(this.hand);
    const w = weapon(weaponType, metal, wood);
    this.wrist.add(w);
    this.muzzle.position.y =
      weaponType === 'firearm' ? -0.95 : weaponType === 'polearm' ? -1.55 : -0.9;
    this.wrist.add(this.muzzle);

    const armL = limb(LIMB.upperArm, thick * 0.8, dark);
    armL.pivot.position.set(0, LIMB.torso - 0.04, -0.2);
    this.spine.add(armL.pivot);
    this.shoulderL = armL.pivot;
    const foreL = limb(LIMB.foreArm, thick * 0.7, dark);
    armL.end.add(foreL.pivot);
    this.elbowL = foreL.pivot;

    const legR = limb(LIMB.thigh, thick * 0.9, body);
    legR.pivot.position.z = 0.1;
    hips.add(legR.pivot);
    this.hipR = legR.pivot;
    const shinR = limb(LIMB.shin, thick * 0.8, body);
    legR.end.add(shinR.pivot);
    this.kneeR = shinR.pivot;
    const legL = limb(LIMB.thigh, thick * 0.9, dark);
    legL.pivot.position.z = -0.1;
    hips.add(legL.pivot);
    this.hipL = legL.pivot;
    const shinL = limb(LIMB.shin, thick * 0.8, dark);
    legL.end.add(shinL.pivot);
    this.kneeL = shinL.pivot;

    this.pose = { ...guardFor(weaponType) };
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
      if (o instanceof Mesh) o.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
  }

  private material(color: string): MeshLambertMaterial {
    const m = new MeshLambertMaterial({ color });
    this.materials.push(m);
    return m;
  }
}
