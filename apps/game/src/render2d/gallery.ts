/**
 * Dev-only gallery of every 2D figure (open /gallery2d.html with `pnpm dev`). Query:
 * ?model=knight&weapon=blade&class=heavy&hero=1&accent=%232a6fd6&view=strip|grid&anim=0&flash=0.8&face=-1
 * Without filters it shows every model x class x weapon in the guard pose, then a pose strip.
 */
import { ARMATURA_MODELS } from '@m1565/content';
import type { ArmaturaModel } from '@m1565/content';
import type { FrameClass, WeaponType } from '@m1565/core';
import { guardFor } from '../render/Armatura';
import type { Pose } from '../render/Armatura';
import { moveFor } from '../render/duelMoves';
import type { Rig } from './contract';
import { createRig } from './rig';

const WEAPONS: WeaponType[] = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'];
const CLASSES: FrameClass[] = ['light', 'medium', 'heavy'];
const q = new URLSearchParams(location.search);

const pick = <T extends string>(key: string, all: readonly T[]): readonly T[] => {
  const v = q.get(key);
  return v && (all as readonly string[]).includes(v) ? [v as T] : all;
};

interface Cell {
  canvas: HTMLCanvasElement;
  rig: Rig;
  scale: number;
  ox: number;
  oy: number;
}
const cells: Cell[] = [];
const OX: Record<string, number> = {
  guard: 0.35,
  windup: 0.4,
  strike: 0.25,
  recoil: 0.45,
  fall: 0.92,
};

function addCell(
  parent: HTMLElement,
  rig: Rig,
  w: number,
  h: number,
  scale: number,
  label: string,
  ox = 0.3,
): void {
  const fig = document.createElement('figure');
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const cap = document.createElement('figcaption');
  cap.textContent = label;
  fig.append(canvas, cap);
  parent.append(fig);
  cells.push({ canvas, rig, scale: scale * dpr, ox: w * ox * dpr, oy: h * 0.9 * dpr });
}

function render(c: Cell, t: number): void {
  const ctx = c.canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
  ctx.setTransform(c.scale, 0, 0, -c.scale, c.ox, c.oy);
  // ground
  ctx.fillStyle = '#4b5568';
  ctx.fillRect(-3, -0.6, 8, 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(c.rig.baseX + 0.05, 0, 0.55, 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  c.rig.time = t;
  c.rig.draw(ctx);
}

/** Poses for the strip: guard, windup, strike (at impact) and the defeated fall. */
function stripPoses(weapon: WeaponType): { name: string; pose: Pose }[] {
  const guard = guardFor(weapon);
  const style =
    weapon === 'firearm'
      ? 'shot'
      : weapon === 'explosive'
        ? 'throw'
        : weapon === 'polearm'
          ? 'thrust'
          : weapon === 'blunt'
            ? 'bash'
            : 'overhead';
  const move = moveFor({ weapon, style, power: 1.2, reach: 1 });
  const first = move.keys[0];
  const hit = move.keys.find((k) => k.t >= move.impact) ?? move.keys[1];
  const fall = {
    x: -1,
    y: 0.1,
    fall: 1.5,
    lean: 0.3,
    sR: 2.8,
    sL: 2.6,
    hR: 0.8,
    hL: 0.6,
    kR: -0.2,
  };
  return [
    { name: 'guard', pose: { ...guard } },
    { name: 'windup', pose: { ...guard, ...(first?.p ?? {}) } },
    { name: 'strike', pose: { ...guard, ...(hit?.p ?? {}) } },
    {
      name: 'recoil',
      pose: { ...guard, x: -0.4, lean: 0.55, sR: 1.6, sL: 1.4, hR: 0.5, kR: -0.8 },
    },
    { name: 'fall', pose: { ...guard, ...fall } },
  ];
}

function main(): void {
  const root = document.getElementById('root') as HTMLElement;
  const accent = q.get('accent') ?? '#2a6fd6';
  const hero = q.get('hero') === '1';
  const models = pick<ArmaturaModel>('model', ARMATURA_MODELS);
  const weapons = pick<WeaponType>('weapon', WEAPONS);
  const classes = pick<FrameClass>('class', CLASSES);
  const view = q.get('view');
  const filtered = !!(q.get('model') || q.get('weapon') || q.get('class'));

  if (view !== 'strip') {
    for (const model of models) {
      const h = document.createElement('h2');
      h.textContent = model;
      root.append(h);
      const grid = document.createElement('div');
      grid.className = 'grid';
      root.append(grid);
      for (const weaponType of weapons)
        for (const frameClass of classes) {
          const rig = createRig(
            { model, weaponType, frameClass, accent, ...(hero ? { hero } : {}) },
            0,
            q.get('face') === '-1' ? -1 : 1,
          );
          rig.pose = { ...guardFor(weaponType) };
          addCell(
            grid,
            rig,
            filtered ? 330 : 230,
            filtered ? 360 : 260,
            filtered ? 120 : 84,
            `${model} ${weaponType} ${frameClass}`,
          );
        }
    }
  }
  if (view !== 'grid') {
    const h = document.createElement('h2');
    h.textContent = 'pose strip';
    root.append(h);
    for (const model of models.length === ARMATURA_MODELS.length
      ? (['knight', 'sipahi', 'machine'] as const)
      : models) {
      for (const weaponType of weapons.length === WEAPONS.length
        ? (['blade', 'firearm'] as const)
        : weapons) {
        const grid = document.createElement('div');
        grid.className = 'grid';
        root.append(grid);
        for (const { name, pose } of stripPoses(weaponType)) {
          const rig = createRig(
            {
              model,
              weaponType,
              frameClass: classes[1] ?? 'medium',
              accent,
              ...(hero ? { hero } : {}),
            },
            0,
            1,
          );
          rig.pose = { ...pose, x: pose.x * 0.35 };
          addCell(grid, rig, 280, 320, 104, `${model} ${weaponType} ${name}`, OX[name] ?? 0.4);
        }
      }
    }
  }
  const flash = Number(q.get('flash') ?? 0) || 0;
  for (const c of cells) c.rig.flash = flash;
  const anim = q.get('anim') !== '0';
  const t0 = performance.now();
  const frame = (): void => {
    const t = anim ? (performance.now() - t0) / 1000 : 0.4;
    for (const c of cells) render(c, t);
    if (anim) requestAnimationFrame(frame);
  };
  frame();
  document.title = 'gallery ready';
}

main();
