# ADR 0014: One damage-scale knob

## Status

Accepted

## Context

Blows were far too lethal: a typical unit (about 100 HP in the shipped battles) fell to about 3
rear basic hits and 4 front hits, so battles were decided in a couple of exchanges and positioning
and reactions hardly mattered. The owner wants 4–5 rear hits for a typical unit.

## Decision

Add `damageScale` to `balance.json` (and core `DEFAULT_BALANCE`). `damageFor` multiplies
`(raw − DEF × defDamagePerPoint)` by it, before Defend/Counter multipliers and skill reduction.

- It is applied after DEF so DEF keeps its proportional meaning; technique power, height, rear
  and Defend multipliers keep their relative values, and counter reflect (built from the final
  undefended damage) scales with it automatically.
- HP and XP are untouched: XP uses the share of max HP dealt, so a hit now earns proportionally
  less per blow but more blows land per kill; xpDefeat still pays out once.
- The AI danger estimate and the two UI readouts (loadout "damage"/"block", unit panel "blocks")
  multiply by the same knob. The forecast panel uses `damageFor` and needs no change.
- Core rules tests run on `TEST_BALANCE` with `damageScale: 1` so hand-computed values stay
  readable; a separate test file pins the shipped balance.
- Value 0.6 was chosen by measuring hits-to-kill over every unit pairing in every battle.
