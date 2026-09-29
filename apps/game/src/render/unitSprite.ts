import { CanvasTexture, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';

/**
 * Placeholder unit billboard: a coloured banner with an initial. Replaced by atlas sprites
 * (idle/walk/attack per facing) once art exists; the renderer only depends on `Sprite`.
 */
export function createPlaceholderUnit(label: string, color: string): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(32, 88, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#1b1410';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(54, 10);
    ctx.lineTo(54, 60);
    ctx.lineTo(32, 84);
    ctx.lineTo(10, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f4ead2';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 32, 40);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(0.8, 1.2, 1);
  sprite.center.set(0.5, 0.05);
  return sprite;
}
