/**
 * Shared contract for the 2D art pipeline (ADR 0013). Every module in render2d/ codes against
 * these types so the rig, the effects, the stages and the per-attack scripts can be built
 * independently. Presentation only: results always come from the rules engine.
 *
 * WORLD SPACE (matches the 3D duel so duelMoves.ts keyframes are reused unchanged):
 *   - x is horizontal (the left fighter stands at -GAP/2, the right at +GAP/2), y is up,
 *     1 unit is about 0.55 of a figure's height (a figure is ~1.8 units tall).
 *   - Fighters are drawn in side view. `Pose` (render/Armatura.ts) gives the joint angles.
 *   - The right fighter is mirrored by the stage (facing -1), so scripts write in "attacker
 *     forward = +x" terms via `FxContext.dir`.
 */
import type { Pose, FigureSpec } from '../render/Armatura';

export type { Pose, FigureSpec };

/** Vector in world units. */
export interface V2 {
  x: number;
  y: number;
}

/** Where the rig says its key points are for the current pose, in world space. */
export interface FighterAnchors {
  /** Centre of the body (chest). */
  readonly chest: V2;
  readonly head: V2;
  /** The weapon hand. */
  readonly hand: V2;
  /** The off hand / shield hand. */
  readonly offHand: V2;
  /** The weapon tip (blade point, muzzle, mace head, lance tip). */
  readonly tip: V2;
  /** Feet on the ground. */
  readonly feet: V2;
}

/**
 * A drawable 2D fighter. Implemented by render2d/rig.ts (`createRig`). Pure canvas drawing:
 * no DOM, no allocation per frame beyond small temporaries.
 */
export interface Rig {
  readonly spec: FigureSpec;
  /** World-space base x of the fighter (before pose.x) and its facing (1 = right, -1 = left). */
  baseX: number;
  facing: 1 | -1;
  pose: Pose;
  /** Time in seconds, for idle breathing and cloth/plume sway. */
  time: number;
  /** 0..1 white-hot hit flash and tint. */
  flash: number;
  /** Anchors for the current pose (call after setting `pose`). */
  anchors(): FighterAnchors;
  /** Draws the figure with the world transform already applied to `ctx`. */
  draw(ctx: CanvasRenderingContext2D): void;
}

/** Effects toolkit handle (render2d/fx.ts). All coordinates are world space unless noted. */
export interface Fx {
  /** Current animation time of the strike, seconds. */
  readonly time: number;
  /** Deterministic randomness for particles (never Math.random in tests). */
  rand(): number;
  spark(at: V2, o?: { n?: number; color?: string; speed?: number; dir?: number; spread?: number; size?: number }): void;
  dust(at: V2, o?: { n?: number; color?: string; size?: number }): void;
  smoke(at: V2, o?: { n?: number; color?: string; size?: number; rise?: number }): void;
  ember(at: V2, o?: { n?: number; color?: string }): void;
  /** Expanding ring / shockwave. */
  ring(at: V2, o?: { color?: string; radius?: number; life?: number; width?: number }): void;
  /** Radial slash lines bursting from a point (comic impact). */
  burst(at: V2, o?: { n?: number; color?: string; length?: number; life?: number }): void;
  /** Crescent / arc slash swoosh, angles in radians, drawn once and fading. */
  arc(at: V2, o: { radius: number; from: number; to: number; width?: number; color?: string; life?: number }): void;
  /** Soft glow blob. */
  glow(at: V2, o?: { radius?: number; color?: string; life?: number }): void;
  /** Text onomatopoeia ("CLANG!") that pops and fades. */
  word(at: V2, text: string, o?: { color?: string; size?: number; life?: number; rot?: number }): void;
  /** A moving projectile / body drawn with a custom painter until `life` ends. */
  sprite(o: {
    from: V2;
    to: V2;
    life: number;
    arc?: number;
    trail?: string;
    paint: (ctx: CanvasRenderingContext2D, p: V2, angle: number, k: number) => void;
    onEnd?: () => void;
  }): void;
  /** Weapon-tip trail: feed it a point each frame inside a swing. */
  trailPoint(id: string, p: V2, o?: { color?: string; width?: number; fade?: number }): void;
  /** Screen-space effects. */
  shake(amount: number, decay?: number): void;
  flash(color: string, strength: number, life?: number): void;
  /** Freeze all motion for `ms` (hit-stop) while effects keep drawing. */
  hitStop(ms: number): void;
  /** Speed lines across the screen along `dir` radians. */
  speedLines(o?: { dir?: number; color?: string; life?: number; n?: number }): void;
  /** Zoom the camera towards a world point for a moment (k >= 1). */
  punch(at: V2, k: number, life?: number): void;
  /** Dark vignette / colour wash behind the fighters, fading. */
  wash(color: string, strength: number, life?: number): void;
  /** Slow motion factor for a window (0.2 = very slow). */
  slowmo(factor: number, life: number): void;
  /** Free-form painter drawn under (`back`) or over (`front`) the fighters for `life` seconds. */
  layer(where: 'back' | 'front', life: number, paint: (ctx: CanvasRenderingContext2D, k: number) => void): void;
}

/** Everything a per-attack script sees. Scripts write in attacker-forward = +x terms. */
export interface FxContext {
  readonly fx: Fx;
  readonly attacker: Rig;
  readonly defender: Rig;
  /** +1 if the attacker stands left of the defender (faces right), else -1. Multiply x offsets by it. */
  readonly dir: 1 | -1;
  readonly hit: boolean;
  readonly defeated: boolean;
  readonly power: number;
  readonly reach: number;
  readonly reaction: 'defend' | 'avoid' | 'attackBack' | 'counter' | 'none';
  readonly heavy: boolean;
  /** Time from the start of the strike. */
  readonly t: number;
  /** Seconds at which contact happens (the move's impact time). */
  readonly impact: number;
}

/** What an attack adds on top of the base weapon/style move from duelMoves.ts. */
export interface AttackScript {
  /** The attack's identity colours for trails, glows and words. */
  readonly palette: { readonly main: string; readonly accent: string; readonly dark: string };
  /**
   * Optionally replace the base move's keyframes/timing (spins, leaps, multi-hit flurries).
   * Receives the base Move and returns the move to play. Keep `impact` consistent with the keys.
   */
  readonly choreograph?: (base: import('../render/duelMoves').Move, c: Pick<FxContext, 'hit' | 'power' | 'reach' | 'heavy'>) => import('../render/duelMoves').Move;
  /** Runs once when the strike starts (announce, stance glow, camera push). */
  readonly start?: (c: FxContext) => void;
  /** Runs every frame before contact (trails, charge-up auras, projectiles in flight). */
  readonly windup?: (c: FxContext) => void;
  /** Runs every frame after contact (lingering flames, shockwave follow-through). */
  readonly follow?: (c: FxContext) => void;
  /** Runs once at the moment of contact. This is the signature visual of the attack. */
  readonly impactFx: (c: FxContext) => void;
  /** Runs once when the defender is defeated by this attack (finishing flourish). */
  readonly finish?: (c: FxContext) => void;
}

/** Scripts register themselves by attack id (see render2d/attacks/index.ts). */
export type AttackScripts = Readonly<Record<string, AttackScript>>;
