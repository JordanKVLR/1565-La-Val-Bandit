# Attacks

Generated from `packages/content/data/attacks.json` and `balance.json` by
`packages/content/test/attacks-doc.test.ts` (run it with `UPDATE_DOCS=1` to rewrite this file; the
test fails when the file is out of date). Every pilot also has the two **starter** attacks for their
weapon; a faction technique unlocks when the pilot has reached its **Level** and their stats (gear
included) meet the requirement (ADR 0015). The cost model and the attack kinds are in ADR 0023 (ADR 0017's value ladder was replaced by it).

## Starter attacks (every pilot, no requirement)

| Weapon    | Attack         | Style    | Power         | Range  |
| --------- | -------------- | -------- | ------------- | ------ |
| Blade     | Slash (basic)  | slash    | 0.8           | 1      |
| Blade     | Thrust         | thrust   | 1.0           | 1      |
| Polearm   | Thrust (basic) | thrust   | 1.0           | 1      |
| Polearm   | Long Thrust    | thrust   | 1.0 (-20 acc) | 1-2    |
| Blunt     | Bash (basic)   | bash     | 0.8           | 1      |
| Blunt     | Smash          | overhead | 1.0           | 1      |
| Firearm   | Fire (basic)   | shot     | 1.0           | weapon |
| Firearm   | Stock Strike   | bash     | 0.8           | 1      |
| Explosive | Throw (basic)  | throw    | 1.0           | weapon |
| Explosive | Shove          | bash     | 0.5           | 1      |

## How techniques are costed and judged

- **Cost model:** AP is 30 + 50 per point of total power above 1 and FP is 5 + 45 per point (ranged styles pay 20 more); accuracy falls 15 per point of power. Extras are priced on top: a knockdown costs 10 AP and 10 FP, a collision 15 AP and 20 FP, piercing 20 FP per whole point of DEF ignored, fatigue inflicted 0.5 FP per FP, a sap 10 FP, each MOV of slow 6 FP, and each point of accuracy bonus 0.5 AP and 0.5 FP. There are no rank discounts: a later technique is a different tool, not a cheaper copy of an earlier one (ADR 0023).
- **Value (a yardstick, not a ladder):** expected damage per use against a reference target (30 raw damage, DEF 8, 55% base hit), plus 0.12 per FP of fatigue inflicted and the worth of a knockdown (0.5), collision (0.9), sap (0.3) or slow (0.2 per MOV), in units of a plain power-1.0 strike. Tested in `content.test.ts`: every technique costs more FP per damage than the weapon's basic strike, offers a tool the basics lack, and no pool repeats a tool twice running.
- **Attack kinds** (after the classic): a **knockdown** that lands topples the defender unless it chose Defend: its strike back is cancelled and it starts its next turn 35 AP short. A **collision** topples through Defend too (55 AP). Neither can be countered; Avoid is the answer to both. A **sap** leaves the target dealing 70% damage, and a **slow** takes MOV off it, until its next turn is over.
- **Tools:** _Precise_ (accuracy), _Flurry_ (two or three armour-piercing strikes), _Pierce_ (a single armour-piercing blow), _Heavy_ (raw power, dear in AP and FP), _Knockdown_ and _Collision_ (no strike back, AP lost), _Exhaust_ (heavy fatigue) and _Sap/Slow_ (debuffs). Names, lore and requirements are in `attacks.json`.

## Unlock-level curve

Every technique opens at a set pilot level, so nobody has more than the two starters at levels 1-2 and techniques arrive gradually through the campaign (prologue pilots are level 1-6, the later acts 5-12). Each faction and weapon pool opens its first technique by level 4, a new one at least every 3 levels, and ends with a signature technique at level 13 or later.

## The 113 techniques

| #   | Faction | Attack                       | Weapon      | Frame        | Style    | Power | Hits | AP  | FP  | Acc | Range  | Level | Value | Needs                  | Extras                                       |
| --- | ------- | ---------------------------- | ----------- | ------------ | -------- | ----- | ---- | --- | --- | --- | ------ | ----- | ----- | ---------------------- | -------------------------------------------- |
| 1   | Corsair | Boarding Slash               | blade       | any          | slash    | 1.00  | 1    | 35  | 11  | +12 | weapon | 3     | 1.22× | AGL 9                  | -                                            |
| 2   | Corsair | Deck Dance                   | blade       | any          | slash    | 0.60  | 2    | 40  | 26  | +1  | weapon | 5     | 1.28× | BAS 7, AGL 12          | ignores 50% DEF                              |
| 3   | Corsair | Salt and Steel               | blade       | any          | sweep    | 0.80  | 1    | 20  | 18  | +3  | weapon | 8     | 1.12× | POW 11, AGL 10         | +25 FP to target                             |
| 4   | Corsair | Cutlass Storm                | blade       | any          | slash    | 0.70  | 2    | 55  | 42  | +0  | weapon | 10    | 1.80× | DEX 11, AGL 14         | ignores 55% DEF, +10 FP to target per hit    |
| 5   | Corsair | Barbary Reaper               | blade       | any          | sweep    | 1.60  | 1    | 60  | 32  | -9  | weapon | 13    | 1.47× | BAS 5, POW 12, AGL 15  | -                                            |
| 6   | Corsair | Boarding Frenzy              | blade       | any          | slash    | 0.80  | 2    | 65  | 48  | -1  | weapon | 17    | 1.78× | DEX 14, AGL 16         | ignores 60% DEF                              |
| 7   | Corsair | Sea-Wolf's Rush              | blade       | any          | charge   | 1.70  | 1    | 80  | 62  | -10 | weapon | 21    | 1.78× | POW 18, AGL 18         | +10 FP to target, collision                  |
| 8   | Corsair | Scourge of the Barbary Coast | blade       | any          | slash    | 0.55  | 3    | 65  | 49  | -2  | weapon | 25    | 1.67× | POW 21, DEX 16, AGL 20 | ignores 55% DEF                              |
| 9   | Corsair | Boat-Hook Jab                | polearm     | any          | thrust   | 1.00  | 1    | 35  | 11  | +12 | weapon | 3     | 1.22× | POW 8                  | -                                            |
| 10  | Corsair | Grapple                      | polearm     | any          | thrust   | 1.00  | 1    | 40  | 15  | +0  | weapon | 5     | 1.06× | POW 9                  | knockdown                                    |
| 11  | Corsair | Keelhaul                     | polearm     | any          | bash     | 0.90  | 1    | 25  | 11  | +1  | weapon | 8     | 0.91× | POW 12                 | slows 1                                      |
| 12  | Corsair | Harpoon Thrust               | polearm     | any          | thrust   | 1.15  | 1    | 35  | 25  | -2  | 1-2    | 10    | 1.32× | POW 12, DEX 11         | ignores 65% DEF                              |
| 13  | Corsair | Drowning Hook                | polearm     | any          | bash     | 1.15  | 1    | 45  | 27  | -2  | weapon | 13    | 1.33× | BAS 6, POW 13, AGL 12  | +10 FP to target, knockdown                  |
| 14  | Corsair | Gaff and Chain               | polearm     | any          | thrust   | 1.00  | 1    | 30  | 17  | +0  | weapon | 17    | 1.04× | POW 17, AGL 15         | slows 2                                      |
| 15  | Corsair | Harpooner's Heave            | polearm     | any          | thrust   | 1.30  | 1    | 50  | 38  | +0  | 1-2    | 21    | 1.60× | POW 19, DEX 16         | ignores 80% DEF                              |
| 16  | Corsair | Leviathan Hook               | polearm     | any          | bash     | 1.70  | 1    | 80  | 62  | -10 | weapon | 25    | 1.78× | BAS 11, POW 22, AGL 17 | +10 FP to target, collision                  |
| 17  | Militia | Fisherman's Hook-Cut         | blade       | any          | slash    | 1.00  | 1    | 35  | 11  | +12 | weapon | 3     | 1.22× | AGL 9                  | -                                            |
| 18  | Militia | Żejtun Feint                 | blade       | any          | slash    | 0.60  | 2    | 40  | 26  | +1  | weapon | 5     | 1.28× | DEX 8, AGL 11          | ignores 50% DEF                              |
| 19  | Militia | Harvest Swing                | blade       | any          | sweep    | 0.80  | 1    | 20  | 18  | +3  | weapon | 7     | 1.12× | POW 12                 | +25 FP to target                             |
| 20  | Militia | Carob Split                  | blade       | any          | overhead | 1.60  | 1    | 60  | 32  | -9  | weapon | 10    | 1.47× | POW 15, AGL 10         | -                                            |
| 21  | Militia | Last Stand                   | blade       | any          | overhead | 1.15  | 1    | 45  | 27  | -2  | weapon | 13    | 1.33× | POW 16, AGL 11, DEF 5  | +10 FP to target, knockdown                  |
| 22  | Militia | Carob Sickle                 | blade       | any          | sweep    | 1.00  | 1    | 30  | 17  | +0  | weapon | 17    | 1.04× | POW 18, AGL 14         | slows 2                                      |
| 23  | Militia | Strike of the Old Stones     | blade       | any          | overhead | 1.90  | 1    | 75  | 45  | -13 | weapon | 21    | 1.64× | POW 21, AGL 14, DEF 7  | -                                            |
| 24  | Militia | Defender of the Island       | blade       | any          | slash    | 1.70  | 1    | 80  | 62  | -10 | weapon | 25    | 1.78× | BAS 11, POW 23, AGL 16 | +10 FP to target, collision                  |
| 25  | Militia | Aimed Shot                   | firearm     | any          | shot     | 1.00  | 1    | 35  | 35  | +12 | weapon | 4     | 1.28× | DEX 9                  | ignores 20% DEF                              |
| 26  | Militia | Double Charge                | firearm     | any          | shot     | 1.35  | 1    | 50  | 41  | -5  | weapon | 6     | 1.31× | POW 9, DEX 11          | -                                            |
| 27  | Militia | Crossfire                    | firearm     | any          | volley   | 0.60  | 2    | 40  | 46  | +1  | weapon | 8     | 1.28× | BAS 7, DEX 13          | ignores 50% DEF                              |
| 28  | Militia | Braced Shot                  | firearm     | any          | shot     | 1.15  | 1    | 35  | 45  | -2  | weapon | 10    | 1.32× | BAS 7, DEX 13          | ignores 65% DEF                              |
| 29  | Militia | Sharpshooter                 | firearm     | any          | shot     | 1.35  | 1    | 55  | 59  | +5  | weapon | 13    | 1.77× | DEX 16, AGL 10         | ignores 65% DEF                              |
| 30  | Militia | Parapet Shot                 | firearm     | any          | shot     | 1.15  | 1    | 45  | 41  | +16 | weapon | 17    | 1.54× | BAS 9, DEX 18          | -                                            |
| 31  | Militia | Bastion Volley               | firearm     | any          | volley   | 0.80  | 2    | 65  | 68  | -1  | weapon | 21    | 1.78× | DEX 19, AGL 13         | ignores 60% DEF                              |
| 32  | Militia | Dead Aim of Malta            | firearm     | any          | shot     | 1.50  | 1    | 65  | 73  | +13 | weapon | 25    | 2.27× | BAS 10, DEX 22, AGL 14 | ignores 75% DEF                              |
| 33  | Militia | Pitchfork Jab                | polearm     | any          | thrust   | 1.00  | 1    | 35  | 11  | +12 | 1-2    | 3     | 1.22× | DEX 8                  | -                                            |
| 34  | Militia | Brace and Drive              | polearm     | any          | thrust   | 1.00  | 1    | 40  | 15  | +0  | 1-2    | 5     | 1.06× | POW 11                 | knockdown                                    |
| 35  | Militia | Watchtower Sweep             | polearm     | any          | sweep    | 0.90  | 1    | 25  | 11  | +1  | 1-2    | 8     | 0.91× | BAS 7, POW 10, AGL 12  | slows 1                                      |
| 36  | Militia | Gaff Hook                    | polearm     | any          | thrust   | 0.80  | 1    | 20  | 18  | +3  | 1-2    | 10    | 1.12× | POW 11, AGL 11         | +25 FP to target                             |
| 37  | Militia | Wallbreaker                  | polearm     | any          | thrust   | 1.60  | 1    | 60  | 32  | -9  | 1-2    | 13    | 1.47× | BAS 7, POW 14, AGL 10  | -                                            |
| 38  | Militia | Ladder-Pusher                | polearm     | any          | thrust   | 1.15  | 1    | 45  | 27  | -2  | 1-2    | 17    | 1.33× | POW 17, AGL 14         | +10 FP to target, knockdown                  |
| 39  | Militia | Watchfire Thrust             | polearm     | any          | thrust   | 1.30  | 1    | 50  | 38  | +0  | 1-2    | 21    | 1.60× | POW 20, DEX 15, AGL 13 | ignores 80% DEF                              |
| 40  | Militia | Gate of Birgu                | polearm     | any          | thrust   | 1.70  | 1    | 80  | 62  | -10 | 1-2    | 25    | 1.78× | BAS 12, POW 22, AGL 15 | +10 FP to target, collision                  |
| 41  | Order   | Cross Cut                    | blade       | any          | slash    | 1.00  | 1    | 35  | 11  | +12 | weapon | 3     | 1.22× | POW 9                  | -                                            |
| 42  | Order   | Pilgrim's Thrust             | blade       | any          | thrust   | 1.00  | 1    | 30  | 15  | +0  | weapon | 5     | 1.14× | DEX 10                 | ignores 50% DEF                              |
| 43  | Order   | Shieldbreaker                | blade/blunt | any          | overhead | 0.80  | 1    | 20  | 15  | +3  | weapon | 7     | 0.82× | POW 12                 | saps                                         |
| 44  | Order   | Eight-Point Flurry           | blade       | any          | slash    | 0.60  | 2    | 40  | 26  | +1  | weapon | 9     | 1.28× | BAS 8, DEX 13, AGL 10  | ignores 50% DEF                              |
| 45  | Order   | Stoccata Lunga               | blade       | any          | thrust   | 1.15  | 1    | 45  | 21  | +16 | weapon | 11    | 1.54× | DEX 14, AGL 9          | -                                            |
| 46  | Order   | Last Rampart                 | blade       | medium/heavy | overhead | 1.60  | 1    | 60  | 32  | -9  | weapon | 13    | 1.47× | BAS 5, POW 16, DEX 11  | -                                            |
| 47  | Order   | Bastion Riposte              | blade       | any          | thrust   | 1.15  | 1    | 35  | 25  | -2  | weapon | 17    | 1.32× | DEX 17, AGL 11         | ignores 65% DEF                              |
| 48  | Order   | Sword of Saint Michael       | blade       | any          | overhead | 1.90  | 1    | 75  | 45  | -13 | weapon | 21    | 1.64× | BAS 9, POW 20, DEX 15  | -                                            |
| 49  | Order   | Dawn of the Grand Master     | blade       | any          | slash    | 0.80  | 2    | 65  | 53  | -1  | weapon | 25    | 2.05× | POW 22, DEX 19, AGL 13 | ignores 60% DEF, +10 FP to target per hit    |
| 50  | Order   | Shield Bash                  | blunt       | any          | bash     | 1.00  | 1    | 40  | 15  | +0  | weapon | 3     | 1.06× | POW 9                  | knockdown                                    |
| 51  | Order   | Rim Strike                   | blunt       | any          | bash     | 1.00  | 1    | 35  | 11  | +12 | weapon | 5     | 1.22× | DEX 9                  | -                                            |
| 52  | Order   | Bell-Ringer                  | blunt       | any          | overhead | 0.80  | 1    | 20  | 18  | +3  | weapon | 7     | 1.12× | POW 13                 | +25 FP to target                             |
| 53  | Order   | Helm Splitter                | blunt       | any          | overhead | 1.15  | 1    | 35  | 25  | -2  | weapon | 10    | 1.32× | POW 14, DEX 9          | ignores 65% DEF                              |
| 54  | Order   | Knell of Saint John          | blunt       | any          | overhead | 0.90  | 1    | 25  | 23  | +1  | weapon | 13    | 1.35× | BAS 8, POW 16, DEF 6   | +35 FP to target                             |
| 55  | Order   | Cathedral Bell               | blunt       | any          | bash     | 1.15  | 1    | 45  | 27  | -2  | weapon | 17    | 1.33× | BAS 9, POW 19          | +10 FP to target, knockdown                  |
| 56  | Order   | Gate-Breaker                 | blunt       | any          | overhead | 1.30  | 1    | 50  | 38  | +0  | weapon | 21    | 1.60× | POW 21, DEX 14, DEF 8  | ignores 80% DEF                              |
| 57  | Order   | Judgement of the Langues     | blunt       | any          | bash     | 1.70  | 1    | 80  | 62  | -10 | weapon | 25    | 1.78× | BAS 12, POW 23, DEF 9  | +10 FP to target, collision                  |
| 58  | Order   | Hedge of Pikes               | polearm     | any          | thrust   | 1.00  | 1    | 40  | 15  | +0  | weapon | 3     | 1.06× | DEX 12, DEF 7          | knockdown                                    |
| 59  | Order   | Lance of Aragon              | polearm     | any          | charge   | 1.35  | 1    | 50  | 21  | -5  | 1-2    | 5     | 1.31× | POW 10, AGL 8          | -                                            |
| 60  | Order   | Halberd Hook                 | polearm     | any          | thrust   | 0.90  | 1    | 25  | 11  | +1  | 1-2    | 8     | 0.91× | POW 11, DEX 10         | slows 1                                      |
| 61  | Order   | Knight's Charge              | polearm     | medium       | charge   | 1.50  | 1    | 70  | 48  | -7  | 1-2    | 11    | 1.53× | BAS 6, POW 15, AGL 11  | collision                                    |
| 62  | Order   | Charge of the Langues        | polearm     | medium       | charge   | 1.60  | 1    | 60  | 32  | -9  | 1-2    | 13    | 1.47× | BAS 6, POW 14, AGL 10  | -                                            |
| 63  | Order   | Pike Wall of Aragon          | polearm     | any          | thrust   | 1.15  | 1    | 45  | 27  | -2  | 1-2    | 17    | 1.33× | POW 18, DEX 14         | +10 FP to target, knockdown                  |
| 64  | Order   | Lancer's Reckoning           | polearm     | medium       | charge   | 1.30  | 1    | 50  | 38  | +0  | weapon | 21    | 1.60× | BAS 10, POW 20, AGL 13 | ignores 80% DEF                              |
| 65  | Order   | Valette's Sortie             | polearm     | medium       | charge   | 1.70  | 1    | 80  | 62  | -10 | weapon | 25    | 1.78× | BAS 12, POW 22, AGL 15 | +10 FP to target, collision                  |
| 66  | Ottoman | Crescent Slash               | blade       | any          | slash    | 1.00  | 1    | 35  | 11  | +12 | weapon | 3     | 1.22× | DEX 9                  | -                                            |
| 67  | Ottoman | Drawing Cut                  | blade       | any          | slash    | 1.00  | 1    | 30  | 15  | +0  | weapon | 5     | 1.14× | DEX 10, AGL 9          | ignores 50% DEF                              |
| 68  | Ottoman | Janissary's Oath             | blade       | any          | overhead | 1.35  | 1    | 50  | 21  | -5  | weapon | 8     | 1.31× | POW 12, DEX 9          | -                                            |
| 69  | Ottoman | Twin Moons                   | blade       | any          | slash    | 0.60  | 2    | 40  | 26  | +1  | weapon | 10    | 1.28× | BAS 8, DEX 10, AGL 12  | ignores 50% DEF                              |
| 70  | Ottoman | Sultan's Edge                | blade       | medium       | slash    | 1.15  | 1    | 35  | 25  | -2  | weapon | 13    | 1.32× | POW 15, DEX 13, DEF 4  | ignores 65% DEF                              |
| 71  | Ottoman | Sabre of the Divan           | blade       | any          | slash    | 1.15  | 1    | 45  | 21  | +16 | weapon | 17    | 1.54× | DEX 17, AGL 12         | -                                            |
| 72  | Ottoman | Whirlwind of the Corps       | blade       | any          | sweep    | 0.70  | 2    | 65  | 45  | +2  | weapon | 21    | 1.56× | POW 19, AGL 16         | ignores 40% DEF, knockdown                   |
| 73  | Ottoman | Blade of the Padishah        | blade       | any          | slash    | 0.55  | 3    | 65  | 49  | -2  | weapon | 25    | 1.67× | POW 22, DEX 19, AGL 14 | ignores 55% DEF                              |
| 74  | Ottoman | Fire Pot                     | explosive   | any          | throw    | 1.35  | 1    | 50  | 41  | -5  | weapon | 4     | 1.31× | DEX 9                  | -                                            |
| 75  | Ottoman | Smoke and Iron               | explosive   | any          | throw    | 0.80  | 1    | 20  | 38  | +3  | weapon | 6     | 1.12× | DEX 12                 | +25 FP to target                             |
| 76  | Ottoman | Humbara Cluster              | explosive   | any          | throw    | 0.60  | 2    | 40  | 46  | +1  | weapon | 9     | 1.28× | DEX 13, AGL 9          | ignores 50% DEF                              |
| 77  | Ottoman | Burning Pitch                | explosive   | any          | throw    | 0.90  | 1    | 25  | 43  | +1  | weapon | 11    | 1.35× | POW 9, DEX 15          | +35 FP to target                             |
| 78  | Ottoman | Tophane Barrage              | explosive   | any          | throw    | 0.70  | 2    | 55  | 57  | +0  | weapon | 13    | 1.54× | BAS 7, POW 9, DEX 15   | ignores 55% DEF                              |
| 79  | Ottoman | Naphtha Flask                | explosive   | any          | throw    | 0.90  | 1    | 25  | 41  | +1  | weapon | 17    | 0.94× | POW 13, DEX 15         | saps, slows 1                                |
| 80  | Ottoman | Hail of Greek Fire           | explosive   | any          | throw    | 0.80  | 2    | 65  | 83  | -1  | weapon | 21    | 2.58× | DEX 17, AGL 13         | ignores 60% DEF, +30 FP to target per hit    |
| 81  | Ottoman | Fire of the Tophane          | explosive   | any          | throw    | 0.55  | 3    | 65  | 69  | -2  | weapon | 25    | 1.67× | BAS 11, POW 14, DEX 20 | ignores 55% DEF                              |
| 82  | Ottoman | Steady Volley                | firearm     | any          | shot     | 1.00  | 1    | 35  | 31  | +12 | weapon | 3     | 1.22× | DEX 9                  | -                                            |
| 83  | Ottoman | Rolling Fire                 | firearm     | any          | volley   | 0.60  | 2    | 40  | 46  | +1  | weapon | 6     | 1.28× | DEX 12                 | ignores 50% DEF                              |
| 84  | Ottoman | Tufek Salvo                  | firearm     | any          | shot     | 0.80  | 1    | 20  | 38  | +3  | weapon | 8     | 1.12× | POW 10, DEX 11         | +25 FP to target                             |
| 85  | Ottoman | Marksman of the Orta         | firearm     | any          | shot     | 1.15  | 1    | 35  | 45  | -2  | weapon | 10    | 1.32× | DEX 15                 | ignores 65% DEF                              |
| 86  | Ottoman | Fire Line of the Orta        | firearm     | any          | volley   | 0.70  | 2    | 55  | 57  | +0  | weapon | 13    | 1.54× | BAS 7, DEX 15, AGL 10  | ignores 55% DEF                              |
| 87  | Ottoman | Orta Platoon Fire            | firearm     | any          | volley   | 0.90  | 1    | 25  | 41  | +1  | weapon | 17    | 0.94× | DEX 17, AGL 12         | saps, slows 1                                |
| 88  | Ottoman | Veteran of Rhodes            | firearm     | any          | shot     | 1.50  | 1    | 65  | 73  | +13 | weapon | 21    | 2.27× | BAS 10, DEX 20         | ignores 75% DEF                              |
| 89  | Ottoman | Thunder of the Corps         | firearm     | any          | volley   | 0.55  | 3    | 65  | 69  | -2  | weapon | 25    | 1.67× | BAS 10, DEX 22, AGL 14 | ignores 55% DEF                              |
| 90  | Ottoman | Lance Feint                  | polearm     | any          | thrust   | 1.00  | 1    | 35  | 11  | +12 | 1-2    | 3     | 1.22× | DEX 9, AGL 12          | -                                            |
| 91  | Ottoman | Sipahi Charge                | polearm     | light        | charge   | 1.35  | 1    | 50  | 21  | -5  | 1-2    | 5     | 1.31× | AGL 10                 | -                                            |
| 92  | Ottoman | Hooked Spear Pull            | polearm     | any          | thrust   | 1.00  | 1    | 40  | 15  | +0  | 1-2    | 8     | 1.06× | POW 10, AGL 12         | knockdown                                    |
| 93  | Ottoman | Akinji Sweep                 | polearm     | any          | sweep    | 1.00  | 1    | 30  | 17  | +0  | 1-2    | 10    | 1.04× | POW 10, AGL 13         | slows 2                                      |
| 94  | Ottoman | Thunder of Hooves            | polearm     | light        | charge   | 1.50  | 1    | 70  | 48  | -7  | 1-2    | 13    | 1.53× | POW 11, AGL 15         | collision                                    |
| 95  | Ottoman | Akinji Lance                 | polearm     | any          | charge   | 1.60  | 1    | 60  | 32  | -9  | weapon | 17    | 1.47× | POW 18, AGL 15         | -                                            |
| 96  | Ottoman | Hooked Lance Haul            | polearm     | any          | thrust   | 1.30  | 1    | 55  | 43  | -5  | 1-2    | 21    | 1.58× | POW 19, AGL 16         | ignores 30% DEF, +15 FP to target, knockdown |
| 97  | Ottoman | Wrath of the Sipahi          | polearm     | any          | charge   | 1.70  | 1    | 80  | 62  | -10 | weapon | 25    | 1.78× | BAS 10, POW 23, AGL 18 | +10 FP to target, collision                  |
| 98  | Scala   | Piston Strike                | blunt       | any          | bash     | 1.00  | 1    | 35  | 11  | +12 | weapon | 4     | 1.22× | POW 8                  | -                                            |
| 99  | Scala   | Valve Release                | blunt       | any          | bash     | 0.80  | 1    | 20  | 18  | +3  | weapon | 6     | 1.12× | POW 9                  | +25 FP to target                             |
| 100 | Scala   | Steam Hammer                 | blunt       | any          | overhead | 1.35  | 1    | 50  | 21  | -5  | weapon | 8     | 1.31× | POW 10                 | -                                            |
| 101 | Scala   | Governor Slam                | blunt       | any          | bash     | 1.15  | 1    | 35  | 25  | -2  | weapon | 10    | 1.32× | BAS 6, POW 12          | ignores 65% DEF                              |
| 102 | Scala   | Overpressure                 | blunt       | any          | bash     | 1.60  | 1    | 60  | 32  | -9  | weapon | 13    | 1.47× | BAS 6, POW 12          | -                                            |
| 103 | Scala   | Piston Cascade               | blunt       | any          | bash     | 0.50  | 3    | 60  | 41  | -2  | weapon | 17    | 1.45× | BAS 9, POW 18          | ignores 50% DEF                              |
| 104 | Scala   | Boiler Burst                 | blunt       | any          | bash     | 1.70  | 1    | 80  | 62  | -10 | weapon | 21    | 1.78× | BAS 11, POW 21         | +10 FP to target, collision                  |
| 105 | Scala   | The Engineer's Masterpiece   | blunt       | any          | overhead | 1.90  | 1    | 75  | 55  | -13 | weapon | 25    | 1.90× | BAS 12, POW 23, INT 10 | +20 FP to target                             |
| 106 | Scala   | Rivet Shot                   | firearm     | any          | shot     | 1.00  | 1    | 35  | 35  | +12 | weapon | 4     | 1.28× | DEX 8                  | ignores 20% DEF                              |
| 107 | Scala   | Grapeshot                    | firearm     | any          | volley   | 0.60  | 2    | 40  | 46  | +1  | weapon | 6     | 1.28× | DEX 8                  | ignores 50% DEF                              |
| 108 | Scala   | Siege Bolt                   | firearm     | any          | shot     | 1.35  | 1    | 50  | 41  | -5  | weapon | 9     | 1.31× | DEX 10                 | -                                            |
| 109 | Scala   | Chain Shot                   | firearm     | any          | volley   | 0.90  | 1    | 25  | 31  | +1  | weapon | 11    | 0.91× | BAS 6, DEX 11          | slows 1                                      |
| 110 | Scala   | Full Broadside               | firearm     | heavy        | volley   | 1.50  | 1    | 70  | 68  | -7  | weapon | 14    | 1.53× | POW 10, DEX 12         | collision                                    |
| 111 | Scala   | Pressure Round               | firearm     | any          | shot     | 1.35  | 1    | 55  | 59  | +5  | weapon | 17    | 1.77× | BAS 9, DEX 16          | ignores 65% DEF                              |
| 112 | Scala   | Hail of Rivets               | firearm     | any          | volley   | 0.80  | 2    | 65  | 78  | -1  | weapon | 21    | 1.82× | DEX 18, AGL 12         | ignores 60% DEF, saps                        |
| 113 | Scala   | Thunder Engine               | firearm     | any          | volley   | 0.55  | 3    | 65  | 69  | -2  | weapon | 25    | 1.67× | BAS 12, DEX 21, INT 10 | ignores 55% DEF                              |
