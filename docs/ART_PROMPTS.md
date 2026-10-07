# Armatura 1565: art brief for Claude Design

This file is a complete, self-contained brief. Upload it as it is and ask:
_"Create every asset in this brief, except the portraits."_

---

## 0. Read this first (instructions for the designer)

### The game

**Armatura 1565** is an original tactical role-playing game set during the Great Siege of Malta
in 1565. It is an alternate history: knights of the Order of St John, Maltese militia, Ottoman
janissaries and corsairs fight inside clockwork-and-steam war-harnesses called **Armature**
(singular _Armatura_). They are 3–4 m tall, with brass ribs, riveted plates, exposed springs
and a small pilot hatch. Everything else is grounded 16th-century Malta: honey-coloured
limestone, terraced fields, dry-stone walls, galleys, bastions, the Grand Harbour.

The game is played mostly on phones held sideways (landscape) and on the Steam Deck. Battles
happen on an isometric 3D map of square tiles. Story scenes play out on small dioramas.

### What to make

Six sets, listed in order of priority. If you have to stop early, finish whole sets in this
order, because sets 1 and 2 are the ones the game uses the moment they arrive.

| #   | Set                                 | Count | Where it appears                        |
| --- | ----------------------------------- | ----- | --------------------------------------- |
| 1   | Terrain textures (tile tops)        | 14    | Every battle map, **used immediately**  |
| 2   | Terrain side textures (cliff faces) | 6     | Every battle map, **used immediately**  |
| 3   | Story backgrounds                   | 9     | Behind the story dioramas               |
| 4   | Duel backdrops                      | 5     | Behind the 3D close-up of each attack   |
| 5   | Title, logo, app icon and store art | 6     | Title screen, home screen, store pages  |
| 6   | Armatura concept sheets (reference) | 16    | Reference for the 3D models (not shown) |
| –   | Character portraits                 | –     | **Already finished. Do not make any.**  |

### Delivery rules (apply to every asset)

1. **One artboard per file**, at the **exact pixel size** listed, named **exactly** as the file
   name in the tables (for example `terrain/plain.png`).
2. **Export as PNG.** The app icon is also wanted as **SVG** (see §5).
3. **No text, letters, numbers, signatures or watermarks** in any image. The only exception is
   the logo (§5).
4. **Transparency:** only where a row says _transparent_. Everything else fills the whole canvas
   edge to edge.
5. **Seamless where stated:** a tile texture must repeat with no visible seam when placed next to
   itself on all four sides (sides: left and right).
6. **No characters** in textures, backgrounds or duel backdrops. Distant, tiny figures on a
   rampart or a ship are fine.
7. Keep every asset **original**. Do not imitate any existing game, studio, artist or brand.

### Visual style

Match the finished character portraits. Each item below is part of the same style:

- **Look:** graphic-novel illustration with **bold, clean black ink outlines**.
- **Colouring:** **muted watercolour-and-gouache shading**, with a little paper grain.
- **Light:** warm Mediterranean light.
- **Mood:** dignified and grounded, never cartoonish, chibi or photorealistic.
- **Textures are the exception:** terrain textures (sets 1 and 2) are seen small and repeat, so
  they use **thin, soft outlines or none**, with painterly detail. The same palette keeps them
  in the family.

**Palette** (use as a guide, not a straitjacket):

| Role                 | Colour                                |
| -------------------- | ------------------------------------- |
| Limestone, light     | `#E8D3A2` honey, `#EFE3C6` cream      |
| Limestone, shadow    | `#B8935A`, `#8A6A3E`                  |
| Soil (terra rossa)   | `#9A4E2E`, `#6E3A22`                  |
| Vegetation           | `#7C8A4A` olive, `#4E5E2E` dark olive |
| Sea                  | `#1D5FA8` deep, `#4FB3BF` shallow     |
| Brass and gold       | `#C9A45C`, `#D9B56A`                  |
| Maltese painted wood | `#1F5040` green, `#B02E2A` red        |
| Ink and night        | `#1B1410`                             |

**Accessibility:** the game's owner is colourblind (red/green and blue/purple). Never rely on
those colour pairs alone to separate important things. In textures, make neighbouring terrain
types differ in **brightness and pattern**, not just hue. For example, field rows, scrub dots
and road ruts must read clearly in greyscale.

### Accuracy rules for 1565

Avoid these, because they did not exist yet or look wrong:

- **Weapons:** firearms are **matchlocks only**, with an S-shaped serpentine holding a
  smouldering cord. No flintlocks, hammers, frizzens or cartridges.
- **Objects:** no telescopes or spyglasses (invented 1608), no glass-chimney oil lamps, no
  goggles.
- **Clothing:** no fezzes (Ottoman soldiers wear turbans, and janissaries a tall white felt
  _börk_).
- **Buildings:** Mdina has **no large church dome**; its current cathedral dome dates from 1702.
- **Ships:** the fleets are mostly **oared galleys** with lateen sails.
- **Backgrounds:** use Maltese limestone fortifications, never Gothic northern European castles.
- **The Armature** are the one deliberate fantasy element: clockwork, springs, brass and steam.
  No electric lights, screens or modern machinery.

---

## 1. Terrain textures (tile tops)

Battle-map tiles, seen **straight from above**, with even flat lighting, no cast shadows and no
perspective. **512×512, seamless on all four sides.** Each terrain should read as itself at
64 px wide.

| File                   | Content                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `terrain/plain.png`    | Short dry Mediterranean grass, small yellow and white wildflowers, patches of pale soil.                    |
| `terrain/field.png`    | Terraced crop field: neat parallel rows of young barley on red-brown terra rossa soil.                      |
| `terrain/scrub.png`    | Garigue: low rounded thyme and spurge bushes, scattered pale limestone pebbles, dry red earth.              |
| `terrain/road.png`     | Dusty unpaved cart track, pale tan dirt with two shallow wheel ruts running straight across and pebbles.    |
| `terrain/sand.png`     | Fine golden beach sand with gentle wind ripples and a few shell fragments.                                  |
| `terrain/rubble.png`   | Scattered broken honey-coloured limestone blocks and gravel on dusty ground.                                |
| `terrain/rampart.png`  | Top walkway of a fortress wall: large squared honey limestone blocks with mortar joints in regular courses. |
| `terrain/wall.png`     | Older weathered limestone masonry seen from above: darker, irregular blocks with lichen patches.            |
| `terrain/floor.png`    | Worn limestone flagstones of a courtyard, irregular slabs with thin dark joints.                            |
| `terrain/ruin.png`     | Shattered limestone masonry: cracks, soot stains, fallen blocks and charred timber.                         |
| `terrain/shallows.png` | Clear turquoise shallow sea over pale sand and rocks, soft light ripples (caustics).                        |
| `terrain/sea.png`      | Deep Mediterranean blue sea with small white-capped wave crests.                                            |
| `terrain/deck.png`     | Galley deck: weathered oak planks running one way, dark tar seams, iron nail heads.                         |
| `terrain/trench.png`   | Freshly dug siege trench: dark churned earth with timber boards and a few gabions (wicker baskets).         |

---

## 2. Terrain side textures (cliff faces)

The vertical faces of raised tiles. **512×512, seamless left to right** (the top and bottom
edges do not need to match). The top of each image is the top edge of the cliff.

| File                     | Content                                                                                     | Used under                  |
| ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------- |
| `terrain/side-soil.png`  | A band of red terra rossa soil with grass roots on top, over layered pale limestone strata. | plain, field, scrub, trench |
| `terrain/side-rock.png`  | Layered honey-coloured limestone cliff with horizontal strata, cracks and small ledges.     | road, rubble, ruin          |
| `terrain/side-wall.png`  | Fortress wall face of large squared limestone blocks in regular courses, mortar joints.     | rampart, wall, floor        |
| `terrain/side-sand.png`  | Packed sand over soft sandstone, slightly crumbling.                                        | sand                        |
| `terrain/side-water.png` | Underwater blue, lighter at the top and darker towards the bottom, faint light shafts.      | shallows, sea               |
| `terrain/side-wood.png`  | Ship's hull side: dark tarred oak planks running horizontally, iron bands and nail heads.   | deck                        |

---

## 3. Story backgrounds

Painted establishing shots shown **behind** the small story dioramas. **1920×1080**, landscape,
no characters, in the full ink-and-watercolour style. Keep the **centre and lower middle calm**:
the diorama sits there, and dialogue boxes cover the bottom fifth.

| File                                 | Scene                                                                                                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backgrounds/p0-zejtun.png`          | Dawn over the terraced fields and dry-stone walls of Żejtun. A flat-roofed limestone farmhouse, a carob tree, and the bay of Marsaxlokk below with a vast Ottoman fleet of galleys rounding the headland.      |
| `backgrounds/p1-workshop.png`        | Inside a vaulted limestone arsenal workshop in Birgu, lit by forge fire and tallow candles. Half-built Armature stand on timber blocks; springs, gears and riveted plates cover the benches; smoke and sparks. |
| `backgrounds/p2-st-angelo.png`       | The upper ward of Fort St Angelo at night, looking over the Grand Harbour. Bronze cannon on the ramparts, the Order's banner (white cross on red), fires burning on the far shore.                             |
| `backgrounds/p3-camp.png`            | An Ottoman siege camp on a rocky point at dusk: rows of tents, horsetail standards and crescent banners, guns being dragged into place, the sea behind.                                                        |
| `backgrounds/s-mdina.png`            | The silent walled hill city of Mdina at evening: a narrow limestone street, flat roofs, a bell tower, wooden balconies. No large dome.                                                                         |
| `backgrounds/b1-marsaxlokk.png`      | The rocky shore of Marsaxlokk at midday, Ottoman galleys landing troops in the bay, small Maltese fishing boats pulled up on the beach, a watchtower on the point.                                             |
| `backgrounds/b6-kalkara-chapel.png`  | A roofless ruined chapel on the Kalkara shore under a full moon, broken arches, the harbour glinting beyond.                                                                                                   |
| `backgrounds/b8-turgut-battery.png`  | An Ottoman gun battery on the high ground of Tigné Point: earth-and-gabion walls, great bronze siege guns, smoke rolling towards Fort St Elmo across the water.                                                |
| `backgrounds/b9-fall-of-st-elmo.png` | The shattered walls of the star-shaped Fort St Elmo at the tip of the Sciberras peninsula at dawn, smoke rising, the harbour mouth beyond.                                                                     |

---

## 4. Duel backdrops

Wide panoramas behind the 3D close-up shown when one unit attacks another. **2048×768**, with
the **horizon in the lower third**. The 3D fighters stand in the middle, so keep the centre
simple. No characters.

| File                | Scene                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| `duel/fields.png`   | Maltese terraced fields and dry-stone walls under a hazy afternoon sky.          |
| `duel/coast.png`    | A rocky Maltese coast and turquoise sea, galleys far out on the water.           |
| `duel/fortress.png` | Along limestone fortress bastions with smoke rising, Ottoman siege lines beyond. |
| `duel/camp.png`     | An Ottoman siege camp with tents and banners at dusk.                            |
| `duel/night.png`    | The Grand Harbour at night, fires reflected on the dark water.                   |

---

## 5. Title, logo, app icon and store art

| File                          | Size                  | Content                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/title.png`                | 1920×1080             | Title key art. A battered Maltese militia Armatura stands on a limestone rampart at dawn, its young pilot (Ninu, see the cast reference) visible in the open hatch, facing a vast Ottoman fleet of galleys. A knight's Armatura (black and white cross) and a janissary Armatura (blue plates, tall white dome) stand further back. Heroic and painterly. **Keep the upper third calm** for the logo. |
| `ui/logo.png`                 | 1600×600, transparent | The lettering **ARMATURA 1565** in a 16th-century engraved style, with brass and limestone textures. A Maltese eight-pointed cross and an Ottoman crescent are worked subtly into the ornament. This is the only asset with text. Spell it exactly.                                                                                                                                                   |
| `ui/icon.png` + `ui/icon.svg` | 1024×1024             | App icon: a stylised brass Armatura helmet in front of a bronze medallion broken into two halves, a cross on one half and a crescent on the other. Bold, simple shapes that read at 48 px. Deep brown background (`#1B1410`) filling the square, with the subject inside the central 80% (Android crops corners). Also deliver it as a clean **SVG**.                                                 |
| `store/feature-graphic.png`   | 1024×500              | Google Play feature graphic: a militia Armatura and a janissary Armatura facing off on a Maltese shore at sunset. Leave the left third calm for the logo. No text.                                                                                                                                                                                                                                    |
| `store/steam-capsule.png`     | 920×430               | Steam main capsule: the militia Armatura in the foreground, the siege of Birgu behind. Leave the top left calm for the logo. No text.                                                                                                                                                                                                                                                                 |
| `store/steam-hero.png`        | 3840×1240             | Steam library hero: a panoramic siege of the Grand Harbour with fleets, bastions and war-harnesses in battle. No text, no logo (Steam overlays it).                                                                                                                                                                                                                                                   |

---

## 6. Armatura concept sheets (reference only)

The game draws its Armature as simple 3D models in code. These sheets are **reference** for
making those models richer later; they are not shown in the game. **2048×1024**, plain light
parchment background (`#EFE3C6`). Each sheet shows **front, side and back** views of one
harness, standing, at the same scale, with a small human pilot figure beside it for size. No
labels or text.

| File                      | Harness                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concept/haddiem.png`     | Light Maltese militia harness: patched iron plates over a timber frame, leaf springs on the legs, rope-bound joints, red-and-white sash, arming sword.        |
| `concept/moschetta.png`   | Light militia gunner: slim frame, a long matchlock arquebus along the right arm, small powder kegs on the back, leather hood over the hatch.                  |
| `concept/artigjan.png`    | Light workshop harness: tool arms with wrench and clamp hands, brass pressure gauges on the chest.                                                            |
| `concept/cavaliere.png`   | Medium knight of the Order: polished steel plates, black surcoat panel with a white eight-pointed cross, sword and shield.                                    |
| `concept/bastiun.png`     | Heavy knight: massive tower shield, thick riveted plates, short heavy legs.                                                                                   |
| `concept/lanza.png`       | Medium knight lancer: long lance with a cross pennant, streamlined chest plate.                                                                               |
| `concept/kaptan.png`      | Medium knight commander: gilded trim, banner pole on the back, crested dome helm.                                                                             |
| `concept/yeniceri.png`    | Medium janissary harness: blue-lacquered plates, tall white börk-shaped head dome with a brass spoon-holder, kilij in hand, long matchlock tüfek on the back. |
| `concept/sipahi.png`      | Light Ottoman cavalry harness: horse-like jointed legs, red-lacquered plates, long lance with a horsetail tassel.                                             |
| `concept/humbaraci.png`   | Medium bombardier: bandolier of clay grenade pots, sling arm, soot-darkened plates.                                                                           |
| `concept/levend.png`      | Light corsair harness: agile, teal sash, cutlass and boarding hook, rope-wrapped limbs.                                                                       |
| `concept/reis.png`        | Medium corsair captain: gold-trimmed plates, captain's cloak, heavy cutlass.                                                                                  |
| `concept/prototipo.png`   | Medium experimental Genoese harness: exposed brass boiler, hissing valves, piston-driven ram-arm, mismatched plates.                                          |
| `concept/colossus.png`    | Heavy giant Genoese war machine: twice as bulky, boiler chimney, shoulder cannon, huge ram-arm, glowing furnace grille.                                       |
| `concept/siege-tower.png` | Armoured siege tower on timber wheels with a drop bridge and gun ports, brass and oak.                                                                        |
| `concept/barge.png`       | Small armoured supply barge with a swivel gun, sandbags and crates.                                                                                           |

---

## Cast reference (for consistency only: do not draw portraits)

The portraits are finished and already in the game. These descriptions are here only so key
art that includes a character (such as `ui/title.png`) matches them.

- **Ninu Falzon** (hero): 23, Maltese farmer and fisherman turned militiaman, sun-browned olive
  skin, thick dark curly hair, green-hazel eyes, linen shirt under a battered brown leather
  jerkin, half of a broken bronze medallion (tulip and crescent design) on a cord.
- **Kateri Borg:** 22, armatura mechanic from Mdina, dark curly hair tied back, grease smudge,
  single brass jeweller's loupe on a band, green dress and leather apron.
- **Fra Luis:** knight of Aragon in his forties, greying beard, scar across the brow, steel
  gorget and pauldrons over a black surcoat with the white eight-pointed cross.
- **Deniz:** young Ottoman corsair navigator, dark wavy hair, red-and-white turban, gold hoop
  earring, green embroidered vest.
- **The Order's colours:** black habit or surcoat with a white eight-pointed cross; banner
  white cross on red.
- **The Ottoman side:** turbans, crimson, blue and gold kaftans, crescent and horsetail
  standards.

---

## For the game's owner: adding the files

1. Put each file at `apps/game/public/art/<file name>` (for example
   `apps/game/public/art/terrain/plain.png`).
2. Hand them to Claude Code to wire in. Sets 1 and 2 only need entries in
   `apps/game/public/art/manifest.json` and show up straight away; the other sets need a small
   code step each.
3. Record any third-party element in `assets/CREDITS.md`.

## Checklist

- [ ] 14 terrain textures (§1)
- [ ] 6 terrain side textures (§2)
- [ ] 9 story backgrounds (§3)
- [ ] 5 duel backdrops (§4)
- [ ] Title, logo, icon (PNG + SVG), 3 store images (§5)
- [ ] 16 Armatura concept sheets (§6)
