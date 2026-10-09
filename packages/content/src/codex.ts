import { z } from 'zod';
import codexData from '../data/codex.json';

/**
 * Historical notes: short entries on the real people, places and events of 1565, and on what
 * the game invents. Every entry says plainly which it is (see PLAN §3.1, sensitivity note).
 */

export const CODEX_KINDS = ['historical', 'fiction'] as const;
export const CODEX_CATEGORIES = ['event', 'people', 'place', 'warfare', 'story'] as const;

export const CodexEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    kind: z.enum(CODEX_KINDS),
    category: z.enum(CODEX_CATEGORIES),
    /** Dates or a role, shown under the title. */
    when: z.string().min(1).optional(),
    /** Paragraphs separated by a blank line. */
    text: z.string().min(80).max(1200),
    /** Hidden until this battle has been won (keeps story twists for their moment). */
    unlockAfter: z.string().optional(),
  })
  .strict();

export type CodexEntry = z.infer<typeof CodexEntrySchema>;

export function loadCodex(raw: unknown = codexData): readonly CodexEntry[] {
  const list = CodexEntrySchema.array().parse(raw);
  const seen = new Set<string>();
  for (const e of list) {
    if (seen.has(e.id)) throw new Error(`Duplicate codex entry: ${e.id}`);
    seen.add(e.id);
  }
  return list;
}

/** Whether an entry can be read, given the battles won so far. */
export function codexUnlocked(entry: CodexEntry, completedBattles: readonly string[]): boolean {
  return !entry.unlockAfter || completedBattles.includes(entry.unlockAfter);
}
