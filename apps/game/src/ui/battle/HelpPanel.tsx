import { useState } from 'preact/hooks';
import { t, tRich } from '../../i18n';
import type { ControlContext } from '../../platform/input/controls';
import { helpRows } from '../../platform/input/controls';

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
    <div class="help-controls" data-testid="help-controls">
      <h3 class="pointer-only">{t('help.touch')}</h3>
      <dl class="pointer-only">
        {TOUCH.map(([what, does]) => [
          <dt key={what}>{t(what)}</dt>,
          <dd key={does}>{t(does)}</dd>,
        ])}
      </dl>
      {CONTROL_PAGES.map((context) => (
        <table class="controls-table" key={context}>
          <caption>{t(`help.page.${context}`)}</caption>
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
                <td>{r.keys}</td>
                <td>{r.pad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <p class="hint">
        <span class="pointer-only">{t('help.mouseHint')}</span> {t('help.padHint')}
      </p>
    </div>
  );
}

/** Rules at a glance and the controls, reachable from the battle HUD. */
export function HelpPanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<'rules' | 'controls'>('rules');
  return (
    <div class="modal" role="dialog" aria-label={t('help.title')}>
      <div class="modal-box help">
        <h2>{t('help.title')}</h2>
        <div class="seg help-tabs" role="tablist" aria-label={t('help.pages')}>
          {(['rules', 'controls'] as const).map((id) => (
            <button
              type="button"
              key={id}
              role="tab"
              id={`help-tab-${id}`}
              aria-selected={page === id}
              aria-controls="help-page"
              tabIndex={page === id ? 0 : -1}
              class={`btn tab ${page === id ? 'on' : ''}`}
              onClick={() => setPage(id)}
            >
              {t(`help.tab.${id}`)}
            </button>
          ))}
        </div>
        <div id="help-page" role="tabpanel" aria-labelledby={`help-tab-${page}`}>
          {page === 'controls' ? (
            <ControlsPage />
          ) : (
            <dl>
              {RULES.map(([title, text]) => [
                <dt key={title}>{t(title)}</dt>,
                <dd key={text}>{tRich(text)}</dd>,
              ])}
            </dl>
          )}
        </div>
        <button type="button" class="btn" data-nav-back onClick={onClose}>
          {t('help.gotIt')}
        </button>
      </div>
    </div>
  );
}
