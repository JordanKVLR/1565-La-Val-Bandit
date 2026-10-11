import { describe, expect, it } from 'vitest';
import type { Reaction, WeaponType } from '@m1565/core';
import attacks from '../../../../../packages/content/data/attacks.json';
import { DuelStage2D } from '../DuelStage2D';
import { fakeCanvas } from '../testKit';
import { OTTOMAN_SCRIPTS } from './ottoman';

const spec = (weaponType: WeaponType) => ({
  model: 'knight' as const,
  weaponType,
  frameClass: 'medium' as const,
  accent: '#f00',
});
type A = { id: string; faction: string; style: never; weaponTypes: WeaponType[] };
const list = (attacks as unknown as A[]).filter((a) => a.faction === 'ottoman');
const cases: { hit: boolean; defeated: boolean; reaction: Reaction }[] = [
  { hit: true, defeated: false, reaction: 'none' },
  { hit: false, defeated: false, reaction: 'avoid' },
  { hit: true, defeated: true, reaction: 'none' },
  { hit: false, defeated: false, reaction: 'defend' },
];

describe('ottoman scripts', () => {
  it('covers every ottoman attack', () => {
    for (const a of list) expect(OTTOMAN_SCRIPTS[a.id], a.id).toBeTruthy();
  });
  for (const a of list) {
    it(`${a.id} runs without throwing and impacts once`, () => {
      for (const c of cases) {
        const stage = new DuelStage2D(
          fakeCanvas(),
          spec(a.weaponTypes[0]!),
          spec('blade'),
          '#5b6b35',
          1,
          { manual: true },
        );
        let n = 0;
        stage.beginStrike({
          attacker: 'left',
          style: a.style,
          attackId: a.id,
          ...c,
          onImpact: () => n++,
        });
        for (let i = 0; i < 3000 && stage.striking; i++) {
          stage.advance(1 / 30);
          stage.render();
        }
        expect(n).toBe(1);
        stage.dispose();
      }
    });
  }
});
