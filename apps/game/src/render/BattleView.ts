import type { BattleMap, Coord, Facing } from '@m1565/core';
import { DIRECTIONS, getTile } from '@m1565/core';
import {
  AmbientLight,
  HemisphereLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OrthographicCamera,
  Path,
  PlaneGeometry,
  Raycaster,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Sprite } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { applyTerrainArt } from './art';
import type { HighlightKind } from './highlights';
import { buildHighlights, cursorTexture, disposeHighlights } from './highlights';
import { MAP_GOLD_BRIGHT, MAP_INK } from './palette';
import type { TerrainAtlas } from './terrainTextures';
import { createTerrainAtlas } from './terrainTextures';
import type { FigureSpec } from './Armatura';
import { bakeFigure } from './Armatura';
import type { UnitLook } from './unitSprite';
import { BADGE_FONT, createUnitSprite, drawUnit } from './unitSprite';
import { measureCanvas, renderPixelRatio } from './resolution';
import { settings } from '../state/settings';
import {
  CELL_H,
  CELL_W,
  FIGURE_UNIT,
  FOOT,
  IDLE_MS,
  MapFigure,
  cameraFacing,
  disposeRingTextures,
  storyFigureSpec,
} from '../render2d/mapSprite';

/** World units per height step. Tiles are 1×1 on the ground plane. */
const STEP = 0.35;
const TRIANGLES_PER_TILE = 12;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.8;
const TAP_SLOP_PX = 8;
const IDLE_MIN_MS = IDLE_MS;
const IDLE_MAX_MS = 500;
/** Idle frames may take about 1/IDLE_DUTY of the time between them. */
const IDLE_DUTY = 10;

export interface UnitVisual extends UnitLook {
  readonly id: string;
  readonly at: Coord;
  readonly facing: Facing;
  readonly arrowColor: string;
  /** The armatura standing on the arrow; story actors without one show only their badge. */
  readonly figure?: FigureSpec;
}

export type { HighlightKind };

const FACING_ANGLE: Record<Facing, number> = {
  north: Math.PI,
  east: Math.PI / 2,
  south: 0,
  west: -Math.PI / 2,
};

/** Where the unit's badge floats and where its arrow sits, relative to the tile top. */
const LABEL_OFFSET = new Vector3(0, 0.42, 0);
/** With a figure on the arrow the badge floats above its head instead. */
const FIGURE_LABEL_OFFSET = new Vector3(0, 1.15, 0);
const FIGURE_SCALE = 0.5;
const ARROW_OFFSET = new Vector3(0, 0.1, 0);
/** 2D mode: the arrow shrinks to a tile marker around the sprite's feet, the badge floats over its head. */
const ARROW_2D = 0.82;
const BADGE_OFFSET_2D = new Vector3(0, 0.1 + 2.2 * FIGURE_UNIT, 0);

/**
 * Unit marker on the tile: a thin ring in the side's shape (circle: yours, diamond: enemy)
 * round the unit's feet, with a slim dart on its rim pointing the way the unit faces (+z =
 * south before rotation). A dark rim just outside keeps it readable on any terrain; it turns
 * gold for the unit whose turn it is. One shape set, so the marker is two meshes.
 */
function markerShapes(enemy: boolean, pad: number): Shape[] {
  const ring = new Shape();
  const hole = new Path();
  const width = 0.045;
  if (enemy) {
    // Square to the tile, so the isometric camera shows it as a diamond, like the HUD's mark.
    const r = 0.29 + pad;
    const inner = 0.29 - width - pad;
    ring.moveTo(-r, -r);
    ring.lineTo(r, -r);
    ring.lineTo(r, r);
    ring.lineTo(-r, r);
    ring.closePath();
    hole.moveTo(-inner, -inner);
    hole.lineTo(-inner, inner);
    hole.lineTo(inner, inner);
    hole.lineTo(inner, -inner);
    hole.closePath();
  } else {
    const r = 0.33;
    ring.absarc(0, 0, r + pad, 0, Math.PI * 2, false);
    hole.absarc(0, 0, r - width - pad, 0, Math.PI * 2, true);
  }
  ring.holes.push(hole);
  const dart = new Shape();
  const p = pad * 1.4;
  dart.moveTo(0, 0.52 + p);
  dart.lineTo(0.15 + p, 0.3 - p * 0.5);
  dart.lineTo(0, 0.36 - p);
  dart.lineTo(-0.15 - p, 0.3 - p * 0.5);
  dart.closePath();
  return [ring, dart];
}

function createArrowMarker(color: string, enemy: boolean): Group {
  const extrude = (pad: number, depth: number) =>
    new ExtrudeGeometry(markerShapes(enemy, pad), {
      depth,
      bevelEnabled: false,
      curveSegments: 40,
    }).rotateX(Math.PI / 2);
  const g = new Group();
  const fill = new Mesh(extrude(0, 0.035), new MeshLambertMaterial({ color }));
  fill.name = 'fill';
  const edge = new Mesh(
    extrude(0.018, 0.03).translate(0, -0.008, 0),
    new MeshLambertMaterial({ color: MAP_INK }),
  );
  edge.name = 'rim';
  g.add(edge, fill);
  return g;
}

/** The active unit's marker: a gold rim, a warm glow and a touch larger (`base` scales 2D markers). */
function setArrowActive(arrow: Group, active: boolean, base = 1): void {
  const fill = arrow.getObjectByName('fill') as Mesh | undefined;
  const rim = arrow.getObjectByName('rim') as Mesh | undefined;
  (fill?.material as MeshLambertMaterial | undefined)?.emissive.set(active ? '#4a3810' : '#000000');
  (rim?.material as MeshLambertMaterial | undefined)?.color.set(active ? MAP_GOLD_BRIGHT : MAP_INK);
  arrow.scale.setScalar(base * (active ? 1.08 : 1));
}

interface UnitNode {
  /** The badge (initial and HP bar); absent for 2D story actors. */
  sprite: Sprite | null;
  arrow: Group;
  labelOffset: Vector3;
  look: UnitLook;
  at: Coord;
  facing: Facing;
  /** 2D mode: the animated figure standing on the tile. */
  fig: MapFigure | null;
  /** World-space nudge (hit shake). */
  nudge: number;
  /** Tile-top position the node is currently drawn at. */
  pos: Vector3;
}

type Tween = (now: number) => boolean; // returns true when finished

/**
 * Isometric battle renderer. Owns the Three.js scene, camera and pointer gestures, and reports
 * tile taps upward. It holds no game rules: the controller tells it what to show and animate.
 */
export class BattleView {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly target = new Vector3();
  private readonly cursor: Mesh;
  private readonly highlightGroup = new Group();
  private highContrast = false;
  private highlightToken = 0;
  private lastLayers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }> = [];
  private hovered: string | null = null;
  private readonly raycaster = new Raycaster();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private readonly resizeObserver: ResizeObserver;
  private readonly units = new Map<string, UnitNode>();
  private readonly dying = new Set<UnitNode>();
  private mode: '2d' | '3d' = settings.get().renderMode === '3d' ? '3d' : '2d';
  private lastList: readonly UnitVisual[] = [];
  private readonly unsubscribeSettings: () => void;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  /** Current idle-frame interval; the governor stretches it when the main thread lags. */
  private idleMs = IDLE_MIN_MS;
  private idleLate = 0;
  private idleWait = 0;
  /** Smoothed main-thread cost (ms) of one idle-only frame. */
  private idleCost = 0;
  private idleDue = 0;
  private readonly reduced = prefersReducedMotion();
  private readonly ppu = Math.min(140, Math.max(90, 72 * (window.devicePixelRatio || 1)));
  private readonly tweens = new Set<Tween>();
  private terrain: Mesh | undefined;
  private readonly atlas: TerrainAtlas = createTerrainAtlas();
  private rotation = 0;
  private zoom = 1;
  private dragStart: { x: number; y: number; moved: boolean } | undefined;
  private pinchDistance = 0;
  private frameRequested = false;
  /** Anything but sprite idling changed: the next frame redraws the whole canvas. */
  private fullRedraw = true;
  private disposed = false;
  private readonly frameListeners = new Set<() => void>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly map: BattleMap,
    private readonly onTileTap: (c: Coord) => void,
    private readonly input: {
      /** The tile under a mouse pointer (PC), or null when it leaves the map. */
      readonly onHover?: (c: Coord | null) => void;
      /** Right-click: back out of the current step. */
      readonly onCancel?: () => void;
    } = {},
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.scene.background = new Color(0x2a1f2e);

    this.scene.add(new HemisphereLight(0xe8f0ff, 0x6b5a3a, 1.3));
    this.scene.add(new AmbientLight(0xffffff, 0.55));
    const sun = new DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(-4, 10, 6);
    this.scene.add(sun);

    // The selected tile: a gold frame with firmer corners over a faint wash (one textured plane).
    this.cursor = new Mesh(
      new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ map: cursorTexture(false), transparent: true, depthWrite: false }),
    );
    this.cursor.renderOrder = 1;
    this.cursor.visible = false;
    this.scene.add(this.cursor, this.highlightGroup);

    this.buildTerrain();
    void applyTerrainArt(this.atlas).then((changed) => changed && this.requestRender());
    // Badges are drawn on canvases: draw them again once their typeface (Cinzel) is ready.
    void document.fonts
      ?.load(BADGE_FONT)
      .then(() => {
        if (this.disposed) return;
        for (const node of this.units.values()) if (node.sprite) drawUnit(node.sprite, node.look);
        this.requestRender();
      })
      .catch(() => undefined);
    this.target.set(map.width / 2, 0, map.depth / 2);
    this.updateCamera();

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', this.onContextMenu);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    // The map switches between 2D sprites and 3D figures live when the setting changes.
    this.unsubscribeSettings = settings.subscribe(() => {
      const mode = settings.get().renderMode === '3d' ? '3d' : '2d';
      if (mode === this.mode) return;
      this.mode = mode;
      this.rebuildUnits();
    });
    this.scheduleIdle();
  }

  /**
   * Idle breathing runs at ~12 fps while the tab shows and sprites exist. A governor keeps it to
   * roughly a tenth of the main thread: it times the idle frames and how late the timer fires
   * (a slow device, software GL, a starved page) and stretches the interval towards 2 fps when
   * they cost more than that; fast devices stay at 12 fps.
   */
  private scheduleIdle(): void {
    this.idleDue = performance.now() + this.idleMs;
    this.idleTimer = setTimeout(() => {
      if (this.disposed) return;
      const late = Math.max(0, performance.now() - this.idleDue);
      this.idleLate = this.idleLate * 0.7 + late * 0.3;
      this.idleMs = Math.min(
        IDLE_MAX_MS,
        Math.max(IDLE_MIN_MS, this.idleCost * IDLE_DUTY + (this.idleLate + this.idleWait) * 4),
      );
      if (this.mode === '2d' && !this.reduced && this.units.size && !document.hidden)
        this.requestRender(true);
      this.scheduleIdle();
    }, this.idleMs);
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribeSettings();
    if (this.idleTimer) clearTimeout(this.idleTimer);
    for (const node of [...this.units.values(), ...this.dying]) this.removeNode(node, false);
    this.units.clear();
    this.dying.clear();
    disposeRingTextures();
    this.tweens.clear();
    this.frameListeners.clear();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.scene.traverse((o) => {
      if (o instanceof Mesh || o instanceof LineSegments) o.geometry.dispose();
    });
    this.renderer.dispose();
  }

  /** Rotates the view in 90° steps (+1 clockwise, -1 counter-clockwise). */
  rotate(direction: 1 | -1): void {
    this.rotation = (this.rotation + direction + 4) % 4;
    this.updateCamera();
  }

  /** Zooms by a factor (keyboard and gamepad; pinch and the wheel use the same limits). */
  zoomBy(factor: number): void {
    this.setZoom(this.zoom * factor);
  }

  /** Pans to a tile only if it sits near the screen edge, so a moving cursor stays in view. */
  reveal(c: Coord): void {
    const { x, y } = this.tileScreenPosition(c);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (x < w * 0.15 || x > w * 0.85 || y < h * 0.2 || y > h * 0.8) void this.focus(c, 180);
  }

  /** Creates, updates or removes unit billboards to match the given list. */
  syncUnits(list: readonly UnitVisual[]): void {
    this.lastList = list;
    const seen = new Set<string>();
    for (const u of list) {
      seen.add(u.id);
      let node = this.units.get(u.id);
      if (!node) {
        node = this.createNode(u);
        this.units.set(u.id, node);
        this.placeNode(node, u.at);
      } else {
        if (node.at.x !== u.at.x || node.at.y !== u.at.y) this.placeNode(node, u.at);
        if (!sameLook(node.look, u)) {
          if (node.sprite) drawUnit(node.sprite, u);
          node.look = u;
        }
      }
      setArrowActive(node.arrow, u.active, node.fig ? ARROW_2D : 1);
      node.arrow.rotation.y = FACING_ANGLE[u.facing];
      node.facing = u.facing;
    }
    for (const [id, node] of this.units) {
      if (seen.has(id)) continue;
      this.units.delete(id);
      if (node.fig && this.mode === '2d' && !this.disposed) {
        // Knocked out: fall and fade, then remove.
        node.fig.ko();
        if (node.sprite) node.sprite.visible = false;
        node.arrow.visible = false;
        this.dying.add(node);
      } else this.removeNode(node, true);
    }
    this.requestRender();
  }

  private createNode(u: UnitVisual): UnitNode {
    const two = this.mode === '2d';
    const spec = u.figure ?? (two ? storyFigureSpec(u.id, u.color) : undefined);
    const arrow = createArrowMarker(u.color, !!u.enemy);
    let fig: MapFigure | null = null;
    let sprite: Sprite | null = null;
    let labelOffset = LABEL_OFFSET;
    if (two && spec) {
      fig = new MapFigure(spec, this.ppu, this.units.size + this.dying.size);
      this.scene.add(fig.sprite);
      arrow.scale.setScalar(ARROW_2D);
      if (!u.hideHp || u.figure) {
        sprite = createUnitSprite(u);
        sprite.scale.multiplyScalar(0.74);
        sprite.renderOrder = 2;
        sprite.material.depthTest = false;
        labelOffset = BADGE_OFFSET_2D;
      }
    } else {
      sprite = createUnitSprite(u);
      if (u.figure) {
        const figure = new Mesh(
          bakeFigure(u.figure),
          new MeshLambertMaterial({ vertexColors: true }),
        );
        figure.scale.setScalar(FIGURE_SCALE);
        arrow.add(figure);
        sprite.scale.multiplyScalar(0.75);
        labelOffset = FIGURE_LABEL_OFFSET;
      }
    }
    if (sprite) this.scene.add(sprite);
    this.scene.add(arrow);
    return {
      sprite,
      arrow,
      labelOffset,
      look: u,
      at: u.at,
      facing: u.facing,
      fig,
      nudge: 0,
      pos: new Vector3(),
    };
  }

  private removeNode(node: UnitNode, requestRender: boolean): void {
    if (node.sprite) {
      this.scene.remove(node.sprite);
      node.sprite.material.map?.dispose();
      node.sprite.material.dispose();
    }
    this.scene.remove(node.arrow);
    node.arrow.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        (o.material as MeshLambertMaterial).dispose();
      }
    });
    if (node.fig) {
      this.scene.remove(node.fig.sprite);
      node.fig.dispose();
    }
    if (requestRender) this.requestRender();
  }

  /** Render mode changed: drop every unit visual and build them again in the new style. */
  private rebuildUnits(): void {
    for (const node of [...this.units.values(), ...this.dying]) this.removeNode(node, false);
    this.units.clear();
    this.dying.clear();
    this.syncUnits(this.lastList);
  }

  /** Positions every part of a node at a tile-top point. */
  private setNodePos(node: UnitNode, pos: Vector3, dx = 0): void {
    node.pos.copy(pos);
    node.nudge = dx;
    node.sprite?.position
      .copy(pos)
      .add(node.labelOffset)
      .setX(pos.x + dx);
    node.arrow.position.copy(pos).add(ARROW_OFFSET);
    node.fig?.sprite.position.copy(pos).setX(pos.x + dx);
  }

  /** Walks a unit along a path (tile by tile, hopping on height changes). */
  animateMove(id: string, path: readonly Coord[], msPerTile: number): Promise<void> {
    const node = this.units.get(id);
    if (!node || path.length === 0) return Promise.resolve();
    const points = [node.at, ...path].map((c) => this.tileTop(c));
    return new Promise((resolve) => {
      const start = performance.now();
      const total = msPerTile * path.length;
      this.addTween((now) => {
        // rAF timestamps can precede `start` slightly; clamp so progress never goes negative.
        const t = Math.min(1, Math.max(0, (now - start) / total));
        const seg = Math.min(path.length - 1, Math.floor(t * path.length));
        const local = t * path.length - seg;
        const a = points[seg]!;
        const b = points[seg + 1]!;
        const pos = a.clone().lerp(b, local);
        pos.y = Math.max(a.y, b.y) * Math.sin(local * Math.PI) * 0.15 + a.y + (b.y - a.y) * local;
        this.setNodePos(node, pos);
        const dir = { x: Math.sign(b.x - a.x), y: Math.sign(b.z - a.z) };
        const facing = (Object.keys(DIRECTIONS) as Facing[]).find(
          (f) => DIRECTIONS[f].x === dir.x && DIRECTIONS[f].y === dir.y,
        );
        if (facing) {
          node.arrow.rotation.y = FACING_ANGLE[facing];
          node.facing = facing;
        }
        if (node.fig) node.fig.walking = t < 1;
        if (t >= 1) {
          node.at = path[path.length - 1]!;
          resolve();
          return true;
        }
        return false;
      });
    });
  }

  /** Short shake on a unit: used when it takes a hit on the map. */
  shake(id: string): void {
    const node = this.units.get(id);
    if (!node) return;
    if (node.fig) {
      // The active unit is the one striking: it lunges at the target, which recoils.
      const attacker = [...this.units.values()].find((n) => n !== node && n.look.active);
      if (attacker?.fig) {
        const dx = node.at.x - attacker.at.x;
        const dy = node.at.y - attacker.at.y;
        const face = (Object.keys(DIRECTIONS) as Facing[]).find((f) =>
          Math.abs(dx) >= Math.abs(dy)
            ? DIRECTIONS[f].x === Math.sign(dx) && DIRECTIONS[f].y === 0
            : DIRECTIONS[f].y === Math.sign(dy) && DIRECTIONS[f].x === 0,
        );
        if (face) {
          attacker.facing = face;
          attacker.arrow.rotation.y = FACING_ANGLE[face];
        }
        attacker.fig.lunge();
      }
      setTimeout(
        () => {
          if (!this.disposed) node.fig?.hurt();
          this.requestRender();
        },
        attacker?.fig ? 140 : 0,
      );
      this.requestRender();
    }
    const base = this.tileTop(node.at);
    const start = performance.now();
    this.addTween((now) => {
      const t = Math.max(0, (now - start) / 300);
      this.setNodePos(node, base, Math.sin(t * 40) * 0.06 * (1 - Math.min(t, 1)));
      return t >= 1 && (this.setNodePos(node, base), true);
    });
  }

  setHighlights(layers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }>): void {
    this.lastLayers = layers;
    disposeHighlights(this.highlightGroup);
    this.highlightGroup.clear();
    const { group, pulsing } = buildHighlights(layers, (c) => this.tileTop(c), this.highContrast);
    for (const child of [...group.children]) this.highlightGroup.add(child);
    // High contrast dims the map under highlights so they stand out.
    const dim = this.highContrast && layers.some((l) => l.kind !== 'goal' && l.tiles.length);
    (this.terrain?.material as MeshLambertMaterial | undefined)?.color.setScalar(dim ? 0.55 : 1);
    const token = ++this.highlightToken;
    if (pulsing.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.addTween((now) => {
        if (token !== this.highlightToken || this.disposed) return true;
        const k = 1 + 0.07 * Math.sin(now / 170);
        for (const f of pulsing) f.scale.set(k, 1, k);
        return false;
      });
    }
    this.requestRender();
  }

  /** Bolder highlight patterns and outlines, and a dimmed map behind them. */
  setHighContrast(on: boolean): void {
    if (on === this.highContrast) return;
    this.highContrast = on;
    const cursor = this.cursor.material as MeshBasicMaterial;
    cursor.map = cursorTexture(on);
    cursor.needsUpdate = true;
    this.setHighlights(this.lastLayers);
  }

  select(c: Coord | undefined): void {
    this.cursor.visible = !!c;
    if (c) this.cursor.position.copy(this.tileTop(c)).add(new Vector3(0, 0.004, 0));
    this.requestRender();
  }

  /** Smoothly pans the camera to centre on a tile. */
  focus(c: Coord, ms = 350): Promise<void> {
    if (prefersReducedMotion()) ms = 1;
    const from = this.target.clone();
    const to = new Vector3(c.x + 0.5, 0, c.y + 0.5);
    const start = performance.now();
    return new Promise((resolve) => {
      this.addTween((now) => {
        const t = Math.min(1, Math.max(0, (now - start) / ms));
        const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        this.target.copy(from).lerp(to, e);
        this.updateCamera();
        if (t >= 1) resolve();
        return t >= 1;
      });
    });
  }

  /**
   * Runs `listener` after every rendered frame (camera moves, zoom, resize, animations), so
   * DOM pieces pinned to the map, such as the action bar beside a unit, can follow it. Returns
   * the unsubscribe function.
   */
  onFrame(listener: () => void): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  /** Screen-space position (CSS pixels, relative to the canvas) of a tile's centre. */
  tileScreenPosition(c: Coord): { x: number; y: number } {
    const p = this.tileTop(c).project(this.camera);
    return {
      x: ((p.x + 1) / 2) * this.canvas.clientWidth,
      y: ((1 - p.y) / 2) * this.canvas.clientHeight,
    };
  }

  /**
   * Which world facing points toward each screen corner (up-left, up-right, down-left,
   * down-right) for the current camera rotation. Used by the facing picker.
   */
  screenFacings(): Record<'upLeft' | 'upRight' | 'downLeft' | 'downRight', Facing> {
    const origin = new Vector3(0, 0, 0).project(this.camera);
    const screen = (f: Facing) => {
      const d = DIRECTIONS[f];
      const p = new Vector3(d.x, 0, d.y).project(this.camera);
      return { x: p.x - origin.x, y: p.y - origin.y };
    };
    const facings = Object.keys(DIRECTIONS) as Facing[];
    const pick = (sx: number, sy: number) =>
      facings.reduce((best, f) => {
        const v = screen(f);
        const b = screen(best);
        return v.x * sx + v.y * sy > b.x * sx + b.y * sy ? f : best;
      });
    return {
      upLeft: pick(-1, 1),
      upRight: pick(1, 1),
      downLeft: pick(-1, -1),
      downRight: pick(1, -1),
    };
  }

  private placeNode(node: UnitNode, c: Coord): void {
    node.at = c;
    this.setNodePos(node, this.tileTop(c));
  }

  private tileTop(c: Coord): Vector3 {
    const h = getTile(this.map, c)?.height ?? 0;
    return new Vector3(c.x + 0.5, (h + 1) * STEP, c.y + 0.5);
  }

  private addTween(t: Tween): void {
    this.tweens.add(t);
    this.requestRender();
  }

  /** Points each box face at its terrain's atlas cell; cliff textures stretch with height. */
  private mapUvs(box: BufferGeometry, terrain: string, height: number): void {
    const uv = box.getAttribute('uv');
    for (let face = 0; face < 6; face++) {
      const [u0, v0, u1, v1] = face === 2 ? this.atlas.top(terrain) : this.atlas.side(terrain);
      const vScale = face === 2 ? 1 : Math.min(1, height / 1.4);
      for (let k = 0; k < 4; k++) {
        const i = face * 4 + k;
        const u = uv.getX(i);
        const v = uv.getY(i);
        uv.setXY(
          i,
          u0 + u * (u1 - u0),
          face === 2 ? v0 + v * (v1 - v0) : v1 - (1 - v) * vScale * (v1 - v0),
        );
      }
    }
    uv.needsUpdate = true;
  }

  private buildTerrain(): void {
    const parts: BufferGeometry[] = [];
    const outline: number[] = [];
    const top = new Color();
    const side = new Color();
    for (let y = 0; y < this.map.depth; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = getTile(this.map, { x, y });
        if (!tile) continue;
        const h = (tile.height + 1) * STEP;
        const box = new BoxGeometry(1, h, 1).translate(x + 0.5, h / 2, y + 0.5);
        // Subtle per-tile light variation so large fields don't look stamped.
        const shade = 0.92 + ((x * 7 + y * 13) % 5) * 0.025;
        top.setRGB(shade, shade, shade);
        side.setRGB(shade * 0.72, shade * 0.72, shade * 0.72);
        const colors: number[] = [];
        // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z; 4 vertices each.
        for (let face = 0; face < 6; face++) {
          const c = face === 2 ? top : side;
          for (let v = 0; v < 4; v++) colors.push(c.r, c.g, c.b);
        }
        this.mapUvs(box, tile.terrain, h);
        box.setAttribute('color', new Float32BufferAttribute(colors, 3));
        parts.push(box);
        const e = 0.002;
        outline.push(
          x,
          h + e,
          y,
          x + 1,
          h + e,
          y,
          x + 1,
          h + e,
          y,
          x + 1,
          h + e,
          y + 1,
          x + 1,
          h + e,
          y + 1,
          x,
          h + e,
          y + 1,
          x,
          h + e,
          y + 1,
          x,
          h + e,
          y,
        );
      }
    }
    const merged = mergeGeometries(parts);
    for (const p of parts) p.dispose();
    this.terrain = new Mesh(
      merged,
      new MeshLambertMaterial({ vertexColors: true, map: this.atlas.texture }),
    );
    this.scene.add(this.terrain);

    const grid = new BufferGeometry();
    grid.setAttribute('position', new Float32BufferAttribute(outline, 3));
    this.scene.add(
      new LineSegments(
        grid,
        new LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
      ),
    );
  }

  private updateCamera(): void {
    // Classic isometric angle, orbiting the target in 90° steps.
    const angle = Math.PI / 4 + (this.rotation * Math.PI) / 2;
    const distance = 30;
    this.camera.position.set(
      this.target.x + Math.sin(angle) * distance,
      this.target.y + distance * 0.82,
      this.target.z + Math.cos(angle) * distance,
    );
    this.camera.lookAt(this.target);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    // Screen density, TV zoom and the 4K cap (ADR 0010).
    this.renderer.setPixelRatio(renderPixelRatio(measureCanvas(this.canvas)));
    this.renderer.setSize(w, h, false);
    // Fit roughly the map diagonal to the shorter screen side.
    const viewHeight = Math.max(this.map.width, this.map.depth) * 0.85;
    const aspect = w / h;
    this.camera.left = (-viewHeight * aspect) / 2;
    this.camera.right = (viewHeight * aspect) / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.near = 0.1;
    this.camera.far = 200;
    this.updateCamera();
  }

  /** Render on demand; keeps rendering only while tweens run, to save battery on phones. */
  private requestRender(idleOnly = false): void {
    if (!idleOnly) this.fullRedraw = true;
    if (this.frameRequested || this.disposed) return;
    this.frameRequested = true;
    const requestedAt = performance.now();
    requestAnimationFrame((now) => {
      this.frameRequested = false;
      if (this.disposed) return;
      const started = performance.now();
      const idleOnly = !this.fullRedraw && !this.tweens.size;
      for (const t of [...this.tweens]) if (t(now)) this.tweens.delete(t);
      const animating = this.mode === '2d' ? this.updateFigures(now) : false;
      this.paint(animating);
      if (idleOnly && !animating) {
        this.idleCost = this.idleCost * 0.7 + (performance.now() - started) * 0.3;
        // How long the browser took to hand out the frame beyond a normal vsync wait: it grows
        // when the compositor or GPU is behind.
        const wait = Math.max(0, started - requestedAt - 20);
        this.idleWait = this.idleWait * 0.7 + wait * 0.3;
      }
      for (const listener of this.frameListeners) listener();
      if (this.tweens.size || animating) this.requestRender();
    });
  }

  /**
   * Draws a frame. When only idling sprites changed their textures, just the screen rectangle
   * around them is redrawn (scissored) instead of the whole map, which is what keeps idle
   * breathing cheap on slow GPUs; an idle tick where nothing is due draws nothing.
   */
  private paint(animating: boolean): void {
    const full = this.fullRedraw || animating || this.tweens.size > 0 || this.mode !== '2d';
    this.fullRedraw = false;
    const r = this.renderer;
    if (full) {
      for (const n of this.units.values()) if (n.fig) n.fig.redrawn = false;
      r.render(this.scene, this.camera);
      return;
    }
    const box = this.idleRect();
    if (!box) return;
    r.setScissorTest(true);
    r.setScissor(box.x, box.y, box.w, box.h);
    r.render(this.scene, this.camera);
    r.setScissorTest(false);
  }

  /** Canvas rectangle (CSS pixels, y up) around the sprites redrawn this frame, or null. */
  private idleRect(): { x: number; y: number; w: number; h: number } | null {
    const size = this.renderer.getSize(new Vector2());
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
    const p = new Vector3();
    const w = CELL_W * FIGURE_UNIT;
    const h = CELL_H * FIGURE_UNIT;
    for (const n of this.units.values()) {
      const f = n.fig;
      if (!f?.redrawn) continue;
      f.redrawn = false;
      for (const sx of [-0.5, 0.5])
        for (const sy of [-FOOT / CELL_H, 1 - FOOT / CELL_H]) {
          p.copy(f.sprite.position)
            .addScaledVector(right, sx * w)
            .addScaledVector(up, sy * h)
            .project(this.camera);
          x0 = Math.min(x0, p.x);
          x1 = Math.max(x1, p.x);
          y0 = Math.min(y0, p.y);
          y1 = Math.max(y1, p.y);
        }
    }
    if (x0 === Infinity) return null;
    const pad = 3;
    const left = Math.max(0, Math.floor(((x0 + 1) / 2) * size.x) - pad);
    const bottom = Math.max(0, Math.floor(((y0 + 1) / 2) * size.y) - pad);
    const rightPx = Math.min(size.x, Math.ceil(((x1 + 1) / 2) * size.x) + pad);
    const top = Math.min(size.y, Math.ceil(((y1 + 1) / 2) * size.y) + pad);
    if (rightPx <= left || top <= bottom) return null;
    return { x: left, y: bottom, w: rightPx - left, h: top - bottom };
  }

  /** Steps the 2D figures: camera-relative mirroring, idle/walk/strike frames, KO removal. */
  private updateFigures(now: number): boolean {
    const angle = Math.PI / 4 + (this.rotation * Math.PI) / 2;
    const idle = !this.reduced && !document.hidden;
    let busy = false;
    // With many units standing, each redraws less often (and out of step with the others).
    const idleMs = IDLE_MS * Math.max(1, Math.ceil(this.units.size / 10));
    const v = new Vector3();
    const step = (node: UnitNode): boolean => {
      const fig = node.fig;
      if (!fig) return false;
      const cf = cameraFacing(node.facing, angle);
      fig.mirror = cf.mirror;
      fig.away = cf.away;
      fig.idleMs = idleMs;
      v.copy(node.pos).project(this.camera);
      const visible = Math.abs(v.x) < 1.15 && v.y > -1.2 && v.y < 1.3;
      return fig.update(now, idle, visible);
    };
    for (const node of this.units.values()) if (step(node)) busy = true;
    for (const node of [...this.dying]) {
      step(node);
      if (node.fig?.gone) {
        this.dying.delete(node);
        this.removeNode(node, false);
      } else busy = true;
    }
    return busy;
  }

  private pick(clientX: number, clientY: number): Coord | undefined {
    if (!this.terrain) return undefined;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.terrain)[0];
    if (hit?.faceIndex == null) return undefined;
    const index = Math.floor(hit.faceIndex / TRIANGLES_PER_TILE);
    return { x: index % this.map.width, y: Math.floor(index / this.map.width) };
  }

  private pan(dx: number, dy: number): void {
    // Pointer deltas are on-screen pixels, which the TV zoom makes larger than layout pixels.
    const screenHeight = this.canvas.getBoundingClientRect().height || this.canvas.clientHeight;
    const worldPerPixel = (this.camera.top - this.camera.bottom) / this.zoom / screenHeight;
    const right = new Vector3().setFromMatrixColumn(this.camera.matrix, 0).setY(0).normalize();
    const forward = new Vector3().setFromMatrixColumn(this.camera.matrix, 1).setY(0).normalize();
    this.target.addScaledVector(right, -dx * worldPerPixel);
    this.target.addScaledVector(forward, dy * worldPerPixel * 1.4);
    this.target.x = Math.min(Math.max(this.target.x, 0), this.map.width);
    this.target.z = Math.min(Math.max(this.target.z, 0), this.map.depth);
    this.updateCamera();
  }

  private setZoom(zoom: number): void {
    this.zoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
    this.updateCamera();
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) this.dragStart = { x: e.clientX, y: e.clientY, moved: false };
    if (this.pointers.size === 2) {
      this.dragStart = undefined;
      this.pinchDistance = this.currentPinchDistance();
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) {
      // A mouse moving with no button held: tell the controller which tile it's over.
      if (e.pointerType === 'mouse' && this.input.onHover) {
        const c = this.pick(e.clientX, e.clientY);
        const key = c ? `${c.x},${c.y}` : null;
        if (key !== this.hovered) {
          this.hovered = key;
          this.input.onHover(c ?? null);
        }
      }
      return;
    }
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const d = this.currentPinchDistance();
      if (this.pinchDistance > 0) this.setZoom(this.zoom * (d / this.pinchDistance));
      this.pinchDistance = d;
      return;
    }
    if (this.dragStart) {
      if (Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y) > TAP_SLOP_PX) {
        this.dragStart.moved = true;
      }
      if (this.dragStart.moved) this.pan(e.clientX - prev.x, e.clientY - prev.y);
    }
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (e.type === 'pointerup' && e.button === 2) {
      this.dragStart = undefined;
      return;
    }
    if (e.type === 'pointerup' && this.dragStart && !this.dragStart.moved) {
      const c = this.pick(e.clientX, e.clientY);
      if (c) this.onTileTap(c);
    }
    if (this.pointers.size === 0) this.dragStart = undefined;
    this.pinchDistance = 0;
  };

  private readonly onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    this.input.onCancel?.();
  };

  private readonly onPointerLeave = (): void => {
    if (this.hovered === null) return;
    this.hovered = null;
    this.input.onHover?.(null);
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.setZoom(this.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  };

  private currentPinchDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function sameLook(a: UnitLook, b: UnitLook): boolean {
  return (
    a.label === b.label &&
    a.color === b.color &&
    a.hp === b.hp &&
    a.maxHp === b.maxHp &&
    a.active === b.active &&
    a.enemy === b.enemy
  );
}
