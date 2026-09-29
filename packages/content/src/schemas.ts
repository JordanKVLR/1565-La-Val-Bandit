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
const stats = z.object({ str: z.number().int(), skl: z.number().int(), agi: z.number().int() });

export const WeaponSchema = z
  .object({
    id,
    name: z.string().min(1),
    power: z.number().int().positive(),
    accuracy: z.number().int().min(0).max(100),
    apCost: z.number().int().positive(),
    fpCost: z.number().int().min(0),
    minRange: z.number().int().min(1),
    maxRange: z.number().int().min(1),
  })
  .refine((w) => w.maxRange >= w.minRange, 'maxRange must be >= minRange');

export const FrameSchema = z.object({
  id,
  name: z.string().min(1),
  faction: z.enum(['order', 'militia', 'ottoman', 'corsair', 'scala']),
  hp: z.number().int().positive(),
  armour: z.number().int().min(0),
  move: z.number().int().positive(),
  agility: z.number().int(),
});

export const CharacterSchema = z.object({ id, name: z.string().min(1), stats });

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
  avoidApCost: z.number().min(0),
  avoidFpCost: z.number().min(0),
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
  counterHitBonus: z.number(),
  xpHit: z.number().int().min(0),
  xpDefeat: z.number().int().min(0),
});

/** A unit is either a named character (stats from characters.json) or an inline generic. */
export const BattleUnitSchema = z
  .object({
    id,
    character: id.optional(),
    name: z.string().min(1).optional(),
    stats: stats.optional(),
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
