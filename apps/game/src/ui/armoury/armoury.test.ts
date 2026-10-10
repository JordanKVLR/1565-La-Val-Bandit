import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = import.meta.dirname;
const CSS = readFileSync(join(DIR, 'armoury.css'), 'utf8');

describe('Armoury styles (design system, ADR 0013)', () => {
  it('take every colour from the design tokens', () => {
    expect(CSS.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
    for (const file of ['parts.tsx', 'Shelf.tsx', 'ItemDetail.tsx', 'ArmouryScreen.tsx']) {
      const src = readFileSync(join(DIR, file), 'utf8');
      expect(src.match(/['"]#[0-9a-fA-F]{3,8}['"]/g), file).toBeNull();
    }
  });

  it('use none of the legacy Maltese frames or theme variables', () => {
    // The madum tile stays allowed as a faint full-screen ground (docs/DESIGN.md).
    const legacy = CSS.match(/var\(--(?:mt-(?!madum)|vb-|ar-(?:wood|iron|panel|line))[\w-]*\)/g);
    expect(legacy).toBeNull();
    expect(CSS).not.toMatch(/--mt-(?:lace|cornice|corbels|luzzu)/);
  });
});
