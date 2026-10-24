# Armatura 1565: Feature & Add-on Roadmap (proposal)

Based on `docs/PLAN.md` (M0–M7 done, 24 battles, 3 routes, 3 endings; M8/M9 partly done).

## Diagnosis

**Strengths:** a deep, readable combat loop (AP/FP, directional reactions, height, assist); an
original setting (the Great Siege of Malta plus clockwork Armature); a tested engine with an AI-vs-AI
winnability check; three routes with a hidden-lineage hook.

**Gaps that matter more than new features:**

1. **Replayability is thin.** One 24-battle campaign, NG+ only carries levels over.
2. **No mid-battle variety.** Win conditions exist, but there are no weather, fog, night or
   reinforcement events. Siege maps feel like skirmish maps.
3. **"Skills still to do"** (M6): progression is stat points plus gear, so builds don't diverge.
4. **No meta layer** between battles beyond the shop: no base, no relationships you can see.
5. **Launch blockers:** final art/audio, gamepad, ads, store accounts (M9).
6. **Siege fantasy is under-used.** The title promises a siege; battles are small squads.

## Tier 0: Ship first (finish M8/M9)

| Item | Why |
| ---- | --- |
| Gamepad / Steam Deck full support | Needed for Steam Verified; small cost |
| Final art and audio pass | Placeholders cap review scores |
| Difficulty modes (Story / Standard / Siege) + permadeath option | Cheap to add, widens the audience |
| Accessibility pass (colour-blind tile patterns, text scale) | Already promised in the plan |
| Telemetry-free balance dashboard from the AI sim | Keeps later content honest |

## Tier 1: Depth (v1.1, "The Master's Orders")

1. **Skill trees per frame class.** Three branches each (Bulwark / Duelist / Engineer, etc.),
   unlocked at level milestones. Finishes the M6 gap.
2. **Battlefield events.** Scripted reinforcements, collapsing walls, night/fog vision, sirocco
   wind (shot accuracy), fire spread. All data-driven in battle JSON.
3. **Overheat and repair mechanic for Scala Prototipo** (villain frames) so late-game bosses
   behave differently from reskinned enemies.
4. **Bonds system.** Pairs with high affinity unlock assist bonuses and joint attacks; makes the
   hidden affinity values visible and rewarding.
5. **Camp screen** between chapters: talk to party, optional side scenes, affinity gifts.

## Tier 2: Replayability (v1.2, "Siege Tides")

1. **Siege Mode (roguelite campaign).** Defend Birgu across a 15-week timeline; each week you
   choose which sector to reinforce, spend scudi on walls or Armature, then fight the resulting
   skirmish. Seeded, so it fits the deterministic core and dailies.
2. **Daily/weekly challenge battle** with a shared seed and a local leaderboard (web-only first).
3. **NG+ upgrades:** keep gear, cross-route recruits, "Hard Siege" enemy scaling, new epilogue scenes.
4. **Skirmish arena:** build any matchup from content data; great for modders and for testing.
5. **Achievements and codex:** frames, historical notes on real people and places (strong
   educational and marketing hook for Malta).

## Tier 3: Add-ons / DLC-style content

| Add-on | Pitch |
| ------ | ----- |
| **"Knights of the Sea"** (5–6 battles) | Naval/galley boarding battles on the Grand Harbour with a new corsair frame set |
| **"The Great Assault" (Sept 1565 epilogue)** | Relief force arrives; large 8v8 battles, mass-formation mechanic |
| **"Scala's Workshop"** (side story) | Prequel as Vittorio Scala; prototype-frame puzzle battles |
| **Mdina Intrigue** | Low-combat political chapter with a persuasion minigame feeding affinity |
| **Cosmetic packs** | Liveries and palettes only; no pay-to-win, in keeping with the no-loot-box rule |

## Tier 4: Platform and community

1. **Cloud saves** (Steam first, then Google Play Games/iCloud).
2. **Mod support:** content is JSON, so ship a documented battle/map editor and Steam Workshop
   folder import. The architecture already suits it.
3. **Localisation:** Maltese, Italian, Turkish, French. The i18n table exists; local-language
   releases are a strong fit for the setting.
4. **Photo mode / replay export** from the cinematic close-up system.
5. **Optional voice barks** (open item in the plan), only after the text is stable.

## Suggested order

`Tier 0 → Skills + Events → Bonds/Camp → Siege Mode → Localisation → first add-on`

## Risks to watch

- **Scope creep before launch:** Tier 0 is unfinished; every feature above delays store release.
- **Balance debt:** each new system (events, bonds, skills) multiplies AI-sim cases; keep the
  winnability test in CI.
- **Monetisation conflict:** ads plus DLC plus cosmetics need one coherent story (see §6.1).
- **Historical sensitivity:** Ottoman route content must keep the tone rules in §3.1.
