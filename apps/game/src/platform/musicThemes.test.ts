import { describe, expect, it } from 'vitest';
import { degreeToMidi, THEMES } from './musicThemes';

describe('music themes', () => {
  it('every phrase lasts exactly four bars', () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      theme.phrases.forEach((p, i) => {
        const beats = p.reduce((sum, [, b]) => sum + b, 0);
        expect(beats, `${name} phrase ${i}`).toBe(16);
      });
      for (const i of theme.order) expect(theme.phrases[i], `${name} order`).toBeDefined();
    }
  });

  it('maps scale degrees across octaves', () => {
    const minor = [0, 2, 3, 5, 7, 8, 10];
    expect(degreeToMidi(69, minor, 0)).toBe(69);
    expect(degreeToMidi(69, minor, 2)).toBe(72);
    expect(degreeToMidi(69, minor, 7)).toBe(81);
    expect(degreeToMidi(69, minor, -1)).toBe(67);
  });
});
