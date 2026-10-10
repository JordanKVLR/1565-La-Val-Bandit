/**
 * Baseline attack scripts, one per AttackStyle. Every attack inherits these: a script that
 * defines only some hooks keeps the style defaults for the others (see `scriptFor` in index.ts).
 * Hooks here are stateless; one-shots inside per-frame hooks use `fx.once(key)`.
 */
import type { AttackStyle } from '@m1565/core';
import type { Move } from '../../render/duelMoves';
import type { AttackScript, FxContext, V2 } from '../contract';
import type { FxEngine } from '../fx';

export type Palette = AttackScript['palette'];
type Hooks = Pick<AttackScript, 'start' | 'windup' | 'follow' | 'impactFx' | 'finish' | 'choreograph'>;

export const DEFAULT_PALETTE: Palette = { main: '#fff1c0', accent: '#ffb347', dark: '#5a2e14' };

export const eng = (c: FxContext): FxEngine => c.fx as FxEngine;

/** Mirrors an angle for a right-to-left attacker (angles are written for "forward = +x"). */
export const face = (a: number, dir: 1 | -1): number => (dir === 1 ? a : Math.PI - a);

export type Outcome = 'hit' | 'block' | 'counter' | 'dodge' | 'miss';
export function outcomeOf(c: Pick<FxContext, 'hit' | 'reaction'>): Outcome {
  if (c.reaction === 'defend') return 'block';
  if (!c.hit && c.reaction === 'counter') return 'counter';
  if (!c.hit && c.reaction === 'avoid') return 'dodge';
  return c.hit ? 'hit' : 'miss';
}

/** Where a blow lands on the defender (the side facing the attacker). */
export function hitPoint(c: FxContext): V2 {
  const a = c.defender.anchors().chest;
  return { x: a.x - c.dir * 0.12, y: a.y };
}

const size = (c: FxContext) => 0.85 + 0.25 * Math.min(2, Math.max(0.5, c.power));

const pick = (c: FxContext, words: readonly string[]) => words[Math.floor(eng(c).rand() * words.length)]!;

function whiff(c: FxContext, pal: Palette, text: string): void {
  const fx = eng(c);
  const at = c.defender.anchors().chest;
  fx.word({ x: at.x - c.dir * 0.2, y: at.y + 0.7 }, text, { color: '#d8e8f0', size: 0.4, life: 0.6 });
  fx.dust({ x: at.x, y: 0 }, { n: 4 });
  fx.glow({ x: at.x - c.dir * 0.3, y: at.y }, { radius: 0.5, color: pal.main, life: 0.2 });
}

function meleeHit(
  c: FxContext,
  pal: Palette,
  o: { words: readonly string[]; burst: number; sparks: number; ring: number; star?: number },
): void {
  const fx = eng(c);
  const p = hitPoint(c);
  const s = size(c);
  fx.glow(p, { radius: 1.3 * s, color: pal.main, life: 0.28 });
  fx.burst(p, { n: o.star ?? 11, color: pal.accent, length: o.burst * s, life: 0.36 });
  fx.spark(p, { n: o.sparks, color: pal.accent, speed: 6.5 * s, dir: face(0.35, c.dir), spread: 2.4, size: 0.04 });
  fx.spark(p, { n: 6, color: pal.main, speed: 9, dir: face(0.1, c.dir), spread: 0.7, size: 0.03 });
  fx.ring(p, { color: pal.main, radius: o.ring * s, life: 0.4, width: 0.1 });
  fx.word({ x: p.x - c.dir * 0.1, y: p.y + 0.75 }, pick(c, o.words), {
    color: pal.accent,
    size: 0.5 * s,
    life: 0.8,
  });
}

/** A brief tapered streak from the weapon hand through and past the tip (thrusts). */
function stab(c: FxContext, pal: Palette): void {
  const fx = eng(c);
  const a = c.attacker.anchors();
  const x0 = a.hand.x;
  const y0 = a.hand.y;
  const x1 = a.tip.x + c.dir * 1.0;
  const y1 = a.tip.y;
  fx.layer('front', 0.2, (ctx, k) => {
    const u = Math.min(1, k * 4);
    const alpha = 1 - k;
    const hx = x0 + (x1 - x0) * u;
    const hy = y0 + (y1 - y0) * u;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i === 0 ? pal.accent : '#ffffff';
      ctx.globalAlpha = alpha * (i === 0 ? 0.7 : 0.95);
      const w = (i === 0 ? 0.16 : 0.06) * (1 - k * 0.6);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(hx, hy + w);
      ctx.lineTo(hx + c.dir * 0.5, hy);
      ctx.lineTo(hx, hy - w);
      ctx.closePath();
      ctx.fill();
    }
  });
  fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: pal.main, life: 0.25, n: 12 });
}

function smearArc(c: FxContext, pal: Palette, from: number, to: number, radius: number, width: number, life: number, oy = 0.3): void {
  const a = c.attacker.anchors().chest;
  eng(c).arc(
    { x: a.x + c.dir * 0.15, y: a.y + oy },
    { radius, from: face(from, c.dir), to: face(to, c.dir), width, color: pal.accent, life },
  );
}

// ── ranged helpers ──

function muzzleFlash(c: FxContext, pal: Palette): V2 {
  const fx = eng(c);
  const m = c.attacker.anchors().tip;
  const at = { x: m.x, y: m.y };
  fx.glow(at, { radius: 0.9, color: '#ffd37a', life: 0.14 });
  fx.burst(at, { n: 7, color: '#ffe9a0', length: 0.55, life: 0.16 });
  fx.spark(at, { n: 9, color: pal.accent, speed: 8, dir: face(0, c.dir), spread: 0.8 });
  fx.smoke(at, { n: 5, size: 0.14, rise: 0.4 });
  fx.word({ x: at.x + c.dir * 0.5, y: at.y + 0.5 }, 'BANG!', { color: pal.accent, size: 0.38, life: 0.5 });
  return at;
}

function tracer(c: FxContext, pal: Palette, from: V2, life: number, onHit: boolean): void {
  const fx = eng(c);
  const d = c.defender.anchors();
  const hitMode = c.hit || c.reaction === 'defend';
  const to: V2 = hitMode ? { x: d.chest.x - c.dir * 0.12, y: d.chest.y } : { x: d.chest.x, y: d.chest.y + 0.35 };
  fx.sprite({
    from,
    to,
    life,
    trail: pal.accent,
    paint: (ctx, p, ang) => {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.22, 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0.03, 0, 0.12, 0.028, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    onEnd: () => {
      if (onHit && hitMode) {
        fx.spark(to, { n: 6, color: pal.accent, speed: 5, dir: face(Math.PI, c.dir), spread: 1.6 });
        fx.burst(to, { n: 8, color: pal.accent, length: 0.4, life: 0.22 });
      }
    },
  });
}

function ricochet(c: FxContext, pal: Palette): void {
  const fx = eng(c);
  const d = c.defender.anchors().feet;
  const at = { x: d.x + c.dir * 0.9, y: 0.04 };
  fx.spark(at, { n: 10, color: pal.main, speed: 6, dir: Math.PI / 2, spread: 1.4 });
  fx.dust(at, { n: 6 });
  fx.glow({ x: at.x, y: 0.1 }, { radius: 0.4, color: pal.main, life: 0.15 });
  fx.word({ x: at.x, y: 0.7 }, 'PING!', { color: '#e8f0f4', size: 0.36, life: 0.55 });
}

function explosion(c: FxContext, _pal: Palette): void {
  const fx = eng(c);
  const d = c.defender.anchors().feet;
  const at = { x: d.x + (c.hit ? 0 : c.dir * 0.3), y: 0.45 };
  const s = size(c);
  fx.glow(at, { radius: 2.2 * s, color: '#ffb347', life: 0.5 });
  fx.glow(at, { radius: 1.8 * s, color: '#fff3c4', life: 0.25 });
  fx.burst(at, { n: 14, color: '#ff8a1f', length: 1.1 * s, life: 0.45 });
  fx.ring(at, { color: '#ffd37a', radius: 2.0 * s, life: 0.5, width: 0.14 });
  fx.ring({ x: at.x, y: 0.03 }, { color: '#cdb98e', radius: 2.4 * s, life: 0.6, width: 0.1, flat: 0.22 });
  fx.spark(at, { n: 26, color: '#ffb347', speed: 9 * s, size: 0.05 });
  fx.ember(at, { n: 14 });
  fx.smoke(at, { n: 9, size: 0.3, rise: 0.9, color: '#4a4540' });
  fx.dust({ x: at.x, y: 0 }, { n: 12, size: 0.24 });
  fx.word({ x: at.x, y: at.y + 1.1 }, 'BOOM!', { color: '#ff9d2e', size: 0.65 * s, life: 1.0, rot: -0.1 });
  fx.flash('#fff0c0', 0.5, 0.22);
  fx.shake(0.28, 0.88);
  fx.punch(at, 1.14, 0.55);
  fx.wash('#ffb347', 0.25, 0.5);
}

// ── per-style defaults ──

export function defaultsFor(style: AttackStyle, pal: Palette): Hooks {
  switch (style) {
    case 'slash':
      return {
        windup: (c) => {
          if (c.t >= c.impact - 0.16 && eng(c).once('smear'))
            smearArc(c, pal, 2.3, -0.75, 1.15, 0.55, 0.3);
        },
        impactFx: (c) => {
          const o = outcomeOf(c);
          if (o === 'hit') meleeHit(c, pal, { words: ['SLASH!', 'SHING!', 'SWISH!'], burst: 0.95, sparks: 14, ring: 0.8 });
          else if (o === 'miss' || o === 'dodge') whiff(c, pal, 'SWISH!');
        },
      };
    case 'thrust':
      return {
        windup: (c) => {
          if (c.t >= c.impact - 0.12 && eng(c).once('stab')) stab(c, pal);
        },
        impactFx: (c) => {
          const o = outcomeOf(c);
          if (o === 'hit') meleeHit(c, pal, { words: ['STAB!', 'THRUST!', 'POKE!'], burst: 0.75, sparks: 10, ring: 0.6, star: 9 });
          else if (o === 'miss' || o === 'dodge') whiff(c, pal, 'WHIFF');
        },
      };
    case 'overhead':
      return {
        start: (c) => eng(c).wash(pal.dark, 0.16, 0.7),
        windup: (c) => {
          if (c.t >= c.impact - 0.18 && eng(c).once('smear'))
            smearArc(c, pal, 2.9, -0.2, 1.3, 0.7, 0.34, 0.5);
        },
        impactFx: (c) => {
          const fx = eng(c);
          const o = outcomeOf(c);
          const d = c.defender.anchors().feet;
          const s = size(c);
          if (o === 'hit' || o === 'miss' || o === 'dodge') {
            fx.ring({ x: d.x - c.dir * 0.2, y: 0.03 }, { color: '#e8d4a0', radius: 2.0 * s, life: 0.55, width: 0.12, flat: 0.25 });
            fx.dust({ x: d.x - c.dir * 0.2, y: 0 }, { n: 14, size: 0.2 });
            fx.spark({ x: d.x, y: 0.05 }, { n: 8, color: pal.accent, speed: 6, dir: Math.PI / 2, spread: 2 });
          }
          if (o === 'hit') meleeHit(c, pal, { words: ['WHAM!', 'CRASH!', 'SMASH!'], burst: 1.2, sparks: 16, ring: 1.0 });
          else if (o === 'miss' || o === 'dodge') whiff(c, pal, 'THUD!');
        },
      };
    case 'sweep':
      return {
        windup: (c) => {
          if (c.t >= c.impact - 0.22 && eng(c).once('smear'))
            smearArc(c, pal, 3.7, -0.55, 1.35, 0.5, 0.36, 0.0);
        },
        impactFx: (c) => {
          const fx = eng(c);
          const o = outcomeOf(c);
          const a = c.attacker.anchors().feet;
          fx.ring({ x: a.x, y: 0.03 }, { color: '#e8d4a0', radius: 1.6, life: 0.5, width: 0.1, flat: 0.22 });
          fx.dust({ x: a.x + c.dir * 0.4, y: 0 }, { n: 8 });
          if (o === 'hit') meleeHit(c, pal, { words: ['WHOOSH!', 'SWEEP!'], burst: 0.9, sparks: 12, ring: 0.8 });
          else if (o === 'miss' || o === 'dodge') whiff(c, pal, 'WHOOSH!');
        },
      };
    case 'bash':
      return {
        windup: (c) => {
          if (c.t >= c.impact - 0.1 && eng(c).once('rush'))
            eng(c).speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: pal.main, life: 0.22, n: 10 });
        },
        impactFx: (c) => {
          const o = outcomeOf(c);
          const fx = eng(c);
          if (o === 'hit') {
            meleeHit(c, pal, { words: ['BONK!', 'THUD!', 'WHAMP!'], burst: 1.0, sparks: 9, ring: 0.9, star: 8 });
            const p = hitPoint(c);
            // Dizzy stars.
            fx.spark({ x: p.x, y: p.y + 0.9 }, { n: 5, color: '#fff3a0', speed: 2.5, dir: Math.PI / 2, spread: 2.5, size: 0.06 });
          } else if (o === 'miss' || o === 'dodge') whiff(c, pal, 'WHIFF');
        },
      };
    case 'charge':
      return {
        start: (c) => {
          const fx = eng(c);
          fx.speedLines({ dir: c.dir === 1 ? Math.PI : 0, color: pal.main, life: Math.max(0.5, c.impact), n: 34 });
          fx.wash(pal.dark, 0.2, c.impact);
        },
        windup: (c) => {
          const fx = eng(c);
          const f = c.attacker.anchors().feet;
          if (c.t > 0.2 && c.t < c.impact && (Math.floor(c.t * 30) & 1) === 0)
            fx.dust({ x: f.x - c.dir * 0.2, y: 0 }, { n: 1, size: 0.18 });
        },
        impactFx: (c) => {
          const fx = eng(c);
          const o = outcomeOf(c);
          const d = c.defender.anchors().feet;
          const s = size(c);
          fx.ring({ x: d.x - c.dir * 0.3, y: 0.03 }, { color: '#e8d4a0', radius: 2.4 * s, life: 0.6, width: 0.14, flat: 0.25 });
          fx.dust({ x: d.x - c.dir * 0.3, y: 0 }, { n: 18, size: 0.24 });
          if (o === 'hit') {
            meleeHit(c, pal, { words: ['CRASH!', 'SMASH!', 'KABOOM!'], burst: 1.5, sparks: 20, ring: 1.3, star: 14 });
            fx.speedLines({ color: '#ffffff', life: 0.3, n: 36 });
            fx.punch(hitPoint(c), 1.12, 0.5);
          } else if (o === 'miss' || o === 'dodge') whiff(c, pal, 'WHOOSH!');
        },
      };
    case 'shot':
      return {
        windup: (c) => {
          if (c.t >= c.impact - 0.12 && eng(c).once('fire')) {
            const from = muzzleFlash(c, pal);
            tracer(c, pal, from, 0.12, false);
          }
        },
        impactFx: (c) => {
          const o = outcomeOf(c);
          const fx = eng(c);
          if (o === 'hit') {
            const p = hitPoint(c);
            fx.glow(p, { radius: 1.0, color: pal.main, life: 0.22 });
            fx.burst(p, { n: 10, color: pal.accent, length: 0.8, life: 0.3 });
            fx.spark(p, { n: 12, color: pal.accent, speed: 7, dir: face(0.3, c.dir), spread: 2.2 });
            fx.word({ x: p.x, y: p.y + 0.7 }, 'POW!', { color: pal.accent, size: 0.5, life: 0.7 });
          } else if (o === 'miss' || o === 'dodge') ricochet(c, pal);
        },
      };
    case 'volley':
      return {
        choreograph: (base: Move, _c): Move => {
          const fire = base.impact - 0.12;
          const recoil = base.keys[2]?.p ?? {};
          const rest = base.keys[3]?.p ?? {};
          const keys = [
            ...base.keys.slice(0, 2),
            { t: fire + 0.05, p: recoil },
            { t: fire + 0.11, p: rest },
            { t: fire + 0.16, p: recoil },
            { t: fire + 0.22, p: rest },
            { t: fire + 0.27, p: recoil },
            { t: fire + 0.6, p: rest },
            { t: fire + 1.0, p: {} },
          ];
          return { ...base, keys, impact: fire + 0.34 };
        },
        windup: (c) => {
          const fire = c.impact - 0.34;
          for (let i = 0; i < 3; i++) {
            if (c.t >= fire + i * 0.11 && eng(c).once(`fire${i}`)) {
              const from = muzzleFlash(c, pal);
              tracer(c, pal, from, 0.12, i < 2);
              if (i < 2) eng(c).shake(0.03, 0.8);
            }
          }
        },
        impactFx: (c) => {
          const o = outcomeOf(c);
          const fx = eng(c);
          if (o === 'hit') {
            const p = hitPoint(c);
            fx.glow(p, { radius: 1.2, color: pal.main, life: 0.25 });
            fx.burst(p, { n: 12, color: pal.accent, length: 1.0, life: 0.32 });
            fx.spark(p, { n: 16, color: pal.accent, speed: 8, dir: face(0.3, c.dir), spread: 2.4 });
            fx.word({ x: p.x, y: p.y + 0.75 }, 'RATATAT!', { color: pal.accent, size: 0.5, life: 0.8 });
          } else if (o === 'miss' || o === 'dodge') ricochet(c, pal);
        },
      };
    case 'throw':
      return {
        start: (c) => eng(c).wash(pal.dark, 0.14, 0.8),
        windup: (c) => {
          const fx = eng(c);
          if (c.t >= c.impact - 0.45 && fx.once('lob')) {
            const a = c.attacker.anchors();
            const d = c.defender.anchors().feet;
            fx.sprite({
              from: { x: a.hand.x, y: a.hand.y + 0.1 },
              to: { x: d.x + (c.hit ? 0 : c.dir * 0.3), y: 0.2 },
              life: 0.45,
              arc: 1.5,
              trail: '#ffb347',
              paint: (ctx, p, _ang, k) => {
                ctx.translate(p.x, p.y);
                ctx.rotate(k * 14);
                ctx.fillStyle = '#26221f';
                ctx.beginPath();
                ctx.arc(0, 0, 0.13, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.beginPath();
                ctx.arc(-0.04, 0.04, 0.05, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#7a5a30';
                ctx.fillRect(-0.02, 0.11, 0.04, 0.07);
              },
              onStep: (p, k) => {
                fx.spark({ x: p.x, y: p.y + 0.2 }, { n: 2, color: '#ffcf5a', speed: 2.5, dir: Math.PI / 2, spread: 2, size: 0.03 });
                if (k > 0.3 && (Math.floor(k * 40) & 3) === 0) fx.smoke({ x: p.x, y: p.y }, { n: 1, size: 0.07, rise: 0.2 });
              },
            });
          }
        },
        impactFx: (c) => explosion(c, pal),
      };
  }
}
