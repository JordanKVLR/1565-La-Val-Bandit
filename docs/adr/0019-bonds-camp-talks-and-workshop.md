# 0019: Bonds, camp talks and the Workshop

Status: accepted

## Context

Affinity values existed in the story but did nothing in battle, the company's scudi had one use
(the Armoury), and the campaign was a straight line of battles with no room for the characters to
breathe. We wanted friendship to matter tactically, and a second sink for money and salvage.

## Decisions

- **Bonds** (`data/bonds.json`): pairs of named characters, each reading one story variable
  (`aff_*` for Ninu's four main bonds, `bond_*` for the rest). A score maps to rank 0–3 through
  thresholds in the same file. In battle, bonded allies within `bondRange` (2 tiles) get, per
  rank, +`bondHit` to hit, +`bondDamage` damage dealt and −`bondGuard` damage taken. The hit term
  shows as a "Bond +n%" chip in the forecast. Core only sees `Bond[]` on `BattleSetup` /
  `BattleState.bonds` (optional, so older saves load unchanged).
- **Camp talks** (`data/camp.json` + `story/camp.ink`): short optional scenes opened from the
  preparation screen. Each is an Ink knot `camp_<id>` that raises one bond variable by 1 and ends
  with `>>> endcamp`. They run in a second `StoryRunner` that shares the bond variables with the
  main story and returns to preparation; the main story, stage and autosave are untouched, and a
  half-heard talk is never saved. Heard talks are stored in the campaign save (`campDone`).
  Content tests check each scene has a knot, ends properly and raises exactly one bond between
  its own characters. Rule: scenes use only stage cells other scenes already use.
- **Workshop** (`data/recipes.json`): spend scudi and salvaged **parts** (earned per victory and
  per enemy beaten, `partsVictory` / `partsPerEnemy` in balance) to temper a stock weapon
  (+3 power, a `tempered-*` item) or forge a keepsake charm/amulet. An upgrade consumes a spare or
  replaces the pilot's fitted copy in place. Parts are saved in the campaign save (`parts`).
- Both new save fields are optional, so campaign save version 4 and battle save version 9 stand.
