import type { BattleMap, Coord, Facing } from '@m1565/core';
import { DIRECTIONS, getTile } from '@m1565/core';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Sprite } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FALLBACK_COLOR, TERRAIN_COLORS } from './palette';
import type { UnitLook } from './unitSprite';
import { createUnitSprite, drawUnit } from './unitSprite';

/** World units per height step. Tiles are 1×1 on the ground plane. */
const STEP = 0.35;
const TRIANGLES_PER_TILE = 12;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.8;
const TAP_SLOP_PX = 8;

export interface UnitVisual extends UnitLook {
  readonly id: string;
  readonly at: Coord;
  readonly facing: Facing;
  readonly arrowColor: string;
}

export type HighlightKind = 'move' | 'range' | 'target' | 'danger';

const HIGHLIGHT_COLORS: Record<HighlightKind, { color: number; opacity: number }> = {
  move: { color: 0x4aa3e0, opacity: 0.45 },
  range: { color: 0xe07a3a, opacity: 0.3 },
  target: { color: 0xe0303a, opacity: 0.6 },
  danger: { color: 0x9a3ae0, opacity: 0.25 },
};

const FACING_ANGLE: Record<Facing, number> = {
  north: Math.PI,
  east: Math.PI / 2,
  south: 0,
  west: -Math.PI / 2,
};

interface UnitNode {
  sprite: Sprite;
  arrow: Mesh;
  look: UnitLook;
  at: Coord;
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
  private readonly raycaster = new Raycaster();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private readonly resizeObserver: ResizeObserver;
  private readonly units = new Map<string, UnitNode>();
  private readonly tweens = new Set<Tween>();
  private terrain: Mesh | undefined;
  private rotation = 0;
  private zoom = 1;
  private dragStart: { x: number; y: number; moved: boolean } | undefined;
  private pinchDistance = 0;
  private frameRequested = false;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly map: BattleMap,
    private readonly onTileTap: (c: Coord) => void,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new Color(0x2a1f2e);

    this.scene.add(new AmbientLight(0xffffff, 1.4));
    const sun = new DirectionalLight(0xfff1d6, 2.2);
    sun.position.set(-4, 10, 6);
    this.scene.add(sun);

    this.cursor = new Mesh(
      new PlaneGeometry(0.96, 0.96).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({
        color: 0xf5d77a,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    this.cursor.visible = false;
    this.scene.add(this.cursor, this.highlightGroup);

    this.buildTerrain();
    this.target.set(map.width / 2, 0, map.depth / 2);
    this.updateCamera();

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  dispose(): void {
    this.disposed = true;
    this.tweens.clear();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
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

  /** Creates, updates or removes unit billboards to match the given list. */
  syncUnits(list: readonly UnitVisual[]): void {
    const seen = new Set<string>();
    for (const u of list) {
      seen.add(u.id);
      let node = this.units.get(u.id);
      if (!node) {
        const sprite = createUnitSprite(u);
        const arrow = new Mesh(
          new ConeGeometry(0.12, 0.3, 3).rotateX(Math.PI / 2),
          new MeshBasicMaterial({ color: u.arrowColor }),
        );
        this.scene.add(sprite, arrow);
        node = { sprite, arrow, look: u, at: u.at };
        this.units.set(u.id, node);
        this.placeNode(node, u.at);
      } else {
        if (node.at.x !== u.at.x || node.at.y !== u.at.y) this.placeNode(node, u.at);
        if (!sameLook(node.look, u)) {
          drawUnit(node.sprite, u);
          node.look = u;
        }
      }
      node.arrow.rotation.y = FACING_ANGLE[u.facing];
    }
    for (const [id, node] of this.units) {
      if (!seen.has(id)) {
        this.scene.remove(node.sprite, node.arrow);
        node.sprite.material.map?.dispose();
        node.sprite.material.dispose();
        this.units.delete(id);
      }
    }
    this.requestRender();
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
        node.sprite.position.copy(pos);
        node.arrow.position.copy(pos).add(new Vector3(0, 0.02, 0));
        const dir = { x: Math.sign(b.x - a.x), y: Math.sign(b.z - a.z) };
        const facing = (Object.keys(DIRECTIONS) as Facing[]).find(
          (f) => DIRECTIONS[f].x === dir.x && DIRECTIONS[f].y === dir.y,
        );
        if (facing) node.arrow.rotation.y = FACING_ANGLE[facing];
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
    const base = this.tileTop(node.at);
    const start = performance.now();
    this.addTween((now) => {
      const t = Math.max(0, (now - start) / 300);
      node.sprite.position.set(
        base.x + Math.sin(t * 40) * 0.06 * (1 - Math.min(t, 1)),
        base.y,
        base.z,
      );
      if (t >= 1) {
        node.sprite.position.copy(base);
        return true;
      }
      return false;
    });
  }

  setHighlights(layers: ReadonlyArray<{ kind: HighlightKind; tiles: readonly Coord[] }>): void {
    for (const child of [...this.highlightGroup.children]) {
      this.highlightGroup.remove(child);
      if (child instanceof Mesh) child.geometry.dispose();
    }
    const geo = new PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2);
    for (const layer of layers) {
      const { color, opacity } = HIGHLIGHT_COLORS[layer.kind];
      const mat = new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      for (const c of layer.tiles) {
        const m = new Mesh(geo, mat);
        m.position.copy(this.tileTop(c)).add(new Vector3(0, 0.005, 0));
        this.highlightGroup.add(m);
      }
    }
    this.requestRender();
  }

  select(c: Coord | undefined): void {
    this.cursor.visible = !!c;
    if (c) this.cursor.position.copy(this.tileTop(c)).add(new Vector3(0, 0.01, 0));
    this.requestRender();
  }

  /** Smoothly pans the camera to centre on a tile. */
  focus(c: Coord, ms = 350): Promise<void> {
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
    const p = this.tileTop(c);
    node.sprite.position.copy(p);
    node.arrow.position.copy(p).add(new Vector3(0, 0.02, 0));
  }

  private tileTop(c: Coord): Vector3 {
    const h = getTile(this.map, c)?.height ?? 0;
    return new Vector3(c.x + 0.5, (h + 1) * STEP, c.y + 0.5);
  }

  private addTween(t: Tween): void {
    this.tweens.add(t);
    this.requestRender();
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
        top.setHex(TERRAIN_COLORS[tile.terrain] ?? FALLBACK_COLOR);
        // Subtle per-tile variation so large fields don't read as flat colour.
        top.offsetHSL(0, 0, ((x * 7 + y * 13) % 5) * 0.008 - 0.016);
        side.copy(top).multiplyScalar(0.62);
        const colors: number[] = [];
        // BoxGeometry face order: +x, -x, +y (top), -y, +z, -z; 4 vertices each.
        for (let face = 0; face < 6; face++) {
          const c = face === 2 ? top : side;
          for (let v = 0; v < 4; v++) colors.push(c.r, c.g, c.b);
        }
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
    this.terrain = new Mesh(merged, new MeshLambertMaterial({ vertexColors: true }));
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
  private requestRender(): void {
    if (this.frameRequested || this.disposed) return;
    this.frameRequested = true;
    requestAnimationFrame((now) => {
      this.frameRequested = false;
      if (this.disposed) return;
      for (const t of [...this.tweens]) if (t(now)) this.tweens.delete(t);
      this.renderer.render(this.scene, this.camera);
      if (this.tweens.size) this.requestRender();
    });
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
    const worldPerPixel =
      (this.camera.top - this.camera.bottom) / this.zoom / this.canvas.clientHeight;
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
    if (!prev) return;
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
    if (e.type === 'pointerup' && this.dragStart && !this.dragStart.moved) {
      const c = this.pick(e.clientX, e.clientY);
      if (c) this.onTileTap(c);
    }
    if (this.pointers.size === 0) this.dragStart = undefined;
    this.pinchDistance = 0;
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

function sameLook(a: UnitLook, b: UnitLook): boolean {
  return (
    a.label === b.label &&
    a.color === b.color &&
    a.hp === b.hp &&
    a.maxHp === b.maxHp &&
    a.active === b.active
  );
}
