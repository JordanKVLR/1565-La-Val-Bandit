import type { Coord } from '@m1565/core';
import type { BufferGeometry } from 'three';
import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OKABE } from './palette';

export type HighlightKind = 'move' | 'path' | 'range' | 'target' | 'danger' | 'goal';

type Pattern = 'solid' | 'stripes' | 'hatch' | 'checker' | 'crosshair' | 'dot';

interface Style {
  readonly fill: string;
  readonly opacity: number;
  readonly pattern: Pattern;
  /** Size of the tile square (1 = full tile). */
  readonly size: number;
  /** Outline drawn round the whole area (not between its own tiles). */
  readonly edge?: { readonly color: string; readonly dashed?: boolean };
  /** Square frame on every tile, pulsing: for the enemies you can strike. */
  readonly frame?: string;
}

/**
 * Highlights read by pattern and outline as well as colour (colourblind-safe):
 * - move: blue tiles with a white outline round the reachable area;
 * - path: white dots leading to the chosen tile;
 * - range: orange diagonal stripes inside a dashed orange edge;
 * - target: a yellow crosshair inside a pulsing yellow frame;
 * - danger: black-and-white hatching; goal: a chequered flag pattern.
 */
const STYLES: Record<HighlightKind, Style> = {
  move: {
    fill: OKABE.blue,
    opacity: 0.5,
    pattern: 'solid',
    size: 0.94,
    edge: { color: '#ffffff' },
  },
  path: { fill: '#ffffff', opacity: 0.95, pattern: 'dot', size: 0.94 },
  range: {
    fill: OKABE.orange,
    opacity: 0.55,
    pattern: 'stripes',
    size: 0.94,
    edge: { color: OKABE.orange, dashed: true },
  },
  target: {
    fill: OKABE.yellow,
    opacity: 0.75,
    pattern: 'crosshair',
    size: 0.94,
    frame: OKABE.yellow,
  },
  danger: { fill: '#000000', opacity: 0.45, pattern: 'hatch', size: 0.94 },
  goal: {
    fill: '#ffffff',
    opacity: 0.55,
    pattern: 'checker',
    size: 0.94,
    edge: { color: '#ffffff' },
  },
};

const textures = new Map<string, CanvasTexture>();

function patternTexture(style: Style, strong: boolean): CanvasTexture {
  const key = `${style.pattern}|${style.fill}|${strong}`;
  const cached = textures.get(key);
  if (cached) return cached;
  const S = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const g = canvas.getContext('2d')!;
  const line = strong ? 9 : 6;
  switch (style.pattern) {
    case 'solid':
      g.fillStyle = style.fill;
      g.fillRect(0, 0, S, S);
      break;
    case 'stripes':
      g.fillStyle = style.fill;
      g.globalAlpha = 0.35;
      g.fillRect(0, 0, S, S);
      g.globalAlpha = 1;
      g.strokeStyle = style.fill;
      g.lineWidth = line;
      for (let i = -S; i < S * 2; i += 16) {
        g.beginPath();
        g.moveTo(i, S);
        g.lineTo(i + S, 0);
        g.stroke();
      }
      break;
    case 'hatch':
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(0, 0, S, S);
      g.strokeStyle = '#000';
      g.lineWidth = line;
      for (let i = -S; i < S * 2; i += 14) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + S, S);
        g.stroke();
      }
      break;
    case 'checker':
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          g.fillStyle = (x + y) % 2 ? '#000' : '#fff';
          g.fillRect(x * 16, y * 16, 16, 16);
        }
      break;
    case 'crosshair': {
      g.fillStyle = style.fill;
      g.globalAlpha = 0.45;
      g.fillRect(0, 0, S, S);
      g.globalAlpha = 1;
      g.strokeStyle = '#000';
      g.lineWidth = line + 3;
      const ring = () => {
        g.beginPath();
        g.arc(S / 2, S / 2, 18, 0, Math.PI * 2);
        g.moveTo(S / 2, 4);
        g.lineTo(S / 2, S - 4);
        g.moveTo(4, S / 2);
        g.lineTo(S - 4, S / 2);
        g.stroke();
      };
      ring();
      g.strokeStyle = style.fill;
      g.lineWidth = line - 1;
      ring();
      break;
    }
    case 'dot':
      g.fillStyle = '#000';
      g.beginPath();
      g.arc(S / 2, S / 2, 15, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = style.fill;
      g.beginPath();
      g.arc(S / 2, S / 2, 11, 0, Math.PI * 2);
      g.fill();
      break;
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  textures.set(key, t);
  return t;
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

const SIDES: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

export interface HighlightMeshes {
  readonly group: Group;
  /** Groups that pulse (target frames). */
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
  const edgeW = strong ? 0.1 : 0.065;
  layers.forEach((layer, li) => {
    const style = STYLES[layer.kind];
    const lift = 0.006 + li * 0.003;
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

    if (style.edge) {
      const inSet = new Set(layer.tiles.map((c) => `${c.x},${c.y}`));
      const dark = new MeshBasicMaterial({
        color: '#000',
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      const light = new MeshBasicMaterial({ color: style.edge.color });
      const darkPieces: BufferGeometry[] = [];
      const lightPieces: BufferGeometry[] = [];
      const pieces = style.edge.dashed ? 3 : 1;
      const len = 1 / pieces;
      const dash = style.edge.dashed ? len * 0.6 : len;
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
                horizontal ? dash + 0.02 : edgeW + 0.03,
                0.012,
                horizontal ? edgeW + 0.03 : dash + 0.02,
              ).translate(base.x, base.y, base.z),
            );
            lightPieces.push(
              new BoxGeometry(horizontal ? dash : edgeW, 0.02, horizontal ? edgeW : dash).translate(
                base.x,
                base.y + 0.006,
                base.z,
              ),
            );
          }
        }
      }
      for (const [list, material] of [
        [darkPieces, dark],
        [lightPieces, light],
      ] as const) {
        const edges = mergedMesh(list, material);
        if (edges) group.add(edges);
        else material.dispose();
      }
    }

    if (style.frame) {
      const frameMat = new MeshBasicMaterial({ color: style.frame });
      const darkMat = new MeshBasicMaterial({ color: '#000' });
      const w = strong ? 0.11 : 0.08;
      for (const c of layer.tiles) {
        const f = new Group();
        f.position.copy(top(c)).add(new Vector3(0, lift + 0.03, 0));
        for (const [mat, width, y] of [
          [darkMat, w + 0.04, 0],
          [frameMat, w, 0.008],
        ] as const) {
          const bars = SIDES.map((s) => {
            const horizontal = s.dy !== 0;
            return new BoxGeometry(horizontal ? 1 : width, 0.02, horizontal ? width : 1).translate(
              s.dx * (0.5 - width / 2),
              y,
              s.dy * (0.5 - width / 2),
            );
          });
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
