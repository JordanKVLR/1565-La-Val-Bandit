# ADR 0003: Six classic attributes, damage-based XP and owned gear

## Status

Accepted

## Context

The game had grown seven home-made attributes (STR, SKL, AGI, DEF, INT, SPI, VIT), two
overlapping accuracy stats (weapon accuracy and SKL), XP for every hit or reaction, and a
workshop that sold designs once and then let any pilot use them for free. The owner asked us to
follow the reference game's framework instead: its stat set, its levelling, and gear that has
to be bought or found.

## Decision

- **Attributes:** BAS, POW, DEX, AGL, DEF and WEP, each 0–32. Accuracy comes only from DEX (plus
  the technique's own modifier); evasion only from AGL. Max HP = level × 2 + BAS × 4 + 10 + frame
  HP. `UnitState` keeps the pilot's own values in `pilot` and the gear-inclusive values at the top
  level, so rules read one number.
- **Gear:** frames, weapons, charms and amulets add attribute bonuses. The campaign keeps real
  items: each fitted item is one owned copy; spares sit in `stores` (`"kind:id" → count`).
  Armaturas come only from story and salvage. The Armoury, open between every battle, sells
  weapons, charms and amulets and buys spares back at half price.
- **XP:** only for landing a blow: 30 + 100 × damage share, +150 for a defeat, ×1/0.8/0.5 by
  facing and ×(1 + 0.2 × level gap). 500 XP per level, 3 points per level.
- **Technique cost:** one formula from power × hits sets AP, FP and accuracy, so stronger
  attacks are always dearer and less accurate. Content data only gives power.
- **Saves:** battle saves older than version 7 are refused (the battle restarts); campaign saves
  migrate from version 1 (stats mapped, XP rescaled, designs turned into spare items).
- **Balance tests** run on a fixed reference balance (`TEST_BALANCE`) so retuning the shipped
  numbers in `balance.json` doesn't rewrite every expected value; the AI-vs-AI sim checks the
  shipped numbers.

## Consequences

- One accuracy stat and fewer attributes: easier to read on a phone, and closer to the genre.
- Gear choices now matter between battles; scudi and salvage are the levers for difficulty.
- Mid-battle saves from before the change are lost (the battle restarts from its start).
