# 0021: Classes, Balbi's chronicle, enemy roles, the Truce ending and the daily challenge

Status: accepted

## Decisions

- **Classes** (`data/classes.json`): at `promotionLevel` (10, in balance) a pilot may take one of
  four classes: Bulwark, Vanguard, Duelist, Tactician. Each is a six-point stat package (added to
  the pilot's stats once, capped) and one skill built from the existing skill effects, which joins
  the pilot's skills in battle. The choice is final and stored as `RosterEntry.class` (optional,
  so no save version bump). Chosen in the Training sheet, with a confirmation.
- **Balbi's chronicle**: a third codex kind (`chronicle`, category `diary`) with 15 diary pages in
  the voice of the real arquebusier Francisco Balbi di Correggio, each unlocked by the battle it
  describes. Facts are real (dates, places); Balbi's own lines are invented and labelled as the
  Chronicle, not as history or fiction.
- **Enemy roles**: four skills for enemy units (Standard-Bearer aura, Hardened Veteran, Marksman,
  Zealot) built from existing effects and given to named enemies in later battles, so enemies read
  as roles without new art or rules. Leaders are Hardened Veterans.
- **The Truce** (Cross route): a fourth ending, reached when La Valette's trust is high
  (`aff_valette ≥ 3`) and Deniz was let go (`aff_deniz > 0`). It sets `ending_variant = "truce"`;
  achievements can match a `variant`, and variants never count as a separate route for "all
  endings". Earns the Cross ending and `ACH_ENDING_TRUCE`.
- **Daily challenge** (title screen): one skirmish a day by calendar day, with the skirmish's fixed
  squad and the day number as the seed, so results compare across devices. Best result (fewer
  losses, then more goals, then fewer rounds) is kept on the device for a month; there is no
  server, so no leaderboard.

## Not done (and why)

- New named recruits and their loyalty quests need character portraits (art we cannot license or
  generate here). Voiced lines, new music and expression art need assets as well.
- Permadeath would leave story scenes with fallen characters talking; it needs scene variants.
