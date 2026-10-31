import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { techniqueValue, unlockedAttacks, createBattle } from '@m1565/core';
import { format, resolveConfig } from 'prettier';
import { expect, it } from 'vitest';
import { loadBattle, loadLibrary, resolveTechnique } from '../src';

const lib = loadLibrary();
const DOC = resolve(__dirname, '../../../docs/ATTACKS.md');

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const reqText = (r: Record<string, number | undefined>) =>
  Object.entries(r)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k.toUpperCase()} ${v}`)
    .join(', ');

/** docs/ATTACKS.md, generated from attacks.json and balance.json (UPDATE_DOCS=1 rewrites it). */
function buildDoc(): string {
  const rows = [...lib.attacks]
    .map((data) => ({ data, a: resolveTechnique(data, lib.balance) }))
    .sort(
      (x, y) =>
        x.data.faction.localeCompare(y.data.faction) ||
        x.data.weaponTypes[0]!.localeCompare(y.data.weaponTypes[0]!) ||
        x.data.level - y.data.level,
    );
  const table = rows.map(({ data, a }, i) => {
    const extras = [
      a.pierce ? `ignores ${Math.round(a.pierce * 100)}% DEF` : '',
      a.fatigue ? `+${a.fatigue} FP to target${(a.hits ?? 1) > 1 ? ' per hit' : ''}` : '',
      a.noCounter ? 'cannot be countered' : '',
      a.kind ? a.kind : '',
      a.weaken ? 'saps' : '',
      a.slow ? `slows ${a.slow}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const range = a.minRange || a.maxRange ? `${a.minRange ?? 1}-${a.maxRange ?? 1}` : 'weapon';
    const hits = a.hits ?? 1;
    return `| ${i + 1} | ${cap(data.faction)} | ${data.name} | ${data.weaponTypes.join('/')} | ${data.frameClasses.join('/') || 'any'} | ${data.style} | ${a.power.toFixed(2)} | ${hits} | ${a.apCost} | ${a.fpCost} | ${a.accuracy >= 0 ? '+' : ''}${a.accuracy} | ${range} | ${data.level} | ${techniqueValue(a, lib.balance).toFixed(2)}× | ${reqText(data.requires) || '-'} | ${extras || '-'} |`;
  });
  const first = (battle: string, unit: string) => {
    const { units } = createBattle(loadBattle(battle, lib)).state;
    return unlockedAttacks(units.find((u) => u.id === unit)!);
  };
  void first;
  const b = lib.balance;
  return `# Attacks

Generated from \`packages/content/data/attacks.json\` and \`balance.json\` by
\`packages/content/test/attacks-doc.test.ts\` (run it with \`UPDATE_DOCS=1\` to rewrite this file; the
test fails when the file is out of date). Every pilot also has the two **starter** attacks for their
weapon; a faction technique unlocks when the pilot has reached its **Level** and their stats (gear
included) meet the requirement (ADR 0015). The power curve and cost model are in ADR 0024, the attack kinds in ADR 0023.

## Starter attacks (every pilot, no requirement)

| Weapon    | Attack         | Style    | Power         | Range  |
| --------- | -------------- | -------- | ------------- | ------ |
| Blade     | Slash (basic)  | slash    | 0.8           | 1      |
| Blade     | Thrust         | thrust   | 1.0           | 1      |
| Polearm   | Thrust (basic) | thrust   | 1.0           | 1      |
| Polearm   | Long Thrust    | thrust   | 1.0 (-20 acc) | 1-2    |
| Blunt     | Bash (basic)   | bash     | 0.8           | 1      |
| Blunt     | Smash          | overhead | 1.0           | 1      |
| Firearm   | Fire (basic)   | shot     | 1.0           | weapon |
| Firearm   | Stock Strike   | bash     | 0.8           | 1      |
| Explosive | Throw (basic)  | throw    | 1.0           | weapon |
| Explosive | Shove          | bash     | 0.5           | 1      |

## How techniques are costed and judged

- **Power curve:** a technique's power × hits is ${b.techPowerBase} + ${b.techPowerPerLevel} per unlock level, times its tool's share (heavy ${b.techToolHeavy}; precise, flurry, pierce and knockdown ${b.techToolPrecise}; a pierce of ${Math.round(b.techDeepPierceAt * 100)}% DEF or more ${b.techToolDeepPierce}; collision ${b.techToolCollision}; exhaust and debuff ${b.techToolDebuff}), then gunfire ×${b.gunPower} and bombs ×${b.bombPower}, capped at ${b.techPowerCap} (ADR 0024).
- **Cost model:** *Weight* tools (heavy, precise, knockdown, collision) pay mostly in AP: ${b.techApBase} + ${b.techApPerPower} AP and ${b.techFpBase} + ${b.techFpPerPower} FP per point of total power above 1. *Spirit* tools (flurry, pierce, exhaust, debuff) and every gun or bomb technique pay mostly in FP: ${b.techSpiritApBase} + ${b.techSpiritApPerPower} AP and ${b.techSpiritFpBase} + ${b.techSpiritFpPerPower} FP per point. Ranged styles pay ${b.rangedFpSurcharge} FP more; a knockdown adds ${b.techKnockdownAp} AP and a collision ${b.techCollisionAp} AP. FP stays between ${b.techniqueFpMin} and ${b.techFpMax}. Accuracy rises by tier: +${b.techTierMidAcc} from level ${b.techTierMidLevel}, +${b.techTierAdvancedAcc} from ${b.techTierAdvancedLevel}, +${b.techTierMasterAcc} from ${b.techTierMasterLevel}; precise techniques add their own bonus and heavy ones aim a little worse.
- **Value (a yardstick):** expected damage per use against a reference target (${b.techRefRaw} raw damage, DEF ${b.techRefDef}, ${b.baseHit}% base hit), plus ${b.techValueFatigue} per FP of fatigue inflicted and the worth of a knockdown (${b.techValueKnockdown}), collision (${b.techValueCollision}), sap (${b.techValueWeaken}) or slow (${b.techValueSlow} per MOV), in units of a plain power-1.0 strike. Tested in \`content.test.ts\`: every technique follows the power curve within ${Math.round(b.techPowerTolerance * 100)}%, costs more FP per damage than the weapon's basic strike aimed at the same tier, shows the tool it names, and no pool repeats a tool twice running.
- **Attack kinds** (after the classic): a **knockdown** that lands topples the defender unless it chose Defend: its strike back is cancelled and it starts its next turn ${b.knockdownAp} AP short. A **collision** topples through Defend too (${b.collisionAp} AP). Neither can be countered; Avoid is the answer to both. A **sap** leaves the target dealing ${Math.round(b.weakenMult * 100)}% damage, and a **slow** takes MOV off it, until its next turn is over.
- **Tools:** *Precise* (accuracy), *Flurry* (two or three armour-piercing strikes), *Pierce* (a single armour-piercing blow), *Heavy* (raw power, dear in AP), *Knockdown* and *Collision* (no strike back, AP lost), *Exhaust* (heavy fatigue) and *Sap/Slow* (debuffs). Names, lore and requirements are in \`attacks.json\`.

## Unlock-level curve

Every technique opens at a set pilot level, so nobody has more than the two starters at levels 1-2 and techniques arrive gradually through the campaign (prologue pilots are level 1-6, the later acts 5-12). Each faction and weapon pool opens its first technique by level 4, a new one at least every 3 levels, and ends with a signature technique at level 13 or later.

## The ${rows.length} techniques

| #   | Faction | Attack | Weapon | Frame | Style | Power | Hits | AP | FP | Acc | Range | Level | Value | Needs | Extras |
| --- | ------- | ------ | ------ | ----- | ----- | ----- | ---- | -- | -- | --- | ----- | ----- | ----- | ----- | ------ |
${table.join('\n')}
`;
}

it('docs/ATTACKS.md matches the data (UPDATE_DOCS=1 rewrites it)', async () => {
  // Written the way the repository formats Markdown, so the comparison is exact.
  const config = (await resolveConfig(DOC)) ?? {};
  const doc = await format(buildDoc(), { ...config, filepath: DOC });
  if (process.env.UPDATE_DOCS === '1') writeFileSync(DOC, doc);
  expect(readFileSync(DOC, 'utf8')).toBe(doc);
});
