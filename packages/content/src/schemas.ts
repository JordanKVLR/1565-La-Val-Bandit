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
const stat = z.number().int();
const stats = z.object({
  str: stat,
  skl: stat,
  agi: stat,
  def: stat,
  int: stat,
  spi: stat,
  vit: stat,
});
/** Generic battle units may give only STR/SKL/AGI; the rest are derived from level and frame. */
const partialStats = stats.partial({ def: true, int: true, spi: true, vit: true });

export const WEAPON_TYPES = ['blade', 'polearm', 'blunt', 'firearm', 'explosive'] as const;
export const FRAME_CLASSES = ['light', 'medium', 'heavy'] as const;

export const WeaponSchema = z
  .object({
    id,
    name: z.string().min(1),
    type: z.enum(WEAPON_TYPES),
    power: z.number().int().positive(),
    accuracy: z.number().int().min(0).max(100),
    apCost: z.number().int().positive(),
    fpCost: z.number().int().min(0),
    minRange: z.number().int().min(1),
    maxRange: z.number().int().min(1),
  })
  .refine((w) => w.maxRange >= w.minRange, 'maxRange must be >= minRange');

export const FACTIONS = ['order', 'militia', 'ottoman', 'corsair', 'scala'] as const;

export const FrameSchema = z.object({
  id,
  name: z.string().min(1),
  faction: z.enum(FACTIONS),
  class: z.enum(FRAME_CLASSES),
  hp: z.number().int().positive(),
  armour: z.number().int().min(0),
  move: z.number().int().positive(),
  agility: z.number().int(),
});

const rate = z.number().int().min(0).max(100);
const growth = z.object({
  str: rate,
  skl: rate,
  agi: rate,
  def: rate,
  int: rate,
  spi: rate,
  vit: rate,
});
const allegiance = z.enum(['malta', 'ottoman']);
export const CharacterSchema = z.object({
  id,
  name: z.string().min(1),
  stats,
  growth,
  frame: id,
  weapon: id,
  allegiance,
});
export type Character = z.infer<typeof CharacterSchema>;

export const BalanceSchema = z.object({
  apMax: z.number().positive(),
  apStart: z.number().min(0),
  apRegen: z.number().positive(),
  climbApPerStep: z.number().min(0),
  maxClimb: z.number().int().min(0),
  fpMax: z.number().positive(),
  fpRecovery: z.number().min(0),
  fpRestRecovery: z.number().min(0),
  fpTired: z.number().min(0),
  tiredPenalty: z.number().min(0),
  defendFpCost: z.number().min(0),
  avoidFpCost: z.number().min(0),
  counterFpCost: z.number().min(0),
  attackFpSurcharge: z.number().min(0),
  hitMin: z.number().min(0).max(100),
  hitMax: z.number().min(0).max(100),
  sklHitFactor: z.number(),
  agiEvadeFactor: z.number(),
  heightHitPerStep: z.number(),
  heightDamagePerStep: z.number(),
  heightDamageMaxSteps: z.number().int().min(0),
  sideHitBonus: z.number(),
  rearHitBonus: z.number(),
  rearDamageMult: z.number().positive(),
  assistPerAlly: z.number().min(0),
  assistMax: z.number().min(0),
  defendDamageMult: z.number().min(0).max(1),
  defDamagePerPoint: z.number().min(0),
  vitHpPercent: z.number().min(0),
  intTechniqueAccuracy: z.number().min(0),
  spiFpCostPercent: z.number().min(0),
  spiFpCostMax: z.number().min(0).max(100),
  spiFpRecovery: z.number().min(0),
  spiResistPercent: z.number().min(0),
  spiResistMax: z.number().min(0).max(100),
  counterBaseChance: z.number().min(0).max(100),
  counterIntFactor: z.number().min(0),
  counterMinChance: z.number().min(0).max(100),
  counterMaxChance: z.number().min(0).max(100),
  counterReflectMult: z.number().positive(),
  counterFailMult: z.number().positive(),
  counterHitBonus: z.number(),
  xpHit: z.number().int().min(0),
  xpDefeat: z.number().int().min(0),
  xpPerLevel: z.number().int().positive(),
  xpLevelFactor: z.number().min(0),
  xpMinFactor: z.number().min(0),
  xpMaxFactor: z.number().positive(),
  statPointsPerLevel: z.number().int().min(0),
  hpPerLevel: z.number().int().min(0),
});

const req = z.number().int().min(0).optional();
const statReq = z.object({ str: req, skl: req, agi: req, def: req, int: req, spi: req, vit: req });

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
    power: z.number().positive(),
    accuracy: z.number().int(),
    apCost: z.number().int().positive(),
    fpCost: z.number().int().min(0),
    minRange: z.number().int().min(1).optional(),
    maxRange: z.number().int().min(1).optional(),
    hits: z.number().int().min(1).max(3).optional(),
    pierce: z.number().min(0).max(1).optional(),
    fatigue: z.number().int().min(0).optional(),
    apDamage: z.number().int().min(0).optional(),
    noCounter: z.boolean().optional(),
    requires: statReq,
    description: z.string(),
  })
  .refine((a) => (a.minRange ?? 1) <= (a.maxRange ?? 99), 'minRange must be <= maxRange');
export type AttackData = z.infer<typeof AttackSchema>;

/** A unit is either a named character (stats from characters.json) or an inline generic. */
export const BattleUnitSchema = z
  .object({
    id,
    character: id.optional(),
    name: z.string().min(1).optional(),
    stats: partialStats.optional(),
    side: z.enum(['player', 'enemy']),
    controller: z.enum(['human', 'ai']),
    ai: z.enum(['aggressive', 'defensive', 'hold']).optional(),
    level: z.number().int().min(1),
    frame: id,
    weapon: id,
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

export const ShopItemSchema = z.object({
  item: id,
  kind: z.enum(['weapon', 'frame']),
  price: z.number().int().positive(),
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
