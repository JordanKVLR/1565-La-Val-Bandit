import type { Library, RosterEntry } from '@m1565/content';
import type { ItemKind } from '../../campaign/inventory';
import { t } from '../../i18n';
import { bonusParts } from '../battle/statInfo';
import { Button, Icon, Panel, useMediaQuery } from '../design';
import { Padlock } from '../SkillList';
import { ItemIcon } from './ItemIcon';
import type { Mode, ShelfEntry, ShelfSection } from './model';
import { headlineDelta, iconVariant, nameOf, previewFor } from './model';
import { CoinGlyph, KindGlyph, TierBadge } from './parts';

/** The shelf tabs, in order (names: `shelf.tab.<kind>`, short ones `shelf.tabShort.<kind>`). */
export const TABS: readonly ItemKind[] = ['weapon', 'charm', 'amulet', 'frame'];

/** Phones and narrow windows: short tab names and a short sell toggle (see armoury.css). */
const NARROW_QUERY = '(max-width: 900px)';

/** The test id part of an entry: pilot-held items are distinct per holder. */
export const cardId = (e: Pick<ShelfEntry, 'kind' | 'id' | 'holderId'>) =>
  `${e.kind}-${e.id}${e.holderId ? `-on-${e.holderId}` : ''}`;

/** A stable key for an entry: the same item can sit in the stores and in the stock at once. */
export const entryKey = (e: Pick<ShelfEntry, 'kind' | 'id' | 'holderId' | 'source'>) =>
  `${e.source}:${cardId(e)}`;

function emptyText(tab: ItemKind, mode: Mode): string {
  if (mode === 'sell') return t('shelf.emptySell');
  if (tab === 'frame') return t('shelf.emptyFrames');
  return t('shelf.empty');
}

interface Bonus {
  readonly text: string;
  /** A penalty, drawn differently (and marked with a minus). */
  readonly neg: boolean;
}

/** The item's own bonuses (largest first), or the frame's HP and MOV: up to three. */
function bonuses(lib: Library, e: ShelfEntry): Bonus[] {
  const parts = bonusParts(e.bonus)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .map((p) => ({ text: p.text, neg: p.value < 0 }));
  if (e.kind === 'frame') {
    const f = lib.frames.get(e.id);
    return f
      ? [
          { text: t('stat.hpValue', { n: f.hp }), neg: false },
          { text: t('stat.movValue', { n: f.move }), neg: false },
          ...parts.slice(0, 2),
        ]
      : parts;
  }
  return parts.slice(0, 3);
}

/** The card's bottom-right corner: price, sell price, or where the item is. */
function foot(lib: Library, e: ShelfEntry, mode: Mode) {
  if (mode === 'sell')
    return (
      <span class="ic-price">
        <CoinGlyph />
        {e.sellPrice ?? 0}
      </span>
    );
  switch (e.source) {
    case 'fitted':
      return (
        <span class="ic-stamp">
          <Icon name="cross" class="ic-stamp__cross" />
          {t('shelf.fitted')}
        </span>
      );
    case 'stores':
      return <span class="ic-where">{t('shelf.inStores', { n: e.owned })}</span>;
    case 'pilot':
      return (
        <span class="ic-where">
          {t('armoury.onPilot', { pilot: nameOf(lib, e.holderId ?? '') })}
        </span>
      );
    case 'shop':
      return (
        <span class="ic-price">
          {e.owned > 0 && <small>{t('shelf.owned', { n: e.owned })}</small>}
          <CoinGlyph />
          {e.price ?? 0}
        </span>
      );
    case 'unusable':
      return <span class="ic-where">{t('shelf.otherSide')}</span>;
  }
}

/**
 * One item on the shelf: picture, name, the one line that matters (what it changes for this
 * pilot, or else its bonuses), and tier and price along the foot. The tier shows three ways:
 * pips, the word, and the card's frame (a plain hairline; a gold one with two corner marks; a
 * bright one with four).
 */
function ItemCard({
  lib,
  pilot,
  entry,
  mode,
  selected,
  tabStop,
  onSelect,
}: {
  lib: Library;
  pilot: RosterEntry | undefined;
  entry: ShelfEntry;
  mode: Mode;
  selected: boolean;
  /** Roving tab stop: only one card in the grid is reachable with Tab. */
  tabStop: boolean;
  onSelect: () => void;
}) {
  const hint =
    pilot && mode === 'shop' && entry.source !== 'fitted' && entry.source !== 'unusable'
      ? (() => {
          const p = previewFor(lib, pilot, entry.kind, entry.id);
          return headlineDelta(p.before, p.after);
        })()
      : null;
  const cs = bonuses(lib, entry);
  const frameClass = lib.frames.get(entry.id)?.class;
  const tierWord = entry.tier
    ? t(`tierWord.${entry.tier}`)
    : frameClass
      ? t(`frameClass.${frameClass}`)
      : '';
  const sep = t('common.listSep');
  const label = [
    entry.name,
    tierWord,
    cs.map((c) => c.text).join(sep),
    entry.source === 'shop' && mode === 'shop' ? t('armoury.scudi', { n: entry.price ?? 0 }) : null,
    mode === 'sell' ? t('shelf.cardSellsFor', { n: entry.sellPrice ?? 0 }) : null,
    entry.source === 'fitted' ? t('shelf.cardFitted') : null,
    hint,
    entry.blocked ? t('shelf.cardUnavailable', { reason: entry.blocked }) : null,
  ]
    .filter(Boolean)
    .join(sep);
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={label}
      tabIndex={tabStop ? 0 : -1}
      class={`item-card t-${entry.tier ?? 'frame'}${selected ? ' selected' : ''}${entry.blocked ? ' is-blocked' : ''}`}
      data-testid={`item-card-${cardId(entry)}`}
      data-key={entryKey(entry)}
      data-source={entry.source}
      data-blocked={entry.blocked ? 'true' : 'false'}
      onClick={onSelect}
    >
      <span class="ic-icon">
        <ItemIcon
          kind={entry.kind}
          variant={iconVariant(lib, entry.kind, entry.id)}
          tier={entry.tier ?? 'common'}
          size={40}
          title=""
        />
        {entry.blocked && (
          <span class="ic-lock">
            <Padlock size={11} />
          </span>
        )}
      </span>
      <span class="ic-name">{entry.name}</span>
      <span class="ic-key">
        {entry.blocked ? (
          <span class="ic-reason">{entry.blocked}</span>
        ) : hint ? (
          hint.split('  ').map((h) => (
            <span key={h} class={`ic-hint${h.startsWith('▼') ? ' down' : ' up'}`}>
              {h}
            </span>
          ))
        ) : (
          cs.map((c) => (
            <span key={c.text} class={`ic-bonus${c.neg ? ' neg' : ''}`}>
              {c.text}
            </span>
          ))
        )}
      </span>
      <span class="ic-foot">
        {entry.tier ? <TierBadge tier={entry.tier} /> : <span class="ic-class">{tierWord}</span>}
        {foot(lib, entry, mode)}
      </span>
    </button>
  );
}

export function Shelf({
  lib,
  pilot,
  tab,
  mode,
  sections,
  selectedKey,
  onTab,
  onMode,
  onSelect,
}: {
  lib: Library;
  pilot: RosterEntry | undefined;
  tab: ItemKind;
  mode: Mode;
  sections: readonly ShelfSection[];
  selectedKey: string | null;
  onTab: (kind: ItemKind) => void;
  onMode: (mode: Mode) => void;
  onSelect: (entry: ShelfEntry) => void;
}) {
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const i = TABS.indexOf(tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
    onTab(next);
    document.getElementById(`shelf-tab-${next}`)?.focus();
  };
  const onGridKey = (e: KeyboardEvent) => {
    const grid = e.currentTarget as HTMLElement;
    const cards = [...grid.querySelectorAll<HTMLButtonElement>('.item-card')];
    const i = cards.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: cols,
      ArrowUp: -cols,
    };
    const j =
      e.key in step
        ? i + step[e.key]!
        : e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? cards.length - 1
            : null;
    // Past the first or last card, the key is left for spatial focus (keyboard and gamepad
    // can then reach the tabs and buttons around the grid; see ui/input.ts).
    if (j === null || j < 0 || j >= cards.length) return;
    e.preventDefault();
    cards[j]?.focus();
  };
  const narrow = useMediaQuery(NARROW_QUERY);
  const empty = sections.every((s) => s.entries.length === 0);
  const keys = sections.flatMap((s) => s.entries.map(entryKey));
  const stop = selectedKey && keys.includes(selectedKey) ? selectedKey : keys[0];
  return (
    <Panel
      as="section"
      class={`ar-panel shelf${mode === 'sell' ? ' selling' : ''}`}
      testId="shelf"
      aria-label={t('shelf.label')}
    >
      <div class="shelf-head">
        {mode === 'shop' ? (
          <div class="shelf-tabs" role="tablist" aria-label={t('shelf.kinds')} onKeyDown={onTabKey}>
            {TABS.map((kind) => (
              <button
                key={kind}
                id={`shelf-tab-${kind}`}
                type="button"
                role="tab"
                aria-selected={kind === tab}
                aria-label={t(`shelf.tab.${kind}`)}
                aria-controls="shelf-panel"
                tabIndex={kind === tab ? 0 : -1}
                class={`ds-tab shelf-tab${kind === tab ? ' on is-selected' : ''}`}
                data-testid={`shelf-tab-${kind}`}
                onClick={() => onTab(kind)}
              >
                <KindGlyph kind={kind} />
                <span class="tl-long">{t(`shelf.tab.${kind}`)}</span>
                <span class="tl-short">{t(`shelf.tabShort.${kind}`)}</span>
              </button>
            ))}
          </div>
        ) : (
          <h3 class="shelf-sell-title">{t('shelf.sellTitle')}</h3>
        )}
        <Button
          class="shelf-mode"
          size="sm"
          variant={mode === 'sell' ? 'secondary' : 'ghost'}
          pressed={mode === 'sell'}
          label={
            mode === 'sell'
              ? t('shelf.doneSelling')
              : narrow
                ? t('shelf.sellShort')
                : t('shelf.sellSpares')
          }
          testId="shelf-mode-sell"
          onClick={() => onMode(mode === 'sell' ? 'shop' : 'sell')}
        >
          <CoinGlyph />
        </Button>
      </div>
      <div
        id="shelf-panel"
        class="shelf-grid"
        role="listbox"
        aria-label={mode === 'sell' ? t('shelf.sparesToSell') : t(`shelf.tab.${tab}`)}
        onKeyDown={onGridKey}
      >
        {empty && (
          <p class="shelf-empty" role="note">
            {emptyText(tab, mode)}
          </p>
        )}
        {sections.map((s) => [
          <h4
            key={`h-${s.title}`}
            class="shelf-sec"
            data-testid={`shelf-section-${s.source}`}
            role="presentation"
          >
            <span>{s.title}</span>
          </h4>,
          ...s.entries.map((e) => (
            <ItemCard
              key={`${s.title}-${entryKey(e)}`}
              lib={lib}
              pilot={pilot}
              entry={e}
              mode={mode}
              selected={selectedKey === entryKey(e)}
              tabStop={stop === entryKey(e)}
              onSelect={() => onSelect(e)}
            />
          )),
        ])}
      </div>
    </Panel>
  );
}
