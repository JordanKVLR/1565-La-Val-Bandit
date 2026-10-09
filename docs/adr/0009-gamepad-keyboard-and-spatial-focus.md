# ADR 0009: Gamepad and keyboard play through one key table and spatial focus

## Status

Accepted.

## Context

Steam Deck Verified needs the whole game playable with the built-in controller, and PC
players expect the keyboard to work beyond a few battle shortcuts. The screens already
listened for keys (battle: M/A/E/U/Enter/Esc; Armoury: Q/E, [ ], arrows, Esc), but the battle
map could only be used by tapping or clicking a tile, menus had no arrow-key navigation, and
nothing read gamepads. Several agents are changing the same screens in parallel, so the
solution had to touch them as little as possible.

## Decision

- **One table of controls per context** (`platform/input/controls.ts`: battle, armoury,
  menu). Each row is an abstract action with the keyboard key the screen already handles and
  the gamepad inputs that send it. The Controls help page and the button prompts are drawn
  from the same rows, so they cannot drift from what the inputs do.
- **The gamepad sends keys.** `platform/input/gamepad.ts` is the only code that touches the
  browser Gamepad API: it polls once per frame while a pad is connected (and not at all
  otherwise), with key-style auto-repeat for directions (`gamepadMapping.ts`, pure and unit
  tested with mock pads). `ui/input.ts` turns each input into a `keydown` for the current
  context on the focused element; Ⓐ on a focused control presses it. A Steamworks Input adapter
  could replace the polling file without touching the screens.
- **Screens first, generic fallbacks last.** Screens handle their keys on `document` (battle,
  story) or on elements (Armoury grids) and call `preventDefault()` when they use one. The
  fallbacks listen on `window`, so they always run after: arrows move focus spatially inside
  the topmost dialog or the screen (`ui/spatial.ts`, pure geometry), Esc presses the dialog's
  `[data-nav-back]` button, `[ ]` switch tabs, Enter with nothing focused focuses the dialog's
  `[data-nav-default]` control, and Page Up/Down (the right stick) scroll.
- **A tile cursor on the battle map.** `BattleController` gained `moveCursor`,
  `cycleCursor` and `confirmCursor`; the arrows step one tile along the screen diagonal a
  quarter turn clockwise from the arrow (↑ = up-right), following the camera rotation
  (`scenes/cursor.ts`). In move mode the route previews as with a mouse hover, so Ⓐ moves in
  one press; Ⓐ on your own unit opens Move. The cursor reuses the existing selection marker
  and pans the camera only near the screen edge.
- **Prompts follow the last input.** `<html data-input>` records pointer, keyboard or
  gamepad; `KeyHint` shows key letters or pad glyphs (Ⓐ Ⓑ Ⓧ Ⓨ LB RB…), and with a pad the
  focus ring is always drawn, because programmatic focus is not always `:focus-visible`.

Battle mapping: D-pad/left stick cursor · Ⓐ select/confirm · Ⓑ back · Ⓧ attack · Ⓨ end turn
· View undo · L3 move · LB/RB previous/next unit · LT/RT or right stick ←→ rotate · right stick
↑↓ zoom · Menu button opens the battle menu. Armoury: LB/RB shelves (Q/E), LT/RT pilots ([ ]).

## Consequences

- New screens get D-pad navigation for free if their controls are real buttons; they only
  need `data-nav-back` on the button that closes a dialog.
- Esc in battle opens the menu when there is nothing to cancel; the keyboard's Menu key
  (ContextMenu), which the pad's Menu button sends, toggles it.
- Remappable controls (PLAN §2.7) can later edit the same table.
