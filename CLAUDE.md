# Contributor guide (humans and AI agents)

Tactical RPG set during the Great Siege of Malta, 1565. The design and roadmap live in
`docs/PLAN.md`; read it before making design decisions.

## Layout

- `packages/core`: the rules engine. Pure TypeScript and deterministic (seeded RNG in state).
  **No DOM, Three.js or Preact imports**; ESLint enforces this.
- `packages/content`: game data (JSON) plus zod schemas and loaders. Content is data, not code.
- `packages/content/story`: the Ink master script. `>>> command` lines drive the game (see the
  header of `main.ink`). Lines written `NAME: text` are dialogue; NAME must be in `data/cast.json`.
- `apps/game`: the Vite web client. `render/` is Three.js (it draws events and never decides
  rules), `scenes/` holds the battle controller, `campaign/` the story/battle session and saves,
  `ui/` the Preact screens and HUD, `platform/` the adapters (storage, audio, ads, achievements).
  `android/` and `ios/` are Capacitor projects.
- `apps/desktop`: Electron shell for Steam.

## Adding content

- New battle: add `data/maps/<id>.json` (optional, maps can be shared) and
  `data/battles/<id>.json`, then reference it from the story with `>>> battle <id>`. Files are
  picked up automatically. Named characters use `character`; give them the level they should have
  reached at that point in the story.
- Achievements/trophies: add an entry to `data/achievements.json` (stable `ACH_*` id, grade,
  trigger). The game reports events, never ids; see `docs/CONSOLE.md`.
- The content tests check every story line for unknown battles, maps, cast and commands, play each
  route to its ending, and simulate every battle AI-vs-AI (it must be winnable).

## Commands

```sh
pnpm install
pnpm dev          # dev server (use --host URL on a phone on the same network)
pnpm check        # format, lint, typecheck, unit tests, build: run before every push
pnpm e2e          # Playwright smoke tests (phone landscape + Steam Deck viewports)
pnpm coverage     # core must stay ≥90% lines
pnpm --filter @m1565/game icons   # regenerate PNG icons from icons/icon.svg
pnpm --filter @m1565/game cap:sync         # native build + copy into android/ and ios/
pnpm --filter @m1565/game build:single     # one-file HTML build for quick sharing
open http://localhost:5173/?battle=<id>    # jump straight into any battle
```

## Rules

- All art, names, text and music are original or properly licensed. Never copy assets from
  the reference game. List third-party assets in `assets/CREDITS.md`.
- Every rules change comes with Vitest tests in `packages/core/test`.
- Tuning numbers belong in content data, not in magic constants in code.
- Landscape only; touch first; buttons ≥44px; respect safe-area insets.
- UI text goes in `apps/game/src/i18n/en.ts` (ESLint blocks hard-coded strings in TSX); story text
  stays in Ink and names/descriptions in content JSON. See `docs/I18N.md`.
- Record significant technical decisions as ADRs in `docs/adr/`.
