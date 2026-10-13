import type { ArmaturaModel } from '@m1565/content';
import type { FigureSpec, Pose } from '../contract';
import type { Ctx, Swatch } from './kit';

export type Part =
  'armour' | 'cloth' | 'trim' | 'skin' | 'dark' | 'hat' | 'leather' | 'metal' | 'wood';
export type Palette = Record<Part, Swatch>;
export type { ArmaturaModel };

/** What a figure painter sees. Mutable and reused every frame (no per-frame allocation). */
export interface F {
  ctx: Ctx;
  spec: FigureSpec;
  /** Girth multiplier from the frame class (light 0.9, medium 1, heavy 1.18). */
  g: number;
  /** 0 light, 1 medium, 2 heavy. */
  cls: 0 | 1 | 2;
  hero: boolean;
  /** Seconds. */
  t: number;
  /** Cloth lag in -1..1: positive streams cloth backwards. */
  drag: number;
  /** The side colour. */
  acc: Swatch;
  p: Palette;
  pose: Pose;
  /** 0..1 how far the figure is toppled (for painters that react). */
  down: number;
  /** Joint data computed by the skeleton (figure-local, before the world transform). */
  armAngR: number;
  armAngL: number;
  /** Weapon direction angle (spine lean + sR + eR + wR). */
  wAng: number;
}

/** Which palette part covers each limb, and how thick the limbs read. */
export interface LimbStyle {
  upper: Part;
  fore: Part;
  thigh: Part;
  shin: Part;
  /** Radius multiplier for arms and legs. */
  arm: number;
  leg: number;
}

/** Per-model painter set. Frames are described on each hook. */
export interface Look {
  readonly model: ArmaturaModel;
  limbs(f: F): LimbStyle;
  /** Root frame (feet at origin) behind everything. */
  world?(f: F): void;
  /** Spine frame (origin at the hips, y along the torso), behind the torso: capes, tanks. */
  back?(f: F): void;
  /** Root frame, drawn after the legs and before the torso (a hull the legs stand in). */
  hull?(f: F): void;
  /** Spine frame: the torso itself. */
  torso(f: F): void;
  /** Hip frame (no lean), over the thighs: skirts, tassets, kaftan. */
  skirt?(f: F): void;
  /** Spine frame, origin at the head centre. */
  head(f: F): void;
  /** Spine frame, over the torso and head (sashes, straps). */
  front?(f: F): void;
  /** Upper-arm frame at the shoulder (a pauldron, a sleeve cap). */
  pad?(f: F, far: boolean): void;
  /** Forearm frame at the elbow (bracers, sleeves, cuffs). */
  fore?(f: F, far: boolean): void;
  /** Wrist frame (origin at the hand, forearm up the +y axis): gauntlet or fist. */
  hand(f: F, far: boolean): void;
  /** Thigh frame at the hip joint. */
  thigh?(f: F, far: boolean): void;
  /** Shin frame at the knee. */
  shin?(f: F, far: boolean): void;
  /** Shin frame at the ankle (origin at the ankle, shin up the +y axis; the shin angle applied). */
  boot(f: F, far: boolean): void;
  /** True if the off hand carries a round shield for this weapon. */
  shield?(f: F): boolean;
  /** Extra hook after everything in the spine frame (steam, glow). */
  over?(f: F): void;
  /** Weapon style hint: curved for sabres. */
  readonly sabre?: boolean;
  /** People: their own palette (cloth = garment, armour = sleeves, wood = legs, dark = hair). */
  readonly palette?: Palette;
  /** Head size multiplier (default 1.12). */
  readonly headScale?: number;
}

// ── People (story diorama) ───────────────────────────────────

/**
 * How a plain person (no armatura) looks. Render2d only; the story diorama builds one per cast
 * id (`figures/peopleCast.ts`) and the rig draws it with `figures/people.ts`. All colours are
 * hex strings; the side colour (`FigureSpec.accent`) is worn as a sash, scarf and armband.
 */
export type Build = 'slim' | 'average' | 'broad' | 'stout';
export type HairStyle = 'bald' | 'short' | 'curly' | 'messy' | 'long' | 'tied' | 'bun' | 'bob';
export type BeardStyle = 'none' | 'stubble' | 'short' | 'full' | 'long';
export type HeadwearKind =
  | 'none'
  | 'cap'
  | 'flatcap'
  | 'straw'
  | 'scarf'
  | 'veil'
  | 'turban'
  | 'bork'
  | 'hood'
  | 'band'
  | 'goggles';
export type OutfitKind =
  'tunic' | 'doublet' | 'vest' | 'robe' | 'coat' | 'apron' | 'dress' | 'skirt';
export type ShoeKind = 'boots' | 'shoes' | 'sandals';
/** Small hand-held things. Never weapons. */
export type PropKind = 'book' | 'tool' | 'lantern' | 'wrench' | 'quill' | 'banner' | 'scroll';

export interface PersonHeadwear {
  readonly kind: HeadwearKind;
  readonly color: string;
  /** Band, cap under a turban, or hem colour. */
  readonly trim?: string;
  /** Feather colours (plume) on caps and turbans. */
  readonly plume?: readonly string[];
  /** A jewel or badge on turbans and borks. */
  readonly gem?: string;
  /** A taller turban. */
  readonly tall?: boolean;
}

export interface PersonOutfit {
  readonly kind: OutfitKind;
  /** The visible garment colour (vest, tunic, robe, coat). */
  readonly main: string;
  /** Shirt under a vest, coat or doublet. */
  readonly under: string;
  readonly trim: string;
  /** Trousers or hose. */
  readonly legs: string;
  /** Sleeve colour when it differs from `main` (defaults to `under` for vests, else `main`). */
  readonly sleeve?: string;
  readonly sleeves?: 'long' | 'rolled' | 'bare';
  /** Skirt colour for `skirt`, apron colour for `apron`. */
  readonly skirt?: string;
  /** Fur collar and hem. */
  readonly fur?: string;
  /** Embroidered band down the front. */
  readonly band?: boolean;
  /** The white eight-pointed cross of the Order on the chest (original vector). */
  readonly emblem?: 'cross8';
  /** A ruff or white collar. */
  readonly collar?: string;
}

export interface PersonLook {
  readonly skin: string;
  readonly hair: string;
  readonly hairStyle: HairStyle;
  readonly beard?: BeardStyle;
  readonly moustache?: 'thin' | 'full' | 'handlebar';
  /** Colour of beard and moustache (default: the hair colour). */
  readonly facial?: string;
  readonly build: Build;
  /** Height multiplier around 1 (0.9 short .. 1.08 tall). */
  readonly height?: number;
  readonly headwear?: PersonHeadwear;
  readonly outfit: PersonOutfit;
  readonly cloak?: string;
  readonly belt: string;
  /** A wide waist sash (Ottoman or corsair dress). */
  readonly sash?: string;
  readonly shoes: { readonly kind: ShoeKind; readonly color: string };
  readonly prop?: PropKind;
  /** A pendant on the chest (a charm, a cross, pearls). */
  readonly charm?: string;
  readonly earring?: string;
  readonly blush?: boolean;
  /** Lip colour (women's faces). */
  readonly lips?: string;
}
