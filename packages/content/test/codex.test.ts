import { describe, expect, it } from 'vitest';
import { battleSources, codexUnlocked, loadCodex } from '../src';

describe('historical notes (codex)', () => {
  const codex = loadCodex();

  it('has a readable number of entries, each labelled historical or fiction', () => {
    expect(codex.length).toBeGreaterThanOrEqual(15);
    expect(codex.length).toBeLessThanOrEqual(30);
    expect(codex.filter((e) => e.kind === 'historical').length).toBeGreaterThanOrEqual(12);
    expect(codex.filter((e) => e.kind === 'fiction').length).toBeGreaterThanOrEqual(4);
  });

  it('covers the key real figures and places of 1565', () => {
    const ids = new Set(codex.filter((e) => e.kind === 'historical').map((e) => e.id));
    for (const id of [
      'valette',
      'mustafa-pasha',
      'piali-pasha',
      'turgut-reis',
      'anastagi',
      'balbi',
      'st-elmo',
      'birgu-senglea',
      'mdina',
      'relief',
    ]) {
      expect(ids, id).toContain(id);
    }
  });

  it("labels the game's inventions as fiction (PLAN sensitivity note)", () => {
    const kind = (id: string) => codex.find((e) => e.id === id)?.kind;
    for (const id of ['armature', 'ninu', 'deniz', 'leyla', 'valette-secret', 'scala']) {
      expect(kind(id), id).toBe('fiction');
    }
    // Story entries are always fiction; fiction is never filed as a real event or person.
    for (const e of codex) expect(e.category === 'story', e.id).toBe(e.kind === 'fiction');
  });

  it('only unlocks entries after battles that exist', () => {
    for (const e of codex) {
      if (e.unlockAfter) expect(Object.keys(battleSources), e.id).toContain(e.unlockAfter);
    }
  });

  it('keeps story twists locked until their battle is won', () => {
    const secret = codex.find((e) => e.id === 'valette-secret')!;
    expect(codexUnlocked(secret, [])).toBe(false);
    expect(codexUnlocked(secret, [secret.unlockAfter!])).toBe(true);
    expect(
      codexUnlocked(
        codex.find((e) => e.id === 'st-elmo')!,
        [],
      ),
    ).toBe(true);
  });

  it('rejects duplicate ids and unknown kinds', () => {
    const entry = {
      id: 'x',
      title: 'X',
      kind: 'historical',
      category: 'event',
      text: 'y'.repeat(100),
    };
    expect(() => loadCodex([entry, entry])).toThrow(/Duplicate/);
    expect(() => loadCodex([{ ...entry, kind: 'legend' }])).toThrow();
  });
});
