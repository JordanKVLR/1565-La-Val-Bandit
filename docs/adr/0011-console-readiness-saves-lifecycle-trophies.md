# ADR 0011: Console readiness: crash-safe saves, suspend/resume, controller loss, one trophy registry

## Status

Accepted.

## Context

The owner wants the game ready for Xbox and PlayStation before choosing how to port it, so the
behaviour console certification looks for should already exist behind platform adapters. Four
gaps stood out:

- **Saves.** `writeSave` called `localStorage.setItem` once. Only choices, chapter cards, the
  Armoury and stat raises autosaved; story lines and the AI's moves did not, and a battle saved
  only when the player was asked for a command. A file-backed adapter (Capacitor Filesystem,
  Electron fs, a console's save API) could tear a save if the app was killed mid-write, and
  nothing could recover from a damaged save.
- **Suspend/resume.** Only the audio reacted to the page being hidden. Electron gave
  Chromium's storage its own lazy commit timer, so a Steam Deck put to sleep and never woken
  could lose the latest writes.
- **Controller loss.** A pad unplugged mid-battle went unnoticed.
- **Achievements.** Six Steam names were hard-coded in two maps in `GameSession`, with no grade,
  no hidden flag and no way to add console trophies without more hard-coding.

## Decision

- **Crash-safe records** (`platform/storage.ts`). Each record has its key plus `.tmp` and
  `.bak`. A write goes tmp, read back and compare, then the current copy to bak (only if it
  parses), then the primary, read back, then remove tmp. A read takes the first copy that parses
  as a JSON object, in the order tmp, primary, bak. A leftover tmp means the last write did not
  finish, so it is the newest copy. A caller can reject a copy that parses but is unusable:
  `GameSession.load` rejects one that will not migrate or resume, and the next copy is tried.
  The primary keeps the old plain JSON format, so existing saves and tests that edit
  `armatura.save.auto` directly still work. No save version bump was needed. The backend is a
  small `KeyValueBackend` interface (localStorage today) that native adapters replace with
  `setStorageBackend`. `flushStorage()` runs platform flush hooks. Settings and the new
  device profile use the same writer.
- **Save after every meaningful change.** Each story line (`advance`), each choice, each
  battle command, the player's or the AI's (`BattleScreen` now reports every state change, not
  only command/ended), Armoury changes, stat raises and settings are written at once. Writes are
  synchronous and a few KB, so there is no write queue to lose. A battle resumed in the
  middle of an AI turn re-plans that turn from the saved state, which is consistent because the
  state only changes between commands.
- **Lifecycle** (`platform/lifecycle.ts`). Suspend comes from `visibilitychange` (hidden),
  `pagehide`, `freeze`, Cordova/Capacitor `pause`, Capacitor's App `appStateChange` when the
  plugin is present, or the Electron shell's `onLifecycle` (system sleep, screen lock,
  minimise). On suspend the game calls `GameSession.flush()`, which rewrites the latest battle
  snapshot or the story position, and never overwrites a snapshot with a battle start. It
  then calls `flushStorage()`, where Electron runs `session.flushStorageData()`, pauses the
  audio, holds the pause gate and sets `<html data-suspended>`, which pauses CSS animations. On
  resume it reverses each step. Electron also flushes storage before quitting.
- **One pause gate** (`state/pause.ts`). The battle AI's pacing delays wait on
  `gameplayPause.whenRunning()`. An enemy step already animating finishes, and the next one
  waits. Suspend and the controller notice each hold the gate under their own reason.
- **Controller disconnect** (`platform/input/disconnect.ts`, `ui/ControllerNotice.tsx`). The
  gamepad adapter now reports which pad sent each input, and also reports `gamepadconnected`
  and `gamepaddisconnected`. If the pad in use disconnects while the last input came from a
  pad, an alert dialog appears: "Controller disconnected. Reconnect your controller, or press
  any key or tap to continue". It holds the gate. It closes when a pad connects, or on any key,
  tap or pad press. The key or press that closes it is swallowed in `ui/input.ts`, through a
  window capture listener for keys and before dispatch for pad presses, so it never reaches
  the battle. Touch or keyboard players who set a pad down are never interrupted.
- **One achievement and trophy registry** (`packages/content/data/achievements.json`, schema
  and matcher in `packages/content/src/achievements.ts`). There are 38 entries. Each has a
  stable `ACH_*` id (the Steam API name; the six shipped names are kept), a name, a description,
  a `hidden` flag for spoilers, a PlayStation-style grade (bronze, silver, gold, platinum) and
  a `trigger`. The game reports events: `battleWon`, `ending`, `newGamePlus`,
  `skillUnlocked`, `itemBought`, `gearFitted`, `scudiHeld` and `codexRead`. The matcher
  picks the entries each event earns, then the meta entries: "all endings", and the platinum
  once every other entry is earned. `platform/achievements.ts` records unlocks in a device
  profile (`armatura.profile.v1`, crash-safe), sends them to every registered backend (Steam
  through Electron today; consoles and mobile register their own), re-sends repeats such as
  endings in New Game+, and re-syncs at start-up. Tests play every route, Grand Master and New
  Game+ through `GameSession`, and use the Armoury and the codex as the screens do. Together
  these must earn the whole registry, platinum last, so every entry is reachable from wired
  events. `manual` triggers exist for platform-side unlocks, but none are used.
- **Pointer-free paths.** A controller-only Playwright spec plays from the title to a battle
  turn and its menu. Three defaults were added so that Ⓐ always does something:
  Continue/New Game, the recommended difficulty and the story menu's Resume are now default
  focus. In the attack menu and facing picker, Enter no longer gets swallowed; it focuses the
  default choice.

## Consequences

- A kill at any point loses at most the step being written. The test storage tears each write
  step to prove it. Each slot uses up to three times its size in storage while a write is in
  progress and twice its size at rest.
- Grand Master trophies use the difficulty in force when the battle or ending is reached. A
  player can switch modes just before a finale; this is accepted.
- Console ports still need per-user save containers, platform trophy ids and icons, button
  glyph sets and SDK backends. `docs/CONSOLE.md` tracks what is done and what is left.
