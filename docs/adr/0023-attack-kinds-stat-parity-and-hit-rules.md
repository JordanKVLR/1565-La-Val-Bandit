# 23. Attack kinds, stat parity and hit rules

## Status

Accepted. Supersedes the level-ladder value standard of ADR 0017 and revises the numbers of
ADR 0018 (Counter).

## Context

Playtesting raised four things at once:

1. Attacks shown at 95% seemed to miss far too often.
2. Defend always hit (100%) and Counter was not worth its risk.
3. POW felt like the best stat to raise.
4. Every new technique was only a little better than the last, which made the basic strikes
   redundant. The classic game this one is modelled on has a real mix of attacks (normal,
   knockdown and collision blows, elemental and ranged ones, debuffs) and a fatigue economy where
   the cheap strike stays useful.

## Decisions

**Hit rolls.** We measured the engine: 200,000 seeded rolls at 95% hit 95.0%, and a sweep of
AI-versus-AI battles hit 93-95% in the 90s bucket, so the roll itself is fair. The cause was the
cap: 58% of all strikes sat pinned at 95%, so a miss every twentieth swing was constant. The cap is
now 99 (`hitMax`), `baseHit` is 55 and `dexHitFactor` 2.4, so fewer strikes saturate and DEX keeps
mattering. Defend doubles the avoid chance, capped at `defendHitMax` (99); a failed Counter is hit
at the same cap.

**Stat parity.** A marginal analysis (the log of expected damage dealt, over damage
taken, times HP, per +1 of each stat) put DEF at 5-6% and POW at 4.3-6.6% against 2-3% for DEX,
AGL and BAS, and DEX at 0% for gunners at the cap. Retuned to `damagePerPoint` 1.1,
`defDamagePerPoint` 0.8, `damageScale` 0.7, `dexHitFactor` 2.4, `hpPerBas` 7: POW about 4.3%,
DEF 3.4%, DEX 3.0%, AGL 3.3%, BAS 3.5%. INT now also trims 1.5% off every FP a pilot gains
(`intFpReduction`, up to 40%), on top of its Counter role.

**Counter.** Base 25 + 3.5 per INT + 1.5 per point of DEX+AGL advantage (cap 90); a success
reflects 1.5 + 0.06 per INT times the blow; a failure costs 1.1x (was 1.25x) and is almost sure to
hit.

**Attack kinds and statuses.** Techniques carry an optional `kind`:

- `knockdown`: if it lands and the target did not Defend, the target's strike back is cancelled
  and it starts its next turn `knockdownAp` AP short (`apDebt`).
- `collision`: the same through Defend, with `collisionAp`.
- Neither can be countered; Avoid answers both.
- `weaken` (the target deals `weakenMult` damage) and `slow` (MOV off) last until the target's next
  turn is over. `apDamage` now means AP off the target's _next_ turn; before, it was removed from a
  pool that refills to 100 at turn start, so it never did anything.

**Technique list.** The 113 techniques keep their names, lore, unlock levels and requirements, but
each is now one tool: precise, flurry, pierce, sniper, heavy, knockdown, collision, exhaust, sap or
slow. Rank discounts are zero and extras are priced (`techKnockdownAp` ... `techAccFp`), so a
later technique is a different tool, never a cheaper copy. Tests require: every technique costs
more FP per damage than the weapon's basic strike, offers a tool the basics lack, no pool repeats a
tool twice running, every pool has at least four tools, and the text matches the numbers.

## Consequences

- Battle saves bump to version 10 (new balance keys); the campaign save is unaffected.
- The AI scores kinds and debuffs, and Defends knockdowns.
- Balance is checked by the AI-versus-AI suite only (a2 and a9 are tight, 3/16); a human should do
  better.

## Revision (playtest round 2)

- Counter was overused. A failed Counter now costs 1.5x the blow (was 1.1x) and is hit at double
  the dodge chance, capped at 99 like Defend, rather than automatically. The reflected damage is
  unchanged. Gunfire (shot and volley styles) can never be countered; Avoid is always offered.
- Gunfire hits harder and aims worse by nature: the Fire starter and every shot or volley technique
  get power x1.25 (`gunPower`), accuracy -25 (`gunAccuracy`) and at least 10% DEF piercing
  (`gunPierce`), on top of their own numbers. Bombs (Throw and throw techniques) hit x1.5
  (`bombPower`). Fire and Throw keep their 25 FP.
- Movement copies the classic AP table (RPGClassics' Vanguard Bandits shrine, terrain page):
  per tile, normal (medium) frames pay 10 on plain/road, 12 wild, 15 rock/castle, 18 desert, 20
  snow/cliff; light and heavy frames have their own columns. The first step of a move costs double
  (`firstStepMult`) and passing through an ally costs 5 (`allyPassAp`). Height adds no AP
  (`climbApPerStep` 0), as the classic prices hard ground by terrain instead. Our terrains map to
  those rows: plain/road/flagstone/deck = plain, field/garigue = wild, rubble/breach = rock,
  rampart = castle, sand = desert, shallows = snow, trench = cliff.
- Battle saves bump to version 11. b5 (Tigne) enemies drop to level 4 to stay winnable.
