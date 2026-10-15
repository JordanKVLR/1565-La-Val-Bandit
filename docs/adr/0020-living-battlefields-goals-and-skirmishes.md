# 0020: Living battlefields, optional goals and skirmishes

Status: accepted

## Context

Every battle was a static set-piece: same units, same ground, one way to win. We wanted fights
that change as they go, reasons to play them well, and optional fights between chapters.

## Decisions

- **Scripted events** (`script` in a battle file): each fires once, on `{round}` or when a named
  unit is `{defeated}`. Actions: `reinforce` (units arrive on their tile or the nearest free
  walkable one; they take their first turn the next round), `terrain` (rewrites tiles, the
  renderer redraws the ground) and `message` (a line from a cast member, shown as a notice and in
  the log). Core runs them in `script.ts` and reports a `scriptEvent`. State carries the unfired
  events, so saves resume correctly; the field is optional, so no save version bump.
  Round-1 events fire before the first event list is returned and are not shown: use round 2+.
- **Optional goals** (`bonus` in a battle file): `rounds` (win within N), `noLosses`,
  `keepAlive` (a named unit stands at the end). Each pays its own scudi and parts when met,
  judged by core's `bonusResults` on the won battle. They show in the objectives panel with their
  rewards and, after the battle, as "Goal met / Goal missed" lines (words and a star, never colour
  alone). Round limits come from the AI-vs-AI average rounds (about 75–80%).
- **Skirmishes** (`data/skirmishes.json` + `s*.json` battles): optional fights offered in the Camp
  sheet once their battle is won (route-specific ones only on their route), each fought once. A
  skirmish battle has a `squad`: the company fills the start tiles from the roster, Ninu first; the
  `fallback` characters stand in when there is no roster (the balance simulation). Losing costs
  nothing; the company returns to camp and the story waits where it was.
- **Balance**: reinforcements make the AI-vs-AI win rate drop sharply, so each is a single unit
  at a lower level arriving late (round 4–6). The balance test still requires 2 of 16 wins.
