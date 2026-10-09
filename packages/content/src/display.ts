import { z } from 'zod';
import displayData from '../data/display.json';

/**
 * Display tuning for the web client (ADR 0010): when Auto picks the TV (10-foot) layout, how
 * large the TV layout is drawn, the title-safe zone, and the battle renderer's resolution caps.
 */
export const DisplayConfigSchema = z
  .object({
    /** Auto picks TV only on a viewport at least this large (CSS px) and after a gamepad input. */
    tvAuto: z.object({ minWidth: z.number().positive(), minHeight: z.number().positive() }).strict(),
    tv: z
      .object({
        /**
         * The TV layout is drawn as if the screen were at most this many CSS px wide and tall,
         * then scaled up to fill it: 600 px tall on a 1080p TV is a 1.8× scale, so 16 px body
         * text reads as about 29 px.
         */
        layoutWidth: z.number().positive(),
        layoutHeight: z.number().positive(),
        /** The largest TV scale (on a 4K screen at 100% scaling it is 3.6). */
        maxZoom: z.number().min(1),
        /** Title-safe inset on each side, as a fraction of the screen (0.05 = 5%). */
        safeZone: z.number().min(0).max(0.2),
      })
      .strict(),
    render: z
      .object({
        /** Device pixels per CSS pixel the 3D views render at, at most. */
        maxPixelRatio: z.number().positive(),
        /** Internal resolution cap for a 3D canvas, in pixels (2560×1440 = 3 686 400). */
        maxRenderPixels: z.number().int().positive(),
      })
      .strict(),
  })
  .strict();

export type DisplayConfig = z.infer<typeof DisplayConfigSchema>;

export function loadDisplayConfig(raw: unknown = displayData): DisplayConfig {
  return DisplayConfigSchema.parse(raw);
}
