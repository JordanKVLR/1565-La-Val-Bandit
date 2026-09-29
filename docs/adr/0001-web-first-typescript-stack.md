# ADR 0001: Web-first TypeScript stack

- Status: accepted (2026-09-29)

## Context

The game must run in mobile browsers first, then ship to the iOS/Android stores and Steam from
a single codebase, and stay easy to maintain.

## Decision

TypeScript monorepo (pnpm workspaces): Vite + Three.js for rendering, Preact for the DOM UI
overlay, and a headless `@m1565/core` rules package. Capacitor will wrap the web build for
mobile stores, and Electron + steamworks.js for Steam.

## Consequences

- One language and one build for all platforms; the rules are testable without a browser.
- No visual editor like Godot/Unity. Maps are authored as data (Tiled importer planned).
- Mobile WebGL performance must be watched (budgets in PLAN §5.5).
