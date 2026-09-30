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

const W = 96;
const H = 96;

/**
 * Unit badge floating over its arrow: a round token with the unit's initial and an HP bar.
 * The arrow on the tile shows facing; this shows who it is and how hurt.
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
  sprite.scale.set(0.55, 0.55, 1);
  sprite.center.set(0.5, 0);
  drawUnit(sprite, look);
  return sprite;
}

export function drawUnit(sprite: Sprite, look: UnitLook): void {
  const texture = sprite.material.map as CanvasTexture;
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  // Token
  ctx.beginPath();
  ctx.arc(W / 2, 40, 30, 0, Math.PI * 2);
  ctx.fillStyle = look.color;
  ctx.fill();
  ctx.lineWidth = look.active ? 6 : 4;
  ctx.strokeStyle = look.active ? '#f5d77a' : '#15100c';
  ctx.stroke();
  ctx.fillStyle = '#f4ead2';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(look.label, W / 2, 42);
  // HP bar
  if (!look.hideHp) {
    const ratio = look.maxHp > 0 ? look.hp / look.maxHp : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(14, 78, W - 28, 12);
    ctx.fillStyle = ratio > 0.5 ? '#5fc46a' : ratio > 0.25 ? '#e0b43a' : '#e0503a';
    ctx.fillRect(17, 81, Math.round((W - 34) * ratio), 6);
  }
  texture.needsUpdate = true;
}
