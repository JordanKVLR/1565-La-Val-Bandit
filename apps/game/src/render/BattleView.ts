import type { BattleMap, Coord } from '@m1565/core';
import { getTile } from '@m1565/core';
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
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
import { createPlaceholderUnit } from './unitSprite';

/** World units per height step. Tiles are 1×1 on the ground plane. */
const STEP = 0.35;
const TRIANGLES_PER_TILE = 12;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const TAP_SLOP_PX = 8;

export interface PlacedUnit {
  readonly label: string;
  readonly color: string;
  readonly at: Coord;
}

/**
 * Isometric battle renderer. Owns the Three.js scene, camera and pointer gestures, and reports
 * tile taps upward. It holds no game rules: the screen feeds it a map and units, and it draws.
 */
export class BattleView {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly target = new Vector3();
  private readonly cursor: Mesh;
  private readonly raycaster = new Raycaster();
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private readonly resizeObserver: ResizeObserver;
  private terrain: Mesh | undefined;
  private units: Sprite[] = [];
  private rotation = 0;
  private zoom = 1;
  private dragStart: { x: number; y: number; moved: boolean } | undefined;
  private pinchDistance = 0;
  private frameRequested = false;

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
        color: 0xe0543a,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    this.cursor.visible = false;
    this.scene.add(this.cursor);

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

  setUnits(units: readonly PlacedUnit[]): void {
    for (const s of this.units) this.scene.remove(s);
    this.units = units.map((u) => {
      const sprite = createPlaceholderUnit(u.label, u.color);
      sprite.position.copy(this.tileTop(u.at));
      this.scene.add(sprite);
      return sprite;
    });
    this.requestRender();
  }

  select(c: Coord | undefined): void {
    this.cursor.visible = !!c;
    if (c) this.cursor.position.copy(this.tileTop(c)).add(new Vector3(0, 0.01, 0));
    this.requestRender();
  }

  private tileTop(c: Coord): Vector3 {
    const h = getTile(this.map, c)?.height ?? 0;
    return new Vector3(c.x + 0.5, (h + 1) * STEP, c.y + 0.5);
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

  /** Render on demand only: saves battery on phones when nothing moves. */
  private requestRender(): void {
    if (this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.renderer.render(this.scene, this.camera);
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
    // Convert screen pixels to world units on the ground plane, respecting rotation.
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
