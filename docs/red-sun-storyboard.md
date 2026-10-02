# Red Sun: music-video storyboard (draft v1, for review)

Nothing in this document has been built. It replaces the "silhouettes only" plan for the cast. Song time is in seconds
(m:ss), same as `timeline.ts`.

## 1. Cast (assumptions marked ?)

| Portrait | Proposed role | Notes |
|---|---|---|
| Young man, curly hair, pendant | **Ninu**, carries the half-medallion | He looks about 20 but the lyric says "a boy". ? Treat this as Ninu grown into the siege, and use a small child silhouette for flashbacks. |
| Woman, goggles, wrench, apron | **The engineer** (she repairs walls and loads cannons) | Not the mother. ? Name. |
| Old man, straw hat, grey stubble | **The farmer / elder** | ? Name and relation to Ninu (neighbour? father?). |
| Scarred knight, black tabard, chain | **A knight of St John, the veteran on the wall** | ? Name. |
| White-bearded knight, sword | **The Grand Master** (Jean de Valette) | ? Confirm. Commander figure, appears in the big moments. |
| (no portrait) | **Ninu's mother** (died when he was small) | Appears only as a memory: warm, translucent, never a normal "present" character. ? Does the other half of the medallion belong to her? That would be a lore change, so your call. |
| (no portrait) | **The sailor** | Stays a silhouette unless you supply a portrait or reassign a role. |

## 2. Look and techniques (the "music video" part)

All still images; I animate the camera and the graphics, not the faces. I cannot blink or lip-sync a painted portrait.

- **Layered portraits.** Each portrait becomes two layers: the soft-masked figure in front, and the same painting
  blurred, darkened and graded behind it. Moving them at different speeds gives parallax depth.
- **Colour grade** to match the sunset palette (crimson shadows, gold highlights), so the paintings sit in the scene.
- **Cutting on the beat.** Hard cuts and wipes on bar downbeats, whip-pans between faces, flash-frames on strong drum hits.
- **Camera language.** Slow push-ins on verses, speed-ramped punches on choruses, handheld sway, dutch tilts on build-ups.
- **Lens and film.** Anamorphic light streaks off the sun, chromatic aberration on drum hits, film grain, letterbox bars
  that open up for choruses.
- **Typography as design.** Lyric words slam and slide in rhythm on chorus lines (not just fade), still clear of the sun.
- **A livelier world behind everything:** drifting clouds, gulls, ships that sail and sway, waves, ash and ember storms,
  cannon smoke trails, torches flickering.

Honest limits: this is painterly motion graphics, not photoreal film. The portraits are not cutouts, so edges are
feathered, not crisp. Transparent PNGs from you would look better.

## 3. Shot list

**Intro, 0:00 to 0:13 (piano).** Black. Red line becomes the horizon, sun rises, "MALTA, 1565". Add: clouds drifting, one gull.
Last bar: slow push through the sun's glow into verse 1.

**Verse 1, 0:13 to 0:29.** Harbour pan as now, plus **Ninu** in three slow shots, one per pair of lines: close-up
(medallion catches the light) on "Salt on my skin", wide of his silhouette on the quay on "Sails on the water" with the
fleet filling in, and back to close-up on "born underneath this sun". Gentle push-ins, no cuts faster than a bar.

**Pre-chorus 1, 0:29 to 0:41.** Pace doubles. **The engineer** on "So let the cannons roar": cut to her portrait, goggles
flare on each cannon flash, wrench-hand silhouette loads a cannon. Whip-pan back to the wall: cracks spread. Camera
punches in every beat. Last beat: all light cuts out (one bar of near-black), then the drop.

**Chorus 1, 0:41 to 1:09.** Big burst. Letterbox opens. Alternating shots, each held 1 to 2 bars:
**scarred knight** (on "Red sun, rise up"), **Ninu** (on "We won't bow"), wall wide with defenders and names glowing
("Every stone"), **engineer** (on "Every heart here is a flame"), sun swell with shockwave rings ("Red sun, red sun"),
split-screen of knight, engineer and Ninu on "Oh-oh-oh" while the defenders raise arms and banners. Embers on every
drum hit.

**Verse 2, 1:09 to 1:26 (darker, quieter).** Fort St Elmo smoking, torches across the island, water dropping. Portraits
here are slow and heavy: the **farmer** on "Saint Elmo fell", the **scarred knight** (tired) on "Every brother we lost",
Ninu looking at the burning fort on "the summer runs long".

**Pre-chorus 2 and chorus 2, 1:26 to 2:07.** Same structure, more of everything. The **Grand Master** appears for the
first time on "So let the banners burn" as the Maltese cross banners rise. Faster cuts, more whip-pans, bigger
shake. Final bar of chorus 2 is a freeze-frame of all five in a line-up, then a hard cut to the bridge.

**Bridge, 2:07 to 2:41 (quiet, intimate).** One memory per line:
- "A boy on the harbour": **Ninu**, medallion glowing, camera orbits slowly.
- "A knight on the wall": the **scarred knight** looking out over the walls.
- "A mother": a **warm translucent silhouette** of a woman (and a small child silhouette) fading out beside Ninu. This
  is the one emotional beat. No portrait, memory colours (faded gold).
- "A sailor": silhouette, hauling rope against the sun.
- "They can take the shoreline": the **farmer**, then the **engineer**, then the **Grand Master**, three slow close-ups.
- "Hold the line" x 8: the portraits join into a row (Ninu, engineer, farmer, scarred knight, Grand Master). Each
  repeat brings one more face in, brighter, with drums building and the cut rate speeding up until it is on every beat.

**Final chorus, 2:41 to 3:18 (key change).** The biggest moment: sun flares to full screen, gold floods the island,
the walls fill with defenders. The five portraits take turns on the lines, then all five side by side in a hero
line-up around the sun on "we're still standing" (twice). On the final "Under the red sun" the RED SUN title slams in,
then ARMATURA and the medallion.

**Outro, 3:18 to 3:34.** Quiet. Fleet sinks, sun softens to gold. Ninu close-up with the medallion on "September wind is
blowing home", a long wide of the walls on "And we're still here", "7 SEPTEMBER 1565", fade to black on the last note.

## 4. 9:16 version

Same shots, framed for tall: portraits fill the frame instead of sitting beside the sun, and wipes become vertical.
Ninu's portrait is already tall, so he reads best.

## 5. Open questions

1. Who are the other four, by name and role? Is the Grand Master Jean de Valette?
2. Is the mother memory okay, and is the other half of the medallion hers?
3. Should the farmer be Ninu's father/elder, or just a villager?
4. The sailor: silhouette, or give the role to someone else?
5. Tone check: is the fast cut rate in the choruses what you want, or calmer?
6. Can you supply transparent PNG cutouts? If not, I use soft masks.

## 6. Effort

New code is roughly: portrait layer and grade, shot sequencer driven by `timeline.ts`, wipes and glitch transitions,
clouds/gulls/ship motion, typography animation. Preview stills first, then a low-res phone preview, then 16:9 and
9:16 renders (about 1.5 to 2 hours of render time in total).
