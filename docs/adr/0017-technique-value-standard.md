# ADR 0017: A value standard for techniques, and a cost model that rewards level

## Status

Accepted. Builds on [ADR 0015](0015-technique-unlock-levels.md).

## Context

Playtest feedback: the techniques that unlock at high levels did not make sense. Sharpshooter
(level 12) had the same POW and FP as Aimed Shot (level 4), a worse hit chance and less piercing.
Every faction was the same. Scoring all 46 techniques by expected damage per use against a reference
target showed that 41 were worth at most 1.1 starter attacks, 18 less than a starter, and 37 were
worse than a starter for the AP they cost; 11 of the 13 techniques at level 9 or higher were
weaker than a lower-level technique in their own pool. The cause was the cost formula: it charged
power three times (AP, FP and 60 accuracy points per point of power), so extra power bought nothing,
and twin-strike techniques lost more again because armour is subtracted from every strike.
Nothing rewarded having reached a high level, so fixing technique by technique could not hold.

## Decision

- **A value standard.** `techniqueValue` (core) is a technique's expected damage per use against a
  reference target (30 raw damage, DEF 8, 65% base hit), plus 0.12 per FP of fatigue it inflicts and 0.4 for
  being uncounterable, divided by the same for a plain power-1.0 strike. A technique unlocked at
  level L must be worth `techValueBase + techValuePerLevel × (L − 3)` = 1.10 + 0.09 × (L − 3),
  within 12%, and within each faction and weapon pool never less than an earlier one.
  All the numbers are in `balance.json`.
- **A new cost model for faction techniques** (`techniqueStats`): the same AP and FP per power, but
  an accuracy tax of 15 (not 60) per point of power, and a _rank_ (one per two unlock levels) that cuts
  FP by 5%, AP by 3% and adds 2 accuracy. Starters keep their formula, so the early game does not move.
- **Techniques differ in how they spend the budget, not in how much they have:** Burst (power),
  Precision (accuracy and piercing), Flurry (two strikes that ignore half of DEF), Control (fatigue,
  uncounterable) and Mastery (a pool's best). A single-strike technique's POW also rises with level,
  because players read POW first.
- **71 techniques**: the 46 existing ones re-levelled and re-statted (same ids, names and lore), plus
  25 new ones, so every pool opens its first technique by level 4, a new one at least every 3 levels,
  and ends with a master technique at 13 or 14.
- **Descriptions are checked.** The effect sentence of every description is generated from the
  technique's numbers, and a test fails if a description claims an effect the numbers lack or the
  reverse. `docs/ATTACKS.md` is generated from the data and a test fails when it is stale
  (`UPDATE_DOCS=1` rewrites it).
- **Calibration.** The plan drafted the ladder at 1.15 + 0.12 per level. AI-vs-AI win rates over all
  36 battles were the same on average at every slope tried (11.6 to 11.9 wins in 16, 11.9 before), but
  three finales swung with it, so the shipped slope is 1.10 + 0.09, and the enemy levels of the
  finales a9, i5 and i9 were lowered by one or two so each stays winnable.

## Consequences

- Aimed Shot, the most-used technique, is trimmed (from 2.3× a starter to 1.3×) to fit the ladder;
  it was the outlier. Late techniques are now clearly better (up to about 2.1×).
- New techniques must pass the value and description tests; tuning is `techValueBase` and
  `techValuePerLevel` in data, plus each technique's own numbers.
- A pilot who already passed a technique's old level may find it moved up by a level or two.
  Unlocks are computed live from level and stats, so saves load unchanged.
