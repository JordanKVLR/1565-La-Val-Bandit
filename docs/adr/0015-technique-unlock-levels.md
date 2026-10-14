# ADR 0015: Techniques unlock by pilot level

## Status

Accepted

## Context

Any faction technique whose stat requirement was met was usable at once, so several pilots started
the game with three attacks (Ninu with Hook-Cut, the gunners with Aimed Shot, Deniz and Yusuf with
Boarding Slash, Leyla with Fire Pot) and the option set never grew with the campaign. The same
play feedback found XP too generous and Ninu's starting stats above his peers.

## Decision

- Each technique in `attacks.json` has an optional `level` (default 1 in the schema; core
  `Attack.level` is optional and read as 1). A technique is usable only when the pilot's level is at
  least `level` AND their stats (gear included) meet `requires`: `isAttackUnlocked` in core,
  used by `unlockedAttacks`, the attack command and strike-back options.
- Shipped levels run from 3 to 14: entry techniques (light, single-stat) at 3-4, early utility at
  5-6, mid at 7-9, advanced at 10-12, ultimates at 13-14. The full table is in `docs/ATTACKS.md`.
  Nobody has more than the two starters at levels 1-2.
- Enemies use the same rule with the levels in their battle files, so the prologue enemies (levels
  1-2) fight with starters and later enemies gain techniques in the same order as the player.
- The level-up event lists `newTechniques`; the log, XP panel and level-up panel announce them.
  Techniques held back by level show as locked ("Unlocks at level N") in the attack menu and unit
  sheet; ones waiting only on attributes stay hidden.
- XP rates were halved at the same time (`xpHitBase` 30, `xpDamageShare` 100, `xpDefeat` 200, was
  75 / 200 / 400): kills take more hits since ADR 0014 and each hit paid the base, so pilots were
  levelling about twice as fast as intended. Ninu's raw stats total 30 (was 35).

## Consequences

- New techniques need a `level`; the content tests reject any below 3 and check that light techniques
  are early and heavy ones late.
- Tuning is data: levels in `attacks.json`, XP in `balance.json`.
