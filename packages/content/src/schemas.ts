import type { BalanceConfig } from '@m1565/core';
import { DEFAULT_BALANCE } from '@m1565/core';
import { z } from 'zod';

export const TerrainSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  moveCost: z.number().int().positive(),
  avoid: z.number().int().min(0).max(100),
  impassable: z.boolean().optional(),
});

/**
 * Hand-authored map format: one character per tile in `terrain` (looked up in `legend`) and one
 * digit per tile in `height`. Rows run north → south. This will be replaced by a Tiled importer
 * that produces the same `BattleMap` shape.
 */
export const MapSourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    legend: z.record(z.string().length(1), z.string()),
    terrain: z.array(z.string()).min(1),
    height: z.array(z.string().regex(/^[0-9]+$/)).min(1),
  })
  .superRefine((m, ctx) => {
    const width = m.terrain[0]?.length ?? 0;
    const rows = [...m.terrain, ...m.height];
    if (m.height.length !== m.terrain.length) {
      ctx.addIssue({ code: 'custom', message: 'terrain and height must have the same row count' });
    }
    if (rows.some((r) => r.length !== width)) {
      ctx.addIssue({ code: 'custom', message: `every row must be ${width} characters wide` });
    }
    for (const ch of new Set(m.terrain.join(''))) {
      if (!(ch in m.legend))
        ctx.addIssue({ code: 'custom', message: `unknown legend char "${ch}"` });
    }
  });

export type MapSource = z.infer<typeof MapSourceSchema>;

const id = z.string().regex(/^[a-z0-9-]+$/);
const coord = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const facing = z.enum(['north', 'east', 'south', 'west']);
const stat = z.number().int().min(0).max(32);
/** BAS max HP · POW damage · DEX accuracy · AGL evasion · DEF damage blocked · WEP weapon damage. */
const stats = z.object({ bas: stat, pow: stat, dex: stat, agl: stat, def: stat, wep: stat });
/** Generic battle units give POW/DEX/AGL; BAS, DEF and WEP are derived from level and frame. */
const partialStats = stats.partial({ bas: true, def: true, wep: true });
/** Attribute bonuses from gear. Most are positive; heavy frames may slow (negative AGL). */
const bonus = z
  .object({
    bas: z.number().int(),
    pow: z.number().int(),
    dex: z.number().int(),
    agl: z.number().int(),
    def: z.number().int(),
    wep: z.number().int(),
  })
  .partial()
  .strict();

export const WEAPON_TYPES = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'] as const;
export const FRAME_CLASSES = ['light', 'medium', 'heavy'] as const;

export const WeaponSchema = z
  .object({
    id,
    name: z.string().min(1),
    type: z.enum(WEAPON_TYPES),
    /** Added to the wielder's attributes. */
    bonus,
    /** AP of the weapon's main ranged attack (Fire, Throw). */
    apCost: z.number().int().positive(),
    minRange: z.number().int().min(1),
    maxRange: z.number().int().min(1),
    /** Armoury price; items sell back for half. */
    price: z.number().int().positive(),
    /** Quality tier: common stock, fine work, or a masterwork. */
    tier: z.enum(['common', 'fine', 'masterwork']).default('common'),
    /** Maker and history, shown in the Armoury. */
    description: z.string().default(''),
  })
  .refine((w) => w.maxRange >= w.minRange, 'maxRange must be >= minRange');

export const FACTIONS = ['order', 'militia', 'ottoman', 'corsair', 'scala'] as const;

/** How an armatura is drawn (see apps/game/src/render/Armatura.ts). */
export const ARMATURA_MODELS = [
  'knight',
  'militia',
  'gunner',
  'janissary',
  'sipahi',
  'corsair',
  'machine',
  'tower',
  'barge',
] as const;
export type ArmaturaModel = (typeof ARMATURA_MODELS)[number];

export const FrameSchema = z.object({
  id,
  name: z.string().min(1),
  faction: z.enum(FACTIONS),
  class: z.enum(FRAME_CLASSES),
  hp: z.number().int().positive(),
  move: z.number().int().positive(),
  /** Attribute package: heavy frames give BAS and DEF, light ones AGL and DEX. No armour. */
  bonus,
  description: z.string().default(''),
  model: z.enum(ARMATURA_MODELS),
});

/** Charms are fitted to the armatura, amulets worn by the pilot. Both only add attributes. */
export const GearSchema = z.object({
  id,
  name: z.string().min(1),
  kind: z.enum(['charm', 'amulet']),
  bonus,
  price: z.number().int().positive(),
  description: z.string(),
});

const rate = z.number().int().min(0).max(100);
const growth = z.object({ bas: rate, pow: rate, dex: rate, agl: rate, def: rate, wep: rate });
const allegiance = z.enum(['malta', 'ottoman']);
export const CharacterSchema = z.object({
  id,
  name: z.string().min(1),
  stats,
  growth,
  frame: id,
  weapon: id,
  allegiance,
  /** A unique colour scheme for the protagonist's armatura. */
  livery: z.enum(['hero']).optional(),
});
export type Character = z.infer<typeof CharacterSchema>;

/** Every tuning number the engine knows, and nothing else (typos and stale keys fail). */
export const BalanceSchema = z
  .object(
    Object.fromEntries(Object.keys(DEFAULT_BALANCE).map((k) => [k, z.number()])) as Record<
      keyof BalanceConfig,
      z.ZodNumber
    >,
  )
  .strict();

const req = z.number().int().min(0).optional();
const statReq = z.object({ bas: req, pow: req, dex: req, agl: req, def: req, wep: req }).strict();

/** A faction technique, unlocked by weapon type, frame class and the pilot's stats. */
export const AttackSchema = z
  .object({
    id,
    name: z.string().min(1),
    faction: z.enum(FACTIONS),
    weaponTypes: z.array(z.enum(WEAPON_TYPES)).min(1),
    /** Empty = any frame class. */
    frameClasses: z.array(z.enum(FRAME_CLASSES)),
    style: z.enum([
      'slash',
      'thrust',
      'overhead',
      'sweep',
      'bash',
      'charge',
      'shot',
      'volley',
      'throw',
    ]),
    /** Per-strike power; AP, FP and accuracy follow from it (see techniqueCost). */
    power: z.number().positive(),
    minRange: z.number().int().min(1).optional(),
    maxRange: z.number().int().min(1).optional(),
    hits: z.number().int().min(1).max(3).optional(),
    pierce: z.number().min(0).max(1).optional(),
    fatigue: z.number().int().min(0).optional(),
    apDamage: z.number().int().min(0).optional(),
    noCounter: z.boolean().optional(),
    /** Added to the formula's accuracy and AP (a slow, careful technique). */
    accuracyBonus: z.number().int().optional(),
    apBonus: z.number().int().min(0).optional(),
    requires: statReq,
    description: z.string(),
  })
  .refine((a) => (a.minRange ?? 1) <= (a.maxRange ?? 99), 'minRange must be <= maxRange');
export type AttackData = z.infer<typeof AttackSchema>;

export const SKILL_CONDITIONS = [
  'always',
  'higher',
  'flank',
  'melee',
  'ranged',
  'foeHeavy',
  'foeLight',
  'foeWounded',
  'selfWounded',
] as const;
const when = z.enum(SKILL_CONDITIONS).optional();
const pct = z.number().int().min(1).max(50);
const small = z.number().int().min(1).max(25);

/** One effect per skill; the numbers are kept small so no skill decides a battle alone. */
export const SkillEffectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hitBonus'), amount: small, when }).strict(),
  z.object({ type: z.literal('damageBonus'), percent: pct, when }).strict(),
  z.object({ type: z.literal('evadeBonus'), amount: small, when }).strict(),
  z.object({ type: z.literal('damageReduction'), percent: pct, when }).strict(),
  z.object({ type: z.literal('defendBonus'), percent: small }).strict(),
  z
    .object({
      type: z.literal('reactionFpDiscount'),
      reaction: z.enum(['defend', 'avoid', 'counter', 'attackBack']),
      amount: small,
    })
    .strict(),
  z.object({ type: z.literal('attackFpDiscount'), amount: small }).strict(),
  z.object({ type: z.literal('counterBonus'), amount: small }).strict(),
  z.object({ type: z.literal('regen'), hp: small }).strict(),
  z.object({ type: z.literal('restBonus'), percent: pct }).strict(),
  z.object({ type: z.literal('xpBonus'), percent: pct }).strict(),
  z.object({ type: z.literal('moveBonus'), tiles: z.number().int().min(1).max(2) }).strict(),
  z.object({ type: z.literal('aura'), amount: small }).strict(),
  z.object({ type: z.literal('initiative'), amount: small }).strict(),
]);

/** A pilot skill: a passive ability with one effect (see ADR 0008). */
export const SkillSchema = z
  .object({
    id,
    name: z.string().min(1),
    /** Plain language, one or two sentences. */
    description: z.string().min(1),
    effect: SkillEffectSchema,
  })
  .strict();
export type SkillData = z.infer<typeof SkillSchema>;

/** skills.json: the skill list, and which named character gains which skill at what level. */
export const SkillBookSchema = z
  .object({
    skills: z.array(SkillSchema).min(1),
    characters: z.record(
      id,
      z.array(z.object({ skill: id, level: z.number().int().min(1) }).strict()),
    ),
  })
  .strict();
export type SkillBook = z.infer<typeof SkillBookSchema>;

/** A unit is either a named character (stats from characters.json) or an inline generic. */
export const BattleUnitSchema = z
  .object({
    id,
    character: id.optional(),
    /** Cast portrait for a generic unit that stands in for a story figure. */
    portrait: id.optional(),
    name: z.string().min(1).optional(),
    stats: partialStats.optional(),
    side: z.enum(['player', 'enemy']),
    controller: z.enum(['human', 'ai']),
    ai: z.enum(['aggressive', 'defensive', 'hold']).optional(),
    level: z.number().int().min(1),
    frame: id,
    weapon: id,
    /** Extra skills for a generic unit (ids from skills.json), active from the start. */
    skills: z.array(id).optional(),
    at: coord,
    facing,
  })
  .refine((u) => u.character || (u.name && u.stats), 'unit needs a character or a name + stats');

export const BattleSourceSchema = z.object({
  id,
  name: z.string().min(1),
  map: id,
  seed: z.number().int(),
  victory: z
    .array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('rout') }),
        z.object({ type: z.literal('defeatLeader'), unitId: id }),
        z.object({ type: z.literal('survive'), rounds: z.number().int().positive() }),
        z.object({ type: z.literal('escape'), unitId: id, tiles: z.array(coord).min(1) }),
      ]),
    )
    .min(1),
  defeat: z.array(z.object({ type: z.literal('protect'), unitId: id })).default([]),
  units: z.array(BattleUnitSchema).min(2),
  /** Armaturas recovered from the field after a victory, added to the player's stores. */
  salvage: z.array(id).default([]),
});

export type BattleSource = z.infer<typeof BattleSourceSchema>;

const barkLines = z.array(z.string().min(1)).min(1);
export const BarkSetSchema = z.object({
  attack: barkLines,
  defend: barkLines,
  avoid: barkLines,
  counter: barkLines,
  hurt: barkLines,
  defeated: barkLines,
});
export const BarksSchema = z.object({
  order: BarkSetSchema,
  militia: BarkSetSchema,
  ottoman: BarkSetSchema,
  corsair: BarkSetSchema,
  scala: BarkSetSchema,
  characters: z.record(z.string(), BarkSetSchema),
});
export type BarkSet = z.infer<typeof BarkSetSchema>;
export type Faction = z.infer<typeof FrameSchema>['faction'];

export const CastSchema = z.object({
  id,
  name: z.string().min(1),
  /** Uppercase name used at the start of story lines, e.g. "FRA LUIS: ...". */
  speaker: z.string().regex(/^[A-ZÀ-ÖØ-ÞĠĦŻĊ][A-ZÀ-ÖØ-ÞĠĦŻĊ .'-]*$/),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  title: z.string(),
});
export type CastMember = z.infer<typeof CastSchema>;

const barks = z.array(z.string().min(1)).min(1);
/** The armourer who runs the Armoury for each side, and what they say. */
export const ArmourerSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  greetings: barks,
  onBuy: barks,
  onSell: barks,
  onEquip: barks,
  tooPoor: barks,
});
export const ArmourersSchema = z.object({ malta: ArmourerSchema, ottoman: ArmourerSchema });
export type Armourer = z.infer<typeof ArmourerSchema>;

/** Armoury stock: what is on sale (prices live with the items). Armaturas are never sold. */
export const ShopItemSchema = z.object({
  item: id,
  kind: z.enum(['weapon', 'charm', 'amulet']),
  allegiance,
  /** Battle id that must be won before this goes on sale; null = from the start. */
  after: id.nullable(),
});
export type ShopItem = z.infer<typeof ShopItemSchema>;

/** Which frame factions each allegiance may pilot. */
export const ALLEGIANCE_FACTIONS = {
  malta: ['order', 'militia'],
  ottoman: ['ottoman', 'corsair'],
} as const;
