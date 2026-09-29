# Armatura 1565

An original isometric tactical RPG set during the Great Siege of Malta (1565). Ninu, a farmer's
son from Żejtun with a secret double lineage, fights through the siege in clockwork war-harnesses.
There are three routes (the Cross, the Island and the Crescent), 24 battles and three endings.

- **Play in a browser:** https://jordankvlr.github.io/1565-La-Val-Bandit/ (landscape; installs as an app)
- **Android test build:** the latest "Android debug APK" run under Actions → Artifacts
- Design and roadmap: [docs/PLAN.md](docs/PLAN.md) · Store releases: [docs/RELEASE.md](docs/RELEASE.md)
- Contributor guide: [CLAUDE.md](CLAUDE.md)

## Quick start

Requires Node 22+ and pnpm (`corepack enable`).

```sh
pnpm install
pnpm dev      # open the printed URL; use the --host address to test on your phone
pnpm check    # format, lint, typecheck, unit/content tests, build
pnpm e2e      # browser tests (phone landscape + Steam Deck)
```

## Layout

| Path               | What it is                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| `packages/core`    | Rules engine: grid, pathfinding, combat, turns, AI, saves. No DOM.                      |
| `packages/content` | Data (maps, battles, frames, weapons, cast, shop) and the Ink story, validated with zod |
| `apps/game`        | Web client (Vite + Three.js + Preact), plus Capacitor `android/` and `ios/` projects    |
| `apps/desktop`     | Electron shell for Steam, with optional steamworks.js achievements                      |
