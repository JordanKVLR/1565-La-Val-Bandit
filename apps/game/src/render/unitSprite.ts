import { CanvasTexture, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';

export interface UnitLook {
  readonly label: string;
  readonly color: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly active: boolean;
  /** Story scenes show characters without combat HP bars. */
  readonly hideHp?: boolean;
}

const W = 64;
const H = 112;

/**
 * Placeholder unit billboard: a coloured banner with an initial and an HP bar. Replaced by atlas
 * sprites (idle/walk/attack per facing) once art exists; the renderer only depends on `Sprite`.
 */
export function createUnitSprite(look: UnitLook): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(
    new SpriteMaterial({ map: texture, transparent: true, depthTest: true }),
  );
  sprite.scale.set(0.8, 1.4, 1);
  sprite.center.set(0.5, 0.04);
  drawUnit(sprite, look);
  return sprite;
}

export function drawUnit(sprite: Sprite, look: UnitLook): void {
  const texture = sprite.material.map as CanvasTexture;
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  // HP bar
  if (!look.hideHp) drawHp(ctx, look);
  drawBody(ctx, look);
  texture.needsUpdate = true;
}

function drawHp(ctx: CanvasRenderingContext2D, look: UnitLook): void {
  const ratio = look.maxHp > 0 ? look.hp / look.maxHp : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(8, 2, 48, 9);
  ctx.fillStyle = ratio > 0.5 ? '#5fc46a' : ratio > 0.25 ? '#e0b43a' : '#e0503a';
  ctx.fillRect(10, 4, Math.round(44 * ratio), 5);
}

function drawBody(ctx: CanvasRenderingContext2D, look: UnitLook): void {
  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(32, 104, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Banner
  ctx.fillStyle = look.color;
  ctx.strokeStyle = look.active ? '#f5d77a' : '#1b1410';
  ctx.lineWidth = look.active ? 5 : 4;
  ctx.beginPath();
  ctx.moveTo(10, 24);
  ctx.lineTo(54, 24);
  ctx.lineTo(54, 74);
  ctx.lineTo(32, 100);
  ctx.lineTo(10, 74);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(look.label, 32, 54);
}
