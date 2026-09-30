import type { FrameClass, WeaponType } from '@m1565/core';
import {
  AmbientLight,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { guardFor, StickFighter } from './StickFighter';

/**
 * A single unit on a stone plinth, turning slowly: the figure on the unit details screen until
 * real frame art exists.
 */
export class UnitViewer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 50);
  private readonly fighter: StickFighter;
  private readonly plinth: Mesh;
  private readonly resizeObserver: ResizeObserver;
  private frame = 0;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    color: string,
    weaponType: WeaponType,
    frameClass: FrameClass,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 1.25, 5.2);
    this.camera.lookAt(0, 0.95, 0);
    this.scene.add(new HemisphereLight(0xdfe8ff, 0x3a2e1e, 1.1));
    this.scene.add(new AmbientLight(0xffffff, 0.45));
    const sun = new DirectionalLight(0xfff0d0, 1.9);
    sun.position.set(-2, 5, 4);
    this.scene.add(sun);
    this.plinth = new Mesh(
      new CylinderGeometry(0.9, 1, 0.16, 32),
      new MeshLambertMaterial({ color: '#b8a67a' }),
    );
    this.plinth.position.y = -0.08;
    this.scene.add(this.plinth);
    this.fighter = new StickFighter(color, weaponType, frameClass, 0, 1);
    this.fighter.apply(guardFor(weaponType));
    this.scene.add(this.fighter.root);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (now: number) => {
      if (this.disposed) return;
      this.fighter.root.rotation.y = reduced ? -0.6 : now / 2400;
      this.renderer.render(this.scene, this.camera);
      if (!reduced) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.fighter.dispose();
    this.plinth.geometry.dispose();
    this.renderer.dispose();
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.position.z = Math.max(5.2, 4 / this.camera.aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
}
