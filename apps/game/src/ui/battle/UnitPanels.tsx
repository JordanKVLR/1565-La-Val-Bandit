import type { BattleState, UnitState } from '@m1565/core';
import { attackFpCost, attackRange, unlockedAttacks } from '@m1565/core';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { UnitViewer } from '../../render/UnitViewer';
import {
  Button,
  Chip,
  Divider,
  Meter,
  Panel,
  Sheet,
  SideMark,
  Stat,
  StatGrid,
  TabPanel,
  Tabs,
} from '../design';
import type { TabItem } from '../design';
import { SkillList } from '../SkillList';
import { TechniqueCard } from './TechniqueCard';
import type { CostPreview } from './StatBars';
import { ATTRIBUTE_BAR_MAX, gearNote, Portrait } from './StatBars';
import { STAT_INFO } from './statInfo';
import { rangeText } from './attackText';
import { frameName, gearName, portraitIdFor, unitFigure } from './vb';

import { SIDE_COLORS as SIDE_COLOR } from '../../render/palette';

/** HP, AP and FP, always in that order, with an optional cost preview on AP and FP. */
function Condition({
  unit,
  state,
  preview,
  stacked = false,
}: {
  unit: UnitState;
  state: BattleState;
  preview?: CostPreview | undefined;
  stacked?: boolean;
}) {
  return (
    <div class="bhud-meters">
      <Meter label={t('stat.hp')} kind="hp" value={unit.hp} max={unit.maxHp} stacked={stacked} />
      <Meter
        label={t('stat.ap')}
        kind="ap"
        value={unit.ap}
        max={state.balance.apMax}
        delta={-(preview?.ap ?? 0)}
        stacked={stacked}
        testId="meter-ap"
      />
      <Meter
        label={t('stat.fp')}
        kind="fp"
        value={unit.fp}
        max={state.balance.fpMax}
        delta={preview?.fp ?? 0}
        stacked={stacked}
      />
    </div>
  );
}

/** Portrait with the side's ring and its shape (circle: yours, diamond: enemy). */
function Avatar({ unit }: { unit: UnitState }) {
  return (
    <div class={`bhud-avatar side-${unit.side}`}>
      <Portrait name={unit.name} side={unit.side} castId={portraitIdFor(unit)} />
      <SideMark side={unit.side} label={t(`unit.side.${unit.side}`)} />
    </div>
  );
}

/**
 * Compact glass card for a unit (bottom left): portrait, name, level and HP/AP/FP. Everything
 * else is one tap away in the details sheet. `preview` shows what the action being set up will
 * cost.
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
    <Panel as="aside" elevation={2} compact class="bhud-card" testId={testId}>
      <Avatar unit={unit} />
      <div class="bhud-card__head">
        <strong class="bhud-card__name">{unit.name}</strong>
        <span class="bhud-card__level">{t('unit.lvUpper', { n: unit.level })}</span>
        {unit.side === 'player' && unit.statPoints > 0 && (
          <Chip tone="gold" icon="plus" label={t('unit.points', { n: unit.statPoints })} />
        )}
        <Button
          class="bhud-card__info"
          label={t('unit.detailsFor', { name: unit.name })}
          icon="info"
          iconOnly
          size="sm"
          variant="ghost"
          onClick={onDetails}
        />
      </div>
      <Condition unit={unit} state={state} preview={preview} />
    </Panel>
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
  return <canvas ref={ref} class="bhud-figure" aria-hidden="true" />;
}

type Page = 'stats' | 'techniques' | 'skills';

/**
 * The full sheet, on demand: a side sheet over the map with Stats (figure, equipment,
 * condition, attributes, numbers), Techniques and Skills tabs.
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
  const [page, setPage] = useState<Page>('stats');
  // Enemies' techniques stay a mystery; your own are listed.
  const techniques = unit.side === 'player' ? unlockedAttacks(unit) : [];
  const reach = attackRange(unit.attacks[0]!, unit.weapon);
  const tabs: TabItem<Page>[] = [
    { id: 'stats', label: t('unit.tab.stats') },
    { id: 'techniques', label: t('unit.tab.techniques') },
  ];
  if ((unit.skills?.length ?? 0) > 0) {
    tabs.push({ id: 'skills', label: t('unit.skills'), testId: 'unit-skills-tab' });
  }
  const idPrefix = `unit-${unit.id}`;
  return (
    <Sheet
      label={t('unit.details', { name: unit.name })}
      title={unit.name}
      closeLabel={t('common.close')}
      onClose={onClose}
      placement="side"
      size="lg"
      class="bhud-details"
      footer={
        onSpend && unit.statPoints > 0 ? (
          <Button
            variant="primary"
            label={t('unit.spendPoints', { n: unit.statPoints })}
            onClick={onSpend}
          />
        ) : undefined
      }
    >
      <div class="bhud-details__top">
        <Avatar unit={unit} />
        <div class="bhud-details__id">
          <span class="bhud-card__level">{t('unit.lvUpper', { n: unit.level })}</span>
          <span class="bhud-details__frame">{frameName(unit)}</span>
        </div>
        <Tabs
          label={t('unit.tabs')}
          tabs={tabs}
          value={page}
          onChange={setPage}
          idPrefix={idPrefix}
          class="bhud-details__tabs"
        />
      </div>
      {page === 'stats' && (
        <TabPanel id="stats" idPrefix={idPrefix} class="bhud-details__stats">
          <section class="bhud-details__figure">
            <Figure unit={unit} />
            <ul class="bhud-equip" aria-label={t('unit.equipment')}>
              <li>
                <span class="bhud-equip__kind">{t('unit.equip.frame')}</span>
                {frameName(unit)}
              </li>
              <li>
                <span class="bhud-equip__kind">{t('unit.equip.weapon')}</span>
                {unit.weapon.name}
              </li>
              <li>
                <span class="bhud-equip__kind">{t('unit.equip.charm')}</span>
                {gearName(unit.charmId, 'charm')}
              </li>
              <li>
                <span class="bhud-equip__kind">{t('unit.equip.amulet')}</span>
                {gearName(unit.amuletId, 'amulet')}
              </li>
            </ul>
          </section>
          <section class="bhud-details__numbers">
            <h3 class="bhud-section">{t('unit.condition')}</h3>
            <Condition unit={unit} state={state} />
            {unit.side === 'player' && (
              <Meter
                label={t('stat.xp')}
                kind="xp"
                thin
                value={unit.xp}
                max={state.balance.xpPerLevel}
                class="bhud-xp"
              />
            )}
            <Divider />
            <StatGrid columns={4}>
              <Stat label={t('unit.currentLevel')} value={unit.level} />
              <Stat
                label={t('unit.expToNext')}
                value={unit.side === 'player' ? state.balance.xpPerLevel - unit.xp : '—'}
              />
              <Stat label={t('unit.move')} value={unit.mov} />
              <Stat label={t('unit.range')} value={rangeText(reach.min, reach.max)} />
              <Stat
                label={t('unit.blocks')}
                value={t('unit.blocksValue', {
                  n: Math.round(unit.def * state.balance.defDamagePerPoint),
                })}
              />
            </StatGrid>
            <h3 class="bhud-section">{t('unit.attributes')}</h3>
            <div class="bhud-attrs">
              {STAT_INFO.map((s) => {
                const geared = unit[s.key];
                const diff = geared - unit.pilot[s.key];
                return (
                  <Meter
                    key={s.key}
                    label={s.label}
                    title={s.help}
                    kind="neutral"
                    value={geared}
                    max={ATTRIBUTE_BAR_MAX}
                    valueText={diff ? `${geared} ${gearNote(diff)}` : `${geared}`}
                  />
                );
              })}
            </div>
          </section>
        </TabPanel>
      )}
      {page === 'techniques' && (
        <TabPanel id="techniques" idPrefix={idPrefix} class="ud-techniques">
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
            <p class="bhud-muted">{t('unit.enemyTechniques')}</p>
          )}
        </TabPanel>
      )}
      {page === 'skills' && (
        <TabPanel id="skills" idPrefix={idPrefix} class="ud-skills" testId="unit-skills">
          {/* Your own pilots show what is still to come; enemies only what they have now. */}
          <SkillList
            skills={unit.skills ?? []}
            level={unit.level}
            hideLocked={unit.side !== 'player'}
          />
        </TabPanel>
      )}
    </Sheet>
  );
}
