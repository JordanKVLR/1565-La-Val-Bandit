import type { BattleState, UnitState } from '@m1565/core';
import { attackFpCost, attackRange, unlockedAttacks } from '@m1565/core';
import { useEffect, useRef, useState } from 'preact/hooks';
import { UnitViewer } from '../../render/UnitViewer';
import { TechniqueCard } from './TechniqueCard';
import type { CostPreview } from './StatBars';
import { ATTRIBUTE_BAR_MAX, gearNote, Portrait } from './StatBars';
import { STAT_INFO } from './statInfo';
import { frameName, gearName, unitFigure, VbBars } from './vb';

import { SIDE_COLORS as SIDE_COLOR } from '../../render/palette';

/**
 * Compact card for a unit (bottom-left, clear of the action menu): portrait, AP/FP/HP bars,
 * name and level. `preview` shows what the action being set up will cost.
 */
export function UnitCard({
  unit,
  state,
  onDetails,
  preview,
  testId = 'unit-card',
}: {
  unit: UnitState;
  state: BattleState;
  onDetails: () => void;
  preview?: CostPreview | undefined;
  testId?: string;
}) {
  return (
    <aside class={`vb-panel unit-card side-${unit.side}`} data-testid={testId}>
      <div class="uc-top">
        <Portrait name={unit.name} side={unit.side} castId={unit.characterId} />
        <VbBars unit={unit} balance={state.balance} ap={preview?.ap ?? 0} fp={preview?.fp ?? 0} />
      </div>
      <div class="uc-head">
        <strong class="vb-name">{unit.name}</strong>
        <small>LV {unit.level}</small>
        <button
          type="button"
          class="vb-cmd mini details"
          onClick={onDetails}
          aria-label={`Details for ${unit.name}`}
        >
          Info
        </button>
      </div>
      {unit.side === 'player' && (
        <span class="xp-line" data-testid="unit-xp">
          EXP {unit.xp}/{state.balance.xpPerLevel}
          <span class="xp-track">
            <span style={{ width: `${(unit.xp / state.balance.xpPerLevel) * 100}%` }} />
          </span>
          {unit.statPoints > 0 && <b> +{unit.statPoints} pts</b>}
        </span>
      )}
    </aside>
  );
}

/** Short segmented bar for an attribute: 20 ticks, full at 40. */
function Ticks({ value }: { value: number }) {
  const lit = Math.round((Math.min(value, ATTRIBUTE_BAR_MAX) / ATTRIBUTE_BAR_MAX) * 20);
  return (
    <span class="vb-ticks" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => (
        <i key={i} class={i < lit ? 'on' : ''} />
      ))}
    </span>
  );
}

function Figure({ unit }: { unit: UnitState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let viewer: UnitViewer | null = null;
    try {
      viewer = new UnitViewer(ref.current, unitFigure(unit, SIDE_COLOR[unit.side]));
    } catch {
      // No WebGL: the equipment list still shows.
    }
    return () => viewer?.dispose();
  }, [unit.id, unit.side, unit.weapon.type, unit.frameId]);
  return <canvas ref={ref} class="vbd-figure" aria-hidden="true" />;
}

/**
 * Full sheet in the classic layout: the unit's figure and equipment on the left; portrait,
 * attribute bars, AP/FP/HP and level on the right; "More info" turns to the techniques.
 */
export function UnitDetails({
  unit,
  state,
  onClose,
  onSpend,
}: {
  unit: UnitState;
  state: BattleState;
  onClose: () => void;
  onSpend?: () => void;
}) {
  const [page, setPage] = useState<'stats' | 'techniques'>('stats');
  // Enemies' techniques stay a mystery; your own are listed.
  const techniques = unit.side === 'player' ? unlockedAttacks(unit) : [];
  const reach = attackRange(unit.attacks[0]!, unit.weapon);
  return (
    <div class="modal vbd" role="dialog" aria-label={`${unit.name} details`} onClick={onClose}>
      <div class="vbd-sheet" onClick={(e) => e.stopPropagation()}>
        <section class="vb-panel vbd-left">
          <Figure unit={unit} />
          <ul class="vbd-equip">
            <li>
              <span class="eq-icon frame" aria-hidden="true" />
              {frameName(unit)}
            </li>
            <li>
              <span class="eq-icon weapon" aria-hidden="true" />
              {unit.weapon.name}
            </li>
            <li>
              <span class="eq-icon item" aria-hidden="true" />
              {gearName(unit.charmId, 'charm')}
            </li>
            <li>
              <span class="eq-icon item" aria-hidden="true" />
              {gearName(unit.amuletId, 'amulet')}
            </li>
          </ul>
        </section>
        <section class="vb-panel vbd-right">
          {page === 'stats' ? (
            <>
              <div class="vbd-top">
                <div class="vbd-portrait">
                  <Portrait name={unit.name} side={unit.side} castId={unit.characterId} />
                  <VbBars unit={unit} balance={state.balance} />
                </div>
                <div class="vbd-attrs">
                  {STAT_INFO.map((s) => (
                    <div class="vbd-attr" key={s.key} title={s.help}>
                      <span class="lbl">{s.label}</span>
                      <b>
                        {unit[s.key]}
                        {unit[s.key] !== unit.pilot[s.key] && (
                          <small class="vbd-gear" title="From gear">
                            {gearNote(unit[s.key] - unit.pilot[s.key])}
                          </small>
                        )}
                      </b>
                      <Ticks value={unit[s.key]} />
                    </div>
                  ))}
                </div>
              </div>
              <h2 class="vb-name vbd-name">{unit.name}</h2>
              <dl class="vbd-list">
                <dt>Current Level</dt>
                <dd>{unit.level}</dd>
                <dt>Exp. To Next</dt>
                <dd>{unit.side === 'player' ? state.balance.xpPerLevel - unit.xp : '---'}</dd>
                <dt>Blocks</dt>
                <dd>{Math.round(unit.def * state.balance.defDamagePerPoint)} dmg</dd>
                <dt>Move</dt>
                <dd>{unit.mov}</dd>
                <dt>Range</dt>
                <dd>{reach.min === reach.max ? reach.max : `${reach.min}–${reach.max}`}</dd>
              </dl>
            </>
          ) : (
            <div class="ud-techniques">
              <h2 class="vb-name vbd-name">{unit.name}: Techniques</h2>
              {unit.side === 'player' ? (
                <div class="tech-list">
                  {techniques.map((a) => (
                    <TechniqueCard
                      key={a.id}
                      attack={a}
                      weapon={unit.weapon}
                      fpCost={attackFpCost(state, unit, a)}
                    />
                  ))}
                </div>
              ) : (
                <p>An enemy's techniques are only revealed in battle.</p>
              )}
            </div>
          )}
          <div class="vbd-actions">
            {onSpend && unit.statPoints > 0 && (
              <button type="button" class="vb-cmd" onClick={onSpend}>
                Spend {unit.statPoints} points
              </button>
            )}
            <button
              type="button"
              class="vb-cmd more"
              onClick={() => setPage(page === 'stats' ? 'techniques' : 'stats')}
            >
              {page === 'stats' ? 'More Info' : 'Back'}
            </button>
            <button type="button" class="vb-cmd" onClick={onClose}>
              Close
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
