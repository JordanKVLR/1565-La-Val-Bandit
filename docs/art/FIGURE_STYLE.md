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
'steam')`; `flag` (plume feather, sash tail, pennon, with `flagTip`); `glint` (4-point star).
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

## Testing visually

Dev server `pnpm --filter @m1565/game dev --port 5340`, then `/gallery2d.html?model=knight&class=heavy&weapon=blunt`
(`&hero=1&face=-1&accent=%232a6fd6`), `/duel2d.html?atk=order-cross-cut&t=0.4`, a battle map
(`/?battle=a1-piccolo-soccorso`) and the unit panel. Compare to `cavaliere.jpg` at 700 px (duel), 250 px
(panel) and 100 px (map). `rig.test.ts` draws every knight variant at all three LODs.
