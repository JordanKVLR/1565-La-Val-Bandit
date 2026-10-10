import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Reaction, UnitState } from '@m1565/core';
import { createBattle, forecastAttack, reactionChoices } from '@m1565/core';
import { loadBattle, loadLibrary } from '@m1565/content';
import { describe, expect, it } from 'vitest';
import { forecastModel } from './forecastModel';
import { signedPct } from './TechniqueCard';

describe('battle overlay styles', () => {
  it('use design tokens only: no raw hex colours', () => {
    const css = readFileSync(join(import.meta.dirname, 'overlays.css'), 'utf8');
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
  });

  it('drop motion with reduced motion where the tokens do not', () => {
    const css = readFileSync(join(import.meta.dirname, 'overlays.css'), 'utf8');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*{\s*\.closeup,\s*\.cu-pop/);
  });
});

describe('forecast model', () => {
  const lib = loadLibrary();
  const base = createBattle(loadBattle('b1-marsaxlokk', lib)).state;
  const player = base.units.find((u) => u.side === 'player')!;
  const enemy = base.units.find((u) => u.side === 'enemy')!;
  // Face to face, the enemy just south of the player.
  const me: UnitState = { ...player, pos: { x: enemy.pos.x, y: enemy.pos.y - 1 }, facing: 'south' };
  const foe: UnitState = { ...enemy, facing: 'north' };
  const state = {
    ...base,
    units: base.units.map((u) => (u.id === me.id ? me : u.id === foe.id ? foe : u)),
  };
  const attack = me.attacks[0]!;
  const f = forecastAttack(state, me, foe, me.pos, attack);
  const model = (reaction: Reaction) =>
    forecastModel({
      state,
      attacker: me,
      defender: foe,
      forecast: f,
      reaction,
      back: f.retaliation,
    });

  it('takes every strike off the defender, never below zero', () => {
    const m = model('none');
    expect(m.defender.hpAfter).toBe(Math.max(0, foe.hp - f.damage.none * f.hits));
    expect(m.attacker.hit).toBe(f.hitChance.none);
    expect(m.attacker.apCost).toBe(attack.apCost);
    expect(m.defender.hit).toBeNull();
    expect(m.attacker.hpAfter).toBe(me.hp);
  });

  it('shows the strike back on the attacker and names its technique', () => {
    if (!f.retaliation) return;
    const m = model('attackBack');
    expect(m.defender.action).toBe('technique');
    expect(m.defender.techniqueName).toBe(f.retaliation.attackName);
    expect(m.defender.hit).toBe(f.retaliation.hitChance);
    expect(m.attacker.hpAfter).toBe(Math.max(0, me.hp - f.retaliation.damage * f.retaliation.hits));
  });

  it('defending lowers the damage shown and costs the defender its FP', () => {
    const choices = reactionChoices(state, foe, me, me.pos, attack);
    const defend = choices.find((c) => c.reaction === 'defend')!;
    const m = forecastModel({
      state,
      attacker: me,
      defender: foe,
      forecast: f,
      reaction: 'defend',
      choice: defend,
    });
    expect(m.defender.damage).toBeNull();
    expect(m.attacker.damage).toBeLessThanOrEqual(f.damage.none);
    expect(m.defender.fpGain).toBe(defend.fpCost);
  });

  it('flags a blow that could finish the defender', () => {
    const weak: UnitState = { ...foe, hp: 1 };
    const m = forecastModel({
      state,
      attacker: me,
      defender: weak,
      forecast: f,
      reaction: 'none',
    });
    expect(m.defenderMayFall).toBe(true);
    expect(m.defender.hpAfter).toBe(0);
  });
});

describe('technique numbers', () => {
  it('sign accuracy with a real minus and ± for none', () => {
    expect(signedPct(10)).toBe('+10%');
    expect(signedPct(-25)).toBe('−25%');
    expect(signedPct(0)).toBe('±0%');
  });
});
