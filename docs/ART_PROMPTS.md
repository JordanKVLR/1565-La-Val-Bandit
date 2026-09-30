# Armatura 1565: art prompt pack

Prompts for generating every image the game needs with an AI image tool (Midjourney, DALL·E,
Stable Diffusion, Firefly, Ideogram, etc.). All designs are original: do **not** add the names
of existing games, studios or artists to these prompts, and don't use reference images from
other games. That keeps the art ours and store-safe.

## How to use this

1. **Start with the style block.** Paste the _Style block_ at the start of every prompt (or set
   it as your tool's style/system prompt) so all images match.
2. **Lock each character's look first.** Generate the portrait, pick the best one, then reuse it
   as the character reference (Midjourney `--cref`, Stable Diffusion IP-Adapter, or "same
   character as the attached image") for their sprites and any later images.
3. **Keep a seed.** When a batch looks right, note the seed and reuse it for the rest of that set.
4. **Export at the listed size** (or larger, same aspect ratio) as PNG. Sprites and portraits
   need transparent backgrounds. If your tool can't do that, ask for a flat magenta
   (#FF00FF) background and remove it afterwards.
5. **Drop files into the repo** at the listed path under `apps/game/public/art/`, and add them to
   `apps/game/public/art/manifest.json`. **Portraits and terrain textures appear in the game
   immediately.** The other sets (sprites, backgrounds, duel backdrops, UI) are ready for the
   next code step: tell me when you have them and I'll wire them in.

### Style block (use in every prompt)

> Hand-painted 1990s console tactical-RPG illustration style, clean confident linework, soft
> cel shading with painterly texture, warm Mediterranean light, muted earthy palette of
> honey limestone, olive green, terracotta, deep sea blue and weathered brass; 16th-century
> Malta, alternate history in which knights and janissaries pilot clockwork-and-steam
> war-harnesses called Armature (3–4 m tall, brass ribs, riveted plates, exposed springs,
> small pilot hatch); dignified, grounded, not cartoonish; no text, no watermark, no logo.

### Negative prompt (for tools that support it)

> text, letters, watermark, signature, logo, modern objects, guns from later centuries, sci-fi
> lasers, anime chibi proportions, photorealism, blurry, extra fingers, deformed hands,
> cropped head, busy background (for portraits and sprites)

---

## 1. Character portraits

Dialogue boxes and battle panels. **Size:** 512×512, square, head and shoulders, facing slightly
toward the viewer, neutral background, transparent or plain. **Path:**
`portraits/<id>.png` → manifest `"portraits": { "<id>": "portraits/<id>.png" }`.

| id          | Prompt (after the style block)                                                                                                                                                                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ninu`      | Portrait of Ninu Falzon, 23-year-old Maltese farmer and fisherman, sun-browned skin, thick dark curly hair, stubborn jaw, bright determined eyes, faint scar on the chin, rough linen shirt under a battered militia leather jerkin, a cord with half of a broken bronze medallion visible at his collar; hopeful and hot-headed expression. |
| `pawlu`     | Portrait of Pawlu Falzon, weathered Maltese farmer in his sixties, former galley slave, deep-lined face, grey stubble, kind tired eyes, old iron-shackle scars on the wrists, faded blue-grey peasant clothes, a woven straw hat pushed back.                                                                                                |
| `kateri`    | Portrait of Kateri Borg, 22-year-old Maltese clockmaker's daughter and war-harness mechanic from Mdina, dark hair tied back with a leather cord, grease smudge on one cheek, brass magnifying loupe pushed up on her forehead, leather apron over a practical dress, a small wrench tucked in a pocket; wry clever half-smile.               |
| `luis`      | Portrait of Fra Luis de Arrieta, Aragonese knight of the Order of St John in his forties, close-cropped greying beard, stern but kind eyes, black surcoat with a white eight-pointed cross over steel half-armour, a scar across the brow; disciplined, protective bearing.                                                                  |
| `valette`   | Portrait of the Grand Master of the Order of St John in 1565, a lean man past seventy with a white beard, sharp commanding eyes, black robe with the white eight-pointed cross, simple steel gorget; immense dignity and a hidden sadness.                                                                                                   |
| `balbi`     | Portrait of an Italian arquebusier and diarist, 1560s, around forty, trimmed dark beard, morion helmet under his arm, ink-stained fingers, small leather notebook tucked in his bandolier; wry observant expression.                                                                                                                         |
| `ganni`     | Portrait of Ġanni, young burly Maltese militiaman, broad cheerful face, short black hair, sleeveless padded jack, pike shaft over one shoulder; eager, loyal grin.                                                                                                                                                                           |
| `rozi`      | Portrait of Rożi, young Maltese militia sharpshooter woman, lean, sharp dark eyes, hair under a head scarf, powder flask and bandolier across her chest; calm and focused.                                                                                                                                                                   |
| `deniz`     | Portrait of Deniz, 19-year-old Ottoman corsair navigator, lean and quick, dark wavy hair under a red cap, gold earring, open-collared white shirt under a short embroidered vest, a kilij hilt at his shoulder; the same stubborn jaw as Ninu; idealistic, proud.                                                                            |
| `leyla`     | Portrait of Leyla Hatun, dignified woman in her forties of Ottoman noble blood, dark eyes, silver streak in her dark hair under a deep violet silk veil and embroidered kaftan, holding half of a broken bronze medallion near her heart; quiet strength and old grief.                                                                      |
| `yusuf`     | Portrait of Yusuf Reis, Ottoman corsair captain in his fifties, weathered, grey-black beard, white turban with a teal sash, heavy sea coat, gold ring; gruff but fatherly.                                                                                                                                                                   |
| `turgut`    | Portrait of an elderly legendary Ottoman admiral around eighty, long white beard, fierce wise eyes, large white turban, rich red-and-gold kaftan, standing as if cannonballs were rain.                                                                                                                                                      |
| `mustafa`   | Portrait of the Ottoman army commander of 1565, stern older general with a thick grey beard, tall formal turban with a plume, crimson kaftan with fur trim; impatient, severe.                                                                                                                                                               |
| `piali`     | Portrait of the Ottoman fleet admiral of 1565, younger than the army commander, neatly trimmed dark beard, admiral's turban, blue-and-gold kaftan; cool and calculating.                                                                                                                                                                     |
| `scala`     | Portrait of Vittorio Scala, Genoese engineer-inventor in his fifties, villain, thin sharp face, neat pointed grey beard, brass-rimmed spectacles, black doublet with brass buttons, a leather tool roll, burn scar on one hand; smiling politely and coldly.                                                                                 |
| `anastagi`  | Portrait of the captain of the Mdina cavalry, Italian officer around forty, dashing moustache, plumed burgonet helmet, cuirass over a dark red doublet; confident, daring.                                                                                                                                                                   |
| `villager`  | Portrait of a frightened Maltese villager, middle-aged, headscarf, simple brown clothes.                                                                                                                                                                                                                                                     |
| `soldier`   | Portrait of a generic soldier of the Order's garrison, helmet, tired soot-streaked face.                                                                                                                                                                                                                                                     |
| `janissary` | Portrait of a generic Ottoman janissary, tall white felt börk hat with a spoon holder, moustache, blue coat.                                                                                                                                                                                                                                 |

---

## 2. Armatura unit sprites (battle map)

One sprite sheet per frame design. **Size:** 1024×512 sheet = 8 cells of 256×256 in a row:
`idle-front, walk1-front, walk2-front, attack-front, idle-back, walk1-back, walk2-back,
attack-back`. "Front" means ¾ view toward the camera, "back" means ¾ view away from it. Full
body, feet at the bottom of each cell, transparent background, same scale in every cell.
**Path:** `sprites/<frame-id>.png`.

Start each prompt with: _"Sprite sheet, 8 poses in one row, isometric ¾ view, full body,
consistent scale, transparent background, of a war-harness (Armatura):"_

| frame id      | Description                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `haddiem`     | light Maltese militia harness, patched iron plates over a wooden frame, exposed leaf springs on the legs, rope-bound joints, red-and-white cloth sash, carries an arming sword. |
| `moschetta`   | light militia gunner harness, slim frame, a long arquebus mounted along the right arm, powder barrels on the back, leather hood over the pilot hatch.                           |
| `artigjan`    | light workshop harness, tool arms, wrench and clamp hands, brass pressure gauges on the chest.                                                                                  |
| `cavaliere`   | medium knight harness of the Order, polished steel plates, black surcoat panel with a white eight-pointed cross, sword and kite shield.                                         |
| `bastiun`     | heavy knight harness, massive tower shield, thick riveted plates, short heavy legs, slow and immovable.                                                                         |
| `lanza`       | medium knight lancer harness, long lance, streamlined chest plate, pennant with the eight-pointed cross.                                                                        |
| `kaptan`      | medium knight commander harness, gilded trim, banner pole on the back, crested helm dome.                                                                                       |
| `yeniceri`    | medium Ottoman janissary harness, blue-lacquered plates, tall white felt-hat shaped head dome, kilij in hand and a long tüfek musket on the back.                               |
| `sipahi`      | light Ottoman cavalry harness, digitigrade horse-like legs, red lacquered plates, long lance with a horsetail tassel.                                                           |
| `humbaraci`   | medium Ottoman bombardier harness, bandolier of clay grenade pots, sling arm, soot-darkened plates.                                                                             |
| `levend`      | light corsair harness, agile, teal sash, cutlass and boarding hook, rope-wrapped limbs.                                                                                         |
| `reis`        | medium corsair captain harness, gold-trimmed plates, captain's cloak, heavy cutlass.                                                                                            |
| `prototipo`   | medium experimental Genoese harness, exposed brass boiler, hissing valves, piston-driven ram-arm, mismatched plates.                                                            |
| `colossus`    | heavy giant Genoese war machine, twice as bulky, boiler chimney on the back, shoulder-mounted cannon, huge ram-arm, glowing furnace grill.                                      |
| `siege-tower` | armoured siege tower on wheels with a drop bridge and gun ports, brass and timber.                                                                                              |
| `barge`       | small armoured supply barge with a swivel gun, sandbags and crates.                                                                                                             |

---

## 3. Terrain textures (battle map tiles)

Seamless, tileable, viewed straight from above, even lighting, no shadows, no perspective.
**Size:** 512×512. **Path:** `terrain/<id>.png` → manifest `"terrain": { "<id>": "terrain/<id>.png" }`.
They show up on the map the moment they're listed.

Start each prompt with: _"Seamless tileable top-down texture, even flat lighting, hand-painted
game texture, Maltese landscape:"_

| id         | Prompt                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------- |
| `plain`    | short dry Mediterranean grass with small wildflowers and patches of pale soil                |
| `field`    | terraced crop field, neat rows of young barley and cotton on red-brown soil                  |
| `scrub`    | garigue: low thyme and spurge bushes, pale limestone pebbles, dry red earth                  |
| `road`     | dusty unpaved cart road, pale tan dirt with two shallow wheel ruts and pebbles               |
| `sand`     | fine golden beach sand with gentle wind ripples                                              |
| `rubble`   | scattered broken honey-coloured limestone blocks and gravel                                  |
| `rampart`  | top of a fortress wall, large honey-coloured globigerina limestone blocks with mortar joints |
| `wall`     | weathered limestone masonry seen from above, darker, with lichen                             |
| `floor`    | worn limestone flagstones of a courtyard, irregular slabs                                    |
| `ruin`     | shattered limestone masonry with cracks, soot and fallen blocks                              |
| `shallows` | clear turquoise shallow sea water over pale sand and rocks, light caustics                   |
| `sea`      | deep Mediterranean blue sea with small wave crests                                           |
| `deck`     | galley deck of weathered oak planks with tar seams and iron nails                            |
| `trench`   | freshly dug siege trench, dark churned earth with timber planks                              |

**Cliff sides** (the vertical faces of raised tiles). **Size:** 512×512, seamless horizontally.
**Path:** `terrain/<name>.png` → manifest
`"terrainSides": { "plain": "terrain/side-soil.png", "road": "terrain/side-rock.png", … }`.
Map each terrain id to the side it should use.

| name         | Prompt                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `side-soil`  | vertical cross-section: a band of red terra rossa soil on top of layered pale limestone strata |
| `side-rock`  | vertical face of layered honey-coloured limestone cliff with horizontal strata                 |
| `side-wall`  | vertical fortress wall of large limestone blocks with mortar                                   |
| `side-sand`  | vertical face of packed sand and sandstone                                                     |
| `side-water` | deep underwater blue gradient, darker at the bottom                                            |
| `side-wood`  | ship hull side, dark tarred oak planks with iron bands                                         |

---

## 4. Story backgrounds (behind the diorama scenes)

Painted establishing shots shown behind the isometric stage. **Size:** 1920×1080, landscape,
no characters. **Path:** `backgrounds/<stage-id>.png`.

| stage id             | Prompt                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `p0-zejtun`          | dawn over terraced fields and rubble walls of Żejtun, Malta, a farmhouse of honey limestone, the bay of Marsaxlokk below with a huge Ottoman fleet of galleys rounding the headland |
| `p1-workshop`        | interior of a 16th-century arsenal workshop in Birgu, lamp-lit, half-built war-harnesses on wooden blocks, springs and gears on benches, smoke and sparks                           |
| `p2-st-angelo`       | the upper ward of Fort St Angelo at night overlooking the Grand Harbour, cannon on the ramparts, fires burning on the far shore                                                     |
| `p3-camp`            | an Ottoman siege camp on a rocky point at dusk, rows of tents, banners, guns being dragged into place, the sea behind                                                               |
| `s-mdina`            | the silent walled hill city of Mdina, narrow limestone street, bell tower, evening light                                                                                            |
| `b6-kalkara-chapel`  | a roofless ruined chapel on the Kalkara shore under a full moon                                                                                                                     |
| `b9-fall-of-st-elmo` | the shattered walls of a star-shaped fort at the tip of a peninsula, smoke, dawn                                                                                                    |

---

## 5. Duel backdrops (3D close-up)

Wide panoramic skies and horizons behind the 3D duel. **Size:** 2048×768. **Path:**
`duel/<terrain-group>.png`.

| name            | Prompt                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `duel/fields`   | wide panoramic view of Maltese terraced fields and rubble walls under a hazy afternoon sky, horizon low in the frame |
| `duel/coast`    | wide panoramic view of a rocky Maltese coast and turquoise sea, galleys in the distance                              |
| `duel/fortress` | wide panoramic view along limestone fortress bastions with smoke rising, siege lines beyond                          |
| `duel/camp`     | wide panoramic view of an Ottoman siege camp with tents and banners at dusk                                          |
| `duel/night`    | wide panoramic view of the Grand Harbour at night, fires reflected on the water                                      |

---

## 6. Title, icon and store art

| file                        | Size                  | Prompt                                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/title.png`              | 1920×1080             | Title screen key art: a young Maltese pilot in a battered militia Armatura on a limestone rampart at dawn, facing a vast Ottoman fleet, with a knight's Armatura and a janissary Armatura in the background; heroic, painterly; leave the upper third calm for the logo.  |
| `ui/logo.png`               | 1600×600, transparent | Game logo lettering "ARMATURA 1565" in a 16th-century engraved style, brass and limestone textures, an eight-pointed cross and a crescent worked subtly into the design. _(AI tools often misspell text. If so, generate the ornament only and set the words in a font.)_ |
| `ui/icon.png`               | 1024×1024             | App icon: a stylised brass Armatura helmet over a broken bronze medallion split into two halves, cross on one half and crescent on the other; bold simple shapes readable at small sizes, deep brown background.                                                          |
| `store/feature-graphic.png` | 1024×500              | Google Play feature graphic: two Armature facing off on a Maltese shore at sunset, room on the left for the logo.                                                                                                                                                         |
| `store/steam-capsule.png`   | 920×430               | Steam main capsule: the hero's Armatura in the foreground, the siege of Birgu behind, logo space top-left.                                                                                                                                                                |
| `store/steam-hero.png`      | 3840×1240             | Steam library hero: panoramic siege of the Grand Harbour, fleets, fortresses, war-harnesses; no text.                                                                                                                                                                     |

Store screenshots should be real in-game captures, not AI images. Apple and Google both
reject misleading screenshots.

---

## Checklist

- [ ] 19 portraits (§1)
- [ ] 16 sprite sheets (§2)
- [ ] 14 terrain textures + 6 cliff sides (§3)
- [ ] 7 story backgrounds (§4)
- [ ] 5 duel backdrops (§5)
- [ ] Title, logo, icon, 3 store images (§6)
- [ ] Every file listed in `apps/game/public/art/manifest.json`
- [ ] Any third-party or licensed element recorded in `assets/CREDITS.md`
