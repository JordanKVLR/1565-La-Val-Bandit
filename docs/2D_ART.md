# 2D art overhaul

2D is the default (`Settings → Unit style`: 2D / 3D, switchable any time; the battle map switches live,
duels and unit panels on next open). Decision record: `docs/adr/0013-2d-art-pipeline.md`.

## Where things live (`apps/game/src/render2d/`)

| Area            | Files                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Shared contract | `contract.ts` (Rig, Fx, FxContext, AttackScript)                                        |
| Figures         | `rig.ts`, `figures/` (9 models x 3 classes x 5 weapons, hero livery, machines)          |
| Effects engine  | `fx.ts` (particles, arcs, bursts, words, hit-stop, slow-mo, shake, impact frames)       |
| Duel            | `DuelStage2D.ts`, `backdrop.ts`, `attacks/styleDefaults.ts` (per-style baseline)        |
| Attack scripts  | `attacks/{order,militia,ottoman,corsair,scala}.ts`: one per attack id in `attacks.json` |
| Map and viewer  | `mapSprite.ts`, `UnitViewer2D.ts`, `stageFactory.ts`                                    |
| Portraits       | `portraits/` (20 cast x 8 expressions; `expressionForLine` picks one per dialogue line) |

## Adding an attack

Add it to `data/attacks.json`, then export a script with the same id from the faction file. Without
one it falls back to its style's default. Every attack id must have a script (tests enforce it).

## Dev harnesses (dev server only)

- `/gallery2d.html`: every figure and pose strip.
- `/duel2d.html?atk=<id>&hit=1&t=0.45`: any attack frozen at any time (`&attacker=right`, `&reaction=defend`, `&defeated=1`).
- `/portraits2d.html`: all portraits and expressions.

## Known limits

Multi-hit attacks show one real impact (the core emits one per strike). Map sprites have no true back
view (they mirror and darken). Some defeat frames are busy, and a few attacks of the same style
(basic slashes, militia shots) look alike. The story script has no mood tags, so expressions are inferred.
