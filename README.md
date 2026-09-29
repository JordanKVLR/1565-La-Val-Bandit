# 1565 (working title)

An original isometric tactical RPG set during the Great Siege of Malta (1565).
Web-first (mobile browser / installable PWA), with Android, iOS and Steam releases planned.

- Design & roadmap: [docs/PLAN.md](docs/PLAN.md)
- Contributor guide: [CLAUDE.md](CLAUDE.md)

## Quick start

Requires Node 22+ and pnpm (`corepack enable`).

```sh
pnpm install
pnpm dev      # open the printed URL; use the --host address to test on your phone
pnpm check    # everything CI runs, except the browser tests
pnpm e2e      # browser tests
```
