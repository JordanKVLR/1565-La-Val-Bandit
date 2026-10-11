import { describe, expect, it } from 'vitest';
import type { AttackStyle, Reaction, WeaponType } from '@m1565/core';
import raw from '../../../../../packages/content/data/attacks.json';
import { DuelStage2D } from '../DuelStage2D';
import { fakeCanvas } from '../testKit';
import { ORDER_SCRIPTS } from './order';
import { SCALA_SCRIPTS } from './scala';

type Atk = { id: string; style: AttackStyle; weaponTypes: WeaponType[] };
const all = (Array.isArray(raw) ? raw : (raw as { attacks: Atk[] }).attacks) as Atk[];
const spec = (weaponType: WeaponType) => ({
  model: 'knight' as const,
  weaponType,
  frameClass: 'medium' as const,
  accent: '#f00',
});
const cases: { hit: boolean; defeated: boolean; reaction: Reaction }[] = [
  { hit: true, defeated: false, reaction: 'none' },
  { hit: false, defeated: false, reaction: 'avoid' },
  { hit: false, defeated: false, reaction: 'defend' },
  { hit: true, defeated: true, reaction: 'none' },
];

async function drive(stage: DuelStage2D, p: Promise<void>): Promise<void> {
  let done = false;
  void p.then(() => (done = true));
  for (let i = 0; i < 2000 && !done; i++) {
    stage.advance(1 / 30);
    stage.render();
    await Promise.resolve();
  }
  await p;
}

for (const [name, scripts, prefix] of [
  ['order', ORDER_SCRIPTS, 'order-'],
  ['scala', SCALA_SCRIPTS, 'scala-'],
] as const) {
  describe(`${name} attack scripts`, () => {
    const mine = all.filter((a) => a.id.startsWith(prefix));
    it('has a script for every attack', () => {
      expect(mine.length).toBeGreaterThan(0);
      for (const a of mine) expect(scripts[a.id], a.id).toBeTruthy();
    });
    for (const a of mine) {
      it(`${a.id} plays hit, miss, block and defeat with one impact`, async () => {
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
          const p = stage.playStrike({
            attacker: 'left',
            style: a.style,
            attackId: a.id,
            ...c,
            onImpact: () => n++,
          });
          await drive(stage, p);
          expect(n).toBe(1);
          stage.dispose();
        }
      });
    }
  });
}
