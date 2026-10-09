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

**Stats per unit:** HP, AP (0–100), FP (0–100), MOV (tiles), weapon, charm and
amulet, plus the six classic pilot attributes (each 0–32). Gear bonuses add on top of the pilot's
own values, still capped at 32. Armaturas have **no armour value**: every armatura gives BAS, DEF
and WEP (9–12 points in all), heavy ones leaning on DEF and BAS, light ones on AGL and DEX.

| Attribute | Effect                                       |
| --------- | -------------------------------------------- |
| **BAS**   | Base: +4 max HP per point                    |
| **POW**   | Power: damage of every attack                |
| **DEX**   | Dexterity: +2% hit chance per point          |
| **AGL**   | Agility: −2% to be hit per point; turn order |
| **DEF**   | Defence: −1.5 damage taken per point         |
| **WEP**   | Weapon skill: damage, like POW               |

**Max HP** = level × 2 + BAS × 4 + 10 + armatura HP.

**Turn order:** each round, units act in descending `AGL + d6` (seeded RNG), shown as a
queue on the HUD.

**Action Points (AP):**

This section follows the classic Vanguard Bandits framework (see §1: mechanics, not assets).

- Every turn starts with a **full 100 AP**.
- Moving costs AP per tile by terrain: Road 6 · Plain 8 · Field/Scrub 10 · Sand 12 · Ruin 14 ·
  Rubble 16 · Shallows 20. Climbing costs +6 per height step. MOV caps tiles per turn.
- Attacks cost AP and FP by power, and stronger attacks are less accurate (one formula for
  every technique, with p = power × hits − 1): **AP = 30 + 50p** (min 20, rounded to 5),
  **FP = 5 + 45p** (min 5; +20 for shot, volley and throw techniques), **accuracy = −60p %** (max +20%).
- Reactions never cost AP; they cost FP (see below).
- The unit card previews every cost before you commit: tapping a tile shows the route and the
  AP it will take (tap again to move), and picking a technique shows its AP and FP.

**Starter attacks** (every pilot, no requirements; faction techniques come on top):

| Weapon    | Attack 1                                 | Attack 2                                            |
| --------- | ---------------------------------------- | --------------------------------------------------- |
| Blade     | Slash ×0.8, +12%, 20 AP, 5 FP            | Thrust ×1.0, ±0, 30 AP, 5 FP                        |
| Polearm   | Thrust ×1.0, ±0, 30 AP                   | Long Thrust ×1.0, −20%, 35 AP, reach 1–2            |
| Blunt     | Bash ×0.8, +12%, 20 AP                   | Smash ×1.0, ±0, 30 AP                               |
| Firearm   | Fire ×1.0, gun range, weapon's AP, 25 FP | Stock Strike ×0.8, +12%, 20 AP, 5 FP, adjacent only |
| Explosive | Throw ×1.0, weapon range, 25 FP          | Shove ×0.5, +20%, 20 AP, adjacent only              |

**Fatigue Points (FP):**

- Your own attacks add their FP (5 for starters, more for stronger techniques). Reacting is what
  tires a pilot most; **Attack back** pays the chosen technique's AP and FP, all as FP (Slash: 25).
- **Recovery:** at the end of a turn, every 3 AP left unspent removes 2 FP. A
  turn spent waiting clears 66 FP. There is no other recovery.
- FP ≥ 50 (_Tired_): −10% hit and −10% evade. FP 100: the pilot **faints**: it can't move,
  attack or react, and must pass its turn (which recovers 66).

**Defender reactions** (chosen by the defender; the AI picks for enemies):

| Reaction        | Cost                     | Effect                                                                                                                                                                                                                         |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Defend**      | +30 FP                   | Always hit, damage ×0.5                                                                                                                                                                                                        |
| **Avoid**       | +20 FP                   | The hit rolls at the normal chance; if it lands, full damage                                                                                                                                                                   |
| **Attack back** | technique AP + FP, as FP | Take the hit (+15% to be hit); if you survive, strike back with a technique you choose that reaches (all its hits and effects apply). Only techniques that keep FP ≤ 100 are offered; the AI strikes back with its main attack |
| **Counter**     | +20 FP                   | A gamble: chance = 10% + 1% × ((your DEX + AGL) − (attacker DEX + AGL)), clamped 5–35%. Success: you take nothing and the attacker takes 1.25× the incoming damage. Failure: you take 1.25×                                    |
| **Do nothing**  | free                     | Take the hit (+15% to be hit)                                                                                                                                                                                                  |

The reaction menu always appears, listing every reaction; ones that can't be used are greyed out
with the reason. **Direction matters:** from the front, all are offered. From the side: Defend,
Avoid and Attack back. From the **rear** a unit can only Avoid. Techniques that block counters also
block Attack back and Counter. A Spent unit (FP 100) can only Do nothing.
Attackers turn to face their target, and a defender that survives turns to face its attacker.

**Hit chance** = clamp(5, 95):
`65 + technique accuracy + DEX×2 − target AGL×2 + heightDiff×5 + facingBonus + assist − terrain.avoid − fatiguePenalties` (+15 when the target attacks back or does nothing)

- Facing bonus: front 0, side +10, rear +25. Rear hits also deal ×1.25 damage.
- **Assist:** +5% for each ally adjacent to the target and able to act, up to +15%.

**Damage** = `max(1, ((POW + WEP) × 1.6 × technique power × heightMult × facingMult − DEF × 1.5 × (1 − pierce)) × reactionMult)`: DEF comes off first, then Defend halves what is left,
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

- **Pilot:** has a level, the six attributes, affinity and a portrait.
- **Frame:** sets base HP/ARM/MOV, weight class and attribute bonuses; it carries one charm,
  and the pilot wears one amulet. Each frame has its own figure (knight, militia farmer,
  gunner, janissary, sipahi, corsair, Scala machine); Ninu's is white and red with gold trim
  and a half-medallion.
- **Gear is owned, not unlimited.** Fitting an armatura or weapon takes it from the stores;
  spares can be moved between pilots on the Prep screen, which compares every stat before and
  after. Armaturas come only from the story and from salvage after a victory.

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

- **XP during battle** (classic rules): XP comes **only from landing a blow**. A hit earns
  30 + 100 × (damage ÷ target max HP), so more damage earns slightly more, and a defeating blow
  adds 150. Head-on hits earn ×1, side ×0.8, rear ×0.5 (the defeat bonus isn't reduced). XP scales with the level gap:
  ×(1 + 0.2 × (target level − attacker level)), limited to ×0.1–×3. Reactions that don't land
  a blow earn nothing. Only the player's side earns XP.
- **Levels:** 500 XP per level; leftover XP carries over. Each level-up happens the moment it's
  earned, mid-battle, and gives +2 max HP and **3 attribute points the player assigns** (AI
  allies spend theirs on their lowest attribute). Unspent points can be spent later.
- **Techniques:** each frame faction (Order, militia, Ottoman, corsair, Scala) has its own list of
  attacks (`packages/content/data/attacks.json`, 46 in total). What a pilot can learn depends on
  the weapon type and frame weight class; when they can use it depends on stat requirements. Locked techniques are hidden; the
  game announces "New technique learned" when raising a stat unlocks one.
  Techniques vary power, accuracy, AP/FP cost and range, and add effects: multiple hits, armour
  pierce, fatigue or AP damage to the target, and blocking counters.
- **Skills** (ADR 0008): each named pilot has three passive skills of their own, unlocked at
  levels 1, 5 and 10 (`packages/content/data/skills.json`, 30 in all). Each has one modest
  effect, sometimes conditional: more accuracy or damage (from height, from the flank, at range,
  against wounded or light foes), harder to hit, less damage taken, a stronger or cheaper Defend,
  cheaper Avoid or techniques, better Counter odds, a little HP back each turn, faster rest, more
  XP, +1 MOV, +initiative, or +5% hit for adjacent allies. Skills feed the same formulas as
  everything else, so the forecast shows them. The unit sheet and the Training sheet list them,
  locked ones greyed with a padlock and "Unlocks at Lv N"; reaching the level announces
  "New skill".
- **Armoury**, open between every battle: buys and sells weapons, charms and amulets for
  _scudi_ (spares sell for half price). Armaturas are never sold. Battles pay 150 scudi plus
  60 + 15 × level per enemy defeated, and 100 more for losing nobody. Every weapon type has
  three tiers per side (common, fine, masterwork), unlocked as the story goes on along every
  route. The screen is the armourer's workshop (ADR 0005): pilot rail, 3D armatura with its four
  slots, a shelf of item cards, and a before → after comparison for every item.
- **Difficulty and New Game+** (ADR 0007): Squire, Knight (default) and Grand Master scale
  content-built enemies (levels, attributes) and scudi income from `balance.json`; on Squire a
  lost battle keeps its experience, so Retry is free. After any ending, New Game+ restarts the
  story with the company's levels, attributes, gear, stores and scudi, and enemies stronger per
  cycle.
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

Mouse/keyboard and gamepad (Steam Deck) map to the same abstract input actions: a tile cursor
on the battle map, spatial focus in menus, and prompts that follow the last input (ADR 0009;
the full table is on the Controls page of How to play).

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
- **Audio:** two recorded, looping tracks: _Gentle Piano_ outside battle and _Thunderous
  Charge_ in battle, crossfading, streamed then cached (ADR 0004). Sound effects are
  synthesised; generated Maltese-folk themes are the fallback if a track can't load.
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
| M6     | Progression        | Levels, skills, shop, Armatura customization, recruitable units, balance-sim tuning                                                | ✅ Done (levels, loadouts, shop, pilot skills)                                                         |
| M7     | Campaign           | Routes A/B/C, endings, NG+                                                                                                         | ✅ Done (36 battles, 3 routes, 3 endings, NG+, 3 difficulty modes: ADR 0007)                           |
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

## 12. Visual theme

The interface is framed in Maltese motifs (see `apps/game/src/ui/maltese.css`):

- **Madum:** the patterned cement floor tile, behind full-screen pages.
- **Bizzilla:** lace edging along panel tops and dividers.
- **Gallarija:** command lists and menus are drawn as enclosed wooden balconies, with a cornice
  on top and limestone corbels underneath.
- **The Maltese cross** marks selections; **luzzu** paint bands divide titles.

These traditions postdate 1565 (balconies mostly 1600s–1700s, madum 1800s). They are an artistic
frame around the story, not period detail. The battle layout stays in the classic
tactical-RPG arrangement (two forecast panels and a command list).
