# ADR 0005: No armour, Defend after DEF, steeper FP, and the Armoury workshop

## Status

Accepted. Amends ADR 0003 (classic attributes and owned gear).

## Context

Playtesting showed four problems. Most hits did single-digit damage, because armatura armour and
DEF were both subtracted and Defend then halved the remainder, often down to the 1-damage
floor. Strong techniques cost little more FP than weak ones, so there was no reason to use
anything else. Firearms out-ranged everything and paid nothing for it, yet were helpless up
close. Money came in too slowly to buy anything, there were no better weapons to buy anyway,
and the preparation screen was a plain list.

## Decision

- **Armatura armour is removed.** `Frame.armour` and `UnitState.arm` are gone. Damage is
  `max(1, round((raw − DEF × 1.5 × (1 − pierce)) × reactionMult))`, so DEF comes off first and
  Defend (×0.5) halves what gets through instead of flooring it.
- **Armaturas give BAS, DEF and WEP.** Each player armatura gives 9–12 bonus points. Heavy
  frames put more into DEF and BAS; light ones put DEF low and add AGL and DEX. A content test
  holds every armatura to that budget and that ordering. Weapon bonuses are ×1.5.
- **FP scales steeply with power:** FP = 5 + 45 × (power × hits − 1). Shot, volley and throw
  techniques cost `rangedFpSurcharge` (+20) on top, which also applies to Fire and Throw.
  Stock Strike is now Slash-strength (×0.8, +12%, 20 AP, 5 FP). Content techniques can carry
  `accuracyBonus` and `apBonus`. Aimed Shot uses them: +25% to hit and ignores half the
  target's DEF, for more AP.
- **Economy ×3.** Victory pays 150, plus 60 + 15 × level per enemy, plus 100 if nobody fell.
  The numbers live in `balance.json`.
- **Weapon tiers.** Weapons carry `tier` (common, fine, masterwork) and a `description`. There
  are 18 new fine and masterwork weapons, unlocked along every route for both sides. Price is
  60 + 40 × the bonus total.
- **The Armoury & Workshop** replaces `PrepScreen`. It is one screen with no page scroll on
  phones: a pilot rail, the pilot's armatura in 3D with four slots, a tabbed shelf of item cards
  (fitted, stores, other pilots, the armourer's stock), and a detail panel. The detail panel
  shows bars for every changed number, techniques learned and lost, and one action that says
  exactly what it does (Buy & equip, Swap, Sell…). A disabled action always shows its reason.
  Each side has a named armourer with spoken lines. Purchases above `armouryConfirmFraction` of
  the purse take a second tap. Tier, gain and loss, blocked items and selection are each shown
  by shape, pattern and text as well as colour. The pure logic lives in `ui/armoury/model.ts`,
  which has unit tests. `?armoury` opens a demo company for tests and design.

## Consequences

- Hits now take about 25–35% of a target's HP, or 12–17% when defended. Every battle still
  passes the AI-vs-AI balance simulation.
- Saves with `arm` values load fine because the field is simply ignored.
- Golden-number tests in `packages/core/test` were updated to the new formula.
