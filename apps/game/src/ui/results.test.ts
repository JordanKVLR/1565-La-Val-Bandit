import { describe, expect, it } from 'vitest';
import { resultLineText } from './results';

describe('victory summary lines', () => {
  it('words scudi, salvage and pilot progress', () => {
    expect(resultLineText({ kind: 'scudi', amount: 240 })).toBe('+240 scudi');
    expect(resultLineText({ kind: 'salvage', frame: 'Ħaddiem' })).toBe(
      'Salvaged armatura: Ħaddiem',
    );
    const pilot = { kind: 'pilot', name: 'Valette', level: 4, xp: 120, xpPerLevel: 500 } as const;
    expect(resultLineText({ ...pilot, levels: 0 })).toBe('Valette: Lv 4, 120/500 XP');
    expect(resultLineText({ ...pilot, levels: 1 })).toBe(
      'Valette rose 1 level to Lv 4 (120/500 XP)',
    );
    expect(resultLineText({ ...pilot, levels: 2 })).toBe(
      'Valette rose 2 levels to Lv 4 (120/500 XP)',
    );
  });
});
