# Contributor guide (humans and AI agents)

Tactical RPG set during the Great Siege of Malta, 1565. The design and roadmap live in
`docs/PLAN.md`; read it before making design decisions.

## Layout

- `packages/core`: the rules engine. Pure TypeScript and deterministic (seeded RNG in state).
  **No DOM, Three.js or Preact imports**; ESLint enforces this.
- `packages/content`: game data (JSON) plus zod schemas and loaders. Content is data, not code.
- `apps/game`: the Vite web client. `render/` is Three.js (it draws events and never decides
  rules), `ui/` is Preact screens and HUD, `platform/` holds adapters (ads, storage, later
  purchases/Steam).

## Commands

```sh
pnpm install
pnpm dev          # dev server (use --host URL on a phone on the same network)
pnpm check        # format, lint, typecheck, unit tests, build: run before every push
pnpm e2e          # Playwright smoke tests (phone landscape + Steam Deck viewports)
pnpm coverage     # core must stay ≥90% lines
pnpm --filter @m1565/game icons   # regenerate PNG icons from icons/icon.svg
```

## Rules

- All art, names, text and music are original or properly licensed. Never copy assets from
  the reference game. List third-party assets in `assets/CREDITS.md`.
- Every rules change comes with Vitest tests in `packages/core/test`.
- Tuning numbers belong in content data, not in magic constants in code.
- Landscape only; touch first; buttons ≥44px; respect safe-area insets.
- Record significant technical decisions as ADRs in `docs/adr/`.
