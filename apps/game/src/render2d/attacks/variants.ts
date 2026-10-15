import type { AttackScripts } from '../contract';

/**
 * New techniques that share a related technique's choreography and effects, in colours of their
 * own: `[the script to borrow, accent colour]`. The borrowed script plays exactly as authored, so
 * the duel keeps its single impact, defeat flourish and dodge/block timing.
 */
export type Variants = Readonly<Record<string, readonly [from: string, accent: string]>>;

export function withVariants(base: AttackScripts, variants: Variants): AttackScripts {
  const out: Record<string, AttackScripts[string]> = { ...base };
  for (const [id, [from, accent]] of Object.entries(variants)) {
    const script = base[from];
    if (!script) throw new Error(`Variant ${id}: no script ${from} to borrow`);
    out[id] = { ...script, palette: { ...script.palette, accent } };
  }
  return out;
}
