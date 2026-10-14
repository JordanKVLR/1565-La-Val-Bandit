# Attacks

Generated from `packages/content/data/attacks.json` and `balance.json` (AP/FP/accuracy come from the shared technique formula). Every pilot also has the two **starter** attacks for their weapon below; a faction technique unlocks when the pilot has reached its **Level** and their stats (gear included) meet the requirement (ADR 0015).

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

## Unlock-level curve

Every technique opens at a set pilot level, so nobody has more than the two starters at levels 1-2
and techniques arrive gradually through the campaign (Prologue pilots are level 1-6, the later
acts 5-12):

| Tier     | Levels | Which techniques                                                                             |
| -------- | ------ | -------------------------------------------------------------------------------------------- |
| Entry    | 3-4    | Power at most 1.15 with a single stat requirement of about 10 or less (Hook-Cut, Aimed Shot) |
| Early    | 5-6    | Reach or utility techniques and the first twin-strike/heavy ones (Lances, Rolling Fire)      |
| Mid      | 7-9    | Power 1.2-1.4, two-stat requirements, twin strikes (Janissary's Oath, Crossfire)             |
| Advanced | 10-12  | Power 1.5 and up, three-stat requirements (Carob Split, Sharpshooter, Overpressure)          |
| Ultimate | 13-14  | Sultan's Edge (13), Full Broadside (14)                                                      |

Within a faction and weapon, the heavier techniques open later than the light ones (the levels follow power, cost and stat needs; see the Level column).

| #   | Faction | Attack               | Weapon      | Frame        | Style    | Power | Hits | AP  | FP  | Acc | Range  | Level | Unlock                | Extras                                |
| --- | ------- | -------------------- | ----------- | ------------ | -------- | ----- | ---- | --- | --- | --- | ------ | ----- | --------------------- | ------------------------------------- |
| 1   | Order   | Cross Cut            | blade       | any          | slash    | 1.15  | 1    | 35  | 12  | -9  | weapon | 3     | POW 9                 | -                                     |
| 2   | Order   | Pilgrim's Thrust     | blade       | any          | thrust   | 1.0   | 1    | 30  | 5   | +0  | weapon | 4     | DEX 10                | ignores 30% DEF                       |
| 3   | Order   | Shieldbreaker        | blade/blunt | any          | overhead | 1.3   | 1    | 45  | 18  | -18 | weapon | 7     | POW 12                | +15 FP to target                      |
| 4   | Order   | Eight-Point Flurry   | blade       | any          | slash    | 0.7   | 2    | 50  | 23  | -24 | weapon | 8     | DEX 13, AGL 10, BAS 8 | 2 strikes                             |
| 5   | Order   | Last Rampart         | blade       | medium/heavy | overhead | 1.6   | 1    | 60  | 32  | -36 | weapon | 12    | POW 16, DEX 11, BAS 5 | -                                     |
| 6   | Order   | Shield Bash          | blunt       | any          | bash     | 0.9   | 1    | 25  | 5   | +6  | weapon | 3     | POW 9                 | +10 FP to target; cannot be countered |
| 7   | Order   | Bell-Ringer          | blunt       | any          | overhead | 1.35  | 1    | 50  | 21  | -21 | weapon | 7     | POW 13                | +20 FP to target                      |
| 8   | Order   | Lance of Aragon      | polearm     | any          | charge   | 1.25  | 1    | 40  | 16  | -15 | 1-2    | 5     | POW 10, AGL 8         | -                                     |
| 9   | Order   | Hedge of Pikes       | polearm     | any          | thrust   | 1.0   | 1    | 30  | 5   | +0  | weapon | 6     | DEX 12, DEF 7         | cannot be countered                   |
| 10  | Order   | Knight's Charge      | polearm     | medium       | charge   | 1.5   | 1    | 55  | 28  | -30 | 1-2    | 11    | POW 15, AGL 11, BAS 6 | -                                     |
| 11  | Militia | Fisherman's Hook-Cut | blade       | any          | slash    | 1.1   | 1    | 35  | 10  | -6  | weapon | 3     | AGL 9                 | -                                     |
| 12  | Militia | Żejtun Feint         | blade       | any          | slash    | 0.65  | 2    | 45  | 18  | -18 | weapon | 7     | AGL 11, DEX 8         | 2 strikes                             |
| 13  | Militia | Harvest Swing        | blade       | any          | sweep    | 1.3   | 1    | 45  | 18  | -18 | weapon | 6     | POW 12                | +15 FP to target                      |
| 14  | Militia | Carob Split          | blade       | any          | overhead | 1.55  | 1    | 60  | 30  | -33 | weapon | 11    | POW 15, AGL 10        | -                                     |
| 15  | Militia | Pitchfork Jab        | polearm     | any          | thrust   | 1.0   | 1    | 30  | 5   | +0  | 1-2    | 3     | DEX 8                 | -                                     |
| 16  | Militia | Brace and Drive      | polearm     | any          | thrust   | 1.3   | 1    | 45  | 18  | -18 | 1-2    | 6     | POW 11                | cannot be countered                   |
| 17  | Militia | Watchtower Sweep     | polearm     | any          | sweep    | 1.2   | 1    | 40  | 14  | -12 | 1-2    | 9     | AGL 12, POW 10, BAS 7 | +20 FP to target                      |
| 18  | Militia | Aimed Shot           | firearm     | any          | shot     | 1.2   | 1    | 55  | 34  | +25 | weapon | 4     | DEX 9                 | ignores 50% DEF                       |
| 19  | Militia | Double Charge        | firearm     | any          | shot     | 1.35  | 1    | 50  | 41  | -21 | weapon | 7     | POW 9, DEX 11         | -                                     |
| 20  | Militia | Crossfire            | firearm     | any          | volley   | 0.65  | 2    | 45  | 38  | -18 | weapon | 9     | DEX 13, BAS 7         | 2 strikes                             |
| 21  | Militia | Sharpshooter         | firearm     | any          | shot     | 1.2   | 1    | 40  | 34  | -12 | weapon | 12    | DEX 16, AGL 10        | ignores 40% DEF                       |
| 22  | Ottoman | Crescent Slash       | blade       | any          | slash    | 1.15  | 1    | 35  | 12  | -9  | weapon | 3     | DEX 9                 | -                                     |
| 23  | Ottoman | Janissary's Oath     | blade       | any          | overhead | 1.4   | 1    | 50  | 23  | -24 | weapon | 7     | POW 12, DEX 9         | -                                     |
| 24  | Ottoman | Twin Moons           | blade       | any          | slash    | 0.7   | 2    | 50  | 23  | -24 | weapon | 9     | AGL 12, DEX 10, BAS 8 | 2 strikes                             |
| 25  | Ottoman | Sultan's Edge        | blade       | medium       | slash    | 1.6   | 1    | 60  | 32  | -36 | weapon | 13    | POW 15, DEX 13, DEF 4 | ignores 30% DEF                       |
| 26  | Ottoman | Steady Volley        | firearm     | any          | shot     | 1.0   | 1    | 30  | 25  | +0  | weapon | 3     | DEX 9                 | -                                     |
| 27  | Ottoman | Rolling Fire         | firearm     | any          | volley   | 0.6   | 2    | 40  | 34  | -12 | weapon | 6     | DEX 12                | 2 strikes                             |
| 28  | Ottoman | Marksman of the Orta | firearm     | any          | shot     | 1.3   | 1    | 45  | 38  | -18 | weapon | 10    | DEX 15                | ignores 35% DEF                       |
| 29  | Ottoman | Sipahi Charge        | polearm     | light        | charge   | 1.3   | 1    | 45  | 18  | -18 | 1-2    | 5     | AGL 10                | -                                     |
| 30  | Ottoman | Lance Feint          | polearm     | any          | thrust   | 1.0   | 1    | 30  | 5   | +0  | 1-2    | 6     | AGL 12, DEX 9         | cannot be countered                   |
| 31  | Ottoman | Thunder of Hooves    | polearm     | light        | charge   | 1.6   | 1    | 60  | 32  | -36 | 1-2    | 12    | AGL 15, POW 11        | +20 FP to target                      |
| 32  | Ottoman | Fire Pot             | explosive   | any          | throw    | 1.1   | 1    | 35  | 30  | -6  | weapon | 4     | DEX 9                 | +15 FP to target                      |
| 33  | Ottoman | Smoke and Iron       | explosive   | any          | throw    | 1.0   | 1    | 30  | 25  | +0  | weapon | 6     | DEX 12                | +25 FP to target                      |
| 34  | Ottoman | Burning Pitch        | explosive   | any          | throw    | 1.5   | 1    | 55  | 48  | -30 | weapon | 11    | DEX 15, POW 9         | +25 FP to target                      |
| 35  | Corsair | Boarding Slash       | blade       | any          | slash    | 1.1   | 1    | 35  | 10  | -6  | weapon | 3     | AGL 9                 | -                                     |
| 36  | Corsair | Deck Dance           | blade       | any          | slash    | 0.65  | 2    | 45  | 18  | -18 | weapon | 7     | AGL 12, BAS 7         | 2 strikes                             |
| 37  | Corsair | Salt and Steel       | blade       | any          | sweep    | 1.3   | 1    | 45  | 18  | -18 | weapon | 8     | POW 11, AGL 10        | +15 FP to target                      |
| 38  | Corsair | Barbary Reaper       | blade       | any          | sweep    | 1.55  | 1    | 60  | 30  | -33 | weapon | 12    | AGL 15, POW 12, BAS 5 | ignores 25% DEF                       |
| 39  | Corsair | Grapple              | polearm     | any          | thrust   | 0.9   | 1    | 25  | 5   | +6  | weapon | 4     | POW 9                 | +20 FP to target; cannot be countered |
| 40  | Corsair | Keelhaul             | polearm     | any          | bash     | 1.3   | 1    | 45  | 18  | -18 | weapon | 8     | POW 12                | +20 FP to target                      |
| 41  | Scala   | Piston Strike        | blunt       | any          | bash     | 1.25  | 1    | 40  | 16  | -15 | weapon | 4     | POW 8                 | -                                     |
| 42  | Scala   | Steam Hammer         | blunt       | any          | overhead | 1.5   | 1    | 55  | 28  | -30 | weapon | 8     | POW 10                | +20 FP to target                      |
| 43  | Scala   | Overpressure         | blunt       | any          | bash     | 1.8   | 1    | 70  | 41  | -48 | weapon | 12    | POW 12, BAS 6         | ignores 30% DEF                       |
| 44  | Scala   | Grapeshot            | firearm     | any          | volley   | 0.7   | 2    | 50  | 43  | -24 | weapon | 6     | DEX 8                 | 2 strikes                             |
| 45  | Scala   | Siege Bolt           | firearm     | any          | shot     | 1.4   | 1    | 50  | 43  | -24 | weapon | 9     | DEX 10                | ignores 40% DEF                       |
| 46  | Scala   | Full Broadside       | firearm     | heavy        | volley   | 0.9   | 2    | 70  | 61  | -48 | weapon | 14    | DEX 12, POW 10        | 2 strikes                             |

## When each pilot gets a third attack

Nobody starts with three attacks. At the levels they have in the story, with their frame and weapon:

| Pilot                 | Weapon          | First technique (level)      |
| --------------------- | --------------- | ---------------------------- |
| Ninu                  | Arming Sword    | Fisherman's Hook-Cut (3)     |
| Kateri, Rozi, Balbi   | Arquebus        | Aimed Shot (4)               |
| Deniz, Yusuf          | Kilij / Cutlass | Boarding Slash (3)           |
| Leyla                 | Grenado         | Fire Pot (4)                 |
| Luis, Ganni, Anastagi | -               | when their stats meet a need |
