# Attacks

Generated from `packages/content/data/attacks.json` and `balance.json` by
`packages/content/test/attacks-doc.test.ts` (run it with `UPDATE_DOCS=1` to rewrite this file; the
test fails when the file is out of date). Every pilot also has the two **starter** attacks for their
weapon; a faction technique unlocks when the pilot has reached its **Level** and their stats (gear
included) meet the requirement (ADR 0015). The power curve and cost model are in ADR 0024, the attack kinds in ADR 0023.

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

- **Power curve:** a technique's power × hits is 1 + 0.09 per unlock level, times its tool's share (heavy 1.1; precise, flurry, pierce and knockdown 0.9; a pierce of 60% DEF or more 0.85; collision 0.85; exhaust and debuff 0.8), then gunfire ×1.25 and bombs ×1.5, capped at 3.4 (ADR 0024).
- **Cost model:** _Weight_ tools (heavy, precise, knockdown, collision) pay mostly in AP: 30 + 15 AP and 5 + 20 FP per point of total power above 1. _Spirit_ tools (flurry, pierce, exhaust, debuff) and every gun or bomb technique pay mostly in FP: 25 + 5 AP and 10 + 40 FP per point. Ranged styles pay 20 FP more; a knockdown adds 10 AP and a collision 15 AP. FP stays between 10 and 80. Accuracy rises by tier: +5 from level 7, +10 from 13, +15 from 18; precise techniques add their own bonus and heavy ones aim a little worse.
- **Value (a yardstick):** expected damage per use against a reference target (30 raw damage, DEF 8, 55% base hit), plus 0.12 per FP of fatigue inflicted and the worth of a knockdown (0.5), collision (0.9), sap (0.3) or slow (0.2 per MOV), in units of a plain power-1.0 strike. Tested in `content.test.ts`: every technique follows the power curve within 5%, costs more FP per damage than the weapon's basic strike aimed at the same tier, shows the tool it names, and no pool repeats a tool twice running.
- **Attack kinds** (after the classic): a **knockdown** that lands topples the defender unless it chose Defend: its strike back is cancelled and it starts its next turn 35 AP short. A **collision** topples through Defend too (55 AP). Neither can be countered; Avoid is the answer to both. A **sap** leaves the target dealing 70% damage, and a **slow** takes MOV off it, until its next turn is over.
- **Tools:** _Precise_ (accuracy), _Flurry_ (two or three armour-piercing strikes), _Pierce_ (a single armour-piercing blow), _Heavy_ (raw power, dear in AP), _Knockdown_ and _Collision_ (no strike back, AP lost), _Exhaust_ (heavy fatigue) and _Sap/Slow_ (debuffs). Names, lore and requirements are in `attacks.json`.

## Unlock-level curve

Every technique opens at a set pilot level, so nobody has more than the two starters at levels 1-2 and techniques arrive gradually through the campaign (prologue pilots are level 1-6, the later acts 5-12). Each faction and weapon pool opens its first technique by level 4, a new one at least every 3 levels, and ends with a signature technique at level 13 or later.

## The 113 techniques

| #   | Faction | Attack                       | Weapon      | Frame        | Style    | Power | Hits | AP  | FP  | Acc | Range  | Level | Value | Needs                  | Extras                                       |
| --- | ------- | ---------------------------- | ----------- | ------------ | -------- | ----- | ---- | --- | --- | --- | ------ | ----- | ----- | ---------------------- | -------------------------------------------- |
| 1   | Corsair | Boarding Slash               | blade       | any          | slash    | 1.14  | 1    | 30  | 10  | +15 | weapon | 3     | 1.50× | AGL 9                  | -                                            |
| 2   | Corsair | Deck Dance                   | blade       | any          | slash    | 0.65  | 2    | 25  | 22  | +0  | weapon | 5     | 1.38× | BAS 7, AGL 12          | ignores 50% DEF                              |
| 3   | Corsair | Salt and Steel               | blade       | any          | sweep    | 1.38  | 1    | 25  | 25  | +5  | weapon | 8     | 1.95× | POW 11, AGL 10         | +25 FP to target                             |
| 4   | Corsair | Cutlass Storm                | blade       | any          | slash    | 0.85  | 2    | 30  | 38  | +5  | weapon | 10    | 2.36× | DEX 11, AGL 14         | ignores 55% DEF, +10 FP to target per hit    |
| 5   | Corsair | Barbary Reaper               | blade       | any          | sweep    | 2.39  | 1    | 50  | 33  | +0  | weapon | 13    | 2.77× | BAS 5, POW 12, AGL 15  | -                                            |
| 6   | Corsair | Boarding Frenzy              | blade       | any          | slash    | 1.14  | 2    | 30  | 61  | +10 | weapon | 17    | 3.17× | DEX 14, AGL 16         | ignores 60% DEF                              |
| 7   | Corsair | Sea-Wolf's Rush              | blade       | any          | charge   | 2.46  | 1    | 65  | 34  | +15 | weapon | 21    | 3.87× | POW 18, AGL 18         | +10 FP to target, collision                  |
| 8   | Corsair | Scourge of the Barbary Coast | blade       | any          | slash    | 0.98  | 3    | 35  | 80  | +15 | weapon | 25    | 4.29× | POW 21, DEX 16, AGL 20 | ignores 55% DEF                              |
| 9   | Corsair | Boat-Hook Jab                | polearm     | any          | thrust   | 1.14  | 1    | 30  | 10  | +15 | weapon | 3     | 1.50× | POW 8                  | -                                            |
| 10  | Corsair | Grapple                      | polearm     | any          | thrust   | 1.30  | 1    | 45  | 11  | +0  | weapon | 5     | 1.44× | POW 9                  | knockdown                                    |
| 11  | Corsair | Keelhaul                     | polearm     | any          | bash     | 1.38  | 1    | 25  | 25  | +5  | weapon | 8     | 1.64× | POW 12                 | slows 1                                      |
| 12  | Corsair | Harpoon Thrust               | polearm     | any          | thrust   | 1.61  | 1    | 30  | 34  | +5  | 1-2    | 10    | 2.13× | POW 12, DEX 11         | ignores 65% DEF                              |
| 13  | Corsair | Drowning Hook                | polearm     | any          | bash     | 1.95  | 1    | 55  | 24  | +10 | weapon | 13    | 2.80× | BAS 6, POW 13, AGL 12  | +10 FP to target, knockdown                  |
| 14  | Corsair | Gaff and Chain               | polearm     | any          | thrust   | 2.02  | 1    | 30  | 51  | +10 | weapon | 17    | 2.76× | POW 17, AGL 15         | slows 2                                      |
| 15  | Corsair | Harpooner's Heave            | polearm     | any          | thrust   | 2.46  | 1    | 30  | 68  | +15 | 1-2    | 21    | 3.91× | POW 19, DEX 16         | ignores 80% DEF                              |
| 16  | Corsair | Leviathan Hook               | polearm     | any          | bash     | 2.76  | 1    | 70  | 40  | +15 | weapon | 25    | 4.35× | BAS 11, POW 22, AGL 17 | +10 FP to target, collision                  |
| 17  | Militia | Fisherman's Hook-Cut         | blade       | any          | slash    | 1.14  | 1    | 30  | 10  | +15 | weapon | 3     | 1.50× | AGL 9                  | -                                            |
| 18  | Militia | Żejtun Feint                 | blade       | any          | slash    | 0.65  | 2    | 25  | 22  | +0  | weapon | 5     | 1.38× | DEX 8, AGL 11          | ignores 50% DEF                              |
| 19  | Militia | Harvest Swing                | blade       | any          | sweep    | 1.30  | 1    | 25  | 22  | +5  | weapon | 7     | 1.84× | POW 12                 | +25 FP to target                             |
| 20  | Militia | Carob Split                  | blade       | any          | overhead | 2.09  | 1    | 45  | 27  | -5  | weapon | 10    | 2.17× | POW 15, AGL 10         | -                                            |
| 21  | Militia | Last Stand                   | blade       | any          | overhead | 1.95  | 1    | 55  | 24  | +10 | weapon | 13    | 2.80× | POW 16, AGL 11, DEF 5  | +10 FP to target, knockdown                  |
| 22  | Militia | Carob Sickle                 | blade       | any          | sweep    | 2.02  | 1    | 30  | 51  | +10 | weapon | 17    | 2.76× | POW 18, AGL 14         | slows 2                                      |
| 23  | Militia | Strike of the Old Stones     | blade       | any          | overhead | 3.18  | 1    | 65  | 49  | +5  | weapon | 21    | 4.11× | POW 21, AGL 14, DEF 7  | -                                            |
| 24  | Militia | Defender of the Island       | blade       | any          | slash    | 2.76  | 1    | 70  | 40  | +15 | weapon | 25    | 4.35× | BAS 11, POW 23, AGL 16 | +10 FP to target, collision                  |
| 25  | Militia | Aimed Shot                   | firearm     | any          | shot     | 1.53  | 1    | 25  | 39  | -13 | weapon | 4     | 1.30× | DEX 9                  | ignores 10% DEF                              |
| 26  | Militia | Double Charge                | firearm     | any          | shot     | 2.11  | 1    | 30  | 58  | -35 | weapon | 6     | 0.89× | POW 9, DEX 11          | ignores 10% DEF                              |
| 27  | Militia | Crossfire                    | firearm     | any          | volley   | 0.96  | 2    | 30  | 52  | -20 | weapon | 8     | 1.38× | BAS 7, DEX 13          | ignores 50% DEF                              |
| 28  | Militia | Braced Shot                  | firearm     | any          | shot     | 2.61  | 1    | 30  | 74  | -30 | weapon | 10    | 1.40× | BAS 7, DEX 13          | ignores 10% DEF                              |
| 29  | Militia | Sharpshooter                 | firearm     | any          | shot     | 2.30  | 1    | 30  | 64  | -15 | weapon | 13    | 2.06× | DEX 16, AGL 10         | ignores 65% DEF                              |
| 30  | Militia | Parapet Shot                 | firearm     | any          | shot     | 2.85  | 1    | 30  | 80  | -3  | weapon | 17    | 3.19× | BAS 9, DEX 18          | ignores 10% DEF                              |
| 31  | Militia | Bastion Volley               | firearm     | any          | volley   | 1.63  | 2    | 35  | 80  | -10 | weapon | 21    | 3.21× | DEX 19, AGL 13         | ignores 60% DEF                              |
| 32  | Militia | Dead Aim of Malta            | firearm     | any          | shot     | 3.40  | 1    | 35  | 80  | -10 | weapon | 25    | 3.48× | BAS 10, DEX 22, AGL 14 | ignores 75% DEF                              |
| 33  | Militia | Pitchfork Jab                | polearm     | any          | thrust   | 1.14  | 1    | 30  | 10  | +15 | 1-2    | 3     | 1.50× | DEX 8                  | -                                            |
| 34  | Militia | Brace and Drive              | polearm     | any          | thrust   | 1.30  | 1    | 45  | 11  | +0  | 1-2    | 5     | 1.44× | POW 11                 | knockdown                                    |
| 35  | Militia | Watchtower Sweep             | polearm     | any          | sweep    | 1.38  | 1    | 25  | 25  | +5  | 1-2    | 8     | 1.64× | BAS 7, POW 10, AGL 12  | slows 1                                      |
| 36  | Militia | Gaff Hook                    | polearm     | any          | thrust   | 1.52  | 1    | 30  | 31  | +5  | 1-2    | 10    | 2.14× | POW 11, AGL 11         | +25 FP to target                             |
| 37  | Militia | Wallbreaker                  | polearm     | any          | thrust   | 2.39  | 1    | 50  | 33  | +0  | 1-2    | 13    | 2.77× | BAS 7, POW 14, AGL 10  | -                                            |
| 38  | Militia | Ladder-Pusher                | polearm     | any          | thrust   | 2.28  | 1    | 60  | 31  | +10 | 1-2    | 17    | 3.29× | POW 17, AGL 14         | +10 FP to target, knockdown                  |
| 39  | Militia | Watchfire Thrust             | polearm     | any          | thrust   | 2.46  | 1    | 30  | 68  | +15 | 1-2    | 21    | 3.91× | POW 20, DEX 15, AGL 13 | ignores 80% DEF                              |
| 40  | Militia | Gate of Birgu                | polearm     | any          | thrust   | 2.76  | 1    | 70  | 40  | +15 | 1-2    | 25    | 4.35× | BAS 12, POW 22, AGL 15 | +10 FP to target, collision                  |
| 41  | Order   | Cross Cut                    | blade       | any          | slash    | 1.14  | 1    | 30  | 10  | +15 | weapon | 3     | 1.50× | POW 9                  | -                                            |
| 42  | Order   | Pilgrim's Thrust             | blade       | any          | thrust   | 1.30  | 1    | 25  | 22  | +0  | weapon | 5     | 1.52× | DEX 10                 | ignores 50% DEF                              |
| 43  | Order   | Shieldbreaker                | blade/blunt | any          | overhead | 1.30  | 1    | 25  | 22  | +5  | weapon | 7     | 1.54× | POW 12                 | saps                                         |
| 44  | Order   | Eight-Point Flurry           | blade       | any          | slash    | 0.81  | 2    | 30  | 35  | +5  | weapon | 9     | 1.95× | BAS 8, DEX 13, AGL 10  | ignores 50% DEF                              |
| 45  | Order   | Stoccata Lunga               | blade       | any          | thrust   | 1.79  | 1    | 40  | 21  | +20 | weapon | 11    | 2.73× | DEX 14, AGL 9          | -                                            |
| 46  | Order   | Last Rampart                 | blade       | medium/heavy | overhead | 2.39  | 1    | 50  | 33  | +0  | weapon | 13    | 2.77× | BAS 5, POW 16, DEX 11  | -                                            |
| 47  | Order   | Bastion Riposte              | blade       | any          | thrust   | 2.15  | 1    | 30  | 56  | +10 | weapon | 17    | 3.12× | DEX 17, AGL 11         | ignores 65% DEF                              |
| 48  | Order   | Sword of Saint Michael       | blade       | any          | overhead | 3.18  | 1    | 65  | 49  | +5  | weapon | 21    | 4.11× | BAS 9, POW 20, DEX 15  | -                                            |
| 49  | Order   | Dawn of the Grand Master     | blade       | any          | slash    | 1.46  | 2    | 35  | 80  | +15 | weapon | 25    | 4.71× | POW 22, DEX 19, AGL 13 | ignores 60% DEF, +10 FP to target per hit    |
| 50  | Order   | Shield Bash                  | blunt       | any          | bash     | 1.14  | 1    | 40  | 10  | +0  | weapon | 3     | 1.23× | POW 9                  | knockdown                                    |
| 51  | Order   | Rim Strike                   | blunt       | any          | bash     | 1.30  | 1    | 35  | 11  | +15 | weapon | 5     | 1.76× | DEX 9                  | -                                            |
| 52  | Order   | Bell-Ringer                  | blunt       | any          | overhead | 1.30  | 1    | 25  | 22  | +5  | weapon | 7     | 1.84× | POW 13                 | +25 FP to target                             |
| 53  | Order   | Helm Splitter                | blunt       | any          | overhead | 1.61  | 1    | 30  | 34  | +5  | weapon | 10    | 2.13× | POW 14, DEX 9          | ignores 65% DEF                              |
| 54  | Order   | Knell of Saint John          | blunt       | any          | overhead | 1.74  | 1    | 30  | 40  | +10 | weapon | 13    | 2.76× | BAS 8, POW 16, DEF 6   | +35 FP to target                             |
| 55  | Order   | Cathedral Bell               | blunt       | any          | bash     | 2.28  | 1    | 60  | 31  | +10 | weapon | 17    | 3.29× | BAS 9, POW 19          | +10 FP to target, knockdown                  |
| 56  | Order   | Gate-Breaker                 | blunt       | any          | overhead | 2.46  | 1    | 30  | 68  | +15 | weapon | 21    | 3.91× | POW 21, DEX 14, DEF 8  | ignores 80% DEF                              |
| 57  | Order   | Judgement of the Langues     | blunt       | any          | bash     | 2.76  | 1    | 70  | 40  | +15 | weapon | 25    | 4.35× | BAS 12, POW 23, DEF 9  | +10 FP to target, collision                  |
| 58  | Order   | Hedge of Pikes               | polearm     | any          | thrust   | 1.14  | 1    | 40  | 10  | +0  | weapon | 3     | 1.23× | DEX 12, DEF 7          | knockdown                                    |
| 59  | Order   | Lance of Aragon              | polearm     | any          | charge   | 1.59  | 1    | 40  | 17  | -10 | 1-2    | 5     | 1.43× | POW 10, AGL 8          | -                                            |
| 60  | Order   | Halberd Hook                 | polearm     | any          | thrust   | 1.38  | 1    | 25  | 25  | +5  | 1-2    | 8     | 1.64× | POW 11, DEX 10         | slows 1                                      |
| 61  | Order   | Knight's Charge              | polearm     | medium       | charge   | 1.69  | 1    | 55  | 19  | +5  | 1-2    | 11    | 2.15× | BAS 6, POW 15, AGL 11  | collision                                    |
| 62  | Order   | Charge of the Langues        | polearm     | medium       | charge   | 2.39  | 1    | 50  | 33  | +0  | 1-2    | 13    | 2.77× | BAS 6, POW 14, AGL 10  | -                                            |
| 63  | Order   | Pike Wall of Aragon          | polearm     | any          | thrust   | 2.28  | 1    | 60  | 31  | +10 | 1-2    | 17    | 3.29× | POW 18, DEX 14         | +10 FP to target, knockdown                  |
| 64  | Order   | Lancer's Reckoning           | polearm     | medium       | charge   | 2.46  | 1    | 30  | 68  | +15 | weapon | 21    | 3.91× | BAS 10, POW 20, AGL 13 | ignores 80% DEF                              |
| 65  | Order   | Valette's Sortie             | polearm     | medium       | charge   | 2.76  | 1    | 70  | 40  | +15 | weapon | 25    | 4.35× | BAS 12, POW 22, AGL 15 | +10 FP to target, collision                  |
| 66  | Ottoman | Crescent Slash               | blade       | any          | slash    | 1.14  | 1    | 30  | 10  | +15 | weapon | 3     | 1.50× | DEX 9                  | -                                            |
| 67  | Ottoman | Drawing Cut                  | blade       | any          | slash    | 1.30  | 1    | 25  | 22  | +0  | weapon | 5     | 1.52× | DEX 10, AGL 9          | ignores 50% DEF                              |
| 68  | Ottoman | Janissary's Oath             | blade       | any          | overhead | 1.89  | 1    | 45  | 23  | -5  | weapon | 8     | 1.94× | POW 12, DEX 9          | -                                            |
| 69  | Ottoman | Twin Moons                   | blade       | any          | slash    | 0.85  | 2    | 30  | 38  | +5  | weapon | 10    | 2.06× | BAS 8, DEX 10, AGL 12  | ignores 50% DEF                              |
| 70  | Ottoman | Sultan's Edge                | blade       | medium       | slash    | 1.84  | 1    | 30  | 44  | +10 | weapon | 13    | 2.65× | POW 15, DEX 13, DEF 4  | ignores 65% DEF                              |
| 71  | Ottoman | Sabre of the Divan           | blade       | any          | slash    | 2.28  | 1    | 50  | 31  | +25 | weapon | 17    | 3.82× | DEX 17, AGL 12         | -                                            |
| 72  | Ottoman | Whirlwind of the Corps       | blade       | any          | sweep    | 1.30  | 2    | 65  | 37  | +15 | weapon | 21    | 3.85× | POW 19, AGL 16         | ignores 40% DEF, knockdown                   |
| 73  | Ottoman | Blade of the Padishah        | blade       | any          | slash    | 0.98  | 3    | 35  | 80  | +15 | weapon | 25    | 4.29× | POW 22, DEX 19, AGL 14 | ignores 55% DEF                              |
| 74  | Ottoman | Fire Pot                     | explosive   | any          | throw    | 2.25  | 1    | 30  | 50  | -10 | weapon | 4     | 2.12× | DEX 9                  | -                                            |
| 75  | Ottoman | Smoke and Iron               | explosive   | any          | throw    | 1.85  | 1    | 25  | 39  | +0  | weapon | 6     | 2.41× | DEX 12                 | +25 FP to target                             |
| 76  | Ottoman | Humbara Cluster              | explosive   | any          | throw    | 1.22  | 2    | 30  | 55  | +5  | weapon | 9     | 3.09× | DEX 13, AGL 9          | ignores 50% DEF                              |
| 77  | Ottoman | Burning Pitch                | explosive   | any          | throw    | 2.39  | 1    | 30  | 54  | +5  | weapon | 11    | 3.48× | POW 9, DEX 15          | +35 FP to target                             |
| 78  | Ottoman | Tophane Barrage              | explosive   | any          | throw    | 1.47  | 2    | 30  | 68  | +10 | weapon | 13    | 4.13× | BAS 7, POW 9, DEX 15   | ignores 55% DEF                              |
| 79  | Ottoman | Naphtha Flask                | explosive   | any          | throw    | 3.03  | 1    | 30  | 71  | +10 | weapon | 17    | 4.29× | POW 13, DEX 15         | saps, slows 1                                |
| 80  | Ottoman | Hail of Greek Fire           | explosive   | any          | throw    | 1.69  | 2    | 30  | 80  | +15 | weapon | 21    | 5.98× | DEX 17, AGL 13         | ignores 60% DEF, +30 FP to target per hit    |
| 81  | Ottoman | Fire of the Tophane          | explosive   | any          | throw    | 1.14  | 3    | 30  | 80  | +15 | weapon | 25    | 5.07× | BAS 11, POW 14, DEX 20 | ignores 55% DEF                              |
| 82  | Ottoman | Steady Volley                | firearm     | any          | shot     | 1.42  | 1    | 25  | 36  | -13 | weapon | 3     | 1.19× | DEX 9                  | ignores 10% DEF                              |
| 83  | Ottoman | Rolling Fire                 | firearm     | any          | volley   | 0.86  | 2    | 25  | 45  | -25 | weapon | 6     | 1.04× | DEX 12                 | ignores 50% DEF                              |
| 84  | Ottoman | Tufek Salvo                  | firearm     | any          | shot     | 1.73  | 1    | 25  | 45  | -20 | weapon | 8     | 1.57× | POW 10, DEX 11         | ignores 10% DEF, +25 FP to target            |
| 85  | Ottoman | Marksman of the Orta         | firearm     | any          | shot     | 2.01  | 1    | 30  | 54  | -20 | weapon | 10    | 1.57× | DEX 15                 | ignores 65% DEF                              |
| 86  | Ottoman | Fire Line of the Orta        | firearm     | any          | volley   | 1.23  | 2    | 30  | 68  | -15 | weapon | 13    | 2.10× | BAS 7, DEX 15, AGL 10  | ignores 55% DEF                              |
| 87  | Ottoman | Orta Platoon Fire            | firearm     | any          | volley   | 2.53  | 1    | 30  | 71  | -15 | weapon | 17    | 2.22× | DEX 17, AGL 12         | ignores 10% DEF, saps, slows 1               |
| 88  | Ottoman | Veteran of Rhodes            | firearm     | any          | shot     | 3.08  | 1    | 30  | 80  | -10 | weapon | 21    | 3.15× | BAS 10, DEX 20         | ignores 75% DEF                              |
| 89  | Ottoman | Thunder of the Corps         | firearm     | any          | volley   | 1.14  | 3    | 35  | 80  | -10 | weapon | 25    | 3.26× | BAS 10, DEX 22, AGL 14 | ignores 55% DEF                              |
| 90  | Ottoman | Lance Feint                  | polearm     | any          | thrust   | 1.14  | 1    | 30  | 10  | +15 | 1-2    | 3     | 1.50× | DEX 9, AGL 12          | -                                            |
| 91  | Ottoman | Sipahi Charge                | polearm     | light        | charge   | 1.59  | 1    | 40  | 17  | -10 | 1-2    | 5     | 1.43× | AGL 10                 | -                                            |
| 92  | Ottoman | Hooked Spear Pull            | polearm     | any          | thrust   | 1.55  | 1    | 50  | 16  | +5  | 1-2    | 8     | 1.91× | POW 10, AGL 12         | knockdown                                    |
| 93  | Ottoman | Akinji Sweep                 | polearm     | any          | sweep    | 1.52  | 1    | 30  | 31  | +5  | 1-2    | 10    | 1.86× | POW 10, AGL 13         | slows 2                                      |
| 94  | Ottoman | Thunder of Hooves            | polearm     | light        | charge   | 1.84  | 1    | 60  | 22  | +10 | 1-2    | 13    | 2.54× | POW 11, AGL 15         | collision                                    |
| 95  | Ottoman | Akinji Lance                 | polearm     | any          | charge   | 2.78  | 1    | 55  | 41  | +0  | weapon | 17    | 3.26× | POW 18, AGL 15         | -                                            |
| 96  | Ottoman | Hooked Lance Haul            | polearm     | any          | thrust   | 2.60  | 1    | 65  | 37  | +15 | 1-2    | 21    | 4.22× | POW 19, AGL 16         | ignores 30% DEF, +15 FP to target, knockdown |
| 97  | Ottoman | Wrath of the Sipahi          | polearm     | any          | charge   | 2.76  | 1    | 70  | 40  | +15 | weapon | 25    | 4.35× | BAS 10, POW 23, AGL 18 | +10 FP to target, collision                  |
| 98  | Scala   | Piston Strike                | blunt       | any          | bash     | 1.22  | 1    | 35  | 10  | +15 | weapon | 4     | 1.63× | POW 8                  | -                                            |
| 99  | Scala   | Valve Release                | blunt       | any          | bash     | 1.23  | 1    | 25  | 19  | +0  | weapon | 6     | 1.62× | POW 9                  | +25 FP to target                             |
| 100 | Scala   | Steam Hammer                 | blunt       | any          | overhead | 1.89  | 1    | 45  | 23  | -5  | weapon | 8     | 1.94× | POW 10                 | -                                            |
| 101 | Scala   | Governor Slam                | blunt       | any          | bash     | 1.61  | 1    | 30  | 34  | +5  | weapon | 10    | 2.13× | BAS 6, POW 12          | ignores 65% DEF                              |
| 102 | Scala   | Overpressure                 | blunt       | any          | bash     | 2.39  | 1    | 50  | 33  | +0  | weapon | 13    | 2.77× | BAS 6, POW 12          | -                                            |
| 103 | Scala   | Piston Cascade               | blunt       | any          | bash     | 0.76  | 3    | 30  | 61  | +10 | weapon | 17    | 2.94× | BAS 9, POW 18          | ignores 50% DEF                              |
| 104 | Scala   | Boiler Burst                 | blunt       | any          | bash     | 2.46  | 1    | 65  | 34  | +15 | weapon | 21    | 3.87× | BAS 11, POW 21         | +10 FP to target, collision                  |
| 105 | Scala   | The Engineer's Masterpiece   | blunt       | any          | overhead | 3.40  | 1    | 65  | 53  | +5  | weapon | 25    | 4.68× | BAS 12, POW 23, INT 10 | +20 FP to target                             |
| 106 | Scala   | Rivet Shot                   | firearm     | any          | shot     | 1.53  | 1    | 25  | 39  | -13 | weapon | 4     | 1.32× | DEX 8                  | ignores 20% DEF                              |
| 107 | Scala   | Grapeshot                    | firearm     | any          | volley   | 0.86  | 2    | 25  | 45  | -25 | weapon | 6     | 1.04× | DEX 8                  | ignores 50% DEF                              |
| 108 | Scala   | Siege Bolt                   | firearm     | any          | shot     | 2.49  | 1    | 30  | 70  | -30 | weapon | 9     | 1.33× | DEX 10                 | ignores 10% DEF                              |
| 109 | Scala   | Chain Shot                   | firearm     | any          | volley   | 1.99  | 1    | 30  | 54  | -20 | weapon | 11    | 1.48× | BAS 6, DEX 11          | ignores 10% DEF, slows 1                     |
| 110 | Scala   | Full Broadside               | firearm     | heavy        | volley   | 2.40  | 1    | 45  | 67  | -15 | weapon | 14    | 2.14× | POW 10, DEX 12         | ignores 10% DEF, collision                   |
| 111 | Scala   | Pressure Round               | firearm     | any          | shot     | 2.69  | 1    | 30  | 76  | -15 | weapon | 17    | 2.42× | BAS 9, DEX 16          | ignores 65% DEF                              |
| 112 | Scala   | Hail of Rivets               | firearm     | any          | volley   | 1.45  | 2    | 30  | 80  | -10 | weapon | 21    | 2.87× | DEX 18, AGL 12         | ignores 60% DEF, saps                        |
| 113 | Scala   | Thunder Engine               | firearm     | any          | volley   | 1.14  | 3    | 35  | 80  | -10 | weapon | 25    | 3.26× | BAS 12, DEX 21, INT 10 | ignores 55% DEF                              |
