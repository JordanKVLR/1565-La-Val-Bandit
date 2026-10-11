import { useRef, useState } from 'preact/hooks';
import { t, tRich } from '../../i18n';
import type { ControlContext } from '../../platform/input/controls';
import { helpRows } from '../../platform/input/controls';
import { Sheet, TabPanel, Tabs } from '../design';
import { useSheetScrollCue } from './ScrollArea';

const CONTROL_PAGES: readonly ControlContext[] = ['battle', 'menu', 'armoury'];

/** Touch gestures: what you do, and what it does. */
const TOUCH = [
  ['help.touch.tap', 'help.touch.tapText'],
  ['help.touch.tapAgain', 'help.touch.tapAgainText'],
  ['help.touch.drag', 'help.touch.dragText'],
  ['help.touch.rotate', 'help.touch.rotateText'],
  ['help.touch.menu', 'help.touch.menuText'],
] as const;

/** The rules page: a heading and a paragraph (with <b> emphasis) for each topic. */
const RULES = [
  ['help.rules.turn', 'help.rules.turnText'],
  ['help.rules.keys', 'help.rules.keysText'],
  ['help.rules.techniques', 'help.rules.techniquesText'],
  ['help.rules.xp', 'help.rules.xpText'],
  ['help.rules.skills', 'help.rules.skillsText'],
  ['help.rules.attributes', 'help.rules.attributesText'],
  ['help.rules.ap', 'help.rules.apText'],
  ['help.rules.fp', 'help.rules.fpText'],
  ['help.rules.reactions', 'help.rules.reactionsText'],
  ['help.rules.position', 'help.rules.positionText'],
  ['help.rules.terrain', 'help.rules.terrainText'],
] as const;

/** Touch, keyboard and gamepad controls, drawn from the same table the inputs use. */
function ControlsPage() {
  return (
    <div class="ov-help__controls" data-testid="help-controls">
      <section class="ov-help__group pointer-only">
        <h3 class="ov-help__caption">{t('help.touch')}</h3>
        <dl class="ov-help__touch">
          {TOUCH.map(([what, does]) => (
            <div key={what}>
              <dt>{t(what)}</dt>
              <dd>{t(does)}</dd>
            </div>
          ))}
        </dl>
      </section>
      {CONTROL_PAGES.map((context) => (
        <table class="ov-keys" key={context}>
          <caption class="ov-help__caption">{t(`help.page.${context}`)}</caption>
          <thead>
            <tr>
              <th scope="col">{t('help.col.action')}</th>
              <th scope="col">{t('help.col.keyboard')}</th>
              <th scope="col">{t('help.col.gamepad')}</th>
            </tr>
          </thead>
          <tbody>
            {helpRows(context).map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td>
                  <kbd class="ov-kbd">{r.keys}</kbd>
                </td>
                <td>
                  <kbd class="ov-kbd ov-kbd--pad">{r.pad}</kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <p class="ds-hint ov-help__hint">
        <span class="pointer-only">{t('help.mouseHint')}</span> {t('help.padHint')}
      </p>
    </div>
  );
}

type Page = 'rules' | 'controls';

/** Rules at a glance and the controls, reachable from the battle menu: a sheet with two tabs. */
export function HelpPanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<Page>('rules');
  const inner = useRef<HTMLDivElement>(null);
  useSheetScrollCue(inner);
  return (
    <Sheet
      label={t('help.title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      placement="center"
      size="lg"
      ornament="cross"
      class="ov-sheet ov-help"
    >
      <div ref={inner} class="ov-help__inner">
        <Tabs
          label={t('help.pages')}
          idPrefix="help"
          value={page}
          onChange={setPage}
          class="ov-help__tabs"
          tabs={[
            { id: 'rules', label: t('help.tab.rules') },
            { id: 'controls', label: t('help.tab.controls') },
          ]}
        />
        <TabPanel id={page} idPrefix="help">
          {page === 'controls' ? (
            <ControlsPage />
          ) : (
            <dl class="ov-help__rules">
              {RULES.map(([title, text]) => (
                <div key={title} class="ov-help__rule">
                  <dt>{t(title)}</dt>
                  <dd>{tRich(text)}</dd>
                </div>
              ))}
            </dl>
          )}
        </TabPanel>
      </div>
    </Sheet>
  );
}
