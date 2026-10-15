import type { Library } from '@m1565/content';
import { xpToNextLevel } from '@m1565/core';
import { useState } from 'preact/hooks';
import type { GameSession, Screen } from '../campaign/GameSession';
import type { ResultLine } from '../campaign/progression';
import { t } from '../i18n';
import { useStore } from '../state/store';
import type { IconName } from './design';
import { Button, Chip, Divider, Icon, Meter, Panel, Sheet } from './design';
import { resultLineText } from './results';
import { PilotAttributes, PilotSkills } from './PilotAttributes';

const LINE_ICON: Record<ResultLine['kind'], IconName> = {
  scudi: 'plus',
  salvage: 'cross',
  parts: 'diamond',
  goal: 'star',
  pilot: 'chevronRight',
};

/**
 * After a victory: the spoils on the left (scudi, salvage), the company on the right (level,
 * experience, a level gained, points to spend), and one gold Continue. Raising attributes is one
 * tap away in a side sheet.
 */
export function ResultsScreen({
  session,
  screen,
  lib,
}: {
  session: GameSession;
  screen: Extract<Screen, { kind: 'results' }>;
  lib: Library;
}) {
  const roster = useStore(session.view).roster;
  const [raising, setRaising] = useState<string | null>(null);
  const nameOf = (id: string) => lib.characters.get(id)?.name ?? id;
  const pilotLine = (name: string) =>
    screen.lines.find(
      (l): l is Extract<ResultLine, { kind: 'pilot' }> => l.kind === 'pilot' && l.name === name,
    );
  const inCompany = new Set(roster.map((r) => nameOf(r.characterId)));
  // Scudi and salvage, and any ally outside the company (their progress is kept for later).
  const spoils = screen.lines.filter((l) => l.kind !== 'pilot' || !inCompany.has(l.name));
  const open = roster.find((r) => r.characterId === raising);
  return (
    <main class="fe-page fe-results">
      <header class="fe-page__head">
        <Icon name="cross" class="fe-page__emblem" />
        <h1 class="fe-page__title">{t('battle.victory')}</h1>
        <Divider glyph="cross" class="fe-page__rule" />
      </header>

      <div class="fe-results__cols">
        <Panel as="section" elevation={2} title={t('fe.results.spoils')} titleLevel={2}>
          <ul class="fe-results__lines">
            {spoils.map((l, i) => (
              <li key={i} class={`fe-results__line is-${l.kind}`}>
                <Icon name={LINE_ICON[l.kind]} class="fe-results__line-icon" />
                <span>{resultLineText(l)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          as="section"
          elevation={2}
          title={t('fe.results.company')}
          titleLevel={2}
          class="fe-results__company"
        >
          <ul class="fe-company">
            {roster.map((r) => {
              const name = nameOf(r.characterId);
              const line = pilotLine(name);
              const points = r.statPoints ?? 0;
              return (
                <li class="fe-pilot" key={r.characterId}>
                  <div class="fe-pilot__head">
                    <span class="fe-pilot__name">{name}</span>
                    <span class="fe-pilot__level">{t('unit.lvUpper', { n: r.level })}</span>
                    {line && line.levels > 0 && (
                      <Chip tone="gold" icon="plus" label={t('fe.results.levelUp')} />
                    )}
                  </div>
                  <Meter
                    kind="xp"
                    label={t('stat.xp')}
                    value={r.xp}
                    max={xpToNextLevel(r.level, lib.balance)}
                    thin
                    {...(line ? { title: resultLineText(line) } : {})}
                  />
                  {points > 0 && (
                    <div class="fe-pilot__points">
                      <Chip
                        tone="gold"
                        icon={null}
                        label={t('roster.pointsToSpend', { n: points })}
                      />
                      <Button
                        size="sm"
                        label={t('fe.results.raise')}
                        icon="chevronRight"
                        onClick={() => setRaising(r.characterId)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <footer class="fe-page__foot">
        <Button
          variant="primary"
          size="lg"
          label={t('common.continue')}
          navDefault
          onClick={() => session.closeResults()}
        />
      </footer>

      {open && (
        <Sheet
          label={nameOf(open.characterId)}
          placement="side"
          size="md"
          closeLabel={t('common.close')}
          onClose={() => setRaising(null)}
        >
          <div class="fe-raise">
            {(open.statPoints ?? 0) > 0 ? (
              <Chip
                tone="gold"
                icon="plus"
                label={t('roster.pointsToSpend', { n: open.statPoints ?? 0 })}
              />
            ) : (
              <Chip tone="neutral" icon={null} label={t('armoury.noPoints')} />
            )}
            <PilotAttributes
              lib={lib}
              entry={open}
              name={nameOf(open.characterId)}
              onRaise={(stat) => session.raiseStat(open.characterId, stat)}
            />
            <PilotSkills lib={lib} entry={open} />
          </div>
        </Sheet>
      )}
    </main>
  );
}
