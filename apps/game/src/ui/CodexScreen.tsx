import type { CodexEntry } from '@m1565/content';
import { codexUnlocked, loadCodex } from '@m1565/content';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { CampaignSave } from '../campaign/types';
import { t, tParts } from '../i18n';
import { noteCodexRead } from '../platform/achievements';
import { readSave, SLOTS } from '../platform/storage';
import { KeyHint } from './KeyHint';
import './codex.css';

type Filter = 'all' | CodexEntry['kind'];

const FILTERS: readonly Filter[] = ['all', 'historical', 'fiction'];

const filterLabel = (f: Filter) => (f === 'all' ? t('codex.filter.all') : t(`codex.kind.${f}`));

/** Battles won in any save, so notes unlocked in one playthrough stay readable from the title. */
export function battlesWonInSaves(): string[] {
  const won = new Set<string>();
  for (const slot of SLOTS) {
    for (const id of readSave<CampaignSave>(slot)?.completedBattles ?? []) won.add(id);
  }
  return [...won];
}

/** Column for history, quill for invention: shape and word, never colour alone. */
function KindIcon({ kind }: { kind: CodexEntry['kind'] | 'locked' }) {
  const paths = {
    historical: 'M3 4h14v2H3zM5 7h2v8H5zM9 7h2v8H9zM13 7h2v8h-2zM2 16h16v2H2zM10 1l8 2.5H2z',
    fiction:
      'M17 2c-5 1-9 5-11 11l-2 5 1.5.5 1.4-3.6C11 14 15 10 17 2zM8.3 12.2c1.6-3 3.8-5.6 6.4-7.3-2 2.4-3.8 5-5 7.9z',
    locked: 'M6 8V6a4 4 0 0 1 8 0v2h1.5v10h-11V8zm2 0h4V6a2 2 0 0 0-4 0zm1 4v3h2v-3z',
  } as const;
  return (
    <svg class="cx-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d={paths[kind]} fill="currentColor" fill-rule="evenodd" />
    </svg>
  );
}

function KindBadge({ kind }: { kind: CodexEntry['kind'] }) {
  return (
    <span class={`cx-badge ${kind}`}>
      <KindIcon kind={kind} />
      {t(`codex.kind.${kind}`)}
    </span>
  );
}

/**
 * Historical notes: who and what in the game is real, and what is invented. Entries that
 * would spoil a story twist stay locked until the battle before it is won.
 */
export function CodexScreen({
  completedBattles,
  onClose,
}: {
  completedBattles: readonly string[];
  onClose: () => void;
}) {
  const codex = useMemo(() => loadCodex(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const shown = codex.filter((e) => filter === 'all' || e.kind === filter);
  const open = shown.filter((e) => codexUnlocked(e, completedBattles));
  const locked = shown.length - open.length;
  const [selectedId, setSelectedId] = useState(open[0]?.id);
  const selected = open.find((e) => e.id === selectedId) ?? open[0];
  // Every entry shown counts as read, for the codex achievements.
  useEffect(() => {
    if (selected)
      noteCodexRead(
        selected.id,
        codex.map((e) => e.id),
      );
  }, [selected, codex]);

  return (
    <div class="modal" role="dialog" aria-modal="true" aria-label={t('codex.title')}>
      <div class="modal-box codex" data-testid="codex">
        <header class="cx-head">
          <h2>{t('codex.title')}</h2>
          <div class="cx-tabs" role="tablist" aria-label={t('codex.show')}>
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f}
                role="tab"
                aria-selected={filter === f}
                tabIndex={filter === f ? 0 : -1}
                class={`btn tab${filter === f ? ' on' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f !== 'all' && <KindIcon kind={f} />}
                {filterLabel(f)}
              </button>
            ))}
          </div>
        </header>
        <p class="cx-intro">
          {tParts('codex.intro', {
            historical: <KindBadge kind="historical" />,
            fiction: <KindBadge kind="fiction" />,
          })}
        </p>
        <div class="cx-body">
          <ul class="cx-list" aria-label={t('codex.entries')}>
            {open.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  class={`cx-item${e.id === selected?.id ? ' on' : ''}`}
                  aria-current={e.id === selected?.id ? 'true' : undefined}
                  data-nav-default={e.id === selected?.id || undefined}
                  data-testid={`codex-${e.id}`}
                  onClick={() => setSelectedId(e.id)}
                  onFocus={() => setSelectedId(e.id)}
                >
                  <span class="cx-item-title">{e.title}</span>
                  <KindBadge kind={e.kind} />
                </button>
              </li>
            ))}
            {locked > 0 && (
              <li class="cx-locked">
                <KindIcon kind="locked" />
                {t('codex.locked', { n: locked })}
              </li>
            )}
          </ul>
          {selected && (
            <article
              class="cx-entry"
              tabIndex={0}
              aria-labelledby="cx-entry-title"
              data-testid="codex-entry"
            >
              <h3 id="cx-entry-title">{selected.title}</h3>
              <div class="cx-meta">
                <KindBadge kind={selected.kind} />
                {selected.when && <span>{selected.when}</span>}
              </div>
              {selected.text.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          )}
        </div>
        <button type="button" class="btn cx-close" data-nav-back onClick={onClose}>
          {t('common.close')} <KeyHint action="back" context="menu" />
        </button>
      </div>
    </div>
  );
}
