# ADR 0008: Pilot skills are data-driven passives unlocked by level

## Status

Accepted.

## Context

M6 listed "skills" as still to do. Named pilots differed only in their attributes and loadout,
so a militiaman and a knight on the same frame played the same. We wanted each named character
to have an identity of their own that grows with them, without new buttons to press on a phone,
and without making the forecast lie.

## Decision

- **Passive only.** A skill is always on once the pilot reaches its level. There is no
  activation, cooldown or extra resource, so the battle UI stays the same.
- **One effect per skill, from a small fixed set** (`packages/core/src/skills.ts`):
  `hitBonus`, `damageBonus`, `evadeBonus`, `damageReduction` (each with an optional condition:
  `higher`, `flank`, `melee`, `ranged`, `foeHeavy`, `foeLight`, `foeWounded`, `selfWounded`),
  `defendBonus`, `reactionFpDiscount`, `attackFpDiscount`, `counterBonus`, `regen`, `restBonus`,
  `xpBonus`, `moveBonus`, `aura` (+hit for adjacent allies; the best aura counts, they don't
  stack) and `initiative`. Every number lives in `packages/content/data/skills.json`; the zod
  schema caps each one (for example ≤50% damage, ≤25 hit or FP) so no skill can decide a battle
  alone.
- **Hooked into the existing formulas, so the forecast stays truthful.** Hit and damage skills
  enter `strikeNumbers` (two new fields: `skillHit` and `reduction`), which both the forecast and
  the resolver use. FP discounts go through `attackFpCost`, `reactionFpCost` and
  `attackBackFpCost`, which the menus already show. Counter skills add after the usual clamp.
  `regen` heals at turn start and emits `unitRecovered`; `restBonus` scales end-of-turn
  recovery; `xpBonus` scales `xpFor`; `initiative` adds to the round's roll; `moveBonus` is baked
  into `mov` like max HP, and added at once when it unlocks mid-battle.
- **Units carry full skill definitions, locked ones included** (`UnitState.skills`), the same
  way they carry their whole technique pool. A skill is active when `level ≥ skill.level`, so a
  mid-battle level-up switches it on and the `levelUp` event lists `newSkills`. Saves stay
  self-contained and the UI can show locked skills without the content library.
- **Assignments live in `skills.json`, keyed by character id** (characters.json is unchanged).
  Each of the ten named characters has three distinct skills at levels 1, 5 and 10. Those levels
  rather than 1/6/12 because scripted campaign levels top out at 11, so the third skill is
  reached in every route's final chapter. Generic units may list skill ids in battle JSON
  (`"skills": [...]`), active from the start; no shipped battle uses this yet.
- **Battle saves are version 8.** A version 7 save migrates by giving every unit no skills.
- **UI:** the unit sheet has a Skills page; the Armoury's Training sheet lists skills; locked
  ones are greyed, dashed, with a padlock and "Unlocks at Lv N" (shape and text, not only
  colour). The XP panel, level-up panel and battle log announce "New skill: X".

## Consequences

- Player-side win rates in the AI-vs-AI sim rise a little on most battles, and every battle
  still passes. `i1-road-to-mdina` (an escape) is the most sensitive, which is why Ninu's first
  skill is the evasion one.
- New effect types need a core change and tests; new skills built from existing types are just
  data.
- Enemies only gain skills if they are named characters (Deniz in b6) or a battle lists them.
