import { CanvasTexture, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';
import { MAP_GOLD, MAP_GOLD_BRIGHT, MAP_HP, MAP_INK, MAP_LIGHT } from './palette';

export interface UnitLook {
  readonly label: string;
  readonly color: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly active: boolean;
  /** Story scenes show characters without combat HP bars. */
  readonly hideHp?: boolean;
  /** Enemies get a diamond badge (players a round one), so side never depends on colour. */
  readonly enemy?: boolean;
}

/** Drawn at 128 px so the badge stays crisp on a 4K TV; the sprite's world size is unchanged. */
const W = 128;
const H = 128;
/** Centre of the token on the canvas. */
const CX = W / 2;
const CY = 66;
/** The initial's typeface: Cinzel, as in the HUD (falls back until the web font loads). */
export const BADGE_FONT = '600 34px Cinzel, Georgia, serif';

/**
 * Unit badge floating over its head: a token in the side's colour and shape (circle: yours,
 * diamond: enemy) with the unit's initial, a thin HP line under it, and for the unit whose
 * turn it is a gold ring and a small gold chevron pointing down at it (shape and size, not
 * colour alone). The marker on the tile shows facing; this shows who it is and how hurt.
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
  sprite.scale.set(0.7, 0.7, 1);
  sprite.center.set(0.5, 0);
  drawUnit(sprite, look);
  return sprite;
}

function tokenPath(ctx: CanvasRenderingContext2D, enemy: boolean, grow: number): void {
  ctx.beginPath();
  if (enemy) {
    const r = 33 + grow * 1.3;
    ctx.moveTo(CX, CY - r);
    ctx.lineTo(CX + r, CY);
    ctx.lineTo(CX, CY + r);
    ctx.lineTo(CX - r, CY);
    ctx.closePath();
  } else {
    ctx.arc(CX, CY, 26 + grow, 0, Math.PI * 2);
  }
}

export function drawUnit(sprite: Sprite, look: UnitLook): void {
  const texture = sprite.material.map as CanvasTexture;
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const enemy = !!look.enemy;
  ctx.clearRect(0, 0, W, H);
  ctx.lineJoin = 'round';

  // The active unit: a gold ring round the token and a chevron above it.
  if (look.active) {
    tokenPath(ctx, enemy, 8);
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(11, 10, 14, 0.6)';
    ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = MAP_GOLD_BRIGHT;
    ctx.stroke();
    ctx.beginPath();
    const top = enemy ? CY - 33 - 18 : CY - 26 - 16;
    ctx.moveTo(CX - 11, top - 12);
    ctx.lineTo(CX, top - 2);
    ctx.lineTo(CX + 11, top - 12);
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(11, 10, 14, 0.7)';
    ctx.stroke();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = MAP_GOLD_BRIGHT;
    ctx.stroke();
  }

  // Token: side colour, lit from above, in a fine dark line with a warm inner hairline.
  tokenPath(ctx, enemy, 0);
  const fill = ctx.createLinearGradient(0, CY - 34, 0, CY + 34);
  fill.addColorStop(0, look.color);
  fill.addColorStop(1, shade(look.color, 0.62));
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = MAP_INK;
  ctx.stroke();
  tokenPath(ctx, enemy, -4);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = look.active ? MAP_GOLD : 'rgba(244, 238, 223, 0.55)';
  ctx.stroke();

  ctx.fillStyle = MAP_LIGHT;
  ctx.font = BADGE_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillText(look.label, CX, CY + 2);
  ctx.shadowColor = 'transparent';

  // HP: a thin line on a dark track; low HP (a quarter or less) also turns the danger tone.
  if (!look.hideHp) {
    const ratio = look.maxHp > 0 ? Math.max(0, Math.min(1, look.hp / look.maxHp)) : 0;
    const w = 64;
    const x = CX - w / 2;
    const y = enemy ? CY + 33 + 10 : CY + 26 + 14;
    ctx.fillStyle = 'rgba(11, 10, 14, 0.82)';
    roundRect(ctx, x - 3, y - 3, w + 6, 11, 5.5);
    ctx.fill();
    ctx.fillStyle = ratio > 0.25 ? MAP_HP.ok : MAP_HP.low;
    if (ratio > 0) {
      roundRect(ctx, x, y, Math.max(5, Math.round(w * ratio)), 5, 2.5);
      ctx.fill();
    }
  }
  texture.needsUpdate = true;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The colour darkened towards black (k = 1 keeps it, 0 is black). */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k);
  return `rgb(${c((n >> 16) & 255)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}
