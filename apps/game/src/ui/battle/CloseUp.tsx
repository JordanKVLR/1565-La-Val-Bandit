import { useEffect, useRef, useState } from 'preact/hooks';
import { sfx } from '../../platform/audio';
import { DuelStage } from '../../render/DuelStage';
import type { CloseUpData, CloseUpSide } from '../../scenes/BattleController';
import { settings } from '../../state/settings';
import { t } from '../../i18n';
import { usePrompt } from '../KeyHint';

interface Props {
  data: CloseUpData;
  onDone: () => void;
}

interface Popup {
  readonly key: number;
  readonly side: 'left' | 'right';
  readonly text: string;
  readonly kind: 'dmg' | 'miss' | 'xp' | 'level';
}

/**
 * Cinematic duel: a 3D stage with both pilots as stick figures, animated by the attack style
 * and the defender's reaction. Tap anywhere to skip.
 */
export function CloseUp({ data, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hp, setHp] = useState<Record<string, number>>({
    [data.left.id]: data.left.hpBefore,
    [data.right.id]: data.right.hpBefore,
  });
  const [lines, setLines] = useState<{ left: string; right: string }>({ left: '', right: '' });
  const [popups, setPopups] = useState<Popup[]>([]);
  // The banner names the technique in play: the attack, then the one used to strike back.
  const [title, setTitle] = useState(data.attackName);
  const prompt = usePrompt();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const speed = settings.get().battleSpeed;
    const stage = new DuelStage(canvas, data.left.figure, data.right.figure, '#5b6b35', speed);
    let cancelled = false;
    let key = 0;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms / speed));
    const sideOf = (id: string): 'left' | 'right' => (id === data.left.id ? 'left' : 'right');
    const pop = (p: Omit<Popup, 'key'>) => {
      const k = ++key;
      setPopups((ps) => [...ps, { ...p, key: k }]);
      setTimeout(() => setPopups((ps) => ps.filter((x) => x.key !== k)), 1400 / speed);
    };
    const firstAttacker = data.strikes[0]?.result.attackerId;

    void (async () => {
      for (const s of data.strikes) {
        if (cancelled) return;
        const atkSide = sideOf(s.result.attackerId);
        const defSide = atkSide === 'left' ? 'right' : 'left';
        if (s.bark) setLines((l) => ({ ...l, [atkSide]: s.bark, [defSide]: '' }));
        if (s.result.attackerId !== firstAttacker && data.backName) setTitle(data.backName);
        await stage.playStrike({
          attacker: atkSide,
          style: s.style,
          power: s.power,
          ...(s.attackId ? { attackId: s.attackId } : {}),
          reach: s.reach,
          hit: s.result.hit,
          defeated: s.result.defeated,
          reaction: s.result.attackerId === firstAttacker ? data.reaction : 'none',
          onImpact: () => {
            sfx(
              !s.result.hit
                ? 'miss'
                : s.result.attackerId !== firstAttacker
                  ? 'counter'
                  : data.reaction === 'defend'
                    ? 'defend'
                    : 'hit',
            );
            setHp((h) => ({ ...h, [s.result.targetId]: s.result.targetHp }));
            if (s.repelled) pop({ side: defSide, text: t('closeUp.counter'), kind: 'level' });
            else
              pop({
                side: defSide,
                text: s.result.hit ? `${s.result.damage}` : t('closeUp.miss'),
                kind: s.result.hit ? 'dmg' : 'miss',
              });
            if (
              s.result.hit &&
              data.counter &&
              !data.counter.success &&
              s.result.attackerId === firstAttacker
            ) {
              pop({ side: defSide, text: t('closeUp.counterFailed'), kind: 'xp' });
            }
            if (s.result.xp > 0)
              pop({ side: atkSide, text: t('closeUp.xp', { n: s.result.xp }), kind: 'xp' });
            if (s.levelUp)
              pop({ side: atkSide, text: t('closeUp.levelUp', { n: s.levelUp }), kind: 'level' });
          },
        });
        if (cancelled) return;
        if (s.reply) setLines((l) => ({ ...l, [defSide]: s.reply }));
        await wait(450);
      }
      await wait(350);
      if (!cancelled) doneRef.current();
    })();
    return () => {
      cancelled = true;
      stage.dispose();
    };
  }, [data]);

  const bar = (s: CloseUpSide) => {
    const now = hp[s.id] ?? s.hpBefore;
    return (
      <div class="cu-status">
        <strong>{s.name}</strong>
        <div class="cu-hp">
          <span style={{ width: `${(now / s.maxHp) * 100}%` }} />
        </div>
        <span class="cu-hp-num">
          {now}/{s.maxHp}
        </span>
      </div>
    );
  };

  return (
    <div
      class="closeup"
      role="dialog"
      aria-label={t('closeUp.label')}
      onClick={() => onDone()}
      data-testid="closeup"
    >
      <div class="cu-stage">
        <canvas ref={canvasRef} class="cu-canvas" aria-hidden="true" />
        <div class="cu-top">
          {bar(data.left)}
          <div class="cu-attack">{title}</div>
          {bar(data.right)}
        </div>
        {popups.map((p) => (
          <div key={p.key} class={`cu-pop ${p.side} ${p.kind}`}>
            {p.text}
          </div>
        ))}
      </div>
      <div class="cu-lines">
        <div class={`cu-line ${data.left.side}`}>
          <div class={`portrait portrait-${data.left.side}`}>{data.left.initial}</div>
          <p>{lines.left}</p>
        </div>
        <div class={`cu-line right ${data.right.side}`}>
          <p>{lines.right}</p>
          <div class={`portrait portrait-${data.right.side}`}>{data.right.initial}</div>
        </div>
      </div>
      <div class="cu-skip">{prompt('skip')}</div>
    </div>
  );
}
