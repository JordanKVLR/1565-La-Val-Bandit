import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { techniqueRank, techniqueValue, unlockedAttacks, createBattle } from '@m1565/core';
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
    ]
      .filter(Boolean)
      .join(', ');
    const range = a.minRange || a.maxRange ? `${a.minRange ?? 1}-${a.maxRange ?? 1}` : 'weapon';
    const hits = a.hits ?? 1;
    return `| ${i + 1} | ${cap(data.faction)} | ${data.name} | ${data.weaponTypes.join('/')} | ${data.frameClasses.join('/') || 'any'} | ${data.style} | ${a.power.toFixed(2)} | ${hits} | ${a.apCost} | ${a.fpCost} | ${a.accuracy >= 0 ? '+' : ''}${a.accuracy} | ${range} | ${data.level} | ${techniqueRank(data.level)} | ${techniqueValue(a, lib.balance).toFixed(2)}× | ${reqText(data.requires) || '-'} | ${extras || '-'} |`;
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
included) meet the requirement (ADR 0015). The value standard and cost model are in ADR 0017.

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

- **Cost model:** AP is ${b.techApBase} + ${b.techApPerPower} per point of total power above 1, FP is ${b.techFpBase} + ${b.techFpPerPower} per point (ranged styles pay ${b.rangedFpSurcharge} more), and accuracy falls ${b.techniqueAccPerPower} per point of power. Each **rank** (one per two levels of the unlock level, so level 3 is rank 1 and level 13 rank 6) cuts FP by ${b.techRankFpDiscount * 100}%, AP by ${b.techRankApDiscount * 100}% and adds ${b.techRankAccBonus} accuracy, so a master technique is both stronger and more economical.
- **Value:** expected damage per use against a reference target (${b.techRefRaw} raw damage, DEF ${b.techRefDef}, ${b.baseHit}% base hit), plus ${b.techValueFatigue} per FP of fatigue inflicted and ${b.techValueNoCounter} for being uncounterable, in units of a plain power-1.0 strike. A technique unlocked at level L must be worth ${b.techValueBase} + ${b.techValuePerLevel} × (L − 3) of those, within ${b.techValueTolerance * 100}%, and within a faction and weapon pool never worth less than an earlier one (tested in \`content.test.ts\`).
- **Roles:** *Burst* (raw power), *Precision* (accuracy and piercing), *Flurry* (two armour-piercing strikes), *Control* (fatigue, uncounterable) and *Mastery* (the pool's best). Names, lore and requirements are in \`attacks.json\`.

## Unlock-level curve

Every technique opens at a set pilot level, so nobody has more than the two starters at levels 1-2 and techniques arrive gradually through the campaign (prologue pilots are level 1-6, the later acts 5-12). Each faction and weapon pool opens its first technique by level 4, a new one at least every 3 levels, and ends with a master technique at level 13 or 14.

## The ${rows.length} techniques

| #   | Faction | Attack | Weapon | Frame | Style | Power | Hits | AP | FP | Acc | Range | Level | Rank | Value | Needs | Extras |
| --- | ------- | ------ | ------ | ----- | ----- | ----- | ---- | -- | -- | --- | ----- | ----- | ---- | ----- | ----- | ------ |
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
