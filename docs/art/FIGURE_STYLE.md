# Armatura figure style (the Cavaliere kit)

The approved reference is `docs/art/cavaliere/` (`cavaliere.jpg`, `still-generator.mjs`,
`animated-reference.html`). The knight (`render2d/figures/knight.ts`, `knightArms.ts`) is the first
model built to it; the other models should be built the same way from `figures/kit.ts`.

## Look

- Bold ink outline `INK = #0e1118` around every plate; thinner ink (3 px) for seams and panel lines.
- Cylinder shading: every plate is one gradient across its width (dark edge, mid, a bright band
  about a third in, soft falloff, dark edge) plus a white specular streak on the bright side.
- Light comes from the upper left; a warm rim (`#ffb866`, ~50% alpha) runs along the right edges.
  Mirrored figures keep this on screen: gradients flip with `K.mir` (set by the rig).
- Materials: steel (`metal`, base `#a7b0c1`), far-side steel (`steelFar`, darker), brass
  (`#d9a443`, gold for the hero), cloth (`cloth`), cream white (`soft`, the cross), leather
  (`matte`), hero enamel (`enamel`). A `Swatch` makes any of them: `sw(hex, kind)` or
  `swatch.as(kind)`. Profiles are in `PROFILES` in kit.ts.
- Details that read as "armatura": layered pauldron with a brass spike, lames on every limb,
  riveted brass joints, brass bands, steam boiler pack with gauge, pipes and a glowing furnace
  (pulses with `f.t`), steam puffs from the vent, thigh piston, belt, buckle and tassets, visor
  helm with a glowing eye slit, red plume, round shield with the eight-pointed cross.

## Coordinates and outlines

- Figure space is world units (a figure is ~1.8 tall, feet at the origin, +x forward, +y up).
- Static plates are authored in **reference pixels** (570 px = 1 unit, y down), exactly as in the
  reference: `refIn(ctx, ox, oy)` ... `refOut(ctx)`, with `Shape.d('M ...')` (absolute M L C Q Z;
  for arcs build a `mkPath` yourself and give a `Frame`). The origin passed to `refIn` is the hook's
  own origin (hip for torso/skirt/back, the helm centre for the head, the joint for pad/fore/boot).
- Stroke widths (reference px): main plates 5-6, joints 5, detail 3-4, rivet rings 1.5. Use
  `inkR(px)` inside `refIn` and `inkU(px)` in world units. Both widen automatically when the figure
  is small (`>= 2.7 canvas px` at LOD 0, 1.5 at LOD 1, 1.3 at LOD 2).

## Building blocks (kit.ts)

`Shape`/`paint(ctx, shape, mat, lw, top)` plate with gradient and ink; `Tube`/`paintTube` tapered
limb with lames, specular and rim; `joint` riveted brass joint; `disc`; `band` (brass strip over
ink); `rivetPath`/`rivets`; `streak` (specular), `seam` (ink line), `flat`; `glow('ember'|'eye'|
'steam')`; `flag` (plume feather, sash tail, pennon); `glint` (4-point star).
Create `Shape`/`Tube`/`Path2D` once at module load or lazily per class, never per frame; gradients
are cached per canvas, flash level and mirror state inside `Swatch.grad`.

A `Look` replaces the default limbs with `segment(f, seg, far, len, r0, r1)` (0 upper arm, 1
forearm, 2 thigh, 3 shin) and draws joints from `fore`/`shin`; `pad` should counter-rotate so the
pauldron stays on the shoulder. `shieldWith(weaponType)` says when the off hand carries the shield.

## Level of detail

The rig calls `setView` once per draw and sets `K.px` (canvas px per unit), `K.lod`, `K.mir`:

| LOD | when                    | draw                                                                                                    |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| 0   | < 120 px/unit (map)     | silhouettes, base gradients, thick ink, eye glow, cross; no lames, rivets, streaks, glints, small bands |
| 1   | 120-230 px/unit (panel) | + lames, specular streaks, bands, gauge, seams                                                          |
| 2   | >= 230 (duel)           | + rivets, rim light, glints, steam puffs at full count                                                  |

## Side colour, class, hero

- `f.acc` (side colour) is always shown as the plume, a belt sash with a knot, an upper-arm band and
  the ring inside the shield rim. The Order red stays the tabard/shield base.
- Class (`f.cls`, `f.g`): girth scales the torso, helm and plume size, pauldron size, tassets
  (2 for light, 3 otherwise), shield radius.
- Hero (`f.hero`): white enamel plates, gold trim, red plume with a gold feather, sun medallion and
  gold sash.

## Roster

One file per model in `render2d/figures/` (`<model>.ts` the Look, `<model>Arms.ts` its weapon painters).
`weapons.ts` only maps (model, weapon type) to a style and dispatches to the model's painters;
`shield.ts` dispatches the off-hand shield. Palettes are in `palette.ts` (hero livery: white enamel,
gold, red; models with their own `mats(f)` override it where they check `f.hero`).

| Model     | Faction (palette)                      | Shield / off hand          | Weapon art                             | Quirks                                                                  |
| --------- | -------------------------------------- | -------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| knight    | Order: silver, red tabard, brass       | round cross shield         | knightArms (+ Ottoman gun and grenade) | the reference; steam pack, plume in side colour                         |
| militia   | Maltese: earthy cloth, limestone, felt | banded plank shield        | militiaArms                            | straw-brim hat, rough kit                                               |
| gunner    | Maltese: brown coat, steel morion      | none                       | militiaArms/gunnerArms                 | shares the militia weapons; dark by nature, brightened                  |
| janissary | Ottoman: blue kaftan, white börk       | small buckler (blunt)      | janissaryArms                          | steam from the crescent horns, tail of the börk                         |
| sipahi    | Ottoman: crimson, steel, mail          | kalkan (blade/blunt/expl.) | sipahiArms                             | side-colour cape                                                        |
| corsair   | Barbary: teal vest, crimson, brass     | buckler (blunt only)       | corsairArms                            | grapple and rope, whistle pack                                          |
| machine   | Scala: dark iron, copper, brass        | none                       | machineArms                            | glowing eye slit, boiler pack, gear knees                               |
| tower     | Scala: timber, iron bands, tracks      | none                       | machineArms                            | arms come out of a bay; shares `Boiler`/`MACH` with the barge           |
| barge     | Maltese boat: planks, brass            | none                       | corsairArms (crew)                     | the whole boat is the hull plate; water pinches to a point at both ends |

Hero: `machMats(f)` swaps tower and barge machinery to white enamel and gold.

### Adding a model

1. Add the id to `ARMATURA_MODELS` (content schemas) and write `figures/<id>.ts` (a `Look`, built from
   `kit.ts`) and `figures/<id>Arms.ts` (weapon painters returning nothing; one case per `WeaponStyle`).
2. Register it in `figures/index.ts` (`LOOKS`), in `weapons.ts` (`styleFor`, `drawWeapon`) and, if it
   carries a shield, in `shield.ts`; add a palette in `palette.ts`.
3. Check it with `gallery2d.html?view=roster&size=map` next to the other models: ink weight, brightness,
   side colour and silhouette must read as part of the family at duel, panel and map size.
4. Extend `corsair.test.ts` style tests (every weapon, class, scale, hero, mirrored).

## Testing visually

Dev server `pnpm --filter @m1565/game dev --port 5340`, then `/gallery2d.html?view=roster&size=map` (all models), `/gallery2d.html?model=knight&class=heavy&weapon=blunt`
(`&hero=1&face=-1&accent=%232a6fd6`), `/duel2d.html?atk=order-cross-cut&t=0.4`, a battle map
(`/?battle=a1-piccolo-soccorso`) and the unit panel. Compare to `cavaliere.jpg` at 700 px (duel), 250 px
(panel) and 100 px (map). `rig.test.ts` draws every knight variant at all three LODs.
