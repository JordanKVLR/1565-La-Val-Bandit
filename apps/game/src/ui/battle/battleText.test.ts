import type { Attack, BattleEvent, StrikeResult, UnavailableReason, Weapon } from '@m1565/core';
import { createBattle } from '@m1565/core';
import { loadBattle, loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { helpRows, promptFor } from '../../platform/input/controls';
import { describeAttack } from '../../scenes/BattleController';
import { promptText } from '../prompts';
import { attackStats, attackTags, requirementText, techniqueEffects } from './attackText';
import { describeObjectives, terrainLabel } from './objectives';
import { reasonText } from './reasons';
import { bonusText, STAT_INFO } from './statInfo';

const sword: Weapon = {
  id: 'sword',
  name: 'Sword',
  type: 'blade',
  bonus: {},
  apCost: 30,
  minRange: 1,
  maxRange: 1,
};
const cut: Attack = {
  id: 'cut',
  name: 'Cut',
  style: 'slash',
  power: 1.3,
  accuracy: -25,
  apCost: 40,
  fpCost: 50,
  hits: 2,
  pierce: 0.5,
  fatigue: 10,
  apDamage: 15,
  noCounter: true,
  maxRange: 2,
  requires: { pow: 12, dex: 9 },
};

describe('reaction reasons', () => {
  it('words every reason code', () => {
    const cases: [UnavailableReason, string][] = [
      [{ code: 'outOfReach' }, 'Out of reach'],
      [{ code: 'tooTired', fpCost: 35 }, 'Too tired (needs 35 FP)'],
      [{ code: 'spent' }, 'Too fatigued (FP full)'],
      [{ code: 'rearNoDefend' }, "Can't defend from behind"],
      [{ code: 'rearNoStrikeBack' }, "Can't strike back from behind"],
      [{ code: 'unanswerable', attackName: 'Feint' }, "Feint can't be answered"],
      [{ code: 'attackerOutOfReach' }, 'Attacker out of reach'],
      [{ code: 'tooTiredToStrikeBack' }, 'Too tired to strike back'],
      [{ code: 'frontOnly' }, 'Only against attacks from the front'],
    ];
    for (const [reason, text] of cases) expect(reasonText(reason)).toBe(text);
  });
});

describe('technique text', () => {
  it('lists tags, numbers, effects and requirements', () => {
    expect(attackTags(cut)).toEqual([
      '×2 hits',
      'pierce 50%',
      '+10 FP to target',
      '−15 AP to target',
      'no counter',
    ]);
    expect(attackStats(cut, sword)).toBe('POW 130% · ACC -25 · AP 40 · FP 50 · range 1–2');
    expect(attackStats({ ...cut, accuracy: 10, maxRange: 1 }, sword, 5)).toBe(
      'POW 130% · ACC +10 · AP 40 · FP 5 · range 1',
    );
    expect(techniqueEffects(cut)).toEqual([
      'Strikes twice, each blow rolled separately',
      "Ignores half of the target's DEF",
      'Tires the target: +10 FP',
      'Shakes the target: −15 AP for its next actions',
      "Can't be answered with Attack back or Counter",
      'Reaches an enemy two tiles away',
      'Heavy: a big wind-up, very tiring',
      'Wild: hard to land',
    ]);
    expect(techniqueEffects({ ...cut, hits: 3, pierce: 1, accuracy: 10 })[0]).toBe(
      'Strikes 3 times, each blow rolled separately',
    );
    expect(techniqueEffects({ ...cut, pierce: 0.3 })[1]).toBe("Ignores 30% of the target's DEF");
    expect(requirementText(cut)).toBe('POW 12 · DEX 9');
    const stats = { bas: 10, pow: 8, dex: 9, agl: 10, def: 10, wep: 10 };
    expect(requirementText(cut, stats)).toBe('POW 12 (have 8) · DEX 9');
  });

  it('labels attributes and gear bonuses', () => {
    expect(STAT_INFO.map((s) => s.label)).toEqual(['BAS', 'POW', 'DEX', 'AGL', 'DEF', 'WEP']);
    expect(STAT_INFO[0]!.help).toBe('Base: +4 max HP per point');
    expect(bonusText({ wep: 4, dex: -1 })).toBe('DEX-1 · WEP+4');
  });
});

describe('battle HUD and log', () => {
  const lib = loadLibrary();
  const state = createBattle(loadBattle('b1-marsaxlokk', lib)).state;
  const hero = state.units.find((u) => u.side === 'player')!;
  const foe = state.units.find((u) => u.side === 'enemy')!;

  it('words objectives and the terrain readout', () => {
    const { win, lose } = describeObjectives({
      ...state,
      victory: [
        { type: 'defeatLeader', unitId: foe.id },
        { type: 'survive', rounds: 5 },
      ],
      defeat: [{ type: 'protect', unitId: hero.id }],
    });
    expect(win).toBe(`Defeat ${foe.name} or Hold out for 5 rounds`);
    expect(lose).toBe(`all your units fall or ${hero.name} falls`);
    expect(terrainLabel(1, { avoid: 10, name: 'Field' })).toBe('1H 10% Field');
  });

  it('words an exchange of blows for the battle log', () => {
    const strike = (over: Partial<StrikeResult> = {}): StrikeResult => ({
      attackerId: hero.id,
      targetId: foe.id,
      hitChance: 80,
      hit: true,
      damage: 12,
      zone: 'front',
      targetHp: 20,
      defeated: false,
      xp: 30,
      ...over,
    });
    const back = strike({ attackerId: foe.id, targetId: hero.id, damage: 5, xp: 0 });
    const ev = (
      over: Partial<Extract<BattleEvent, { type: 'attackResolved' }>> = {},
    ): Extract<BattleEvent, { type: 'attackResolved' }> => ({
      type: 'attackResolved',
      reaction: 'defend',
      attackId: 'basic',
      attackName: 'Slash',
      style: 'slash',
      strikes: [strike()],
      ...over,
    });
    const [a, d] = [hero.name, foe.name];
    expect(describeAttack(state, ev())).toBe(
      `${a} uses Slash on ${d}: 12 damage (defended), +30 XP.`,
    );
    expect(describeAttack(state, ev({ strikes: [strike({ xp: 0 })], reaction: 'none' }))).toBe(
      `${a} uses Slash on ${d}: 12 damage (no reaction).`,
    );
    expect(
      describeAttack(state, ev({ strikes: [strike({ hit: false })], reaction: 'avoid' })),
    ).toBe(`${d} avoids ${a}'s Slash.`);
    expect(
      describeAttack(
        state,
        ev({ reaction: 'attackBack', retaliation: back, retaliationName: 'Thrust' }),
      ),
    ).toBe(
      `${a} uses Slash on ${d}: 12 damage (took it to strike back), +30 XP. Strikes back with Thrust: 5 damage.`,
    );
    expect(
      describeAttack(state, ev({ reaction: 'attackBack', retaliation: { ...back, hit: false } })),
    ).toBe(
      `${a} uses Slash on ${d}: 12 damage (took it to strike back), +30 XP. Strikes back: miss.`,
    );
    expect(
      describeAttack(
        state,
        ev({ reaction: 'counter', retaliation: back, counter: { success: true, chance: 40 } }),
      ),
    ).toBe(`${d} COUNTERS ${a}'s Slash (40% chance): 5 damage reflected.`);
    expect(
      describeAttack(state, ev({ reaction: 'counter', counter: { success: false, chance: 40 } })),
    ).toBe(`${a} uses Slash on ${d}: 12 damage (failed counter), +30 XP. The counter failed.`);
  });
});

describe('input prompts', () => {
  it('give a whole sentence for each kind of input', () => {
    expect(promptText('continue', 'pointer')).toBe('Tap to continue');
    expect(promptText('continue', 'keyboard')).toBe('Press Enter to continue');
    expect(promptText('continue', 'gamepad')).toBe(
      `Press ${promptFor('confirm', 'gamepad', 'menu')} to continue`,
    );
    expect(promptText('moveAgain', 'pointer', { cost: 20 })).toBe('AP −20 · tap again to move');
    expect(promptText('pickEnemy', 'keyboard', { attack: 'Slash' })).toBe(
      'Slash: pick a marked enemy',
    );
    expect(promptText('confirmPurchase', 'gamepad', { share: 'half' })).toBe(
      'That is more than half of your purse. Press Ⓐ again to confirm.',
    );
  });

  it('word the controls help from the string table', () => {
    const rows = helpRows('menu');
    expect(rows[0]).toEqual({
      label: 'Move between buttons',
      keys: 'Arrow keys',
      pad: 'D-pad / left stick',
    });
    expect(rows.find((r) => r.label === 'Previous / next tab')?.keys).toBe('[ ]');
  });
});
