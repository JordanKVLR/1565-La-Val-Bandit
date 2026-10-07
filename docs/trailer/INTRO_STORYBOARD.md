# Armatura 1565: opening cinematic, storyboard v1 (for sign-off, nothing rendered)

Decisions locked in from the discussion: skippable, plays inside the game (MP4 export for sharing
only); music _Under the Red Sun_ (227 s); on-screen text only, no voice-over; the double lineage is
hinted, never stated; it ends at dawn on 18 May 1565 and hands off to the Prologue; fully
procedural art, no supplied illustrations; framed as "in this history" so the fiction is honest.

## Look

16th-century engraved print meets modern motion design. Ink black, red sun, gold, parchment, teal
for the Ottoman side. Cinzel for titles, Cormorant Garamond for narration. Everything moves: slow
camera pushes, parallax layers, drifting embers, smoke, gears. No UI, no feature callouts.

## Shot list (seconds; bar boundaries are the measured musical sections)

| Time      | Song                  | Beat                  | On screen                                                                                                                                                                                                                         | Narration text (draft)                                                                                                                       |
| --------- | --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:13 | piano intro           | **Exile**             | Black. A red sun lifts over a still sea. Galleys in silhouette, heads down, sailing away from a burning shoreline.                                                                                                                | "1522. Rhodes falls. / The Knights of St John have no home."                                                                                 |
| 0:13-0:30 | verse 1, quiet        | **A rock in the sea** | 1530: an engraved falcon crosses the frame; Malta rises out of the water, drawn as a map in ink. The rent for the island: "one falcon a year". Forts grow on the harbour (Birgu, Senglea, St Elmo).                               | "1530. An emperor gives them a rock in the middle of the sea. / The rent: one falcon a year."                                                |
| 0:30-0:41 | pre-chorus build      | **The machines**      | Blueprint grid. Gears lock into place; a clockwork war-harness assembles piece by piece beside a human for scale. The shot pulls back: a second harness on the other side of the frame.                                           | "In this history, an inventor builds machines of war. / He sells them to both sides."                                                        |
| 0:41-1:07 | chorus 1, the drop    | **Two empires**       | Wide map of the Mediterranean. Istanbul glows; a river of ships streams west. Cut to Malta: bells, the chain across the harbour. Valette (portrait, 70 years old, from the in-game art) at a window.                              | "Suleiman the Magnificent sends his fleet. / Jean de Valette, Grand Master, sends for every man who can hold a pike."                        |
| 1:07-1:26 | verse 2               | **The people**        | Four portrait vignettes, one per bar pair, each over an animated layered scene: Pawlu in the fields, Kateri at her workbench of gears, Fra Luis on a bastion, Ninu on the Żejtun hill.                                            | "A farmer who remembers the galleys. / A clockmaker's daughter. / A knight with orders he cannot speak. / A boy who wants to prove himself." |
| 1:26-1:37 | pre-chorus 2          | **The secret (hint)** | 1542, night, a harbour in rain: a hooded freed slave takes a bundle from a woman; a medallion is snapped in two. Faces never shown.                                                                                               | "Some secrets are older than the siege."                                                                                                     |
| 1:37-2:08 | chorus 2              | **Two shores**        | Split frame: Maltese forts left, Ottoman camp right. Each side's armour assembles. Two broken medallion halves drift toward each other across the harbour but never meet. Cannon flashes light both sides.                        | "Two armies. Two sides of one harbour. / And two halves of something that was never meant to be broken."                                     |
| 2:08-2:27 | bridge, soft          | **The night before**  | Quiet. Night over Malta: candle-lit chapels, farmers praying, children asleep, fishermen mending nets. Embers rise.                                                                                                               | "Hold the line."                                                                                                                             |
| 2:27-2:34 | drum build, dip       | **Sails**             | Black sea, a thin grey dawn line. One sail. Then twenty. Then a horizon full of them.                                                                                                                                             | "18 May 1565."                                                                                                                               |
| 2:34-3:13 | final chorus, biggest | **Beacons**           | Chain of beacon fires leaps across the hills of Malta (Mdina to the coast), bells ring, militia run to muster, harnesses wake and their gears turn. Fast but readable cutting on the beat. A lone figure runs up the Żejtun hill. | "The island rings its bells. / Four months of siege begin."                                                                                  |
| 3:13-3:34 | outro, piano alone    | **The hilltop**       | Dawn. Slow push toward the Żejtun hilltop, two silhouettes (Ninu, Pawlu) and sails on the horizon. This is the framing of the game's first scene.                                                                                 | (none, silence in the text, only the piano)                                                                                                  |
| 3:34-3:47 | reprise, loud         | **Title**             | The red sun rises; ARMATURA 1565, "The Great Siege of Malta". Hold, then the sun fills the screen and fades to the Prologue chapter card.                                                                                         | (title only)                                                                                                                                 |

## Rules I will follow

- Every text card stays on screen long enough to read (about 3 words/second plus half a second).
- No claim that is false: fiction (machines, lineage) is introduced by "In this history".
- No reveal of Valette's secret, Leyla or Deniz by name.
- Violence stays at PEGI 12 level: silhouettes and light, no gore.
- Uses only assets already licensed in `assets/CREDITS.md`.

## Delivery plan (after you approve this storyboard)

1. Build the cinematic scenes in the same renderer and show you stills of every shot for approval.
2. Render a draft MP4, review it with parallel QA agents (visuals, pacing/facts, music sync), fix.
3. Port the renderer into the game (`apps/game`), add a skippable intro to New Game and a "Watch
   intro" entry in Settings, add an ADR, credits and tests, run `pnpm check` and the e2e smoke test.
4. Export a share-ready MP4.

## Still open (small)

- Where should it play: every New Game (recommended, with a Skip button and "watch once"), or only
  the very first launch?
- Anything you want added or cut from the shot list, or a line you want worded differently?
