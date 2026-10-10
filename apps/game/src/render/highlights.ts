import type { Coord } from '@m1565/core';
import type { BufferGeometry } from 'three';
import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MAP_GOLD, MAP_GOLD_BRIGHT, MAP_INK, MAP_LIGHT, OKABE } from './palette';

export type HighlightKind = 'move' | 'path' | 'range' | 'target' | 'danger' | 'goal';

type Pattern = 'tile' | 'stripes' | 'hatch' | 'checker' | 'reticle' | 'none';

interface Style {
  readonly fill: string;
  readonly opacity: number;
  readonly pattern: Pattern;
  /** Size of the tile square (1 = full tile). */
  readonly size: number;
  /** Outline drawn round the whole area (not between its own tiles). */
  readonly edge?: { readonly color: string; readonly dashed?: boolean };
  /** Corner brackets on every tile, breathing gently: for the enemies you can strike. */
  readonly frame?: string;
  /** A ribbon through the tiles, in order, ending in a ring: the route preview. */
  readonly route?: string;
}

/**
 * The map's visual language (docs/DESIGN.md): soft fills, fine patterns and thin crisp
 * outlines, each kind told apart by its pattern and outline as well as its colour
 * (colour-blind safe):
 * - move: a soft blue wash with a fine inner line per tile, in one solid outline;
 * - path: a warm-white ribbon from the unit to a ring on the chosen tile;
 * - range: fine orange diagonal hairlines inside a dashed orange outline;
 * - target: a small yellow reticle framed by corner brackets that breathe;
 * - danger: black-and-white hatching; goal: a gold chequer (the "gold tiles") in a gold line.
 * High contrast (`strong`) thickens every line, raises the fills and dims the map behind.
 */
const STYLES: Record<HighlightKind, Style> = {
  move: {
    fill: OKABE.blue,
    opacity: 0.46,
    pattern: 'tile',
    size: 1,
    edge: { color: MAP_LIGHT },
  },
  path: { fill: MAP_LIGHT, opacity: 1, pattern: 'none', size: 1, route: MAP_LIGHT },
  range: {
    fill: OKABE.orange,
    opacity: 0.8,
    pattern: 'stripes',
    size: 1,
    edge: { color: OKABE.orange, dashed: true },
  },
  target: {
    fill: OKABE.yellow,
    opacity: 0.9,
    pattern: 'reticle',
    size: 1,
    frame: OKABE.yellow,
  },
  danger: { fill: '#000000', opacity: 0.4, pattern: 'hatch', size: 0.96 },
  goal: {
    fill: MAP_GOLD,
    opacity: 0.5,
    pattern: 'checker',
    size: 1,
    edge: { color: MAP_GOLD },
  },
};

const textures = new Map<string, CanvasTexture>();

function canvasTexture(key: string, size: number, draw: (g: CanvasRenderingContext2D) => void) {
  const cached = textures.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  textures.set(key, t);
  return t;
}

function patternTexture(style: Style, strong: boolean): CanvasTexture {
  const S = 128;
  return canvasTexture(`${style.pattern}|${style.fill}|${strong}`, S, (g) => {
    switch (style.pattern) {
      case 'tile': {
        // A soft wash with a fine lighter line just inside each tile: the range reads as
        // tiles without a heavy grid.
        g.fillStyle = style.fill;
        g.fillRect(0, 0, S, S);
        g.strokeStyle = 'rgba(255, 250, 235, 0.55)';
        g.lineWidth = strong ? 5 : 3;
        g.strokeRect(9, 9, S - 18, S - 18);
        break;
      }
      case 'stripes': {
        g.fillStyle = style.fill;
        g.globalAlpha = strong ? 0.32 : 0.16;
        g.fillRect(0, 0, S, S);
        g.globalAlpha = 1;
        g.strokeStyle = style.fill;
        g.lineWidth = strong ? 7 : 3.5;
        for (let i = -S; i < S * 2; i += 21.333) {
          g.beginPath();
          g.moveTo(i, S);
          g.lineTo(i + S, 0);
          g.stroke();
        }
        break;
      }
      case 'hatch': {
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.fillRect(0, 0, S, S);
        g.strokeStyle = '#000';
        g.lineWidth = strong ? 8 : 4;
        for (let i = -S; i < S * 2; i += 21.333) {
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i + S, S);
          g.stroke();
        }
        break;
      }
      case 'checker': {
        const n = 4;
        const c = S / n;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            g.fillStyle = (x + y) % 2 ? MAP_INK : style.fill;
            g.globalAlpha = (x + y) % 2 ? 0.55 : 1;
            g.fillRect(x * c, y * c, c, c);
          }
        g.globalAlpha = 1;
        break;
      }
      case 'reticle': {
        g.fillStyle = style.fill;
        g.globalAlpha = strong ? 0.4 : 0.2;
        g.fillRect(0, 0, S, S);
        g.globalAlpha = 1;
        const m = S / 2;
        const reticle = () => {
          g.beginPath();
          g.arc(m, m, 20, 0, Math.PI * 2);
          for (const [x0, y0, x1, y1] of [
            [m, m - 34, m, m - 26],
            [m, m + 26, m, m + 34],
            [m - 34, m, m - 26, m],
            [m + 26, m, m + 34, m],
          ] as const) {
            g.moveTo(x0, y0);
            g.lineTo(x1, y1);
          }
          g.stroke();
        };
        g.lineCap = 'round';
        g.strokeStyle = 'rgba(11, 10, 14, 0.7)';
        g.lineWidth = strong ? 11 : 8;
        reticle();
        g.strokeStyle = style.fill;
        g.lineWidth = strong ? 6 : 3.5;
        reticle();
        break;
      }
      case 'none':
        break;
    }
  });
}

/**
 * The selected tile: a faint gold wash in a thin gold line with firmer corners, one textured
 * plane (one draw call). Shared by the cursor in BattleView.
 */
export function cursorTexture(strong: boolean): CanvasTexture {
  const S = 128;
  return canvasTexture(`cursor|${strong}`, S, (g) => {
    g.fillStyle = MAP_GOLD;
    g.globalAlpha = strong ? 0.34 : 0.2;
    g.fillRect(6, 6, S - 12, S - 12);
    g.globalAlpha = 1;
    const inset = 7;
    const line = (width: number, color: string) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.strokeRect(inset, inset, S - inset * 2, S - inset * 2);
    };
    line(strong ? 9 : 7, 'rgba(11, 10, 14, 0.55)');
    line(strong ? 5 : 3, MAP_GOLD);
    // Corners: short, firmer strokes.
    g.lineCap = 'square';
    g.strokeStyle = MAP_GOLD_BRIGHT;
    g.lineWidth = strong ? 9 : 6;
    const k = 30;
    const a = inset;
    const b = S - inset;
    g.beginPath();
    for (const [x, y, dx, dy] of [
      [a, a, 1, 1],
      [b, a, -1, 1],
      [a, b, 1, -1],
      [b, b, -1, -1],
    ] as const) {
      g.moveTo(x + dx * k, y);
      g.lineTo(x, y);
      g.lineTo(x, y + dy * k);
    }
    g.stroke();
  });
}

/**
 * One mesh for many placed pieces that share a material: a move range of 40 tiles is one draw
 * call rather than 40 (ADR 0010; PLAN §5.5 budgets 100 draw calls).
 */
function mergedMesh(pieces: BufferGeometry[], material: MeshBasicMaterial): Mesh | null {
  if (!pieces.length) return null;
  const geometry = mergeGeometries(pieces);
  for (const p of pieces) p.dispose();
  return geometry ? new Mesh(geometry, material) : null;
}

/** Adds the light pieces over their dark rims as two meshes (two draw calls in all). */
function addPair(
  group: Group,
  dark: BufferGeometry[],
  light: BufferGeometry[],
  lightColor: string,
  darkOpacity: number,
): void {
  const pairs: [BufferGeometry[], MeshBasicMaterial][] = [
    [
      dark,
      new MeshBasicMaterial({
        color: MAP_INK,
        transparent: true,
        opacity: darkOpacity,
        depthWrite: false,
      }),
    ],
    [light, new MeshBasicMaterial({ color: lightColor })],
  ];
  for (const [list, material] of pairs) {
    const mesh = mergedMesh(list, material);
    if (mesh) group.add(mesh);
    else material.dispose();
  }
}

const SIDES: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

const UP = new Vector3(0, 1, 0);

/**
 * A flat strip from `p` to `q`, `width` across and lying in the plane that contains the travel
 * direction `along` (horizontal), so it also works for vertical risers.
 */
function strip(p: Vector3, q: Vector3, width: number, along: Vector3): BufferGeometry {
  const dir = q.clone().sub(p);
  const length = dir.length();
  dir.normalize();
  // A right-handed basis (side × normal = dir), so the box keeps its winding: the normal is
  // up on flat ground and faces the lower tile on a riser.
  const side = UP.clone().cross(Math.abs(dir.y) < 0.99 ? dir : along);
  side.normalize();
  const normal = dir.clone().cross(side).normalize();
  const basis = new Matrix4().makeBasis(side, normal, dir);
  basis.setPosition(p.clone().add(q).multiplyScalar(0.5));
  return new BoxGeometry(width, 0.006, length + width * 0.5).applyMatrix4(basis);
}

function disc(at: Vector3, radius: number): BufferGeometry {
  return new CircleGeometry(radius, 20)
    .rotateX(-Math.PI / 2)
    .translate(at.x, at.y, at.z)
    .toNonIndexed();
}

/** Non-indexed, so strips, discs and rings merge into one geometry. */
const flat = (g: BufferGeometry) => (g.index ? g.toNonIndexed() : g);

/**
 * The route: a ribbon through the tile centres (stepping up and down cliffs at the tile edge
 * rather than cutting through them) over a dark rim, ending in a ring on the chosen tile.
 */
function buildRoute(
  group: Group,
  tiles: readonly Coord[],
  top: (c: Coord) => Vector3,
  lift: number,
  color: string,
  strong: boolean,
): void {
  if (tiles.length < 2) return;
  const w = strong ? 0.085 : 0.055;
  const rim = strong ? 0.05 : 0.04;
  const points = tiles.map((c) => top(c).add(new Vector3(0, lift, 0)));
  const dark: BufferGeometry[] = [];
  const light: BufferGeometry[] = [];
  const add = (p: Vector3, q: Vector3, along: Vector3) => {
    dark.push(flat(strip(p, q, w + rim, along).translate(0, -0.004, 0)));
    light.push(flat(strip(p, q, w, along)));
  };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const along = new Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    if (Math.abs(a.y - b.y) < 1e-3) {
      add(a, b, along);
      continue;
    }
    // Across a height change: to the edge, up or down the riser (just off the cliff face,
    // on the lower tile's side), then on.
    const edge = new Vector3((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
    const lower = a.y < b.y ? -1 : 1;
    const riser = edge.clone().addScaledVector(along, lower * 0.012);
    const ea = new Vector3(riser.x, a.y, riser.z);
    const eb = new Vector3(riser.x, b.y, riser.z);
    add(a, ea, along);
    add(ea, eb, along);
    add(eb, b, along);
  }
  // Round joints at every tile on the way.
  for (const p of points.slice(0, -1)) {
    dark.push(disc(p.clone().setY(p.y - 0.004), (w + rim) / 2));
    light.push(disc(p, w / 2));
  }
  // The destination: a ring on the tile.
  const end = points[points.length - 1]!;
  const ring = (inner: number, outer: number, y: number) =>
    new RingGeometry(inner, outer, 40)
      .rotateX(-Math.PI / 2)
      .translate(end.x, end.y + y, end.z)
      .toNonIndexed();
  const r = 0.2;
  dark.push(ring(r - w / 2 - rim / 2, r + w / 2 + rim / 2, -0.004));
  light.push(ring(r - w / 2, r + w / 2, 0.004));
  addPair(group, dark, light, color, strong ? 0.75 : 0.5);
}

export interface HighlightMeshes {
  readonly group: Group;
  /** Groups that breathe (target brackets). */
  readonly pulsing: readonly Group[];
}

/**
 * Builds the highlight meshes for the given layers. `top` gives a tile's surface centre.
 * `strong` (the high-contrast setting) makes fills, outlines and patterns bolder.
 */
export function buildHighlights(
  layers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }>,
  top: (c: Coord) => Vector3,
  strong: boolean,
): HighlightMeshes {
  const group = new Group();
  const pulsing: Group[] = [];
  const edgeW = strong ? 0.075 : 0.04;
  const rimW = strong ? 0.035 : 0.025;
  layers.forEach((layer, li) => {
    const style = STYLES[layer.kind];
    const lift = 0.006 + li * 0.003;

    if (style.pattern !== 'none') {
      const mat = new MeshBasicMaterial({
        map: patternTexture(style, strong),
        transparent: true,
        opacity: Math.min(1, style.opacity * (strong ? 1.35 : 1)),
        depthWrite: false,
      });
      const tileGeo = new PlaneGeometry(style.size, style.size).rotateX(-Math.PI / 2);
      const fills = layer.tiles.map((c) => {
        const p = top(c);
        return tileGeo.clone().translate(p.x, p.y + lift, p.z);
      });
      tileGeo.dispose();
      const fill = mergedMesh(fills, mat);
      if (fill) group.add(fill);
      else mat.dispose();
    }

    if (style.route) buildRoute(group, layer.tiles, top, lift + 0.02, style.route, strong);

    if (style.edge) {
      const inSet = new Set(layer.tiles.map((c) => `${c.x},${c.y}`));
      const darkPieces: BufferGeometry[] = [];
      const lightPieces: BufferGeometry[] = [];
      const pieces = style.edge.dashed ? 4 : 1;
      const len = 1 / pieces;
      const dash = style.edge.dashed ? len * 0.55 : len;
      for (const c of layer.tiles) {
        for (const s of SIDES) {
          if (inSet.has(`${c.x + s.dx},${c.y + s.dy}`)) continue;
          const horizontal = s.dy !== 0;
          for (let i = 0; i < pieces; i++) {
            const along = -0.5 + len * (i + 0.5);
            const base = top(c).add(
              new Vector3(
                horizontal ? along : s.dx * (0.5 - edgeW / 2),
                lift + 0.01,
                horizontal ? s.dy * (0.5 - edgeW / 2) : along,
              ),
            );
            darkPieces.push(
              new BoxGeometry(
                horizontal ? dash + rimW : edgeW + rimW,
                0.01,
                horizontal ? edgeW + rimW : dash + rimW,
              ).translate(base.x, base.y, base.z),
            );
            lightPieces.push(
              new BoxGeometry(horizontal ? dash : edgeW, 0.016, horizontal ? edgeW : dash).translate(
                base.x,
                base.y + 0.005,
                base.z,
              ),
            );
          }
        }
      }
      addPair(group, darkPieces, lightPieces, style.edge.color, strong ? 0.7 : 0.4);
    }

    if (style.frame) {
      const frameMat = new MeshBasicMaterial({ color: style.frame });
      const darkMat = new MeshBasicMaterial({
        color: MAP_INK,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      const w = strong ? 0.075 : 0.05;
      const arm = 0.3;
      for (const c of layer.tiles) {
        const f = new Group();
        f.position.copy(top(c)).add(new Vector3(0, lift + 0.03, 0));
        for (const [mat, width, y] of [
          [darkMat, w + 0.035, 0],
          [frameMat, w, 0.008],
        ] as const) {
          // Four L-shaped corners just inside the tile.
          const bars: BufferGeometry[] = [];
          const edge = 0.47 - width / 2;
          for (const sx of [-1, 1])
            for (const sz of [-1, 1]) {
              bars.push(
                new BoxGeometry(arm, 0.016, width).translate(
                  sx * (0.47 - arm / 2),
                  y,
                  sz * edge,
                ),
                new BoxGeometry(width, 0.016, arm - width).translate(
                  sx * edge,
                  y,
                  sz * (0.47 - (arm + width) / 2),
                ),
              );
            }
          const frame = mergedMesh(bars, mat);
          if (frame) f.add(frame);
        }
        group.add(f);
        pulsing.push(f);
      }
    }
  });
  return { group, pulsing };
}

/** Disposes geometries and materials (pattern textures are shared and kept). */
export function disposeHighlights(group: Group): void {
  const mats = new Set<MeshBasicMaterial>();
  group.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      mats.add(o.material as MeshBasicMaterial);
    }
  });
  for (const m of mats) m.dispose();
}
