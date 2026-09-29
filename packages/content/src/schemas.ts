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
