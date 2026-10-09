# ADR 0007: Difficulty modes, New Game+ and retrying lost battles

## Status

Accepted

## Context

The campaign had a single balance and ended at the credits. Players asked for a story mode and a
harder mode, and M7 listed New Game+. A lost battle could already be restarted ("Try again"), but
it was free on every setting, so it gave a story mode nothing to offer.

## Decision

- **Three modes, per playthrough:** Squire (story), Knight (the reference balance, default) and
  Grand Master. The mode is picked at New Game, saved with the game and changed from the in-game
  menu (it applies from the next battle). The menu, the title's Continue button and every save
  card show it.
- **Data-driven multipliers** in `balance.json` (mirrored in core `DEFAULT_BALANCE`):
  `<mode>EnemyLevel`, `<mode>EnemyStats`, `<mode>Scudi` and `<mode>DefeatKeepsXp` for `squire`,
  `knight` and `grandMaster`. Knight is neutral (0, 1, 1, 0), so its battles are byte-for-byte the
  authored ones (a content test checks that) and the AI-vs-AI simulation is unchanged.
  - Squire: enemies −1 level (never below 1), attributes ×0.85, scudi ×1.5, a lost battle keeps
    its experience.
  - Grand Master: enemies +2 levels, attributes ×1.15, scudi ×0.75. "Smarter" comes from the
    rules rather than new AI code: higher levels and attributes unlock more of each faction's
    techniques (they are gated by attributes), and the utility AI uses whatever is unlocked.
- **Where it applies:** `buildBattle` takes `{ difficulty, ngPlus }` and scales only enemy units:
  level first (so named enemies grow along their growth curve and generic ones gain derived
  BAS/DEF/WEP and HP), then every attribute is multiplied, rounded and kept within 1…`statMax`.
  The pure functions live in `packages/core/src/difficulty.ts`. The scudi multiplier applies to
  all income: victory purses and `>>> scudi` gifts. Battle purses also grow with enemy level, so
  they follow the scaled levels.
- **Retry battle** (renamed from "Try again") restarts the lost battle from its beginning on
  every mode. With `DefeatKeepsXp` (Squire) the levels and XP earned in the lost attempt are
  kept, also when the player gives up instead, so retrying is free. Otherwise that attempt's
  experience is lost, as before. There is no scudi fee: quitting to the title and continuing
  would dodge it. The defeat screen says which rule applies.
- **New Game+:** reaching any ending records the route in the save (`ending`). The title screen
  then offers New Game+ for every save that has one; it starts the story from the beginning in a
  new playthrough (it autosaves, so a manual save slot that was used keeps the finished game).
  - **Carried over:** every pilot's level, XP, attributes and unspent points (as `veterans`, so
    pilots who join later in the story join with them, and named guests fight with them), the
    gear they had fitted, the stores and the scudi. Fitted gear goes into the stores and is
    refitted when the pilot joins (`kit`), wherever it is still there and usable; the kit the
    story hands over then goes to the stores. A pilot's own starting armatura and weapon go with
    them, as when someone leaves the company, so they are not duplicated.
  - **Reset:** the ink story (choices, affinity, route), battles won, salvage (it can be taken
    again) and the Armoury's stock, which unlocks again as the story goes on.
  - **Enemies scale per cycle**, stacking on top of the difficulty: cycle n adds
    n × `ngPlusEnemyLevelPerCycle` (6) levels and multiplies attributes by
    (1 + n × `ngPlusEnemyStatsPerCycle` (0.2)). A finished company is around level 10–12, so the
    first battles of NG+ 1 put level 7–8 enemies against it, and the finales level 19–20.
  - Ending achievements unlock again on every cycle (they are idempotent on Steam). "NG+ n" shows
    on the title's Continue button, on save cards and in the menu.
- **A pilot who leaves the company keeps their progress** in `veterans` too, so a later return
  (or NG+) doesn't reset them.
- **Saves:** campaign save version 3 adds `difficulty`, `ngPlus`, `ending` and `kit`. Older saves
  migrate to Knight, cycle 0; a save that has already won a route's final battle counts as having
  reached that ending, so finished games from before this change can start New Game+.

## Consequences

- The default experience is unchanged; the other modes are pure data and can be retuned without
  code changes. A content test holds Squire below and Grand Master above Knight on every battle.
- Changing the difficulty mid-battle has no effect until the next battle or retry.
- NG+ enemies are not tuned against a specific carried-over company; the per-cycle numbers are a
  first guess for playtesting.
