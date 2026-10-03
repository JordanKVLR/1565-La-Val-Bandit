# Armatura 1565: opening cinematic, draft v0 (for discussion, nothing rendered yet)

## What I understand you want

- Not a feature trailer. The first thing a player sees: a cinematic that pulls them into the
  world of the Great Siege and the story behind it.
- No UI callouts, no "how it plays", no call to action, no ending on 7 September.
- It ends where the game begins, so the player flows straight into the Prologue.

## Proposed arc (chronological, ~4 min if cut to _Under the Red Sun_)

| # | Beat | Content | Source |
| - | ---- | ------- | ------ |
| 1 | The island | Dark sea, a single red sun. Malta as a bare rock at the edge of two worlds. | invented mood |
| 2 | The wanderers | 1522: Rhodes falls to Suleiman, the Knights of St John sail into exile. 1530: Charles V gives them Malta for one falcon a year. | history |
| 3 | The machines | c. 1550: Vittorio Scala's clockwork Armatura. Sold to the Order and to the Porte. War changes. | PLAN lore |
| 4 | The long shadow | Two sides, one island: Valette (Grand Master) hardens the harbour forts; Suleiman's armada gathers. | history + PLAN |
| 5 | The secret (hinted, not told) | A broken medallion, a baby passed to a freed galley slave. No names, no faces. | PLAN 3.3 |
| 6 | The people | Maltese farmers, fishermen, a clockmaker's daughter, a militia boy. "Not soldiers. Neighbours." | PLAN cast |
| 7 | Sails | 18 May 1565, dawn: sails over Marsaxlokk. Bells. Fires on the hills. | PLAN timeline |
| 8 | Hand-off | Match cut from the sails to the Żejtun hilltop where Ninu argues with Pawlu: the first Prologue scene. Title appears over it. | PLAN P0 |

## What is realistic with my pipeline

- **Strong:** engraved/etched 16th-century print look, animated maps, parallax scenes built from
  layers, sun/sea/ships, gears and machines, kinetic typography, camera moves over still
  paintings, the five portraits, real in-game battlefields as background plates, tight music sync.
- **Weak:** hand-animated characters, realistic faces, crowds, 3D battle scenes. I will not fake
  these. Characters appear as silhouettes, portraits, or as illustrations you supply.
- **Biggest quality lever:** 10 to 15 key illustrations (same AI tool you used for the portraits)
  that I animate with parallax, camera moves, smoke, embers and light. This lifts it from
  "motion graphics" to "cinematic".

## Decisions needed (my recommendation first)

1. **Role and format:** the game's boot cinematic, skippable. _Recommend:_ run it in-engine
   (small, resolution-independent, easy to localise) rather than shipping an ~85 MB MP4 in the app.
   I can still export an MP4 for sharing.
2. **Music:** keep _Under the Red Sun_ (3:47), or something longer or different?
3. **Narration:** on-screen text only, or voice-over? I cannot record a voice. If you provide an
   audio file I will sync to it.
4. **Spoilers:** hint at the double lineage only (recommended), or reveal it?
5. **Ending:** stop at the Żejtun dawn and cut into the Prologue (recommended), or add a
   flash-forward teaser of the whole war first?
6. **Art:** will you supply key illustrations, or should I stay fully procedural?
7. **History vs fiction:** how strictly factual should the opening be? (The Armatura and the
   lineage are fiction; I would label that tone clearly, e.g. "In this history...")
