import { useEffect, useState } from 'preact/hooks';
import type { CloseUpData, CloseUpSide } from '../../scenes/BattleController';
import { sfx } from '../../platform/audio';
import { settings } from '../../state/settings';

interface Props {
  data: CloseUpData;
  onDone: () => void;
}

type Phase = { strike: number; step: 'bark' | 'impact' | 'reply' };

/**
 * Cinematic duel cut-in: both combatants side by side with a line each, the blow, the result.
 * Tap anywhere to skip. Timing scales with the battle-speed setting.
 */
export function CloseUp({ data, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>({ strike: 0, step: 'bark' });
  const [hp, setHp] = useState<Record<string, number>>({
    [data.left.id]: data.left.hpBefore,
    [data.right.id]: data.right.hpBefore,
  });
  const speed = settings.get().battleSpeed;

  useEffect(() => {
    const strike = data.strikes[phase.strike];
    if (!strike) {
      onDone();
      return;
    }
    const ms = { bark: 700, impact: 650, reply: 800 }[phase.step] / speed;
    const t = setTimeout(() => {
      if (phase.step === 'bark') {
        sfx(
          !strike.result.hit
            ? 'miss'
            : phase.strike > 0
              ? 'counter'
              : data.reaction === 'defend'
                ? 'defend'
                : 'hit',
        );
        setHp((h) => ({ ...h, [strike.result.targetId]: strike.result.targetHp }));
        setPhase({ strike: phase.strike, step: 'impact' });
      } else if (phase.step === 'impact') {
        setPhase({ strike: phase.strike, step: 'reply' });
      } else {
        setPhase({ strike: phase.strike + 1, step: 'bark' });
      }
    }, ms);
    return () => clearTimeout(t);
  }, [phase, data, onDone, speed]);

  const strike = data.strikes[phase.strike];
  if (!strike) return null;
  const attackerId = strike.result.attackerId;
  const leftAttacks = attackerId === data.left.id;
  const impact = phase.step !== 'bark';
  const resultText = strike.result.hit ? `${strike.result.damage}` : 'Miss';

  const fighter = (s: CloseUpSide, isLeft: boolean) => {
    const attacking = s.id === attackerId;
    const hit = impact && !attacking && strike.result.hit;
    const hpNow = hp[s.id] ?? s.hpBefore;
    return (
      <div
        class={`cu-fighter ${isLeft ? 'left' : 'right'} ${attacking && impact ? 'lunge' : ''} ${hit ? 'hit' : ''}`}
      >
        <div class={`cu-frame cu-${s.side}`}>{s.initial}</div>
        {impact && !attacking && (
          <div class={`cu-result ${strike.result.hit ? 'dmg' : 'miss'}`}>{resultText}</div>
        )}
        <div class="cu-hp">
          <span style={{ width: `${(hpNow / s.maxHp) * 100}%` }} />
        </div>
        <div class="cu-hp-num">
          {hpNow}/{s.maxHp}
        </div>
      </div>
    );
  };

  const leftLine = leftAttacks ? strike.bark : phase.step === 'reply' ? strike.reply : '';
  const rightLine = !leftAttacks ? strike.bark : phase.step === 'reply' ? strike.reply : '';

  return (
    <div class="closeup" role="dialog" aria-label="Duel" onClick={onDone} data-testid="closeup">
      <div class="cu-stage">
        {fighter(data.left, true)}
        {impact && strike.result.hit && <div class="cu-flash" />}
        {fighter(data.right, false)}
      </div>
      <div class="cu-lines">
        <div class={`cu-line ${data.left.side}`}>
          <div class={`portrait portrait-${data.left.side}`}>{data.left.initial}</div>
          <p>{leftLine}</p>
        </div>
        <div class={`cu-line right ${data.right.side}`}>
          <p>{rightLine}</p>
          <div class={`portrait portrait-${data.right.side}`}>{data.right.initial}</div>
        </div>
      </div>
      <div class="cu-skip">Tap to skip</div>
    </div>
  );
}
