# Console readiness (Xbox, PlayStation)

This checklist covers what console certification usually checks, in plain language, and what
the game already does in code. It also lists what still needs a console SDK, devkits or a
porting partner. Microsoft and Sony publish their real requirement lists (Xbox Requirements,
PlayStation TRCs) only to licensed developers under NDA. The themes below are the commonly
known ones, not official requirement IDs or wording. Before submission, check them against the
current official documents.

Design notes: [ADR 0011](adr/0011-console-readiness-saves-lifecycle-trophies.md) (saves,
suspend, controller loss, trophies), [ADR 0009](adr/0009-gamepad-keyboard-and-spatial-focus.md)
(gamepad and focus navigation) and [ADR 0012](adr/0012-ui-string-table.md) (the UI string table;
translating is described in [I18N.md](I18N.md)).

**Key:** ✅ done in code and tested · 🟡 partly done · ⬜ needs the console SDK, a devkit or a
porting partner

## Porting route (undecided)

The game is a web app: TypeScript, Preact and Three.js/WebGL2. Everything platform-specific sits
behind adapters in `apps/game/src/platform/`: storage, lifecycle, achievements, input, audio,
ads and fullscreen. A port can take one of two routes:

- **Keep the web build** inside a console web runtime or app shell, where the platform allows
  one, and write the adapters against that platform's APIs.
- **Hand over to a porting partner**, who wraps or re-hosts the same build. In that case the
  adapters are the integration surface, and `packages/core` (pure, deterministic rules) and
  `packages/content` (data) carry over unchanged.

Either way the work listed as ⬜ below lives in new adapter files, not in game code.

## Checklist

### Profiles and sign-in

| Status | Item                                                                                                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟡     | One local profile today. Saves (`armatura.save.*`), settings and the achievement profile (`armatura.profile.v1`) all go through `platform/storage.ts`. A per-user backend can therefore keep each user's data apart. |
| ⬜     | Sign in at start, show the active user's gamertag or online ID, and handle a user switch or sign-out mid-game: return to the title screen and reload that user's saves.                                              |
| ⬜     | Guest or unsigned users: decide whether they can play and where their data goes.                                                                                                                                     |

### Save data

| Status | Item                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Writes are crash-safe. Each write goes temp copy, verify, backup, then primary. A kill at any moment leaves a whole save, and a damaged save falls back to the previous good copy (`storage.test.ts` tears every write step). |
| ✅     | Progress saves after every meaningful change: each story line and choice, each battle command (the player's and the AI's), Armoury changes, stat points and settings.                                                         |
| ✅     | Saves are versioned with migrations (`campaign/migrate.ts`, `CAMPAIGN_SAVE_VERSION`). Old saves keep loading.                                                                                                                 |
| ✅     | Saves are small JSON, a few KB to tens of KB per slot: four slots plus the profile.                                                                                                                                           |
| ⬜     | A storage backend on the console's save-data API: `KeyValueBackend` + `setStorageBackend`, plus a flush hook via `onFlushStorage`.                                                                                            |
| ⬜     | A "saving, don't turn off" indicator, if the platform requires one, and handling for full storage (writes already return `false`; the menu shows "Could not save").                                                           |
| ⬜     | Cloud saves and roaming between consoles. This is platform-managed; the format is already portable JSON.                                                                                                                      |

### Suspend, resume and quitting

| Status | Item                                                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅     | On suspend (`platform/lifecycle.ts`: page hidden, `pagehide`, `freeze`, Capacitor app state, Electron sleep, lock or minimise) the game saves now, makes the save durable (Electron commits Chromium storage to disk) and pauses audio, CSS animation and the battle AI. |
| ✅     | Resume continues exactly where the player was (`suspend.test.ts`, `e2e/suspend.spec.ts`).                                                                                                                                                                                |
| ✅     | Quitting is safe at any time: Electron flushes storage before quitting, and nothing is ever pending in the game.                                                                                                                                                         |
| ⬜     | Wire the console's suspend, resume and "constrained" notifications to `installLifecycle` (one call each).                                                                                                                                                                |

### Controller

| Status | Item                                                                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | The whole game plays with a controller alone. `e2e/controller-only.spec.ts` goes from the title through New Game, the intro, story and choices to a battle (move, attack, end turn) and its menu with no pointer.                   |
| ✅     | Controller disconnect: if the pad in use goes away, the game pauses with "Controller disconnected". The notice closes on reconnect or any input; the input that closes it is swallowed, and the battle does not advance underneath. |
| 🟡     | Button prompts use Xbox-style glyphs (Ⓐ Ⓑ Ⓧ Ⓨ LB RB). PlayStation needs its own glyph set (cross, circle, square, triangle, L1, R1) via `PAD_GLYPHS` in `platform/input/controls.ts`, chosen by platform.                           |
| ⬜     | Read input from the console SDK, a replacement for `platform/input/gamepad.ts`. It reports the same `PadInput`s and connection events.                                                                                              |
| ⬜     | Pair the active controller with the active user, and handle the system's controller-pairing UI.                                                                                                                                     |
| 🟡     | Remappable controls: the control table is data (`CONTROLS`), but there is no remapping screen yet.                                                                                                                                  |

### Trophies and achievements

| Status | Item                                                                                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | One data-driven registry (`packages/content/data/achievements.json`): 38 entries with stable ids, names, descriptions, a hidden flag and a PlayStation-style grade, including a platinum. |
| ✅     | Unlocks come from game events, not hard-coded ids. Tests prove every entry is earned by playing, with the platinum last.                                                                  |
| ✅     | Unlocks are recorded per device and re-sent to platform backends at start-up and on repeats. Steam unlocks through the Electron shell.                                                    |
| ⬜     | Platform backends via `registerAchievementBackend`: PlayStation trophy ids and a trophy pack, and Xbox achievement ids with a Gamerscore split across the fixed budget for a base game.   |
| ⬜     | Trophy and achievement icons (original art), localised names, and a review of the hidden flags against each platform's spoiler rules.                                                     |

### 10-foot UI (TV distance)

| Status | Item                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 🟡     | Landscape only, buttons ≥44px, safe-area insets, a Large text option and a focus ring that is always drawn with a pad.            |
| ⬜     | TV scaling, a title-safe area and 4K performance are being done separately (TV mode), and need checking on real TVs with devkits. |

### Age ratings and store

| Status | Item                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⬜     | Ratings: IARC covers digital storefronts in many regions. Some regions and physical releases need their own boards (for example ESRB, PEGI, USK, CERO, ClassInd, ACB). Questionnaire themes: historical war violence between mechanised suits, religious conflict told with care (PLAN §3.1), no gambling or loot boxes, no user-generated content, no online interaction. |
| ⬜     | Store assets, privacy policy and support contact (see RELEASE.md).                                                                                                                                                                                                                                                                                                         |

### No ads, no external links, no outside purchases

| Status | Item                                                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | The ads adapter (`platform/ads.ts`) does nothing. Console builds must keep it that way.                                                                                               |
| ✅     | The game has no outbound links, no web purchase flow, no telemetry and no account system.                                                                                             |
| ⬜     | A console build flag that keeps any future link (credits, privacy policy) inside the game as text. The Electron shell opens links in the system browser, which consoles do not allow. |
| ⬜     | Any later DLC or supporter pack goes through the platform store's purchase API only.                                                                                                  |

### Accessibility

| Status | Item                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Never colour alone: shapes, words and pips mark sides, difficulty, the current facing and selections. The owner is colourblind, and every screen follows this rule. |
| ✅     | Text size option, high-contrast map option and reduced-motion support. All dialogue is text, so subtitles are always on, and the speaker is named.                  |
| ✅     | Battle speed option and close-ups that can be turned off. No timed inputs.                                                                                          |
| 🟡     | Screen-reader labels on controls (ARIA). Console narrators need their own text-to-speech APIs.                                                                      |
| ⬜     | Control remapping screen, and a check against each platform's accessibility guidelines (both publish public guides).                                                |

### Other system features

| Status | Item                                                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅     | Fully offline: no network features, chat or user-generated content.                                                                                                                                                 |
| ⬜     | Rich presence or activity cards ("Chapter 6: Three Roads"); the chapter title is already in the session state.                                                                                                      |
| 🟡     | Localisation. English only today, but every UI string goes through one typed table ([ADR 0012](adr/0012-ui-string-table.md), [docs/I18N.md](I18N.md)). Story (Ink) and content data still need per-language tables. |
| ⬜     | Crash and memory budgets measured on devkits.                                                                                                                                                                       |

## Trophy and achievement table

Ids are permanent. The first six were already configured on Steam and must never be renamed.
"Hidden" entries are shown as secret until earned. Grade counts: 1 platinum, 7 gold, 15 silver,
15 bronze (38 in all).

|   # | Id                       | Name                   | Grade    | Hidden | Earned by                                                                                                       | Description                                                           |
| --: | ------------------------ | ---------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
|   1 | `ACH_FIRST_STAND`        | First Stand            | Bronze   | no     | win `b1-marsaxlokk`                                                                                             | Win the battle on the shore of Marsaxlokk.                            |
|   2 | `ACH_NIGHT_CROSSING`     | Across Dark Water      | Bronze   | no     | win `b4-night-crossing`                                                                                         | Hold the quay of St Elmo after the night crossing.                    |
|   3 | `ACH_OTHER_SHORE`        | The Other Shore        | Bronze   | no     | win `b5-tigne`                                                                                                  | Win the battle for the guns of Tigné.                                 |
|   4 | `ACH_KALKARA`            | Moonlit Chapel         | Bronze   | no     | win `b6-kalkara-chapel`                                                                                         | Win the battle at the chapel of Kalkara.                              |
|   5 | `ACH_ADMIRALS_BATTERY`   | Spike the Guns         | Bronze   | no     | win `b8-turgut-battery`                                                                                         | Win the battle at the Admiral's Battery.                              |
|   6 | `ACH_ST_ELMO`            | The Last of St Elmo    | Silver   | no     | win `b9-fall-of-st-elmo`                                                                                        | Win through the fall of St Elmo.                                      |
|   7 | `ACH_CROSS_RELIEF`       | The Little Relief      | Bronze   | no     | win `a1-piccolo-soccorso`                                                                                       | Bring the relief through on the road of the Cross.                    |
|   8 | `ACH_CROSS_BREACH`       | Hold the Breach        | Silver   | yes    | win `a3-castile-breach`                                                                                         | Hold the breach of Castile on the road of the Cross.                  |
|   9 | `ACH_CROSS_LAST_ASSAULT` | Not One Step Back      | Silver   | yes    | win `a8-st-michael`                                                                                             | Break the last assault on the road of the Cross.                      |
|  10 | `ACH_CROSS_FINALE`       | The Abandoned Lines    | Silver   | yes    | win `a9-marsa-lines`                                                                                            | Win the final battle on the road of the Cross.                        |
|  11 | `ACH_ISLAND_ROAD`        | The Road to Mdina      | Bronze   | no     | win `i1-road-to-mdina`                                                                                          | Win the first battle on the road of the Island.                       |
|  12 | `ACH_ISLAND_WALLS`       | The Silent City        | Silver   | yes    | win `i2-mdina-walls`                                                                                            | Hold the walls of Mdina on the road of the Island.                    |
|  13 | `ACH_ISLAND_LANDING`     | Sails from the North   | Silver   | yes    | win `i4-mellieha-landing`                                                                                       | Win the battle at Mellieħa Bay on the road of the Island.             |
|  14 | `ACH_ISLAND_FINALE`      | The Bay of St Paul     | Silver   | yes    | win `i9-st-pauls-bay`                                                                                           | Win the final battle on the road of the Island.                       |
|  15 | `ACH_CRESCENT_CAMP`      | Across the Water       | Bronze   | no     | win `c1-marsa-camp`                                                                                             | Win the first battle on the road of the Crescent.                     |
|  16 | `ACH_CRESCENT_ESCAPE`    | Out of the Lion's Den  | Silver   | yes    | win `c3-pasha-tribunal`                                                                                         | Escape the Pasha's camp on the road of the Crescent.                  |
|  17 | `ACH_CRESCENT_MEDALLION` | The Broken Medallion   | Silver   | yes    | win `c5-broken-medallion`                                                                                       | Win the battle of the broken medallion on the road of the Crescent.   |
|  18 | `ACH_CRESCENT_FINALE`    | The Last Boat          | Silver   | yes    | win `c9-st-pauls-bay`                                                                                           | Win the final battle on the road of the Crescent.                     |
|  19 | `ACH_ENDING_CROSS`       | Under the Cross        | Gold     | yes    | ending `cross`                                                                                                  | Reach the ending of the Cross.                                        |
|  20 | `ACH_ENDING_ISLAND`      | Of the Island          | Gold     | yes    | ending `island`                                                                                                 | Reach the ending of the Island.                                       |
|  21 | `ACH_ENDING_CRESCENT`    | Two Halves             | Gold     | yes    | ending `crescent`                                                                                               | Reach the ending of the Crescent.                                     |
|  22 | `ACH_ALL_ENDINGS`        | Three Roads Walked     | Gold     | no     | all three ending entries earned                                                                                 | Reach all three endings.                                              |
|  23 | `ACH_NEW_GAME_PLUS`      | The Siege Begins Again | Bronze   | no     | New Game+ started                                                                                               | Start New Game+ with a company that reached an ending.                |
|  24 | `ACH_NG_PLUS_ENDING`     | Twice Delivered        | Gold     | no     | any ending in NG+ 1 or later                                                                                    | Reach any ending in New Game+.                                        |
|  25 | `ACH_GM_ST_ELMO`         | Iron Ravelin           | Silver   | no     | win `b9-fall-of-st-elmo` on Grand Master                                                                        | Win through the fall of St Elmo on Grand Master.                      |
|  26 | `ACH_GM_ENDING`          | Grand Master           | Gold     | no     | any ending on Grand Master                                                                                      | Reach any ending on Grand Master.                                     |
|  27 | `ACH_FIRST_SKILL`        | A New Trick            | Bronze   | no     | a pilot reaches their level-5 skill                                                                             | A pilot learns their second skill.                                    |
|  28 | `ACH_THIRD_SKILL`        | Master of the Craft    | Silver   | no     | a pilot reaches their level-10 skill                                                                            | A pilot learns their third skill.                                     |
|  29 | `ACH_FIRST_PURCHASE`     | Coin for the Armourer  | Bronze   | no     | any Armoury purchase                                                                                            | Buy anything at the Armoury.                                          |
|  30 | `ACH_MASTERWORK`         | Masterwork             | Silver   | no     | a masterwork weapon fitted                                                                                      | Fit a pilot with a masterwork weapon.                                 |
|  31 | `ACH_FULL_KIT`           | Charmed and Warded     | Bronze   | no     | a charm and an amulet on one pilot                                                                              | Fit a pilot with both a charm and an amulet.                          |
|  32 | `ACH_TREASURY`           | A Full Coffer          | Bronze   | no     | 5,000 scudi held                                                                                                | Hold 5,000 scudi at once.                                             |
|  33 | `ACH_NO_LOSSES`          | Every Pilot Home       | Bronze   | no     | win any battle with no pilot lost                                                                               | Win a battle without losing a single pilot.                           |
|  34 | `ACH_FINALE_NO_LOSSES`   | Unbroken Company       | Gold     | no     | win `a9-marsa-lines` / `i9-st-pauls-bay` / `c9-st-pauls-bay` with no pilot lost                                 | Win a road's final battle without losing a single pilot.              |
|  35 | `ACH_SWIFT_ROUT`         | Swift as the Galleys   | Silver   | no     | win `b1-marsaxlokk` / `a8-st-michael` / `c2-marsamxett-galleys` / `c6-boat-road` / `i6-zebbug-wells` by round 3 | Win a battle that asks you to rout every enemy by the end of round 3. |
|  36 | `ACH_CODEX_FIRST`        | Student of the Siege   | Bronze   | no     | first historical note read                                                                                      | Open the historical notes and read an entry.                          |
|  37 | `ACH_CODEX_ALL`          | Chronicler             | Silver   | no     | every historical note read                                                                                      | Read every entry in the historical notes.                             |
|  38 | `ACH_PLATINUM`           | Shield of the Island   | Platinum | no     | every other entry earned                                                                                        | Earn every other trophy.                                              |

Every entry is wired to a game event: battle results and endings in `GameSession`, New Game+ at
its start, skills, gear and scudi after battles and in the Armoury, and the codex in
`CodexScreen`. None are manual. The registry tests (`packages/content/test/achievements.test.ts`)
check the data. The playthrough tests (`apps/game/src/campaign/achievements.test.ts`) earn
every entry through the game.

To add one, add an entry to `achievements.json` with a new `ACH_*` id and a trigger. If it needs
a new kind of event, add it to `AchievementEvent`, report it where it happens, and extend both
tests. Never reuse or rename an id.
