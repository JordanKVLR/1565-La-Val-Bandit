import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AttackStyle, Reaction, WeaponType } from '@m1565/core';
import { DuelStage2D } from '../DuelStage2D';
import { fakeCanvas } from '../testKit';
import { CORSAIR_SCRIPTS } from './corsair';

interface Atk {
  id: string;
  faction: string;
  style: AttackStyle;
  weaponTypes: WeaponType[];
  power: number;
  hits?: number;
}
const attacks = (
  JSON.parse(
    readFileSync(resolve(__dirname, '../../../../../packages/content/data/attacks.json'), 'utf8'),
  ) as Atk[]
).filter((a) => a.faction === 'corsair');
const spec = (weaponType: WeaponType) => ({
  model: 'knight' as const,
  weaponType,
  frameClass: 'medium' as const,
  accent: '#f00',
});
const cases: { hit: boolean; defeated: boolean; reaction: Reaction }[] = [
  { hit: true, defeated: false, reaction: 'none' },
  { hit: true, defeated: true, reaction: 'none' },
  { hit: false, defeated: false, reaction: 'avoid' },
  { hit: false, defeated: false, reaction: 'defend' },
];

describe('corsair scripts', () => {
  it('has a script for every corsair attack', () => {
    expect(attacks.length).toBeGreaterThan(0);
    for (const a of attacks) expect(CORSAIR_SCRIPTS[a.id], a.id).toBeDefined();
  });
  for (const a of attacks) {
    it(`${a.id} impacts exactly once for hit, defeat, dodge and block`, () => {
      for (const c of cases) {
        for (const side of ['left', 'right'] as const) {
          const stage = new DuelStage2D(
            fakeCanvas(),
            spec(a.weaponTypes[0]!),
            spec('blade'),
            '#5b6b35',
            1,
            { manual: true },
          );
          let impacts = 0;
          stage.beginStrike({
            attacker: side,
            style: a.style,
            attackId: a.id,
            power: a.power,
            reach: 2,
            ...c,
            onImpact: () => impacts++,
          });
          for (let i = 0; i < 5000 && stage.striking; i++) {
            stage.advance(1 / 30);
            stage.render();
          }
          expect(impacts).toBe(1);
          stage.dispose();
        }
      }
    });
  }
});
