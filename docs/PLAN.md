# Armatura 1565 — Master Plan

> Status: **Draft v2, decisions confirmed by owner** · Owner: Jordan · Last updated: 2026-09-29
>
> An original tactical RPG set during the Great Siege of Malta (May–September 1565),
> inspired by the _gameplay_ of the 1998 PS1 tactics genre (isometric height-map
> battles, action/fatigue economy, defender reactions, cinematic close-ups,
> branching story). All story, characters, art, text, music and names are original.

---

## 0. Decisions locked in

| #   | Topic          | Decision                                                                                                                                                                                                                                                                             |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Unit fantasy   | **Armature everywhere.** Every combatant on the battlefield pilots an _Armatura_: a clockwork/spring-and-steam war-harness roughly 3–4 m tall. This is an alternate-history 1565 in which the machines have reshaped war. Ordinary troops appear only in story scenes and backdrops. |
| 2   | Point of view  | Protagonist is a **Maltese peasant with a hidden double royal lineage**: the secret son of Jean de Valette and an Ottoman concubine of royal blood (see §3.3). An **Ottoman side-story** is playable as a route.                                                                     |
| 3   | First build    | **Vertical slice**: prologue plus **5 battles** (the last one is the first Ottoman side-story battle), every core system working, playable in a mobile browser.                                                                                                                      |
| 4   | Stack          | **TypeScript + Vite + Three.js**. Rules live in a separate headless package. **Capacitor** wraps the game for iOS/Android, **Electron + steamworks.js** for Steam.                                                                                                                   |
| 5   | Visuals        | **Same presentation style as the reference game:** 3D height-map terrain, 2D billboard character sprites, an isometric camera that rotates in 90° steps, a portrait dialogue box, a side-by-side combat forecast panel, and cinematic close-ups. All assets are original (§1).       |
| 6   | Art/audio      | Placeholders for now, loaded through a manifest so final assets can drop in without code changes.                                                                                                                                                                                    |
| 7   | Orientation    | **Landscape only.**                                                                                                                                                                                                                                                                  |
| 8   | Languages      | **English only.** Strings still go through a single i18n table (near-zero cost), so translation stays possible later.                                                                                                                                                                |
| 9   | Business       | **Free on all platforms. Ads come later** (§6.1), only at natural breaks, never during battles. No loot boxes. For now the code has an `AdsAdapter` stub only, with no ad SDKs and no data collection.                                                                               |
| 10  | Store accounts | None yet. They're needed at M8 (Apple Developer $99/yr, Google Play $25 one-off, Steamworks $100 per app).                                                                                                                                                                           |
| 11  | Title          | **Armatura 1565** (chosen by owner). Code keeps the neutral `@m1565/*` package scope.                                                                                                                                                                                                |
| 12  | Plan location  | This file. It changes through normal commits.                                                                                                                                                                                                                                        |

---

## 1. Originality & IP policy

The game borrows **mechanics and genre conventions**, which are not protected: grid tactics, action points, reaction choice, height bonuses. It must **not** borrow expression:
no character names, portraits, sprites, maps, dialogue, music, UI art, logos or mech designs
from any existing game. Reference screenshots are for _mood and layout study only_ and are
never committed to the repo. Every third-party asset needs a licence entry in
`assets/CREDITS.md`, or CI fails. This also protects store approval (Apple 4.1 "Copycats",
Steam content review).

---

## 2. Game design

### 2.1 Core loop

```
Story scene (isometric diorama + portrait dialogue, choices)
  → Prep (party, Armatura loadout, shop, save)
    → Battle (isometric grid, turn-based)
      → Results (XP, loot, affinity changes)
        → next Story scene (branches on flags/affinity)
```

### 2.2 Battle rules (initial numbers; the balance sim tunes them)

**Stats per unit:** HP, AP (0–100), FP (0–100), STR, SKL (accuracy), AGI (evasion/speed),
ARM (armour), MOV (tiles), plus weapon and gear.

**Turn order:** each round, units act in descending `AGI + d6` (seeded RNG), shown as a
queue on the HUD.

**Action Points (AP):**

- A unit gains **+40 AP** at the start of its turn (cap 100). Unspent AP carries over, so
  waiting is a real choice.
- Moving costs AP per tile by terrain: Road 3 · Plain 4 · Field/Scrub 5 · Rubble 8 ·
  Shallows 10. Climbing costs +4 per height step. MOV caps tiles per turn.
- An attack costs the weapon's AP (sword 25, lance 30, arquebus 35, bombard 50).
- Reactions cost AP too (see below), so an exhausted unit is vulnerable.

**Fatigue Points (FP):**

- Every attack adds fatigue (weapon-dependent, +10 to +25), and so do reactions (Avoid +10,
  Counter = weapon fatigue).
- FP ≥ 50 (_Tired_): −10% hit and −10% evade. FP 100 (_Spent_): the unit must rest
  next turn.
- FP recovers 15 per turn, or 35 if the unit ends its turn with **Rest** (no action).

**Defender reactions** (chosen by the defender; the AI picks for enemies):

| Reaction    | Cost                  | Effect                                                                            |
| ----------- | --------------------- | --------------------------------------------------------------------------------- |
| **Defend**  | free                  | Always hit, damage ×0.5                                                           |
| **Avoid**   | 10 AP, +10 FP         | The hit rolls at the normal chance; if it lands, full damage                      |
| **Counter** | weapon AP + weapon FP | The hit rolls at +15% (you are not dodging); if you survive, you strike back once |

Only reactions the defender can afford are offered. Units start a battle with 20 AP, so a unit
that hasn't had its first turn can only Defend or Avoid. A Spent unit (FP 100) can only Defend.
Attackers turn to face their target, and a defender that survives turns to face its attacker.

**Hit chance** = clamp(5, 95):
`weapon.acc + SKL×2 − target.AGI×2 + heightDiff×5 + facingBonus + assist − terrain.avoid − fatiguePenalties`

- Facing bonus: front 0, side +10, rear +25. Rear hits also deal ×1.25 damage.
- **Assist:** +5% for each ally adjacent to the target and able to act, up to +15%.

**Damage** = `max(1, (weapon.pow + STR) × heightMult × facingMult × reactionMult − ARM)`,
where heightMult is 1 + 0.1 per step above the target (max +0.3).

**Terrain label** in the HUD corner uses the format `<height>H <avoid>% <name>`
(e.g. `1H 5% Plain`).

**Victory conditions** per map: rout, defeat leader, hold N turns, escort, reach tile,
destroy object (siege gun, powder store).

**AI:** utility-based scoring (expected damage, kill chance, risk from exposure, objective
value), with a tuning profile per unit (aggressive / defensive / objective). It stays
deterministic given the RNG seed.

### 2.3 Units — all Armature

Every combatant is a **pilot + Armatura** pair, as in the reference game.

- **Pilot:** has a level, growth stats (STR/SKL/AGI), skills, affinity and a portrait.
- **Frame:** sets base HP/ARM/MOV, weight class, weapon types and 2 gear slots.
- Pilots can switch frames between battles (the Prep screen), within their faction's
  unlocked frames.

| Side             | Frames (weight · role)                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Order of St John | _Cavaliere_ (medium · sword/shield, all-rounder), _Bastiun_ (heavy · tower shield, high ARM), _Lanza_ (medium · reach 2), _Kaptan_ (medium · command aura boosts assist) |
| Maltese militia  | _Ħaddiem_ (light · cheap, fast repair), _Moschetta_ (light · arquebus, range 3–5), _Artiġjan_ (light · repairs allies)                                                   |
| Ottoman army     | _Yeniçeri_ (medium · balanced, tüfek), _Sipahi_ (light · high MOV, lance), _Humbaracı_ (medium · grenade arc over walls)                                                 |
| Corsair fleet    | _Levend_ (light · skirmisher, boarding hooks), _Reis_ (medium · command, cutlass)                                                                                        |
| Scala (villain)  | _Prototipo_ series: experimental, unstable (they may overheat), powerful                                                                                                 |

Siege cannon, walls, gates, powder stores and boats appear on maps as **objects** (they can
be destroyed or captured, and they block or give cover), not as units.

**Lore:** the Armature were invented c. 1550 by Vittorio Scala and sold to both the Order
and the Porte. Only a few hundred exist, so each one is precious and named. This explains
why battles are small squad actions inside the larger siege.

### 2.4 Cinematic close-up

When an attack resolves, the screen cuts to a side-on stage showing both combatants, a
terrain-matched backdrop, portraits and a bark for each (e.g. attacker "For Birgu!" /
defender line). It shows the hit/miss/counter animation, damage numbers and HP bars.
The player can **skip it, speed it up (×2/×4), or turn it off**, and it is always
skippable on tap.

### 2.5 Progression

- **XP during battle:** every hit earns XP, and the blow that defeats a unit earns much more (base
  10 and 40). XP scales with the level gap: ×(1 + 0.2 × (target level − attacker level)), limited
  to ×0.1–×3. So beating stronger enemies is rewarded and farming weak ones isn't. Only the
  player's side earns XP.
- **Levels:** always 100 XP per level; leftover XP carries over. Each level-up happens the moment
  it's earned, mid-battle. It gives +3 max HP and **3 stat points the player assigns** to STR,
  SKL or AGI (AI-controlled allies spend theirs automatically). Unspent points can be saved and
  spent later on the results or preparation screen.
- **Techniques:** each frame faction (Order, militia, Ottoman, corsair, Scala) has its own list of
  attacks (`packages/content/data/attacks.json`, 46 in total). What a pilot can learn depends on
  the weapon type and frame weight class; when they can use it depends on stat requirements.
  Techniques vary power, accuracy, AP/FP cost and range, and add effects: multiple hits, armour
  pierce, fatigue or AP damage to the target, and blocking counters.
- Equipment shop between chapters, using _scudi_ (currency).
- **Affinity:** hidden relationship values changed by dialogue choices; they gate scenes, routes
  and ending variations.

### 2.6 Controls

| Input                        | Action                      |
| ---------------------------- | --------------------------- |
| Tap                          | select / confirm            |
| Drag                         | pan                         |
| Pinch                        | zoom                        |
| Two-finger twist or ⟲ button | rotate 90°                  |
| Long-press                   | unit/terrain info           |
| Undo button                  | undo movement before acting |

Mouse/keyboard and gamepad (Steam Deck) map to the same abstract input actions.

### 2.7 Accessibility

Text size options, colour-blind-safe tile highlights (pattern plus colour), battle-speed
and close-up toggles, full remappable controls on PC, no time pressure.

---

## 3. Narrative

### 3.1 Tone & sensitivity guidelines

- Grounded, human-scale war story. Heroism and cost on **both** sides.
- Ottoman characters get full inner lives, motives and a playable route. No
  caricature, no religious mockery.
- Historical figures appear as supporting characters, and their known actions are
  respected. The main cast and the Armature are fictional additions.
- Violence is PEGI 12 / ESRB T level: no gore.
- Dates and events are checked against sources before content lock (see §9).

### 3.2 Setting & timeline anchors (to verify)

| Date (1565)   | Event                                                                   | Game use            |
| ------------- | ----------------------------------------------------------------------- | ------------------- |
| 18 May        | Ottoman fleet sighted; landing at Marsaxlokk                            | Prologue            |
| late May      | Wells at Marsa poisoned by defenders; Ottoman camp at Marsa             | Ch. 1               |
| 24 May–23 Jun | Siege and fall of Fort St Elmo; Turgut Reis mortally wounded            | Act I climax        |
| early Jul     | _Piccolo Soccorso_ reinforcements slip into Birgu                       | Act II opener       |
| 15 Jul        | Assault on Senglea (incl. boat attack on the palisade)                  | Act II              |
| 7 Aug         | Great assault; Mdina cavalry raid on the Marsa camp forces a withdrawal | Route branch climax |
| Aug           | Mines and siege tower at Birgu/Castile bastion                          | Act III             |
| 7–8 Sep       | _Gran Soccorso_ lands at Mellieħa; siege lifted (8 Sep, _Il-Vittorja_)  | Finale              |

### 3.3 Cast & backstory (story bible draft)

**The secret** (revealed across Act I):
In 1541 the young knight Jean de Valette was captured at sea and served about a year as an
Ottoman galley slave _(historical, verify details)_. **Fictional addition:** while in
captivity he met **Leyla Hatun**, a concubine in a corsair captain's household. She
secretly claims descent from **Şehzade Cem**, the Ottoman prince who was himself once a
captive of the Knights of St John. Their son was born in 1542, after Valette was ransomed.
Leyla feared what either side would do to a child of both bloodlines. She gave the baby
to **Pawlu Falzon**, a Maltese galley slave freed in the same exchange, with a half-token:
half of a broken medallion bearing the Order's cross on one face and Cem's tughra-style
seal on the other.

**Main cast**

- **Ninu Falzon** (23) — the protagonist, raised as a peasant farmer and fisherman in
  Żejtun. Proud, quick-tempered and desperate to prove himself. He doesn't know his parentage. He carries the half-medallion
  without understanding it, and he bonds unusually well with a salvaged Armatura.
- **Pawlu Falzon** (60s) — adoptive father. A former galley slave who knows the truth
  and is sworn to silence. He is killed or captured in the prologue, which sets Ninu off.
- **Jean de Valette** (70) — Grand Master (historical). He knows who Ninu is, and has
  watched from afar for twenty years, bound by his vows and his office. The story is built
  around the question of whether he will ever acknowledge his son.
- **Leyla Hatun** (40s) — Ninu's mother (fictional). She sails with the Ottoman fleet
  in a pasha's household and holds the other half of the medallion.
- **Deniz** (19) — Leyla's later son by the corsair captain, so Ninu's **half-brother**. A
  navigator under Turgut Reis and protagonist of the **Ottoman side-story**. Loyal,
  idealistic, and unaware of the brother he has.
- **Kateri Borg** (22) — clockmaker's daughter from Mdina and Armatura mechanic.
  Pragmatic, wry, and Ninu's closest friend or romance option.
- **Fra Luis de Arrieta** (40s) — Aragonese knight and Ninu's reluctant mentor, secretly
  tasked by Valette to protect him.
- **Vittorio Scala** (50s) — Genoese inventor of the Armature, who sells them to both
  sides. He learns Ninu's secret and wants him as a **pretender**: a puppet with a claim
  that could split both the Order and the Ottoman court. He is the main antagonist on
  every route.
- **Supporting historical figures:** Mustafa Pasha, Piali Pasha, Turgut Reis, Hasan Pasha,
  García de Toledo, Vincenzo Anastagi (Mdina cavalry), and Francesco Balbi di Correggio
  (arquebusier-chronicler; frames chapters as a narrator).

**Sensitivity note:** Valette's affair and Leyla's lineage are clearly labelled as fiction
in the game's historical notes screen.

### 3.4 Structure

```
Prologue ─ Act I: St Elmo (secret revealed) ─┬─ Route A "Cross"     embrace the knightly blood; defend Birgu        → Ending: Victory Day
                                             ├─ Route B "Island"    reject both thrones; fight with Mdina & militia → Ending: Son of Malta
                                             └─ Route C "Crescent"  Ottoman side-story: play as Deniz and Leyla's   → Ending: Two Halves
                                                                    household; the brothers finally meet            (medallion rejoined)
```

- The branch is chosen when St Elmo falls, by an explicit choice plus the affinity and
  flags the player has built up.
- The Ottoman side-story also appears as **interlude chapters** in Routes A and B (short
  Deniz battles). Route C is the full version.
- Size target: ~36 battles total. Shared prologue and Act I: 10. Routes: ~9 each.
  Plus optional skirmishes.
- New Game+ carries levels over and unlocks the other routes' start points.

### 3.5 Vertical slice content (5 battles)

| #   | Scene / battle                                                                                                        | Teaches                                               |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| P0  | Story: Żejtun hilltop at dawn. Ninu argues with Pawlu about joining the militia; sails appear off Marsaxlokk (18 May) | dialogue, choices                                     |
| B1  | **Shore of Marsaxlokk** — Ninu's militia Ħaddiem screen fleeing villagers                                             | move, attack, terrain label                           |
| P1  | Story: Pawlu is taken; Kateri's workshop; the salvaged Armatura wakes for Ninu                                        | party, frames, loadout                                |
| B2  | **Wells of Marsa** — hold the wells while engineers work                                                              | reactions (Defend/Avoid/Counter), AP/FP, hold-N-turns |
| B3  | **Sciberras Ridge** — Fra Luis leads a scouting sortie against the gun lines                                          | height, facing, assist                                |
| B4  | **Night Crossing to St Elmo** — escort boats across the harbour under fire                                            | escort objective, close-ups                           |
| P2  | Story: Valette sees the half-medallion and says nothing. Switch perspective →                                         | —                                                     |
| B5  | **Guns of Tigné** _(Ottoman side-story)_ — as Deniz, protect Turgut Reis's new battery from a Maltese raid            | playing the other side, protect-object objective      |
| P3  | Story: across the harbour, Leyla holds the other half of the medallion. "To be continued"                             | branching flags / save                                |

---

## 4. Presentation

- **Camera:** orthographic isometric, 4 fixed rotations, zoom 3 levels; smooth tweens.
- **Terrain:** a height-map grid merged into one mesh per map (plus instanced props:
  walls, rubble, palms, prickly pear, carob trees, bastion blocks). The material palette is
  Maltese limestone, garigue scrub, terraced fields, sea.
- **Sprites:** 2 drawn facings (front-¾, back-¾), mirrored to make 4. Atlas-packed.
  Idle/walk/attack/hit/KO.
- **UI:** a DOM overlay for crisp text, accessibility and i18n, styled with a 16th-century
  printed-page / illuminated look (blackletter headings, parchment panels).
  Portrait dialogue box at the bottom.
- **Audio:** Howler.js; music layers (calm/tense/battle); SFX bus; volume sliders. Styled
  on Mediterranean renaissance and Ottoman _mehter_ instrumentation (commission later).
- **Placeholders:** coloured prisms plus generated label sprites, silhouette portraits,
  CC0 SFX. All referenced by ID through `assets/manifest.json`.

---

## 5. Technical architecture

### 5.1 Stack

| Concern                | Choice                                                                          | Why                                                            |
| ---------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Language               | TypeScript (strict)                                                             | One language everywhere, and type safety for rules/data        |
| Package mgr / monorepo | pnpm workspaces                                                                 | Fast, strict, simple                                           |
| Bundler / dev server   | Vite                                                                            | Fast HMR, first-class PWA plugin                               |
| 3D rendering           | Three.js                                                                        | Mature, small, excellent mobile WebGL2 support                 |
| UI overlay             | Preact + @preact/signals                                                        | Tiny (~4 KB); components for menus/HUD/dialogue                |
| Rules                  | `@m1565/core`: pure TS, no DOM                                                  | Headless tests, AI sims, reusable anywhere                     |
| Data validation        | Zod schemas                                                                     | Content errors caught at build time                            |
| Branching dialogue     | **Ink** (inkjs)                                                                 | Industry standard; writers use the free Inky editor            |
| Maps                   | **Tiled** (.tmj) → importer → JSON                                              | Standard editor; layers for height/terrain/spawns/triggers     |
| Audio                  | Howler.js                                                                       | Handles mobile audio unlock quirks                             |
| i18n                   | i18next (+ Ink string tables)                                                   | Standard, plural/format support                                |
| Storage                | Platform adapter (IndexedDB / Capacitor Filesystem / Electron fs + Steam Cloud) | One API, per-platform backends                                 |
| PWA                    | vite-plugin-pwa (Workbox)                                                       | Offline play, installable                                      |
| Mobile stores          | Capacitor 7                                                                     | Wraps the same web build; native plugins for purchases/haptics |
| Steam                  | Electron + steamworks.js                                                        | Achievements, cloud saves, overlay; Steam Deck                 |
| Unit tests             | Vitest                                                                          | Fast; shares Vite config                                       |
| E2E / visual           | Playwright (mobile viewports, screenshots)                                      | Real browser checks in CI                                      |
| Lint/format            | ESLint (typescript-eslint) + Prettier                                           | Standard                                                       |
| CI/CD                  | GitHub Actions                                                                  | Test, build, deploy web preview per PR                         |
| Web hosting            | GitHub Pages (upgrade path to Cloudflare Pages / itch.io)                       | Free, automatic                                                |

### 5.2 Repository layout

```
/
├─ apps/
│  ├─ game/                # Vite web client (+ capacitor.config.ts, android/, ios/)
│  │  ├─ src/
│  │  │  ├─ render/        # Three.js: terrain, sprites, camera, effects
│  │  │  ├─ ui/            # Preact components: HUD, menus, dialogue, close-up
│  │  │  ├─ scenes/        # Title, Story, Prep, Battle, Results controllers
│  │  │  ├─ input/         # touch/mouse/keyboard/gamepad → abstract actions
│  │  │  ├─ platform/      # storage, purchases, achievements adapters
│  │  │  └─ main.ts
│  │  └─ public/assets/    # built atlases, audio, portraits
│  └─ desktop/             # Electron shell + steamworks.js bridge
├─ packages/
│  ├─ core/                # rules engine (no DOM): state, commands, combat, AI, RNG
│  └─ content/             # zod schemas + data: units, weapons, frames, maps, ink stories, i18n
├─ tools/
│  ├─ tiled-import/        # .tmj → validated map JSON
│  ├─ atlas/               # sprite packing
│  └─ balance-sim/         # AI-vs-AI batch runs → win-rate/turn-count reports
├─ assets/                 # source art/audio (+ CREDITS.md licence registry)
├─ docs/                   # this plan, design notes, ADRs, store checklists
└─ .github/workflows/
```

### 5.3 Core engine design (`@m1565/core`)

- **State:** plain serializable objects (`BattleState`, `CampaignState`). Never mutated
  directly.
- **Commands → events:** the UI/AI send commands (`Move`, `Attack`, `React`, `Rest`,
  `EndTurn`). The reducer validates them and emits events (`UnitMoved`, `AttackResolved{hit,
dmg, reaction}` …). The renderer only **plays events**, so the logic never waits on
  animation.
- **Deterministic seeded RNG** stored in the state. That enables replays, reproducible bug
  reports, and undo-before-commit.
- **Save format:** versioned JSON snapshot plus migrations (`saveVersion`), so old saves keep
  working after updates.
- **Pathfinding:** Dijkstra over AP cost with height/terrain rules. Range calculations use
  line-of-sight for firearms.
- **Tests:** ≥90% coverage on core. Golden-file tests for combat formulas. Property tests
  (fast-check) check invariants (HP never < 0, AP within bounds, deterministic replays).

### 5.4 Content pipeline

1. Designers edit **Tiled** maps, **Ink** scripts and **YAML/JSON** unit tables.
2. `pnpm content:build` imports Tiled, compiles Ink, validates everything with Zod, and
   checks cross-references (unknown unit ID → error).
3. Output goes to typed JSON consumed by the game. `pnpm dev` hot-reloads content.
4. A dev-only **debug overlay** offers a jump-to-battle, god mode and RNG seed display.

### 5.5 Performance budgets (mid-range Android, e.g. Pixel 6a / iPhone 11)

- 60 fps battle view; ≤ 100 draw calls; ≤ 150 MB RAM.
- Initial web download for the slice ≤ 15 MB; lazy-load later chapters.
- Texture atlases ≤ 2048². Terrain is a single merged mesh; props are instanced.
- DPR capped at 2. Render-on-demand when idle, to save battery.

### 5.6 Quality gates (CI on every push / PR)

`lint → typecheck → unit tests → content validation → build → Playwright smoke
(360×800 landscape, 1280×800 Deck, 1920×1080)` plus a web preview deploy. Balance sim
runs nightly.

---

## 6. Platform & release

| Platform                | Packaging                   | Notes                                                                                                                                           |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Web / PWA               | Vite build → GitHub Pages   | Manifest `orientation: landscape`; offline cache; "rotate your phone" overlay in portrait                                                       |
| Android                 | Capacitor → AAB             | Play Console, target current API level; AdMob later                                                                                             |
| iOS                     | Capacitor → Xcode archive   | Needs macOS: GitHub macOS runner or Codemagic; AdMob plus App Tracking Transparency prompt later                                                |
| Steam (Win/macOS/Linux) | Electron + electron-builder | steamworks.js: achievements, cloud saves; Steam Deck Verified checklist (gamepad, 1280×800, on-screen keyboard). **Likely ad-free** (see below) |

### 6.1 Free + ads plan (implemented later, designed now)

- **Now:** an `AdsAdapter` interface with a no-op implementation. The game calls
  `ads.maybeShowInterstitial('chapter_end')` at defined break points. There are no SDKs
  and no tracking.
- **Placements:** an interstitial between chapters (at most one every ~15 minutes), and
  optional **rewarded** ads (e.g. bonus _scudi_ or a free retry). Never during a battle or
  a story scene, and never forced before gameplay.
- **Mobile:** Google AdMob via a Capacitor plugin, with Google UMP consent (GDPR/UK),
  Apple ATT on iOS, and a matching privacy policy and store data-safety forms.
- **Web:** a web game ad network or portals (e.g. CrazyGames/Poki SDKs, which also bring
  traffic), or AdSense for games. Decided at M8.
- **Steam:** Steam's rules are restrictive about in-game advertising, so the Steam build
  will most likely be free and ad-free, or have an optional paid "Supporter Pack". This
  gets checked against the current Steamworks policy at M8.
- **Option:** a one-time "Remove ads" purchase on mobile.

**Store checklist items:** privacy policy (covering ad SDK data once ads are added), age
ratings (IARC / PEGI 12), screenshots per device class, trailer, store copy, credits,
support contact, and licence audit of `CREDITS.md`.

---

## 7. Milestones

Each milestone ends with a playable build on the web preview, and CI green.

| M      | Name               | Deliverables                                                                                                                       | Exit criteria                                                                                          |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **M0** | Foundations        | Monorepo, TS/ESLint/Prettier, Vitest, Playwright, CI, PWA shell deployed, CLAUDE.md contributor guide                              | ✅ Done 2026-09-29                                                                                     |
| **M1** | Rules core         | Grid, terrain, pathfinding, AP/FP/HP, reactions, hit/damage, turn order, victory checks, AI v1, save/load                          | ✅ Done 2026-09-29 (97% line coverage; 30-seed AI-vs-AI sim)                                           |
| **M2** | Battle renderer    | Terrain mesh, billboards, camera (pan/zoom/rotate), tile highlights, touch input                                                   | ✅ Done                                                                                                |
| **M3** | Battle UX          | Action menu, combat forecast panel, reaction choice, close-up scene, damage FX, turn queue, results                                | ✅ Done                                                                                                |
| **M4** | Story engine       | Ink integration, diorama scenes, portrait dialogue box, choices/flags/affinity, chapter flow, title/save menus                     | ✅ Done                                                                                                |
| **M5** | **Vertical slice** | P0–P3 + B1–B5 content (incl. the first Ottoman side-story battle), tutorial prompts, audio placeholders, settings, i18n extraction | ✅ Done                                                                                                |
| M6     | Progression        | Levels, skills, shop, Armatura customization, recruitable units, balance-sim tuning                                                | ✅ Done (levels, loadouts, shop; skills still to do)                                                   |
| M7     | Campaign           | Routes A/B/C, endings, NG+                                                                                                         | ✅ Done (24 battles, 3 routes, 3 endings)                                                              |
| M8     | Platform shells    | Capacitor Android/iOS, Electron/Steam, ads + consent, achievements, cloud saves                                                    | 🟡 Shells built (Capacitor Android/iOS, Electron + Steam achievements); store accounts and ads pending |
| M9     | Polish & launch    | Final art/audio integration, localization, accessibility pass, performance pass, store assets                                      | 🟡 Placeholder audio, help, settings done; final art/audio, gamepad and store assets pending           |

Status (2026-09-30): M0–M7 complete. The whole campaign is playable on web and mobile browsers; native shells are in place. See `docs/RELEASE.md` for store steps.

---

## 8. Ways of working

- **Branching:** feature branches → PR → CI green → merge. Conventional commits.
- **ADRs:** significant technical decisions are recorded in `docs/adr/NNNN-title.md`.
- **Definition of done:** tests written, content validated, runs on the mobile viewport,
  no new lint errors, docs updated.
- **Maintainability:** rules never import rendering, content is data rather than code, all
  platform differences sit behind `platform/` adapters, and there are no magic numbers
  (tuning lives in `content/balance.json`).

---

## 9. Risks & mitigations

| Risk                                                                | Impact | Mitigation                                                                                                                                           |
| ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Final art cost/time (portraits, sprites, backdrops)                 | High   | Placeholder-first pipeline; fixed sprite spec (size, frames, facings) so an artist or AI-assisted workflow can drop assets in; budget decision at M5 |
| iOS builds need macOS                                               | Med    | Hosted macOS CI (GitHub/Codemagic)                                                                                                                   |
| Mobile WebGL performance variance                                   | Med    | Budgets above, render-on-demand, quality presets, early device testing at M2                                                                         |
| Historical/cultural accuracy                                        | Med    | Source list in `docs/history.md`; review by a Maltese history enthusiast before content lock                                                         |
| Scope creep (36 battles)                                            | High   | Slice-first; each route is a separately shippable content pack                                                                                       |
| Ad SDKs add privacy/consent obligations and can hurt the experience | Med    | Adapter stub until M8; consent flow; strict placement rules (§6.1)                                                                                   |
| Store rejection for similarity to an existing game                  | Med    | §1 originality policy; original names/art/UI                                                                                                         |
| Save compatibility across updates                                   | Med    | Versioned saves + migration tests                                                                                                                    |

---

## 10. Open items for later (no answer needed now)

- Composer/artist selection · ad network choice · whether to add voice barks ·
  community/Discord.

---

## 11. Title shortlist

| Title                                | Angle                                                       |
| ------------------------------------ | ----------------------------------------------------------- |
| **Blood of Two Banners: Malta 1565** | Ninu's double lineage; cross and crescent                   |
| **The Grand Master's Son**           | The central secret. Strong hook, spoiler-light              |
| **Half-Moon & Cross**                | The broken medallion                                        |
| **Heir of the Siege**                | Simple, searchable                                          |
| **Il-Bastard: 1565**                 | Maltese flavour; blunt (might trouble store rating filters) |
| **Armatura: The Great Siege**        | Leads with the mechs and the genre                          |
| **Sons of St Elmo**                  | Brotherhood, the Ninu/Deniz half-brothers                   |
| **1565: The Broken Medallion**       | Mystery-led                                                 |

**Chosen: Armatura 1565.**
