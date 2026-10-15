# 0018: INT replaces WEP; Counter rework; weapons carry their own power

Status: accepted

## Context

Playtest feedback: Counter was useless, WEP was a second damage stat that mostly duplicated POW, and
gear (charms, amulets, harnesses) was not worth the scudi. A mid-battle save from before the XP
rework also showed `NaN` EXP, because saves carry their own balance table and the new keys were
missing (the save version had not been bumped).

## Decisions

- **INT replaces WEP** as the sixth pilot attribute. Damage is `(POW + weapon power) × …`.
  Weapons now carry a `power` field (their old WEP bonus + 5, the average pilot WEP that was lost),
  so damage stays in the same range. Pilot WEP and growth became INT unchanged.
- **Counter**: odds = 15 + 3 × own INT + (DEX+AGL difference), −15 against a blow from the side,
  clamped 5–85%. A blow from behind cannot be countered. A success reflects `1.25 + 0.05 × INT`
  times the blow. A failure still takes ×1.25 at 100% to hit (the forecast now says "+25%").
  FP cost is the attacker's technique FP plus 20 (Countering Thrust costs 5 + 20).
  All numbers live in `balance.json` (`counterIntFactor`, `counterSidePenalty`, `counterReflectPerInt`).
- **Economy**: victory 300, per enemy 90, per enemy level 20, no-losses 150 (about two items a battle).
- **Gear**: HP charms +2/+4/+8 BAS (8/16/32 HP), amulets +2…+4 points each, new INT charms,
  Scholar's Seal and Madonna Medal. Light harnesses have AGL 4–6 and MOV 5–6, heavy ones MOV ≤ 3.
- **Saves**: battle save version 9 (`OLDEST_BATTLE_SAVE = 9`, so older snapshots restart the battle,
  keeping the story save); campaign save version 4 renames each pilot's `wep` to `int`.
  Rule: bump `OLDEST_BATTLE_SAVE` whenever balance keys or unit fields change.
