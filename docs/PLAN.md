# 1565: La Valette's Bandits — Master Plan

> Status: **Draft for approval** · Owner: Jordan · Last updated: 2026-09-29
>
> An original tactical RPG set during the Great Siege of Malta (May–September 1565),
> inspired by the *gameplay* of the 1998 PS1 tactics genre (isometric height-map
> battles, action/fatigue economy, defender reactions, cinematic close-ups,
> branching story). All story, characters, art, text, music and names are original.

---

## 0. Decisions locked in

| # | Topic | Decision |
|---|-------|----------|
| 1 | Unit fantasy | **Hybrid.** Ordinary 16th-century troops (militia, knights, arquebusiers, janissaries, cannon) plus rare **Armature** — clockwork/spring-and-steam war-harnesses piloted by the main cast. They fill the "big machine" role without breaking the period feel. |
| 2 | Point of view | Protagonist is a young **Maltese militiaman**. A later route follows an **Ottoman co-protagonist**, so both sides are human and three-dimensional. |
| 3 | First build | **Vertical slice**: prologue plus 4 battles, every core system working, playable in a mobile browser. |
| 4 | Stack | **TypeScript + Vite + Three.js**. Rules live in a separate headless package. **Capacitor** wraps the game for iOS/Android, **Electron + steamworks.js** for Steam. |
| 5 | Visuals | 3D height-map terrain with **2D billboard sprites** and a fixed isometric camera that rotates in 90° steps. |
| 6 | Art/audio | Placeholders for now, loaded through a manifest so final assets can drop in without code changes. |
| 7 | Orientation | **Landscape only.** |
| 8 | Languages | English at launch. Every string goes through i18n from day one; Maltese, Italian and Turkish are planned next. |
| 9 | Business | **Free web demo** (prologue + Act I opening). Full game: **paid on Steam** (with demo), **free-to-try + one-time unlock** on iOS/Android. No ads, no loot boxes. |
| 10 | Store accounts | Not needed until milestone M8. |
| 11 | Title | **1565: La Valette's Bandits** (working title). |
| 12 | Plan location | This file. It changes through normal commits. |

---

## 1. Originality & IP policy

The game borrows **mechanics and genre conventions**, which are not protected: grid tactics, action points, reaction choice, height bonuses. It must **not** borrow expression:
no character names, portraits, sprites, maps, dialogue, music, UI art, logos or mech designs
from any existing game. Reference screenshots are for *mood and layout study only* and are
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
- FP ≥ 50 (*Tired*): −10% hit and −10% evade. FP 100 (*Spent*): the unit must rest
  next turn.
- FP recovers 15 per turn, or 35 if the unit ends its turn with **Rest** (no action).

**Defender reactions** (chosen by the defender; the AI picks for enemies):

| Reaction | AP cost | Effect |
|----------|---------|--------|
| **Defend** | 0 | Always hit, damage ×0.5 |
| **Avoid** | 10 | Roll to evade; if hit, full damage |
| **Counter** | weapon AP | Take the hit at full damage, then strike back if alive and in range |

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

### 2.3 Units

**Armature** (hero-piloted, customizable frame + weapon + 2 gear slots):

| Side | Frames |
|------|--------|
| Order / Maltese | *Bastiun* (heavy shield), *Lanza* (reach), *Moschetta* (arquebus), *Kaptan* (command aura, boosts assist), *Artiġjan* (repair) |
| Ottoman | *Yeniçeri* (balanced), *Sipahi* (high MOV), *Humbaracı* (grenade arc), *Levend* (corsair skirmisher) |
| Mercenary (villain) | *Scala* prototypes: experimental, unstable, powerful |

**Line units** (not customizable, simple sprites): Maltese militia, Knight on foot,
Spanish tercio arquebusier, bombard crew, Janissary, Azab levy, Sipahi rider, Algerian corsair.

### 2.4 Cinematic close-up

When an attack resolves, the screen cuts to a side-on stage showing both combatants, a
terrain-matched backdrop, portraits and a bark for each (e.g. attacker "For Birgu!" /
defender line). It shows the hit/miss/counter animation, damage numbers and HP bars.
The player can **skip it, speed it up (×2/×4), or turn it off**, and it is always
skippable on tap.

### 2.5 Progression

- XP from actions; level ups raise stats along a growth curve per frame.
- Skills unlock at levels (e.g. *Shield Wall*, *Grenado*, *Harquebus Volley*, *Rally*).
- Equipment shop between chapters, using *scudi* (currency).
- **Affinity:** hidden relationship values with 5 key characters, changed by dialogue
  choices and battle events (assists, rescues). They gate scenes, recruitable allies and
  route branches.

### 2.6 Controls

| Input | Action |
|-------|--------|
| Tap | select / confirm |
| Drag | pan |
| Pinch | zoom |
| Two-finger twist or ⟲ button | rotate 90° |
| Long-press | unit/terrain info |
| Undo button | undo movement before acting |

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

| Date (1565) | Event | Game use |
|-------------|-------|----------|
| 18 May | Ottoman fleet sighted; landing at Marsaxlokk | Prologue |
| late May | Wells at Marsa poisoned by defenders; Ottoman camp at Marsa | Ch. 1 |
| 24 May–23 Jun | Siege and fall of Fort St Elmo; Turgut Reis mortally wounded | Act I climax |
| early Jul | *Piccolo Soccorso* reinforcements slip into Birgu | Act II opener |
| 15 Jul | Assault on Senglea (incl. boat attack on the palisade) | Act II |
| 7 Aug | Great assault; Mdina cavalry raid on the Marsa camp forces a withdrawal | Route branch climax |
| Aug | Mines and siege tower at Birgu/Castile bastion | Act III |
| 7–8 Sep | *Gran Soccorso* lands at Mellieħa; siege lifted (8 Sep, *Il-Vittorja*) | Finale |

### 3.3 Cast (original)

- **Ninu Falzon** (19) — Birgu fisherman's son and militia volunteer. Protagonist.
  Hot-headed and wants to prove himself. He unexpectedly bonds with a salvaged Armatura.
- **Kateri Borg** (22) — clockmaker's daughter from Mdina who keeps the Armature running.
  Pragmatic and wry.
- **Fra Luis de Arrieta** (40s) — Aragonese knight. Ninu's reluctant mentor; duty
  versus mercy.
- **Deniz** (20) — navigator in Turgut Reis's fleet, captured and freed during the story.
  Co-protagonist of the Crescent route.
- **Vittorio Scala** (50s) — Genoese engineer who invented the Armature and sells them to
  both sides. Profits from the war and wants it to last. Main antagonist across all routes.
- **Supporting historical figures:** Jean de Valette, Mustafa Pasha, Piali Pasha,
  Turgut Reis, Hasan Pasha, García de Toledo, Vincenzo Anastagi (Mdina cavalry), and
  Francesco Balbi di Correggio (arquebusier-chronicler; frames chapters as a narrator).

### 3.4 Structure

```
Prologue (Arrival) ─ Act I: St Elmo ─┬─ Route A "Birgu"    (the Order's defence)   → Ending: Victory Day
                                     ├─ Route B "Mdina"    (cavalry & raids)       → Ending: The Rider's Oath
                                     └─ Route C "Crescent" (Ninu & Deniz vs Scala) → Ending: The Quiet Harbour
```

- The branch is decided at the fall of St Elmo by flags plus affinity (whom you saved,
  which orders you obeyed).
- Size target: ~36 battles total. Shared prologue and Act I: 10. Routes: ~9 each.
  Plus optional skirmishes.
- New Game+ carries levels over and unlocks the other routes' start points.

### 3.5 Vertical slice content

| # | Scene / battle | Teaches |
|---|----------------|---------|
| P0 | Story: fishing boat at dawn, sails on the horizon (Marsaxlokk) | dialogue, choices |
| B1 | **Shore of Marsaxlokk** — militia screen retreating villagers | move, attack, terrain |
| P1 | Story: Kateri's workshop; the salvaged Armatura | party, loadout |
| B2 | **Wells of Marsa** — hold the wells while engineers work | reactions, AP/FP, hold-N-turns |
| B3 | **Sciberras Ridge** — scout Ottoman gun lines | height, facing, assist |
| B4 | **Night Crossing to St Elmo** — escort boats across the harbour under fire | escort objective, close-ups |
| P2 | Story: first choice that sets route-leaning flags; "To be continued" | branching / save |

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
  on Mediterranean renaissance and Ottoman *mehter* instrumentation (commission later).
- **Placeholders:** coloured prisms plus generated label sprites, silhouette portraits,
  CC0 SFX. All referenced by ID through `assets/manifest.json`.

---

## 5. Technical architecture

### 5.1 Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript (strict) | One language everywhere, and type safety for rules/data |
| Package mgr / monorepo | pnpm workspaces | Fast, strict, simple |
| Bundler / dev server | Vite | Fast HMR, first-class PWA plugin |
| 3D rendering | Three.js | Mature, small, excellent mobile WebGL2 support |
| UI overlay | Preact + @preact/signals | Tiny (~4 KB); components for menus/HUD/dialogue |
| Rules | `@lvb/core`: pure TS, no DOM | Headless tests, AI sims, reusable anywhere |
| Data validation | Zod schemas | Content errors caught at build time |
| Branching dialogue | **Ink** (inkjs) | Industry standard; writers use the free Inky editor |
| Maps | **Tiled** (.tmj) → importer → JSON | Standard editor; layers for height/terrain/spawns/triggers |
| Audio | Howler.js | Handles mobile audio unlock quirks |
| i18n | i18next (+ Ink string tables) | Standard, plural/format support |
| Storage | Platform adapter (IndexedDB / Capacitor Filesystem / Electron fs + Steam Cloud) | One API, per-platform backends |
| PWA | vite-plugin-pwa (Workbox) | Offline play, installable |
| Mobile stores | Capacitor 7 | Wraps the same web build; native plugins for purchases/haptics |
| Steam | Electron + steamworks.js | Achievements, cloud saves, overlay; Steam Deck |
| Unit tests | Vitest | Fast; shares Vite config |
| E2E / visual | Playwright (mobile viewports, screenshots) | Real browser checks in CI |
| Lint/format | ESLint (typescript-eslint) + Prettier | Standard |
| CI/CD | GitHub Actions | Test, build, deploy web preview per PR |
| Web hosting | GitHub Pages (upgrade path to Cloudflare Pages / itch.io) | Free, automatic |

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

### 5.3 Core engine design (`@lvb/core`)

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

| Platform | Packaging | Notes |
|----------|-----------|-------|
| Web / PWA | Vite build → GitHub Pages | Manifest `orientation: landscape`; offline cache; "rotate your phone" overlay in portrait |
| Android | Capacitor → AAB | Play Console, target current API level, one-time unlock IAP (Play Billing via plugin) |
| iOS | Capacitor → Xcode archive | Needs macOS: GitHub macOS runner or Codemagic; App Store IAP non-consumable unlock; "Restore purchases" |
| Steam (Win/macOS/Linux) | Electron + electron-builder | steamworks.js: achievements, cloud saves; Steam Deck Verified checklist (gamepad, 1280×800, on-screen keyboard) |

**Store checklist items:** privacy policy (no data collection, no analytics by default),
age ratings (IARC / PEGI 12), screenshots per device class, trailer, store copy, credits,
support contact, and licence audit of `CREDITS.md`.

---

## 7. Milestones

Each milestone ends with a playable build on the web preview, and CI green.

| M | Name | Deliverables | Exit criteria |
|---|------|--------------|---------------|
| **M0** | Foundations | Monorepo, TS/ESLint/Prettier, Vitest, Playwright, CI, PWA shell deployed, CLAUDE.md contributor guide | "Hello Malta" PWA installs on a phone |
| **M1** | Rules core | Grid, terrain, pathfinding, AP/FP/HP, reactions, hit/damage, turn order, victory checks, AI v1, save/load | Headless AI-vs-AI battle completes; ≥90% coverage |
| **M2** | Battle renderer | Terrain mesh, billboards, camera (pan/zoom/rotate), tile highlights, touch input | Move a unit by touch on a phone at 60 fps |
| **M3** | Battle UX | Action menu, combat forecast panel, reaction choice, close-up scene, damage FX, turn queue, results | Full battle playable vs AI with placeholders |
| **M4** | Story engine | Ink integration, diorama scenes, portrait dialogue box, choices/flags/affinity, chapter flow, title/save menus | Prologue scene plays into B1 and saves/resumes |
| **M5** | **Vertical slice** | P0–P2 + B1–B4 content, tutorial prompts, audio placeholders, settings, i18n extraction | External playtest link; feedback round |
| M6 | Progression | Levels, skills, shop, Armatura customization, recruitable units, balance-sim tuning | Act I fully playable |
| M7 | Campaign | Routes A/B/C, endings, NG+ | Content complete |
| M8 | Platform shells | Capacitor Android/iOS, Electron/Steam, purchases, achievements, cloud saves | Internal test tracks: Play internal, TestFlight, Steam beta branch |
| M9 | Polish & launch | Final art/audio integration, localization, accessibility pass, performance pass, store assets | Store submissions |

M0–M5 is the current scope. After M5, we review and re-plan M6+ with playtest data.

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

| Risk | Impact | Mitigation |
|------|--------|------------|
| Final art cost/time (portraits, sprites, backdrops) | High | Placeholder-first pipeline; fixed sprite spec (size, frames, facings) so an artist or AI-assisted workflow can drop assets in; budget decision at M5 |
| iOS builds need macOS | Med | Hosted macOS CI (GitHub/Codemagic) |
| Mobile WebGL performance variance | Med | Budgets above, render-on-demand, quality presets, early device testing at M2 |
| Historical/cultural accuracy | Med | Source list in `docs/history.md`; review by a Maltese history enthusiast before content lock |
| Scope creep (36 battles) | High | Slice-first; each route is a separately shippable content pack |
| Store rejection for similarity to an existing game | Med | §1 originality policy; original names/art/UI |
| Save compatibility across updates | Med | Versioned saves + migration tests |

---

## 10. Open items for later (no answer needed now)

- Final title and logo · composer/artist selection · price points · whether to add
  voice barks · localization vendor · community/Discord.
