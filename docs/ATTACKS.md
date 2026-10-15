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

## The 71 techniques

| #   | Faction | Attack                | Weapon      | Frame        | Style    | Power | Hits | AP  | FP  | Acc | Range  | Level | Rank | Value | Needs                 | Extras                                    |
| --- | ------- | --------------------- | ----------- | ------------ | -------- | ----- | ---- | --- | --- | --- | ------ | ----- | ---- | ----- | --------------------- | ----------------------------------------- |
| 1   | Corsair | Boarding Slash        | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | AGL 9                 | -                                         |
| 2   | Corsair | Deck Dance            | blade       | any          | slash    | 0.55  | 2    | 35  | 9   | +8  | weapon | 5     | 2    | 1.31× | BAS 7, AGL 12         | ignores 50% DEF                           |
| 3   | Corsair | Salt and Steel        | blade       | any          | sweep    | 1.20  | 1    | 35  | 12  | +3  | weapon | 8     | 3    | 1.57× | POW 11, AGL 10        | +10 FP to target                          |
| 4   | Corsair | Cutlass Storm         | blade       | any          | slash    | 0.55  | 2    | 30  | 8   | +14 | weapon | 10    | 4    | 1.76× | DEX 11, AGL 14        | ignores 50% DEF, +10 FP to target per hit |
| 5   | Corsair | Barbary Reaper        | blade       | any          | sweep    | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 5, POW 12, AGL 15 | +10 FP to target                          |
| 6   | Corsair | Boat-Hook Jab         | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | POW 8                 | -                                         |
| 7   | Corsair | Grapple               | polearm     | any          | thrust   | 1.10  | 1    | 35  | 9   | +2  | weapon | 5     | 2    | 1.26× | POW 9                 | cannot be countered                       |
| 8   | Corsair | Keelhaul              | polearm     | any          | bash     | 1.20  | 1    | 35  | 12  | +3  | weapon | 8     | 3    | 1.57× | POW 12                | +10 FP to target                          |
| 9   | Corsair | Harpoon Thrust        | polearm     | any          | thrust   | 1.25  | 1    | 35  | 13  | +4  | 1-2    | 10    | 4    | 1.72× | POW 12, DEX 11        | ignores 30% DEF                           |
| 10  | Corsair | Drowning Hook         | polearm     | any          | bash     | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.11× | BAS 6, POW 13, AGL 12 | +10 FP to target, cannot be countered     |
| 11  | Militia | Fisherman's Hook-Cut  | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | AGL 9                 | -                                         |
| 12  | Militia | Żejtun Feint          | blade       | any          | slash    | 0.55  | 2    | 35  | 9   | +8  | weapon | 5     | 2    | 1.31× | DEX 8, AGL 11         | ignores 50% DEF                           |
| 13  | Militia | Harvest Swing         | blade       | any          | sweep    | 1.15  | 1    | 35  | 10  | +4  | weapon | 7     | 3    | 1.50× | POW 12                | +10 FP to target                          |
| 14  | Militia | Carob Split           | blade       | any          | overhead | 1.40  | 1    | 45  | 18  | +2  | weapon | 10    | 4    | 1.72× | POW 15, AGL 10        | -                                         |
| 15  | Militia | Last Stand            | blade       | any          | overhead | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | POW 16, AGL 11, DEF 5 | +10 FP to target                          |
| 16  | Militia | Aimed Shot            | firearm     | any          | shot     | 1.10  | 1    | 35  | 29  | +0  | weapon | 4     | 1    | 1.27× | DEX 9                 | ignores 15% DEF                           |
| 17  | Militia | Double Charge         | firearm     | any          | shot     | 1.20  | 1    | 40  | 33  | +1  | weapon | 6     | 2    | 1.35× | POW 9, DEX 11         | -                                         |
| 18  | Militia | Crossfire             | firearm     | any          | volley   | 0.60  | 2    | 35  | 32  | +9  | weapon | 8     | 3    | 1.52× | BAS 7, DEX 13         | ignores 50% DEF                           |
| 19  | Militia | Braced Shot           | firearm     | any          | shot     | 1.25  | 1    | 35  | 33  | +5  | weapon | 10    | 4    | 1.74× | BAS 7, DEX 13         | ignores 30% DEF                           |
| 20  | Militia | Sharpshooter          | firearm     | any          | shot     | 1.45  | 1    | 45  | 38  | +5  | weapon | 13    | 6    | 2.17× | DEX 16, AGL 10        | ignores 40% DEF                           |
| 21  | Militia | Pitchfork Jab         | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | 1-2    | 3     | 1    | 1.10× | DEX 8                 | -                                         |
| 22  | Militia | Brace and Drive       | polearm     | any          | thrust   | 1.10  | 1    | 35  | 9   | +2  | 1-2    | 5     | 2    | 1.26× | POW 11                | cannot be countered                       |
| 23  | Militia | Watchtower Sweep      | polearm     | any          | sweep    | 1.20  | 1    | 35  | 12  | +3  | 1-2    | 8     | 3    | 1.57× | BAS 7, POW 10, AGL 12 | +10 FP to target                          |
| 24  | Militia | Gaff Hook             | polearm     | any          | thrust   | 1.25  | 1    | 35  | 13  | +4  | 1-2    | 10    | 4    | 1.73× | POW 11, AGL 11        | +10 FP to target, cannot be countered     |
| 25  | Militia | Wallbreaker           | polearm     | any          | thrust   | 1.45  | 1    | 45  | 18  | +5  | 1-2    | 13    | 6    | 2.06× | BAS 7, POW 14, AGL 10 | +10 FP to target                          |
| 26  | Order   | Cross Cut             | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | POW 9                 | -                                         |
| 27  | Order   | Pilgrim's Thrust      | blade       | any          | thrust   | 1.10  | 1    | 35  | 9   | +2  | weapon | 5     | 2    | 1.27× | DEX 10                | ignores 10% DEF                           |
| 28  | Order   | Shieldbreaker         | blade/blunt | any          | overhead | 1.15  | 1    | 35  | 10  | +4  | weapon | 7     | 3    | 1.50× | POW 12                | +10 FP to target                          |
| 29  | Order   | Eight-Point Flurry    | blade       | any          | slash    | 0.65  | 2    | 40  | 15  | +9  | weapon | 9     | 4    | 1.71× | BAS 8, DEX 13, AGL 10 | ignores 50% DEF                           |
| 30  | Order   | Stoccata Lunga        | blade       | any          | thrust   | 1.30  | 1    | 40  | 14  | +15 | weapon | 11    | 5    | 1.85× | DEX 14, AGL 9         | -                                         |
| 31  | Order   | Last Rampart          | blade       | medium/heavy | overhead | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 5, POW 16, DEX 11 | +10 FP to target                          |
| 32  | Order   | Shield Bash           | blunt       | any          | bash     | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.16× | POW 9                 | cannot be countered                       |
| 33  | Order   | Rim Strike            | blunt       | any          | bash     | 1.10  | 1    | 35  | 9   | +4  | weapon | 5     | 2    | 1.32× | DEX 9                 | +5 FP to target                           |
| 34  | Order   | Bell-Ringer           | blunt       | any          | overhead | 1.15  | 1    | 35  | 10  | +4  | weapon | 7     | 3    | 1.50× | POW 13                | +10 FP to target                          |
| 35  | Order   | Helm Splitter         | blunt       | any          | overhead | 1.20  | 1    | 35  | 11  | +5  | weapon | 10    | 4    | 1.72× | POW 14, DEX 9         | ignores 40% DEF                           |
| 36  | Order   | Knell of Saint John   | blunt       | any          | overhead | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 8, POW 16, DEF 6  | +10 FP to target                          |
| 37  | Order   | Hedge of Pikes        | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.16× | DEX 12, DEF 7         | cannot be countered                       |
| 38  | Order   | Lance of Aragon       | polearm     | any          | charge   | 1.15  | 1    | 35  | 11  | +2  | 1-2    | 5     | 2    | 1.29× | POW 10, AGL 8         | -                                         |
| 39  | Order   | Halberd Hook          | polearm     | any          | thrust   | 1.20  | 1    | 35  | 12  | +3  | 1-2    | 8     | 3    | 1.54× | POW 11, DEX 10        | +5 FP to target, cannot be countered      |
| 40  | Order   | Knight's Charge       | polearm     | medium       | charge   | 1.35  | 1    | 40  | 16  | +5  | 1-2    | 11    | 5    | 1.85× | BAS 6, POW 15, AGL 11 | ignores 20% DEF                           |
| 41  | Order   | Charge of the Langues | polearm     | medium       | charge   | 1.45  | 1    | 45  | 18  | +5  | 1-2    | 13    | 6    | 2.06× | BAS 6, POW 14, AGL 10 | +10 FP to target                          |
| 42  | Ottoman | Crescent Slash        | blade       | any          | slash    | 1.05  | 1    | 30  | 7   | +1  | weapon | 3     | 1    | 1.10× | DEX 9                 | -                                         |
| 43  | Ottoman | Drawing Cut           | blade       | any          | slash    | 1.10  | 1    | 35  | 9   | +6  | weapon | 5     | 2    | 1.27× | DEX 10, AGL 9         | -                                         |
| 44  | Ottoman | Janissary's Oath      | blade       | any          | overhead | 1.30  | 1    | 40  | 16  | +1  | weapon | 8     | 3    | 1.52× | POW 12, DEX 9         | -                                         |
| 45  | Ottoman | Twin Moons            | blade       | any          | slash    | 0.65  | 2    | 40  | 15  | +9  | weapon | 10    | 4    | 1.71× | BAS 8, DEX 10, AGL 12 | ignores 50% DEF                           |
| 46  | Ottoman | Sultan's Edge         | blade       | medium       | slash    | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | POW 15, DEX 13, DEF 4 | +10 FP to target                          |
| 47  | Ottoman | Fire Pot              | explosive   | any          | throw    | 1.10  | 1    | 35  | 29  | +0  | weapon | 4     | 1    | 1.17× | DEX 9                 | -                                         |
| 48  | Ottoman | Smoke and Iron        | explosive   | any          | throw    | 1.15  | 1    | 35  | 31  | +2  | weapon | 6     | 2    | 1.37× | DEX 12                | +5 FP to target                           |
| 49  | Ottoman | Humbara Cluster       | explosive   | any          | throw    | 0.55  | 2    | 30  | 28  | +6  | weapon | 9     | 4    | 1.62× | DEX 13, AGL 9         | ignores 50% DEF, +10 FP to target per hit |
| 50  | Ottoman | Burning Pitch         | explosive   | any          | throw    | 1.15  | 1    | 30  | 29  | +8  | weapon | 11    | 5    | 1.83× | POW 9, DEX 15         | +25 FP to target                          |
| 51  | Ottoman | Tophane Barrage       | explosive   | any          | throw    | 0.60  | 2    | 35  | 30  | +9  | weapon | 13    | 6    | 2.05× | BAS 7, POW 9, DEX 15  | ignores 40% DEF, +20 FP to target per hit |
| 52  | Ottoman | Steady Volley         | firearm     | any          | shot     | 1.05  | 1    | 30  | 27  | +1  | weapon | 3     | 1    | 1.10× | DEX 9                 | -                                         |
| 53  | Ottoman | Rolling Fire          | firearm     | any          | volley   | 0.55  | 2    | 35  | 29  | +8  | weapon | 6     | 2    | 1.31× | DEX 12                | ignores 50% DEF                           |
| 54  | Ottoman | Tufek Salvo           | firearm     | any          | shot     | 1.20  | 1    | 35  | 32  | +3  | weapon | 8     | 3    | 1.57× | POW 10, DEX 11        | +10 FP to target                          |
| 55  | Ottoman | Marksman of the Orta  | firearm     | any          | shot     | 1.25  | 1    | 35  | 33  | +5  | weapon | 10    | 4    | 1.74× | DEX 15                | ignores 30% DEF                           |
| 56  | Ottoman | Fire Line of the Orta | firearm     | any          | volley   | 0.70  | 2    | 40  | 36  | +16 | weapon | 13    | 6    | 2.08× | BAS 7, DEX 15, AGL 10 | ignores 50% DEF                           |
| 57  | Ottoman | Lance Feint           | polearm     | any          | thrust   | 1.05  | 1    | 30  | 7   | +1  | 1-2    | 3     | 1    | 1.16× | DEX 9, AGL 12         | cannot be countered                       |
| 58  | Ottoman | Sipahi Charge         | polearm     | light        | charge   | 1.15  | 1    | 35  | 11  | +2  | 1-2    | 5     | 2    | 1.29× | AGL 10                | -                                         |
| 59  | Ottoman | Hooked Spear Pull     | polearm     | any          | thrust   | 1.20  | 1    | 35  | 12  | +3  | 1-2    | 8     | 3    | 1.54× | POW 10, AGL 12        | +5 FP to target, cannot be countered      |
| 60  | Ottoman | Akinji Sweep          | polearm     | any          | sweep    | 1.25  | 1    | 35  | 13  | +4  | 1-2    | 10    | 4    | 1.76× | POW 10, AGL 13        | +15 FP to target                          |
| 61  | Ottoman | Thunder of Hooves     | polearm     | light        | charge   | 1.45  | 1    | 45  | 18  | +5  | 1-2    | 13    | 6    | 2.06× | POW 11, AGL 15        | +10 FP to target                          |
| 62  | Scala   | Piston Strike         | blunt       | any          | bash     | 1.10  | 1    | 35  | 9   | +0  | weapon | 4     | 1    | 1.17× | POW 8                 | -                                         |
| 63  | Scala   | Valve Release         | blunt       | any          | bash     | 1.15  | 1    | 35  | 11  | +2  | weapon | 6     | 2    | 1.37× | POW 9                 | +5 FP to target                           |
| 64  | Scala   | Steam Hammer          | blunt       | any          | overhead | 1.20  | 1    | 35  | 12  | +3  | weapon | 8     | 3    | 1.57× | POW 10                | +10 FP to target                          |
| 65  | Scala   | Governor Slam         | blunt       | any          | bash     | 1.25  | 1    | 35  | 13  | +4  | weapon | 10    | 4    | 1.72× | BAS 6, POW 12         | ignores 30% DEF                           |
| 66  | Scala   | Overpressure          | blunt       | any          | bash     | 1.45  | 1    | 45  | 18  | +5  | weapon | 13    | 6    | 2.06× | BAS 6, POW 12         | +10 FP to target                          |
| 67  | Scala   | Rivet Shot            | firearm     | any          | shot     | 1.10  | 1    | 35  | 29  | +0  | weapon | 4     | 1    | 1.30× | DEX 8                 | ignores 20% DEF                           |
| 68  | Scala   | Grapeshot             | firearm     | any          | volley   | 0.55  | 2    | 35  | 29  | +8  | weapon | 6     | 2    | 1.31× | DEX 8                 | ignores 50% DEF                           |
| 69  | Scala   | Siege Bolt            | firearm     | any          | shot     | 1.25  | 1    | 35  | 33  | +4  | weapon | 9     | 4    | 1.72× | DEX 10                | ignores 30% DEF                           |
| 70  | Scala   | Chain Shot            | firearm     | any          | volley   | 0.60  | 2    | 35  | 30  | +13 | weapon | 11    | 5    | 1.78× | BAS 6, DEX 11         | ignores 40% DEF, +10 FP to target per hit |
| 71  | Scala   | Full Broadside        | firearm     | heavy        | volley   | 0.60  | 2    | 35  | 30  | +21 | weapon | 14    | 6    | 2.11× | POW 10, DEX 12        | ignores 50% DEF, +10 FP to target per hit |
