# ADR 0016: XP pacing, honest strike-back odds, and facing that stays put

## Status

Accepted.

## Context

Playtest feedback after ADR 0015 said: XP per battle was far too low; fighting a tougher enemy paid
too little and fighting weaker ones too much; a strike back seemed to carry an accuracy penalty;
enemy techniques could not be read; and a unit that is attacked turns to face its attacker, which
removes the point of choosing a facing at the end of a turn.

A simulation of all 36 battles (AI against AI, 8 seeds, every XP-earning strike recorded) showed
a pilot earning about 200 XP a battle (0.4 of a level) and trailing the level the story files
assume by up to 1.9 levels in the middle of a route. The level-gap factor existed (±20% a level)
but gaps are usually small, so it moved the total little. Levelling cost a flat 500 XP, so late
levels came as fast as early ones.

For the strike back, the rules had no explicit penalty. The screenshot's 74% against 49% was a side
attack (+10), the attacker's higher DEX and AGL (+8) and the ground under the target (about −7).
But paying FP _before_ the strikes could push a unit into the Tired band (FP ≥ 50) and make its own
blow, or the blow it answered, 10 points worse or better, which the forecast never showed.

## Decision

- **XP:** a global `xpScale` of 1.25; a steeper gap bonus (1 + 0.30·gap + 0.05·gap², capped at ×4);
  a real penalty for weaker foes (0.72^|gap|, floored at ×0.05); and each level costs 6% more XP
  than the last (`xpToNextLevel`), so reaching level 12 costs 7,150 XP instead of 5,500. All five
  numbers are in `balance.json`. In the campaign simulation, with a pilot who falls behind meeting
  relatively tougher foes, this keeps pilots within about 1.1 levels of the story files and ends
  them at levels 10.9 to 12.1 (they ended at 9.9 to 11.6).
- **Honest odds:** FP for an attack and for a reaction is paid after the exchange, so Tired is
  judged on the fatigue each side came in with, exactly as the forecast shows. Every hit-chance
  term (`HitParts`: technique, DEX against AGL, flank, height, allies, ground, fatigue, skills) is
  now listed as signed chips on both sides of the forecast, so a gap between a blow and its strike
  back is explained rather than mysterious.
- **Facing:** a defender is never turned by a blow. Only the attacker turns toward its target. A
  flank stays a flank until the defender's own turn, which makes the facing chosen at the end of a
  turn a real decision.
- **Enemy information:** the unit sheet shows every unit's techniques (and skills), enemies
  included, with the techniques their level has not yet opened shown locked.

## Consequences

- XP and level costs are not flat any more: the XP bar, the results and the unit sheet read
  `xpToNextLevel(level)`. Saved XP stays a remainder within the level, so saves load unchanged.
- Facing now matters more to the AI and the player: flanking and rear attacks last, so expect
  battles to reward positioning. The AI-vs-AI win-rate tests guard that every battle stays winnable.
- The rules tests run on a flat 500 XP with no global rate (`TEST_BALANCE`), so their expected
  values do not move when the shipped numbers are retuned.
