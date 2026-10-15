# Technique and XP rethink: plan

Status: **draft for approval. No code has been changed.** Written after the first playtest
feedback (XP too low; the high-level techniques do not make sense). Every number below was
measured from the current data or produced by a throwaway script; none of it ships until you
have approved the direction and the simulation pass has confirmed it.

## 1. What play showed

- XP per battle feels far too low. Attacking a higher-level enemy barely pays more, and a high-level
  pilot levels as easily as a low-level one.
- Techniques unlock by level (good, keep it), but the later ones are not better. In the Arquebus
  screenshot, Sharpshooter (Lv 12) has the same POW (120%) and FP (34) as Aimed Shot (Lv 4), a worse
  hit chance and less armour-piercing. Double Charge and Crossfire cost more FP for no gain. Every
  other faction has the same problem.

## 2. XP: findings and plan

### 2.1 What the numbers say

I ran the AI-vs-AI simulation of all 36 battles (8 seeds each) and recorded every XP-earning
strike. On the current rules:

- A pilot earns **about 200 XP per battle** (median; 40 to 620), which is **0.4 of a level**.
- Following one pilot through the 18 battles of each route (prologue, Act I, then a route), they
  trail the level the story files assume by **up to 1.9 levels** mid-campaign, and finish at level
  9.9 to 11.6 where the files assume 11.
- The level-gap multiplier already exists (±20% per level, 0.1 to 3.0), but the gap is usually small
  (average −2 to +3.4), so it moves the total little. Only the boss fights stand out.
- Levelling costs a flat 500 XP, so level 10 to 11 costs the same as level 1 to 2. That is why
  strong pilots keep levelling quickly.

### 2.2 Proposed rules (all in `balance.json`)

1. **+25% XP everywhere**: a new `xpScale: 1.25`, applied after everything else, so tests can pin
   "exactly 25% more than before".
2. **A steeper bonus for tougher enemies** (enemy level above the attacker's):
   `1 + 0.30·gap + 0.05·gap²`, capped at 4.0.
3. **A real penalty for weaker enemies**: `0.72^gap`, never below 0.05 (a hit is still worth at
   least 1 XP).
4. **Each level costs a little more**: 500 XP at level 1, rising 6% per level (≈ 620 at level 5, 770
   at level 10, 890 at level 14). Reaching level 12 costs 7,150 XP instead of 5,500.

Multiplier on one hit's XP, by how far the enemy is above (+) or below (−) the attacker:

| Gap | Now  | Proposed | Proposed × 1.25 |
| --- | ---- | -------- | --------------- |
| −6  | 0.10 | 0.14     | 0.17            |
| −4  | 0.20 | 0.27     | 0.34            |
| −3  | 0.40 | 0.37     | 0.47            |
| −2  | 0.60 | 0.52     | 0.65            |
| −1  | 0.80 | 0.72     | 0.90            |
| 0   | 1.00 | 1.00     | 1.25            |
| +1  | 1.20 | 1.35     | 1.69            |
| +2  | 1.40 | 1.80     | 2.25            |
| +3  | 1.60 | 2.35     | 2.94            |
| +5  | 2.00 | 3.75     | 4.69            |
| +6  | 2.20 | 4.00     | 5.00            |

### 2.3 Does it hit the pacing target?

Pilot level after each battle, with a pilot who falls behind meeting relatively tougher enemies
(so they earn more), compared with the level the story files assume. Final battle shown; the
whole curve is in the simulation notes.

| Route                        | Story assumes | Now                    | +25% only       | **Proposed (all four rules)** |
| ---------------------------- | ------------- | ---------------------- | --------------- | ----------------------------- |
| Cross (Order)                | 11.0          | 11.6                   | 13.0            | **12.1**                      |
| Island                       | 11.0          | 10.7                   | 12.0            | **12.0**                      |
| Crescent                     | 11.2          | 9.9                    | 11.1            | **10.9**                      |
| Worst mid-campaign shortfall |               | 1.9 / 1.5 / 1.8 levels | 1.1 / 0.9 / 1.0 | **1.1 / 1.1 / 1.6**           |

- "+25% only" overshoots at the finale, because the boss battles pay so much.
- The growing level cost holds the late game back, which is the behaviour you asked for, while the
  25% and the steeper bonus close the mid-campaign gap.
- Caveat: the AI plays the pilots, and XP concentrates on whoever fights in real play. I will
  re-measure against the live game before and after.

### 2.4 Code touched

`xpFor` in `combat.ts` (new level factor and scale); a `xpToNextLevel(level, balance)` helper in core
used by `addXp` (commands.ts), `GameSession.ts` and `progression.ts` (carry-over), the XP bar in
`UnitPanels.tsx`, `XpPanel.tsx` and `ResultsScreen.tsx`. Saved XP stays a remainder within the
level, so old saves load unchanged. The XP pop-up gains a text chip such as "Tougher foe ×1.8" or
"Outclassed foe ×0.4" (words and a sign, not colour). Tests: exact values of the curve,
continuity at gap 0, the caps, the level costs, and the carry-over.

## 3. Techniques: findings and plan

### 3.1 Why the list does not make sense

I scored every technique by **expected damage per use** against a mid-campaign target (30 raw
damage, DEF 8, 65% base hit), counting power, strikes, accuracy and armour piercing. Compared with
the starter attack:

- **41 of 46** techniques deal at most 1.1× a starter's damage per use. **18 deal less.**
- **37 of 46** are worse than the starter per AP spent.
- **11 of the 13** techniques at level 9 or higher are weaker than the best technique at level 5 or
  lower in their own pool.
- Damage per use sits at about 1.0× from level 3 to level 14: level 3 is as good as level 14.

| Pool            | Technique (Lv)                                                                    | Damage per use vs starter     |
| --------------- | --------------------------------------------------------------------------------- | ----------------------------- |
| Militia firearm | Aimed Shot (4) / Double Charge (7) / Crossfire (9) / Sharpshooter (12)            | 2.31× / 1.07× / 0.60× / 1.31× |
| Scala firearm   | Grapeshot (6) / Siege Bolt (9) / Full Broadside (14)                              | 0.63× / 1.22× / 0.44×         |
| Scala blunt     | Piston Strike (4) / Steam Hammer (8) / Overpressure (12)                          | 1.08× / 0.98× / 0.67×         |
| Ottoman blade   | Crescent Slash (3) / Janissary's Oath (7) / Twin Moons (9) / Sultan's Edge (13)   | 1.08× / 1.05× / 0.63× / 0.98× |
| Order blade     | Cross Cut (3) / Pilgrim's Thrust (4) / Eight-Point Flurry (8) / Last Rampart (12) | 1.08× / 1.20× / 0.63× / 0.90× |

### 3.2 Root cause: three taxes on power and no mastery

The cost formula charges a heavier technique **three times**: AP (50 per power), FP (45 per power)
and **accuracy (60 points per power)**. A 1.6-power technique hits about 36 points less often, so
its extra damage is cancelled and the AP and FP bills are pure loss. Twin-strike techniques are
worse again, because armour is subtracted from each strike. Nothing in the rules rewards having
reached a high level, so the numbers cannot be fixed one technique at a time; the formula has to
change.

### 3.3 Principles for the rewrite

1. **Later is better, always.** Within a weapon pool, each technique beats the one before in damage
   per use, and none is worse than a starter per AP.
2. **Everything at a level is worth the same; techniques differ in how they spend it.** A
   level-by-level value budget (§3.4) is spent on one signature: _Burst_ (raw power), _Precision_
   (accuracy and piercing), _Flurry_ (two strikes that ignore half of DEF), _Control_ (fatigue,
   cannot be countered), or _Mastery_ (the pool's best, a bit of everything).
3. **POW visibly climbs.** Players read POW first, so a single-strike technique's POW rises with
   level (about 110% at level 3 to 160% at level 13) and the signature makes up the rest.
4. **A new technique roughly every two levels** (levels 3 to 14), so levelling keeps paying.
5. **Rules are tested.** A content test fails if any rule above is broken (§3.7), so the list
   cannot drift again.

### 3.4 The value budget and the new cost model

- `value = expected damage per use + 0.12 per FP of fatigue inflicted + 0.4 if it cannot be countered`,
  measured in starter attacks.
- **Target by level: 1.15× at level 3, rising 0.12 per level, to about 2.4× at level 13.**
- **Mastery discounts**: every 2 levels of a technique's unlock level is a _rank_; each rank cuts its
  FP cost 5% and its AP cost 3%, and adds 2 accuracy. So a master technique is not only stronger
  but more economical.
- **The accuracy tax drops from 60 to 15 points per power** for faction techniques. The starters
  keep their current formula, so early-game balance does not move.
- All of these are new keys in `balance.json`; the technique files keep their own power, strikes and
  signature, and the costs are computed, so retuning later is one number.

### 3.5 Before and after, for the four techniques in your screenshot

| Technique     | Now (Lv: POW, HIT, AP, FP, damage vs starter) | Proposed                                             |
| ------------- | --------------------------------------------- | ---------------------------------------------------- |
| Aimed Shot    | Lv 4: 120%, +25, 55, 34, **2.31×**            | Lv 4: 110%, +0, 35, 29, ignores 25% DEF, **1.33×**   |
| Double Charge | Lv 7: 135%, −21, 50, 41, 1.07×                | Lv 6: 130%, −1, 40, 37, **1.48×**                    |
| Crossfire     | Lv 9: 65% ×2, −18, 45, 39, 0.60×              | Lv 8: 65% ×2, +7, 40, 36, ignores 50% DEF, **1.66×** |
| Sharpshooter  | Lv 12: 120%, −12, 40, 34, 1.31×               | Lv 13: 160%, +3, 50, 42, ignores 40% DEF, **2.37×**  |

**Aimed Shot is the outlier today** (2.3× a starter, far above anything else in the game), so the
ladder trims it. It is the most-used technique (militia gunners fill 57 player-side unit slots across the
battles), so this is a deliberate change you should know about; see decision 1 in §6.

### 3.6 The draft list: 71 techniques (46 existing, 25 new)

Existing names, lore and styles are kept; most are re-levelled and re-statted. **NEW** names are
drafts for you to rename or veto. "Value" is damage-plus-effects against a starter attack. All
numbers are the generator's first pass, every row within 10% of its level's budget; the simulation
pass sets the final ones.

**Order · blade**

| Lv  | Technique              | Role      | POW    | HIT | AP  | FP  | Extras                            | Value |
| --- | ---------------------- | --------- | ------ | --- | --- | --- | --------------------------------- | ----- |
| 3   | Cross Cut              | Burst     | 110%   | +0  | 35  | 9   | -                                 | ×1.17 |
| 5   | Pilgrim's Thrust       | Precision | 115%   | +2  | 35  | 11  | ignores 15% DEF                   | ×1.39 |
| 7   | Shieldbreaker          | Control   | 120%   | +3  | 35  | 12  | +15 FP to target                  | ×1.65 |
| 9   | Eight-Point Flurry     | Flurry    | 70% ×2 | +8  | 45  | 18  | ignores 50% DEF                   | ×1.87 |
| 11  | Stoccata Lunga **NEW** | Precision | 140%   | +14 | 45  | 17  | ignores 10% DEF                   | ×2.11 |
| 13  | Last Rampart           | Mastery   | 160%   | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target | ×2.33 |

**Order · blunt**

| Lv  | Technique                   | Role      | POW  | HIT | AP  | FP  | Extras                            | Value |
| --- | --------------------------- | --------- | ---- | --- | --- | --- | --------------------------------- | ----- |
| 3   | Shield Bash                 | Control   | 105% | +1  | 30  | 7   | cannot be countered               | ×1.16 |
| 5   | Rim Strike **NEW**          | Precision | 115% | +4  | 35  | 11  | +10 FP to target                  | ×1.50 |
| 7   | Bell-Ringer                 | Control   | 120% | +3  | 35  | 12  | +15 FP to target                  | ×1.65 |
| 10  | Helm Splitter **NEW**       | Burst     | 140% | +2  | 45  | 18  | ignores 40% DEF                   | ×1.99 |
| 13  | Knell of Saint John **NEW** | Mastery   | 160% | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target | ×2.33 |

**Order · polearm**

| Lv  | Technique                     | Role    | POW  | HIT | AP  | FP  | Extras                                | Value |
| --- | ----------------------------- | ------- | ---- | --- | --- | --- | ------------------------------------- | ----- |
| 3   | Hedge of Pikes                | Control | 105% | +1  | 30  | 7   | cannot be countered                   | ×1.16 |
| 5   | Lance of Aragon               | Burst   | 120% | +1  | 40  | 13  | -                                     | ×1.35 |
| 8   | Halberd Hook **NEW**          | Control | 125% | +2  | 40  | 14  | +15 FP to target, cannot be countered | ×1.77 |
| 11  | Knight's Charge               | Burst   | 155% | +2  | 50  | 22  | ignores 20% DEF                       | ×2.11 |
| 13  | Charge of the Langues **NEW** | Mastery | 160% | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target     | ×2.33 |

**Militia · blade**

| Lv  | Technique            | Role    | POW    | HIT | AP  | FP  | Extras                            | Value |
| --- | -------------------- | ------- | ------ | --- | --- | --- | --------------------------------- | ----- |
| 3   | Fisherman's Hook-Cut | Burst   | 110%   | +0  | 35  | 9   | -                                 | ×1.17 |
| 5   | Żejtun Feint         | Flurry  | 55% ×2 | +8  | 35  | 9   | ignores 50% DEF                   | ×1.31 |
| 7   | Harvest Swing        | Control | 120%   | +3  | 35  | 12  | +15 FP to target                  | ×1.65 |
| 10  | Carob Split          | Burst   | 160%   | -1  | 55  | 26  | -                                 | ×1.97 |
| 13  | Last Stand **NEW**   | Mastery | 160%   | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target | ×2.33 |

**Militia · polearm**

| Lv  | Technique           | Role    | POW  | HIT | AP  | FP  | Extras                                | Value |
| --- | ------------------- | ------- | ---- | --- | --- | --- | ------------------------------------- | ----- |
| 3   | Pitchfork Jab       | Burst   | 110% | +0  | 35  | 9   | -                                     | ×1.17 |
| 5   | Brace and Drive     | Control | 115% | +2  | 35  | 11  | +5 FP to target, cannot be countered  | ×1.43 |
| 8   | Watchtower Sweep    | Control | 125% | +2  | 40  | 14  | +15 FP to target                      | ×1.72 |
| 10  | Gaff Hook **NEW**   | Control | 130% | +3  | 40  | 15  | +20 FP to target, cannot be countered | ×1.97 |
| 13  | Wallbreaker **NEW** | Mastery | 160% | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target     | ×2.33 |

**Militia · firearm**

| Lv  | Technique           | Role      | POW    | HIT | AP  | FP  | Extras          | Value |
| --- | ------------------- | --------- | ------ | --- | --- | --- | --------------- | ----- |
| 4   | Aimed Shot          | Precision | 110%   | +0  | 35  | 29  | ignores 25% DEF | ×1.33 |
| 6   | Double Charge       | Burst     | 130%   | -1  | 40  | 37  | -               | ×1.48 |
| 8   | Crossfire           | Flurry    | 65% ×2 | +7  | 40  | 36  | ignores 50% DEF | ×1.66 |
| 10  | Braced Shot **NEW** | Precision | 135%   | +8  | 40  | 37  | ignores 30% DEF | ×2.00 |
| 13  | Sharpshooter        | Mastery   | 160%   | +3  | 50  | 42  | ignores 40% DEF | ×2.37 |

**Ottoman · blade**

| Lv  | Technique           | Role      | POW    | HIT | AP  | FP  | Extras                            | Value |
| --- | ------------------- | --------- | ------ | --- | --- | --- | --------------------------------- | ----- |
| 3   | Crescent Slash      | Burst     | 110%   | +0  | 35  | 9   | -                                 | ×1.17 |
| 5   | Drawing Cut **NEW** | Precision | 115%   | +6  | 35  | 11  | ignores 5% DEF                    | ×1.40 |
| 7   | Janissary's Oath    | Burst     | 140%   | +0  | 45  | 20  | -                                 | ×1.67 |
| 9   | Twin Moons          | Flurry    | 70% ×2 | +8  | 45  | 18  | ignores 50% DEF                   | ×1.87 |
| 13  | Sultan's Edge       | Mastery   | 160%   | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target | ×2.33 |

**Ottoman · firearm**

| Lv  | Technique                     | Role      | POW    | HIT | AP  | FP  | Extras           | Value |
| --- | ----------------------------- | --------- | ------ | --- | --- | --- | ---------------- | ----- |
| 3   | Steady Volley                 | Burst     | 110%   | +0  | 35  | 29  | -                | ×1.17 |
| 6   | Rolling Fire                  | Flurry    | 60% ×2 | +7  | 40  | 33  | ignores 50% DEF  | ×1.48 |
| 8   | Tufek Salvo **NEW**           | Control   | 125%   | +2  | 40  | 34  | +15 FP to target | ×1.72 |
| 10  | Marksman of the Orta          | Precision | 135%   | +8  | 40  | 37  | ignores 30% DEF  | ×2.00 |
| 13  | Fire Line of the Orta **NEW** | Mastery   | 80% ×2 | +13 | 50  | 42  | ignores 50% DEF  | ×2.40 |

**Ottoman · polearm**

| Lv  | Technique                 | Role    | POW  | HIT | AP  | FP  | Extras                                | Value |
| --- | ------------------------- | ------- | ---- | --- | --- | --- | ------------------------------------- | ----- |
| 3   | Lance Feint               | Control | 105% | +1  | 30  | 7   | cannot be countered                   | ×1.16 |
| 5   | Sipahi Charge             | Burst   | 120% | +1  | 40  | 13  | -                                     | ×1.35 |
| 8   | Hooked Spear Pull **NEW** | Control | 125% | +2  | 40  | 14  | +15 FP to target, cannot be countered | ×1.77 |
| 10  | Akinji Sweep **NEW**      | Control | 130% | +3  | 40  | 15  | +25 FP to target                      | ×2.00 |
| 13  | Thunder of Hooves         | Mastery | 160% | +3  | 50  | 22  | +20 FP to target                      | ×2.43 |

**Ottoman · explosive**

| Lv  | Technique               | Role    | POW    | HIT | AP  | FP  | Extras                                    | Value |
| --- | ----------------------- | ------- | ------ | --- | --- | --- | ----------------------------------------- | ----- |
| 4   | Fire Pot                | Control | 110%   | +0  | 35  | 29  | +5 FP to target                           | ×1.25 |
| 6   | Smoke and Iron          | Control | 120%   | +1  | 40  | 33  | +10 FP to target                          | ×1.52 |
| 9   | Humbara Cluster **NEW** | Flurry  | 65% ×2 | +3  | 40  | 35  | ignores 50% DEF, +10 FP to target per hit | ×1.91 |
| 11  | Burning Pitch           | Burst   | 135%   | +5  | 40  | 36  | +25 FP to target                          | ×2.13 |
| 13  | Tophane Barrage **NEW** | Mastery | 70% ×2 | +6  | 40  | 36  | ignores 40% DEF, +20 FP to target per hit | ×2.36 |

**Corsair · blade**

| Lv  | Technique             | Role    | POW    | HIT | AP  | FP  | Extras                                    | Value |
| --- | --------------------- | ------- | ------ | --- | --- | --- | ----------------------------------------- | ----- |
| 3   | Boarding Slash        | Burst   | 110%   | +0  | 35  | 9   | -                                         | ×1.17 |
| 5   | Deck Dance            | Flurry  | 55% ×2 | +8  | 35  | 9   | ignores 50% DEF                           | ×1.31 |
| 8   | Salt and Steel        | Control | 125%   | +2  | 40  | 14  | +15 FP to target                          | ×1.72 |
| 10  | Cutlass Storm **NEW** | Flurry  | 60% ×2 | +13 | 35  | 11  | ignores 50% DEF, +10 FP to target per hit | ×1.94 |
| 13  | Barbary Reaper        | Mastery | 160%   | +3  | 50  | 22  | ignores 10% DEF, +10 FP to target         | ×2.33 |

**Corsair · polearm**

| Lv  | Technique              | Role      | POW  | HIT | AP  | FP  | Extras                                | Value |
| --- | ---------------------- | --------- | ---- | --- | --- | --- | ------------------------------------- | ----- |
| 3   | Boat-Hook Jab **NEW**  | Burst     | 110% | +0  | 35  | 9   | -                                     | ×1.17 |
| 5   | Grapple                | Control   | 115% | +2  | 35  | 11  | +5 FP to target, cannot be countered  | ×1.43 |
| 8   | Keelhaul               | Control   | 125% | +2  | 40  | 14  | +15 FP to target                      | ×1.72 |
| 10  | Harpoon Thrust **NEW** | Precision | 135% | +3  | 40  | 17  | ignores 50% DEF                       | ×2.01 |
| 13  | Drowning Hook **NEW**  | Mastery   | 160% | +3  | 50  | 22  | +25 FP to target, cannot be countered | ×2.58 |

**Scala · blunt**

| Lv  | Technique             | Role    | POW  | HIT | AP  | FP  | Extras           | Value |
| --- | --------------------- | ------- | ---- | --- | --- | --- | ---------------- | ----- |
| 4   | Piston Strike         | Burst   | 115% | +0  | 35  | 11  | -                | ×1.25 |
| 6   | Valve Release **NEW** | Control | 120% | +1  | 40  | 13  | +10 FP to target | ×1.52 |
| 8   | Steam Hammer          | Control | 125% | +2  | 40  | 14  | +15 FP to target | ×1.72 |
| 10  | Governor Slam **NEW** | Burst   | 145% | +1  | 45  | 20  | ignores 30% DEF  | ×1.98 |
| 13  | Overpressure          | Mastery | 160% | +3  | 50  | 22  | +20 FP to target | ×2.43 |

**Scala · firearm**

| Lv  | Technique          | Role      | POW    | HIT | AP  | FP  | Extras                                    | Value |
| --- | ------------------ | --------- | ------ | --- | --- | --- | ----------------------------------------- | ----- |
| 4   | Rivet Shot **NEW** | Precision | 110%   | +0  | 35  | 29  | ignores 20% DEF                           | ×1.30 |
| 6   | Grapeshot          | Flurry    | 60% ×2 | +7  | 40  | 33  | ignores 50% DEF                           | ×1.48 |
| 9   | Siege Bolt         | Precision | 130%   | +6  | 40  | 35  | ignores 30% DEF                           | ×1.86 |
| 11  | Chain Shot **NEW** | Control   | 70% ×2 | +10 | 45  | 37  | ignores 40% DEF, +10 FP to target per hit | ×2.11 |
| 14  | Full Broadside     | Mastery   | 70% ×2 | +18 | 40  | 36  | ignores 50% DEF, +10 FP to target per hit | ×2.47 |

### 3.7 Guardrails (content tests)

- Within each faction and weapon pool, value never falls as the level rises, and a single-strike
  technique's POW never falls.
- No technique is worse than its pool's starter per AP.
- No technique below level 3 and none above 14; at most one new technique per pool per two levels.
- Every technique has a name, a description and a signature; a flurry always ignores at least half of DEF.
- The generated `docs/ATTACKS.md` is rebuilt from the data and checked in CI so it cannot go stale.

### 3.8 Enemies, difficulty and saves

- Enemies use the same rule, so late enemies hit harder as the ladder rises. I will compare AI-vs-AI
  win rates for all 36 battles before and after, and tune the ladder's two numbers (start and slope)
  until difficulty is within about ±5 points of today.
- Technique ids do not change, and unlocks are computed live from level and stats, so **saves load
  unchanged**. A pilot who already passed a technique's old level may find it moved up by a level or
  two (for example Sharpshooter 12 → 13).
- The attack menu and technique card keep their layout. They gain a small rank mark (pips plus the
  word "Master" for the top technique), and the signature shows as a text chip. Nothing relies on
  colour.

## 4. Delivery in four steps

Each step ends with `pnpm check`, the e2e suite and the AI-vs-AI simulation, then merge and deploy.

1. **XP** (§2): small, ships first, and you can feel it straight away.
2. **Re-stat the 46 existing techniques** (§3.4 and the existing rows of §3.6): this is the fix for
   the complaint. New cost model, new tests, regenerated `docs/ATTACKS.md`, ADR 0016.
3. **Add the 25 new techniques**: new names, lore and duel animations per style; optional if you
   would rather stop at 46.
4. **UI**: rank marks, signature chips, the XP bonus chip.

## 5. Risks

- **Balance moves.** Both changes shift difficulty, so each step is calibrated with the simulation
  and the numbers stay in data files.
- **Aimed Shot nerf** (§3.5) for the most-used pool.
- **The simulation is the AI.** It is a floor for a human player, so your next playtest is the real
  check; I will say which battles changed most.
- **More content** (25 techniques) means more names, lore and animations to review.

## 6. Decisions for you

1. **Aimed Shot**: trim it to fit the ladder (my recommendation), or keep it as a standout and lift
   the whole ladder (more lethal late game)?
2. **Scope**: re-stat the 46 existing techniques only, or also add the 25 new ones (an unlock about
   every two levels)?
3. **Level cost growth**: 6% per level (my recommendation), 0 (flat 500), or steeper?
4. **XP chip wording**: "Tougher foe ×1.8" and "Outclassed foe ×0.4": good, or do you prefer other
   words?
5. **Names**: veto or rename any of the 25 draft names in §3.6.
