# 22. Level curve to 25, recruit levels and deeper unlocks

## Status

Accepted

## Context

Battles were tuned for about Lv 11-12 at the finale, a simulation stalled near Lv 5, skills and
techniques stopped at Lv 10/13, and recruits joined at Lv 1. The goal is roughly one level per
battle per unit and about Lv 25 at the end of the campaign.

## Decision

- Enemy average level follows T(n) = 1 + 22*((n-1)/14)^1.15 over the 15-16 roster battles of a
  route (interludes are Ottoman-side). Every story battle and skirmish is rescaled to it.
- `xpFor` gains a `rise` factor (1 + xpLevelCostGrowth*(level-1)) so higher levels keep pace with the
  growing level cost; `xpScale` is 2.2 (content data).
- `packages/content/data/campaign.json` gives the battle order per route. A recruit joins at the
  enemy average of the next battle (`nextBattleId`, `enemyAverageLevel`, `raisedTo`); existing
  members are never lowered and keep any higher earned stats.
- Old saves (`curve` < `LEVEL_CURVE`) are caught up to within 3 levels of the curve on load.
- Skills at Lv 15/20/25 for every named character; techniques at Lv 17/21/25 per pool with 2D
  duel variants.
- No hard level cap.

## Consequences

Balance is validated by AI-vs-AI simulation only; margins on a2, a3, a9 and b5 are thin and human
play should do better. Future content must use `enemyAverageLevel` targets rather than fixed levels.
