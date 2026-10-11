import type { FigureSpec } from '../render/Armatura';
import { measureCanvas, renderPixelRatio } from '../render/resolution';
import type { Rig } from './contract';
import { createRig } from './rig';

/**
 * 2D unit viewer: one unit on a stone plinth with a slow idle (breathing, plume sway) and a
 * small mirror-turn now and then. Same constructor and dispose as render/UnitViewer.ts.
 */
export class UnitViewer2D {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly rig: Rig;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly reduced: boolean;
  private frame = 0;
  private disposed = false;
  private w = 0;
  private h = 0;
  private ratio = 1;
  private t = 0;
  private last = 0;
  private turn = 0; // 0..1 progress through the current turn, -1 idle
  private turnAt = 5;
  private face: 1 | -1 = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    spec: FigureSpec,
  ) {
    this.ctx = canvas.getContext('2d');
    this.reduced = safeMatch('(prefers-reduced-motion: reduce)');
    this.rig = createRig(spec, 0, 1);
    this.turn = -1;
    this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(canvas);
    this.resize();
    if (!this.reduced && typeof requestAnimationFrame !== 'undefined') {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  dispose(): void {
    this.disposed = true;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
  }

  private readonly tick = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    if (this.turn < 0 && this.t > this.turnAt) {
      this.turn = 0;
      this.turnAt = this.t + 7;
    }
    if (this.turn >= 0) {
      this.turn += dt / 1.1;
      if (this.turn >= 1) {
        this.turn = -1;
        this.face = this.face === 1 ? -1 : 1;
      }
    }
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.ratio = renderPixelRatio(measureCanvas(this.canvas));
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.ratio);
    this.canvas.height = Math.round(h * this.ratio);
    this.draw();
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx || !this.w) return;
    const { w, h } = this;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // Soft spotlight backdrop.
    const g = ctx.createRadialGradient(w / 2, h * 0.5, 4, w / 2, h * 0.5, Math.max(w, h) * 0.7);
    g.addColorStop(0, 'rgba(255,236,190,0.30)');
    g.addColorStop(0.55, 'rgba(120,96,70,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(h / 2.5, w / 1.9);
    const groundY = h * 0.86;
    const cx = w / 2;
    // Plinth.
    const pw = scale * 0.95;
    const ph = scale * 0.13;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, groundY + ph * 1.4, pw * 1.05, ph * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    const side = ctx.createLinearGradient(cx - pw, 0, cx + pw, 0);
    side.addColorStop(0, '#8d7d5a');
    side.addColorStop(0.45, '#d2c096');
    side.addColorStop(1, '#6f6244');
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + ph * 0.9, pw, ph, 0, 0, Math.PI);
    ctx.lineTo(cx - pw, groundY);
    ctx.ellipse(cx, groundY, pw, ph, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0d1a8';
    ctx.beginPath();
    ctx.ellipse(cx, groundY, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,64,40,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Figure. A turn squashes it through zero width and mirrors it.
    let sx = 1;
    if (this.turn >= 0) sx = Math.cos(this.turn * Math.PI);
    const rig = this.rig;
    rig.time = this.t;
    rig.facing = this.face;
    ctx.save();
    ctx.translate(cx, groundY);
    ctx.scale(scale * 1.15, -scale * 1.15);
    ctx.scale(Math.abs(sx) < 0.05 ? 0.05 : sx, 1);
    rig.draw(ctx);
    ctx.restore();
  }
}

function safeMatch(q: string): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia(q).matches;
  } catch {
    return false;
  }
}
