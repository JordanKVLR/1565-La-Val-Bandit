# 24. Technique power curve and cost profiles

## Status

Accepted. Supersedes the technique cost model of ADR 0023 and its rule that techniques are "not a
ladder". ADR 0023's attack kinds, hit rules, stat parity and Counter numbers still stand.

## Context

Playtest feedback: "the basic attacks are still viable and the new attacks are usable for some of
their effects, but they all feel equally powerful. The more advanced a technique, the better the
power should be, especially if it uses more AP."

A side-by-side audit against the classic game this one is modelled on found three causes:

1. **A flat curve.** Median power × hits went 1.0 (starters) → 1.16 (levels 3-6) → 1.18 (7-12)
   → 1.41 (13-17) → 1.75 (21-25). In the classic, damage moves roughly double from basic to
   signature (median 1.0 → 2.1, top 3.15).
2. **Both resources charged at full rate.** AP = 30 + 50p and FP = 5 + 45p, so power per 100
   AP + FP fell from 2.7 (starters) to 1.4 (signatures). The classic charges a strong move heavily in
   one resource and lightly in the other (Blizzard Break 80 AP / 10 FP, Bursting Fire 10 / 80).
   Across our list AP and FP correlated +0.74; in the classic, −0.40.
3. **Accuracy fell with tier** (about +1 → −9), while the classic's advanced moves land more
   often (−13 → +13).

Because a turn's 100 AP can be spent on several strikes, five 20-AP Slashes (41 expected damage
against the reference target) out-damaged every signature turn (14-23). Raising power alone does
not fix this: under the old AP slope a 3.2-power move costs about 85 AP, which leaves no room for a
follow-up strike, and the turn does less damage. The extra power only pays off if heavy moves also
cost less AP.

## Decision

**Power curve.** Each technique has a `tool` in `attacks.json`. Its power × hits is
`techPowerBase` + `techPowerPerLevel` × unlock level (1 + 0.09 L: 1.3 at L3, 2.2 at L13,
3.25 at L25), times the tool's share:

| Tool                               | Share |
| ---------------------------------- | ----- |
| heavy                              | 1.10  |
| precise, flurry, pierce, knockdown | 0.90  |
| pierce of ≥ 60% DEF, collision     | 0.85  |
| exhaust, debuff                    | 0.80  |

Gunfire ×1.25 and bombs ×1.5 apply on top (ADR 0023 revision), capped at `techPowerCap` 3.4. The
classic's highest player move is 3.15. Content tests hold every technique to the curve within
`techPowerTolerance` (5%), so the designer can nudge a technique without touching code.

**Two cost profiles.** With p = power × hits − 1:

- **Weight** (heavy, precise, knockdown, collision): AP 30 + 15p, FP 5 + 20p. These moves cost
  the most AP, as the playtest asked, but at about 65-70 AP a level-21 move still leaves room for
  one starter strike or a short step.
- **Spirit** (flurry, pierce, exhaust, debuff, and every gun or bomb technique): AP 25 + 5p,
  FP 10 + 40p. You can move and strike, then you are tired.

Knockdown adds 10 AP and collision 15 AP. Shot, volley and throw add 20 FP. A technique costs
between `techniqueFpMin` 10 and `techFpMax` 80 FP. The other extras' prices (pierce, fatigue, sap,
slow, accuracy) stay in the balance table at zero: the tool's share of the curve already pays for
its effect.

**Accuracy by tier.** Techniques no longer lose accuracy per point of power
(`techniqueAccPerPower` 0). They gain +5 from level 7, +10 from 13 and +15 from 18. Precise
techniques add +15 (+12 for gunfire), and heavy ones take −10.

**Starters.** These stay the cheapest damage per FP. The minimum AP rises from 20 to 25 (the
classic's Slash is 30), so four light strikes fit in a turn, not five. Starters still use the
shared formula's −60p accuracy.

**Retuned content.** Every technique's power and `accuracyBonus` now come from the curve. Two
techniques changed tool so a pool never repeats one twice running: Braced Shot is now heavy and
drops its pierce, and Sharpshooter stays a pierce.

**Tests.** `content.test.ts` now checks the curve, checks that each tool shows in the numbers,
and checks that a pool's last technique outhits its first by 1.5×. The FP-per-damage rule from
ADR 0023 stays, but the basic is now given the technique's tier accuracy so the two are compared
at equal aim. `technique-curve.test.ts` covers the core formulas.

## Consequences

- Against the reference target, a level-21 signature plus a Slash now beats four Slashes by about
  25-40% and invites fewer strike backs. A level-13 move plus two Slashes beats them by about 25%.
- Pilots tire faster: the mean technique FP rose from 36 to about 40. Starters are the only strike
  back most pilots can afford (Attack back costs AP + FP as fatigue, and a signature goes past 100).
- Enemies draw on the same pools, so fights get shorter and enemy damage rises with level. In the
  AI-vs-AI suite (16 seeds per battle), average battle length fell by roughly a third (a3: 20.9 →
  11.9 rounds). Most win counts moved by 0-4. The big drops were c9 St Paul's Bay (12 → 1/16),
  c6 Boat Road (16 → 8), c4 Corradino (11 → 6) and a9 Marsa Lines (7 → 2). a8 St Michael rose
  (5 → 10). In c9, the escort target Leyla now dies early to the mid-tier gunfire, and lowering
  enemy levels did not help, because their stats are fixed in the battle file. The Pasha's Guard
  gunner now holds its post (`ai: hold`), which brings c9 back to 3/16. a2, a3 and a9 sit at
  2/16, the suite's floor. These need a human playtest, and probably a retune pass on the Act III
  and Iberian battles.
- Battle saves bump to version 12 (new balance keys). The campaign save is unaffected.
- Some lore text still says "hits a little harder than a plain strike" where the numbers are now
  much higher. The tests only check effects, not degrees. Reword it in a writing pass.
- Reference: the audit with charts and the full classic attack list (from the RPGClassics
  Vanguard Bandits shrine) was shared as a separate page during design review.
