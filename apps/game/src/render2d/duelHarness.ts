/**
 * Dev-only harness for the 2D duel (open /duel2d.html). Query parameters:
 *   atk=<attack id>  style=slash|thrust|overhead|sweep|bash|charge|shot|volley|throw
 *   weapon=blade|polearm|blunt|firearm|explosive  modelA=knight  modelB=janissary
 *   hit=1  defeated=0  reaction=none|defend|avoid|counter|attackBack  power=1  reach=1
 *   attacker=left|right  ground=#5b6b35  t=0.45
 * With `t` the strike is stepped in fixed 1/60 s steps up to that strike time and frozen
 * (deterministic, for screenshots); `window.__duel = { total, renderAt(t) }`. Without `t` it
 * plays live and loops.
 */
import type { AttackStyle, FrameClass, Reaction, WeaponType } from '@m1565/core';
import type { ArmaturaModel } from '@m1565/content';
import type { StrikePlay } from '../render/DuelStage';
import { DuelStage2D } from './DuelStage2D';

const q = new URLSearchParams(location.search);
const style = (q.get('style') ?? 'slash') as AttackStyle;
const defaultWeapon: Record<string, WeaponType> = {
  shot: 'firearm',
  volley: 'firearm',
  throw: 'explosive',
  charge: 'polearm',
  bash: 'blunt',
  thrust: 'blade',
};
const weapon = (q.get('weapon') ?? defaultWeapon[style] ?? 'blade') as WeaponType;
const attacker = (q.get('attacker') ?? 'left') as 'left' | 'right';
const flag = (k: string, d: boolean) => (q.has(k) ? q.get(k) === '1' : d);
const frame = (q.get('frame') ?? 'medium') as FrameClass;

const play: StrikePlay = {
  attacker,
  style,
  ...(q.has('atk') ? { attackId: q.get('atk')! } : {}),
  power: Number(q.get('power') ?? 1),
  reach: Number(q.get('reach') ?? 1),
  hit: flag('hit', true),
  defeated: flag('defeated', false),
  reaction: (q.get('reaction') ?? 'none') as Reaction,
};

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ground = q.get('ground') ?? '#5b6b35';
const specs = () => {
  const a = { model: (q.get('modelA') ?? 'knight') as ArmaturaModel, weaponType: weapon, frameClass: frame, accent: '#c0161f' };
  const b = {
    model: (q.get('modelB') ?? 'janissary') as ArmaturaModel,
    weaponType: (q.get('weaponB') ?? 'blade') as WeaponType,
    frameClass: frame,
    accent: '#1f5fc0',
  };
  return attacker === 'left' ? ([a, b] as const) : ([b, a] as const);
};

function make(manual: boolean): DuelStage2D {
  const [l, r] = specs();
  return new DuelStage2D(canvas, l, r, ground, 1, { manual, seed: 1565 });
}

if (q.has('t')) {
  let stage = make(true);
  stage.beginStrike({ ...play });
  const total = stage.strikeTotal;
  const renderAt = (t: number) => {
    stage.dispose();
    stage = make(true);
    stage.beginStrike({ ...play });
    for (let i = 0; i < 4000 && stage.strikeTime < t && stage.striking; i++) stage.advance(1 / 60);
    stage.render();
  };
  (window as unknown as { __duel: unknown }).__duel = { total, renderAt };
  renderAt(Number(q.get('t')));
} else {
  let stage = make(false);
  (window as unknown as { __duel: unknown }).__duel = { total: 0, renderAt: () => undefined };
  const loop = async () => {
    for (;;) {
      await stage.playStrike({ ...play });
      await new Promise((r) => setTimeout(r, 700));
      stage.dispose();
      stage = make(false);
    }
  };
  void loop();
}
