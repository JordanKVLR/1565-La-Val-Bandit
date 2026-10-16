# Attacks

Generated from `packages/content/data/attacks.json` and `balance.json` by
`packages/content/test/attacks-doc.test.ts` (run it with `UPDATE_DOCS=1` to rewrite this file; the
test fails when the file is out of date). Every pilot also has the two **starter** attacks for their
weapon; a faction technique unlocks when the pilot has reached its **Level** and their stats (gear
included) meet the requirement (ADR 0015). The value standard and cost model are in ADR 0017.

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

- **Cost model:** AP is 30 + 50 per point of total power above 1, FP is 5 + 45 per point (ranged styles pay 20 more), and accuracy falls 15 per point of power. Each **rank** (one per two levels of the unlock level, so level 3 is rank 1 and level 13 rank 6) cuts FP by 5%, AP by 3% and adds 2 accuracy, so a master technique is both stronger and more economical.
- **Value:** expected damage per use against a reference target (30 raw damage, DEF 8, 65% base hit), plus 0.12 per FP of fatigue inflicted and 0.4 for being uncounterable, in units of a plain power-1.0 strike. A technique unlocked at level L must be worth 1.1 + 0.09 × (L − 3) of those, within 12%, and within a faction and weapon pool never worth less than an earlier one (tested in `content.test.ts`).
- **Roles:** _Burst_ (raw power), _Precision_ (accuracy and piercing), _Flurry_ (two armour-piercing strikes), _Control_ (fatigue, uncounterable) and _Mastery_ (the pool's best). Names, lore and requirements are in `attacks.json`.

## Unlock-level curve

Every technique opens at a set pilot level, so nobody has more than the two starters at levels 1-2 and techniques arrive gradually through the campaign (prologue pilots are level 1-6, the later acts 5-12). Each faction and weapon pool opens its first technique by level 4, a new one at least every 3 levels, and ends with a master technique at level 13 or 14.

## The 113 techniques

| #   | Faction | Attack                       | Weapon      | Frame        | Style    | Power | Hits | AP  | FP  | Acc | Range  | Level | Rank | Value | Needs                  | Extras                                                 |
| --- | ------- | ---------------------------- | ----------- | ------------ | -------- | ----- | ---- | --- | --- | --- | ------ | ----- | ---- | ----- | ---------------------- | ------------------------------------------------------ |
| 1   | Corsair | Boarding Slash               | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | AGL 9                  | -                                                      |
| 2   | Corsair | Deck Dance                   | blade       | any          | slash    | 0.55  | 2    | 35  | 9   | +8  | weapon | 5     | 2    | 1.31× | BAS 7, AGL 12          | ignores 50% DEF                                        |
| 3   | Corsair | Salt and Steel               | blade       | any          | sweep    | 1.20  | 1    | 35  | 12  | +3  | weapon | 8     | 3    | 1.57× | POW 11, AGL 10         | +10 FP to target                                       |
| 4   | Corsair | Cutlass Storm                | blade       | any          | slash    | 0.55  | 2    | 30  | 8   | +14 | weapon | 10    | 4    | 1.76× | DEX 11, AGL 14         | ignores 50% DEF, +10 FP to target per hit              |
| 5   | Corsair | Barbary Reaper               | blade       | any          | sweep    | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 5, POW 12, AGL 15  | +10 FP to target                                       |
| 6   | Corsair | Boarding Frenzy              | blade       | any          | slash    | 0.80  | 2    | 45  | 19  | +15 | weapon | 17    | 8    | 2.30× | DEX 14, AGL 16         | ignores 40% DEF                                        |
| 7   | Corsair | Sea-Wolf's Rush              | blade       | any          | charge   | 1.60  | 1    | 40  | 16  | +11 | weapon | 21    | 10   | 2.74× | POW 18, AGL 18         | ignores 30% DEF, +10 FP to target                      |
| 8   | Corsair | Scourge of the Barbary Coast | blade       | any          | slash    | 0.75  | 3    | 60  | 24  | +15 | weapon | 25    | 12   | 3.14× | POW 21, DEX 16, AGL 20 | ignores 40% DEF                                        |
| 9   | Corsair | Boat-Hook Jab                | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | POW 8                  | -                                                      |
| 10  | Corsair | Grapple                      | polearm     | any          | thrust   | 1.10  | 1    | 35  | 9   | +2  | weapon | 5     | 2    | 1.26× | POW 9                  | cannot be countered                                    |
| 11  | Corsair | Keelhaul                     | polearm     | any          | bash     | 1.20  | 1    | 35  | 12  | +3  | weapon | 8     | 3    | 1.57× | POW 12                 | +10 FP to target                                       |
| 12  | Corsair | Harpoon Thrust               | polearm     | any          | thrust   | 1.25  | 1    | 35  | 13  | +4  | 1-2    | 10    | 4    | 1.72× | POW 12, DEX 11         | ignores 30% DEF                                        |
| 13  | Corsair | Drowning Hook                | polearm     | any          | bash     | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.11× | BAS 6, POW 13, AGL 12  | +10 FP to target, cannot be countered                  |
| 14  | Corsair | Gaff and Chain               | polearm     | any          | thrust   | 1.50  | 1    | 40  | 17  | +9  | weapon | 17    | 8    | 2.40× | POW 17, AGL 15         | +15 FP to target, cannot be countered                  |
| 15  | Corsair | Harpooner's Heave            | polearm     | any          | thrust   | 1.60  | 1    | 40  | 16  | +11 | 1-2    | 21    | 10   | 2.73× | POW 19, DEX 16         | ignores 50% DEF                                        |
| 16  | Corsair | Leviathan Hook               | polearm     | any          | bash     | 1.65  | 1    | 40  | 14  | +14 | weapon | 25    | 12   | 3.10× | BAS 11, POW 22, AGL 17 | +30 FP to target, cannot be countered                  |
| 17  | Militia | Fisherman's Hook-Cut         | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | AGL 9                  | -                                                      |
| 18  | Militia | Żejtun Feint                 | blade       | any          | slash    | 0.55  | 2    | 35  | 9   | +8  | weapon | 5     | 2    | 1.31× | DEX 8, AGL 11          | ignores 50% DEF                                        |
| 19  | Militia | Harvest Swing                | blade       | any          | sweep    | 1.15  | 1    | 35  | 10  | +4  | weapon | 7     | 3    | 1.50× | POW 12                 | +10 FP to target                                       |
| 20  | Militia | Carob Split                  | blade       | any          | overhead | 1.40  | 1    | 45  | 18  | +2  | weapon | 10    | 4    | 1.72× | POW 15, AGL 10         | -                                                      |
| 21  | Militia | Last Stand                   | blade       | any          | overhead | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | POW 16, AGL 11, DEF 5  | +10 FP to target                                       |
| 22  | Militia | Carob Sickle                 | blade       | any          | sweep    | 1.60  | 1    | 45  | 19  | +7  | weapon | 17    | 8    | 2.39× | POW 18, AGL 14         | +10 FP to target                                       |
| 23  | Militia | Strike of the Old Stones     | blade       | any          | overhead | 1.85  | 1    | 50  | 22  | +7  | weapon | 21    | 10   | 2.68× | POW 21, AGL 14, DEF 7  | -                                                      |
| 24  | Militia | Defender of the Island       | blade       | any          | slash    | 1.95  | 1    | 50  | 19  | +10 | weapon | 25    | 12   | 3.07× | BAS 11, POW 23, AGL 16 | +5 FP to target                                        |
| 25  | Militia | Aimed Shot                   | firearm     | any          | shot     | 1.10  | 1    | 35  | 29  | +0  | weapon | 4     | 1    | 1.27× | DEX 9                  | ignores 15% DEF                                        |
| 26  | Militia | Double Charge                | firearm     | any          | shot     | 1.20  | 1    | 40  | 33  | +1  | weapon | 6     | 2    | 1.35× | POW 9, DEX 11          | -                                                      |
| 27  | Militia | Crossfire                    | firearm     | any          | volley   | 0.60  | 2    | 35  | 32  | +9  | weapon | 8     | 3    | 1.52× | BAS 7, DEX 13          | ignores 50% DEF                                        |
| 28  | Militia | Braced Shot                  | firearm     | any          | shot     | 1.25  | 1    | 35  | 33  | +5  | weapon | 10    | 4    | 1.74× | BAS 7, DEX 13          | ignores 30% DEF                                        |
| 29  | Militia | Sharpshooter                 | firearm     | any          | shot     | 1.45  | 1    | 45  | 38  | +5  | weapon | 13    | 6    | 2.17× | DEX 16, AGL 10         | ignores 40% DEF                                        |
| 30  | Militia | Parapet Shot                 | firearm     | any          | shot     | 1.50  | 1    | 40  | 37  | +9  | weapon | 17    | 8    | 2.39× | BAS 9, DEX 18          | ignores 40% DEF                                        |
| 31  | Militia | Bastion Volley               | firearm     | any          | volley   | 0.80  | 2    | 40  | 36  | +21 | weapon | 21    | 10   | 2.65× | DEX 19, AGL 13         | ignores 50% DEF                                        |
| 32  | Militia | Dead Aim of Malta            | firearm     | any          | shot     | 1.40  | 1    | 30  | 29  | +40 | weapon | 25    | 12   | 3.12× | BAS 10, DEX 22, AGL 14 | ignores 70% DEF                                        |
| 33  | Militia | Pitchfork Jab                | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | 1-2    | 3     | 1    | 1.10× | DEX 8                  | -                                                      |
| 34  | Militia | Brace and Drive              | polearm     | any          | thrust   | 1.10  | 1    | 35  | 9   | +2  | 1-2    | 5     | 2    | 1.26× | POW 11                 | cannot be countered                                    |
| 35  | Militia | Watchtower Sweep             | polearm     | any          | sweep    | 1.20  | 1    | 35  | 12  | +3  | 1-2    | 8     | 3    | 1.57× | BAS 7, POW 10, AGL 12  | +10 FP to target                                       |
| 36  | Militia | Gaff Hook                    | polearm     | any          | thrust   | 1.25  | 1    | 35  | 13  | +4  | 1-2    | 10    | 4    | 1.73× | POW 11, AGL 11         | +10 FP to target, cannot be countered                  |
| 37  | Militia | Wallbreaker                  | polearm     | any          | thrust   | 1.45  | 1    | 45  | 18  | +5  | 1-2    | 13    | 6    | 2.06× | BAS 7, POW 14, AGL 10  | +10 FP to target                                       |
| 38  | Militia | Ladder-Pusher                | polearm     | any          | thrust   | 1.50  | 1    | 40  | 17  | +9  | 1-2    | 17    | 8    | 2.40× | POW 17, AGL 14         | +15 FP to target, cannot be countered                  |
| 39  | Militia | Watchfire Thrust             | polearm     | any          | thrust   | 1.70  | 1    | 45  | 18  | +10 | 1-2    | 21    | 10   | 2.73× | POW 20, DEX 15, AGL 13 | ignores 30% DEF                                        |
| 40  | Militia | Gate of Birgu                | polearm     | any          | thrust   | 1.75  | 1    | 45  | 15  | +13 | 1-2    | 25    | 12   | 3.09× | BAS 12, POW 22, AGL 15 | ignores 10% DEF, +15 FP to target, cannot be countered |
| 41  | Order   | Cross Cut                    | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | POW 9                  | -                                                      |
| 42  | Order   | Pilgrim's Thrust             | blade       | any          | thrust   | 1.10  | 1    | 35  | 9   | +2  | weapon | 5     | 2    | 1.27× | DEX 10                 | ignores 10% DEF                                        |
| 43  | Order   | Shieldbreaker                | blade/blunt | any          | overhead | 1.15  | 1    | 35  | 10  | +4  | weapon | 7     | 3    | 1.50× | POW 12                 | +10 FP to target                                       |
| 44  | Order   | Eight-Point Flurry           | blade       | any          | slash    | 0.65  | 2    | 40  | 15  | +9  | weapon | 9     | 4    | 1.71× | BAS 8, DEX 13, AGL 10  | ignores 50% DEF                                        |
| 45  | Order   | Stoccata Lunga               | blade       | any          | thrust   | 1.30  | 1    | 40  | 14  | +15 | weapon | 11    | 5    | 1.85× | DEX 14, AGL 9          | -                                                      |
| 46  | Order   | Last Rampart                 | blade       | medium/heavy | overhead | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 5, POW 16, DEX 11  | +10 FP to target                                       |
| 47  | Order   | Bastion Riposte              | blade       | any          | thrust   | 1.50  | 1    | 40  | 17  | +9  | weapon | 17    | 8    | 2.39× | DEX 17, AGL 11         | ignores 40% DEF                                        |
| 48  | Order   | Sword of Saint Michael       | blade       | any          | overhead | 1.85  | 1    | 50  | 22  | +7  | weapon | 21    | 10   | 2.68× | BAS 9, POW 20, DEX 15  | -                                                      |
| 49  | Order   | Dawn of the Grand Master     | blade       | any          | slash    | 0.80  | 2    | 40  | 13  | +25 | weapon | 25    | 12   | 3.11× | POW 22, DEX 19, AGL 13 | ignores 50% DEF, +10 FP to target per hit              |
| 50  | Order   | Shield Bash                  | blunt       | any          | bash     | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.16× | POW 9                  | cannot be countered                                    |
| 51  | Order   | Rim Strike                   | blunt       | any          | bash     | 1.10  | 1    | 35  | 9   | +4  | weapon | 5     | 2    | 1.32× | DEX 9                  | +5 FP to target                                        |
| 52  | Order   | Bell-Ringer                  | blunt       | any          | overhead | 1.15  | 1    | 35  | 10  | +4  | weapon | 7     | 3    | 1.50× | POW 13                 | +10 FP to target                                       |
| 53  | Order   | Helm Splitter                | blunt       | any          | overhead | 1.20  | 1    | 35  | 11  | +5  | weapon | 10    | 4    | 1.72× | POW 14, DEX 9          | ignores 40% DEF                                        |
| 54  | Order   | Knell of Saint John          | blunt       | any          | overhead | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 8, POW 16, DEF 6   | +10 FP to target                                       |
| 55  | Order   | Cathedral Bell               | blunt       | any          | bash     | 1.60  | 1    | 45  | 19  | +7  | weapon | 17    | 8    | 2.39× | BAS 9, POW 19          | +10 FP to target                                       |
| 56  | Order   | Gate-Breaker                 | blunt       | any          | overhead | 1.65  | 1    | 45  | 17  | +10 | weapon | 21    | 10   | 2.71× | POW 21, DEX 14, DEF 8  | ignores 40% DEF                                        |
| 57  | Order   | Judgement of the Langues     | blunt       | any          | bash     | 1.75  | 1    | 45  | 15  | +13 | weapon | 25    | 12   | 3.10× | BAS 12, POW 23, DEF 9  | +20 FP to target, cannot be countered                  |
| 58  | Order   | Hedge of Pikes               | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.16× | DEX 12, DEF 7          | cannot be countered                                    |
| 59  | Order   | Lance of Aragon              | polearm     | any          | charge   | 1.15  | 1    | 35  | 11  | +2  | 1-2    | 5     | 2    | 1.29× | POW 10, AGL 8          | -                                                      |
| 60  | Order   | Halberd Hook                 | polearm     | any          | thrust   | 1.20  | 1    | 35  | 12  | +3  | 1-2    | 8     | 3    | 1.54× | POW 11, DEX 10         | +5 FP to target, cannot be countered                   |
| 61  | Order   | Knight's Charge              | polearm     | medium       | charge   | 1.35  | 1    | 40  | 16  | +5  | 1-2    | 11    | 5    | 1.85× | BAS 6, POW 15, AGL 11  | ignores 20% DEF                                        |
| 62  | Order   | Charge of the Langues        | polearm     | medium       | charge   | 1.45  | 1    | 45  | 18  | +5  | 1-2    | 13    | 6    | 2.06× | BAS 6, POW 14, AGL 10  | +10 FP to target                                       |
| 63  | Order   | Pike Wall of Aragon          | polearm     | any          | thrust   | 1.55  | 1    | 45  | 18  | +8  | 1-2    | 17    | 8    | 2.38× | POW 18, DEX 14         | +10 FP to target, cannot be countered                  |
| 64  | Order   | Lancer's Reckoning           | polearm     | medium       | charge   | 1.70  | 1    | 45  | 18  | +10 | weapon | 21    | 10   | 2.73× | BAS 10, POW 20, AGL 13 | ignores 30% DEF                                        |
| 65  | Order   | Valette's Sortie             | polearm     | medium       | charge   | 1.75  | 1    | 45  | 15  | +13 | weapon | 25    | 12   | 3.12× | BAS 12, POW 22, AGL 15 | ignores 20% DEF, +15 FP to target                      |
| 66  | Ottoman | Crescent Slash               | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | DEX 9                  | -                                                      |
| 67  | Ottoman | Drawing Cut                  | blade       | any          | slash    | 1.10  | 1    | 35  | 9   | +6  | weapon | 5     | 2    | 1.27× | DEX 10, AGL 9          | -                                                      |
| 68  | Ottoman | Janissary's Oath             | blade       | any          | overhead | 1.30  | 1    | 40  | 16  | +1  | weapon | 8     | 3    | 1.52× | POW 12, DEX 9          | -                                                      |
| 69  | Ottoman | Twin Moons                   | blade       | any          | slash    | 0.65  | 2    | 40  | 15  | +9  | weapon | 10    | 4    | 1.71× | BAS 8, DEX 10, AGL 12  | ignores 50% DEF                                        |
| 70  | Ottoman | Sultan's Edge                | blade       | medium       | slash    | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | POW 15, DEX 13, DEF 4  | +10 FP to target                                       |
| 71  | Ottoman | Sabre of the Divan           | blade       | any          | slash    | 1.50  | 1    | 40  | 17  | +9  | weapon | 17    | 8    | 2.39× | DEX 17, AGL 12         | ignores 40% DEF                                        |
| 72  | Ottoman | Whirlwind of the Corps       | blade       | any          | sweep    | 0.90  | 2    | 50  | 21  | +16 | weapon | 21    | 10   | 2.74× | POW 19, AGL 16         | ignores 40% DEF                                        |
| 73  | Ottoman | Blade of the Padishah        | blade       | any          | slash    | 0.70  | 3    | 55  | 22  | +20 | weapon | 25    | 12   | 3.01× | POW 22, DEX 19, AGL 14 | ignores 40% DEF                                        |
| 74  | Ottoman | Fire Pot                     | explosive   | any          | throw    | 1.10  | 1    | 35  | 29  | +0  | weapon | 4     | 1    | 1.17× | DEX 9                  | -                                                      |
| 75  | Ottoman | Smoke and Iron               | explosive   | any          | throw    | 1.15  | 1    | 35  | 31  | +2  | weapon | 6     | 2    | 1.37× | DEX 12                 | +5 FP to target                                        |
| 76  | Ottoman | Humbara Cluster              | explosive   | any          | throw    | 0.55  | 2    | 30  | 28  | +6  | weapon | 9     | 4    | 1.62× | DEX 13, AGL 9          | ignores 50% DEF, +10 FP to target per hit              |
| 77  | Ottoman | Burning Pitch                | explosive   | any          | throw    | 1.15  | 1    | 30  | 29  | +8  | weapon | 11    | 5    | 1.83× | POW 9, DEX 15          | +25 FP to target                                       |
| 78  | Ottoman | Tophane Barrage              | explosive   | any          | throw    | 0.60  | 2    | 35  | 30  | +9  | weapon | 13    | 6    | 2.05× | BAS 7, POW 9, DEX 15   | ignores 40% DEF, +20 FP to target per hit              |
| 79  | Ottoman | Naphtha Flask                | explosive   | any          | throw    | 1.35  | 1    | 35  | 32  | +11 | weapon | 17    | 8    | 2.36× | POW 13, DEX 15         | +30 FP to target                                       |
| 80  | Ottoman | Hail of Greek Fire           | explosive   | any          | throw    | 0.75  | 2    | 40  | 34  | +13 | weapon | 21    | 10   | 2.71× | DEX 17, AGL 13         | ignores 50% DEF, +15 FP to target per hit              |
| 81  | Ottoman | Fire of the Tophane          | explosive   | any          | throw    | 0.65  | 3    | 50  | 39  | +10 | weapon | 25    | 12   | 3.13× | BAS 11, POW 14, DEX 20 | ignores 40% DEF, +15 FP to target per hit              |
| 82  | Ottoman | Steady Volley                | firearm     | any          | shot     | 1.05  | 1    | 30  | 27  | +1  | weapon | 3     | 1    | 1.10× | DEX 9                  | -                                                      |
| 83  | Ottoman | Rolling Fire                 | firearm     | any          | volley   | 0.55  | 2    | 35  | 29  | +8  | weapon | 6     | 2    | 1.31× | DEX 12                 | ignores 50% DEF                                        |
| 84  | Ottoman | Tufek Salvo                  | firearm     | any          | shot     | 1.20  | 1    | 35  | 32  | +3  | weapon | 8     | 3    | 1.57× | POW 10, DEX 11         | +10 FP to target                                       |
| 85  | Ottoman | Marksman of the Orta         | firearm     | any          | shot     | 1.25  | 1    | 35  | 33  | +5  | weapon | 10    | 4    | 1.74× | DEX 15                 | ignores 30% DEF                                        |
| 86  | Ottoman | Fire Line of the Orta        | firearm     | any          | volley   | 0.70  | 2    | 40  | 36  | +16 | weapon | 13    | 6    | 2.08× | BAS 7, DEX 15, AGL 10  | ignores 50% DEF                                        |
| 87  | Ottoman | Orta Platoon Fire            | firearm     | any          | volley   | 0.75  | 2    | 40  | 37  | +17 | weapon | 17    | 8    | 2.31× | DEX 17, AGL 12         | ignores 50% DEF                                        |
| 88  | Ottoman | Veteran of Rhodes            | firearm     | any          | shot     | 1.30  | 1    | 30  | 29  | +31 | weapon | 21    | 10   | 2.78× | BAS 10, DEX 20         | ignores 60% DEF                                        |
| 89  | Ottoman | Thunder of the Corps         | firearm     | any          | volley   | 0.65  | 3    | 50  | 39  | +20 | weapon | 25    | 12   | 3.19× | BAS 10, DEX 22, AGL 14 | ignores 40% DEF, +10 FP to target per hit              |
| 90  | Ottoman | Lance Feint                  | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | 1-2    | 3     | 1    | 1.16× | DEX 9, AGL 12          | cannot be countered                                    |
| 91  | Ottoman | Sipahi Charge                | polearm     | light        | charge   | 1.15  | 1    | 35  | 11  | +2  | 1-2    | 5     | 2    | 1.29× | AGL 10                 | -                                                      |
| 92  | Ottoman | Hooked Spear Pull            | polearm     | any          | thrust   | 1.20  | 1    | 35  | 12  | +3  | 1-2    | 8     | 3    | 1.54× | POW 10, AGL 12         | +5 FP to target, cannot be countered                   |
| 93  | Ottoman | Akinji Sweep                 | polearm     | any          | sweep    | 1.25  | 1    | 35  | 13  | +4  | 1-2    | 10    | 4    | 1.76× | POW 10, AGL 13         | +15 FP to target                                       |
| 94  | Ottoman | Thunder of Hooves            | polearm     | light        | charge   | 1.45  | 1    | 45  | 18  | +5  | 1-2    | 13    | 6    | 2.06× | POW 11, AGL 15         | +10 FP to target                                       |
| 95  | Ottoman | Akinji Lance                 | polearm     | any          | charge   | 1.50  | 1    | 40  | 17  | +9  | weapon | 17    | 8    | 2.34× | POW 18, AGL 15         | +15 FP to target                                       |
| 96  | Ottoman | Hooked Lance Haul            | polearm     | any          | thrust   | 1.55  | 1    | 40  | 15  | +12 | 1-2    | 21    | 10   | 2.75× | POW 19, AGL 16         | +25 FP to target, cannot be countered                  |
| 97  | Ottoman | Wrath of the Sipahi          | polearm     | any          | charge   | 1.60  | 1    | 40  | 13  | +15 | weapon | 25    | 12   | 3.05× | BAS 10, POW 23, AGL 18 | ignores 30% DEF, +20 FP to target                      |
| 98  | Scala   | Piston Strike                | blunt       | any          | bash     | 1.10  | 1    | 35  | 9   | +0  | weapon | 4     | 1    | 1.17× | POW 8                  | -                                                      |
| 99  | Scala   | Valve Release                | blunt       | any          | bash     | 1.15  | 1    | 35  | 11  | +2  | weapon | 6     | 2    | 1.37× | POW 9                  | +5 FP to target                                        |
| 100 | Scala   | Steam Hammer                 | blunt       | any          | overhead | 1.20  | 1    | 35  | 12  | +3  | weapon | 8     | 3    | 1.57× | POW 10                 | +10 FP to target                                       |
| 101 | Scala   | Governor Slam                | blunt       | any          | bash     | 1.25  | 1    | 35  | 13  | +4  | weapon | 10    | 4    | 1.72× | BAS 6, POW 12          | ignores 30% DEF                                        |
| 102 | Scala   | Overpressure                 | blunt       | any          | bash     | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 6, POW 12          | +10 FP to target                                       |
| 103 | Scala   | Piston Cascade               | blunt       | any          | bash     | 1.50  | 1    | 40  | 17  | +9  | weapon | 17    | 8    | 2.34× | BAS 9, POW 18          | +15 FP to target                                       |
| 104 | Scala   | Boiler Burst                 | blunt       | any          | bash     | 1.65  | 1    | 45  | 17  | +10 | weapon | 21    | 10   | 2.71× | BAS 11, POW 21         | ignores 40% DEF                                        |
| 105 | Scala   | The Engineer's Masterpiece   | blunt       | any          | overhead | 1.75  | 1    | 45  | 15  | +13 | weapon | 25    | 12   | 3.13× | BAS 12, POW 23, INT 10 | +25 FP to target                                       |
| 106 | Scala   | Rivet Shot                   | firearm     | any          | shot     | 1.10  | 1    | 35  | 29  | +0  | weapon | 4     | 1    | 1.30× | DEX 8                  | ignores 20% DEF                                        |
| 107 | Scala   | Grapeshot                    | firearm     | any          | volley   | 0.55  | 2    | 35  | 29  | +8  | weapon | 6     | 2    | 1.31× | DEX 8                  | ignores 50% DEF                                        |
| 108 | Scala   | Siege Bolt                   | firearm     | any          | shot     | 1.25  | 1    | 35  | 33  | +4  | weapon | 9     | 4    | 1.72× | DEX 10                 | ignores 30% DEF                                        |
| 109 | Scala   | Chain Shot                   | firearm     | any          | volley   | 0.60  | 2    | 35  | 30  | +13 | weapon | 11    | 5    | 1.78× | BAS 6, DEX 11          | ignores 40% DEF, +10 FP to target per hit              |
| 110 | Scala   | Full Broadside               | firearm     | heavy        | volley   | 0.60  | 2    | 35  | 30  | +21 | weapon | 14    | 6    | 2.11× | POW 10, DEX 12         | ignores 50% DEF, +10 FP to target per hit              |
| 111 | Scala   | Pressure Round               | firearm     | any          | shot     | 1.20  | 1    | 30  | 28  | +27 | weapon | 17    | 8    | 2.36× | BAS 9, DEX 16          | ignores 50% DEF                                        |
| 112 | Scala   | Hail of Rivets               | firearm     | any          | volley   | 0.75  | 2    | 40  | 34  | +23 | weapon | 21    | 10   | 2.82× | DEX 18, AGL 12         | ignores 50% DEF, +10 FP to target per hit              |
| 113 | Scala   | Thunder Engine               | firearm     | any          | volley   | 0.60  | 3    | 45  | 36  | +22 | weapon | 25    | 12   | 3.19× | BAS 12, DEX 21, INT 10 | ignores 50% DEF, +10 FP to target per hit              |
