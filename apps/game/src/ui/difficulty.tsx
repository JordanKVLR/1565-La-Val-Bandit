import type { BalanceConfig, Difficulty } from '@m1565/core';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, difficultyMods, isDifficulty } from '@m1565/core';
import { t } from '../i18n';
import { Chip, cx, Icon } from './design';

/** The mode's name in the player's language. */
export const difficultyName = (d: Difficulty): string => t(`difficulty.name.${d}`);

/** Rank pips, so the modes differ by shape and count as well as by name (never by colour). */
const PIPS: Readonly<Record<Difficulty, number>> = { squire: 1, knight: 2, grandMaster: 3 };

/** One to three diamonds: the mode's rank as a shape and a count. */
export function DifficultyPips({ d }: { d: Difficulty }) {
  return (
    <span class="fe-pips" aria-hidden="true">
      {Array.from({ length: PIPS[d] }, (_, i) => (
        <Icon key={i} name="diamond" />
      ))}
    </span>
  );
}

const pct = (mult: number) => Math.round(Math.abs(mult - 1) * 100);

/** One line describing what a mode changes, built from the balance numbers themselves. */
export function difficultySummary(b: BalanceConfig, d: Difficulty): string {
  const m = difficultyMods(b, d);
  const parts: string[] = [];
  if (m.enemyLevel !== 0 || m.enemyStats !== 1) {
    const n = Math.abs(m.enemyLevel);
    const level = m.enemyLevel
      ? t(m.enemyLevel > 0 ? 'difficulty.levelsHigher' : 'difficulty.levelsLower', { n })
      : '';
    const stats =
      m.enemyStats !== 1
        ? t(m.enemyStats > 1 ? 'difficulty.stronger' : 'difficulty.weaker', {
            n: pct(m.enemyStats),
          })
        : '';
    const changes = [level, stats].filter(Boolean).join(t('common.listSep'));
    parts.push(t('difficulty.enemies', { changes }));
  } else {
    parts.push(t('difficulty.enemiesAsWritten'));
  }
  if (m.scudi !== 1)
    parts.push(
      t(m.scudi > 1 ? 'difficulty.moreScudi' : 'difficulty.fewerScudi', { n: pct(m.scudi) }),
    );
  parts.push(t(m.defeatKeepsXp ? 'difficulty.keepXp' : 'difficulty.loseXp'));
  return parts.join(t('common.sep'));
}

/**
 * The three modes as cards side by side. The current one has a gold frame, a check and the word
 * "current"; the recommended one says so; the rank is drawn as pips. Never colour alone.
 */
export function DifficultyPicker({
  balance,
  value,
  onPick,
}: {
  balance: BalanceConfig;
  value?: Difficulty;
  onPick: (d: Difficulty) => void;
}) {
  return (
    <div class="fe-modes" role="group" aria-label={t('difficulty.title')}>
      {DIFFICULTIES.map((d) => {
        const current = value === d;
        return (
          <button
            type="button"
            key={d}
            class={cx('fe-mode', current && 'is-current')}
            aria-pressed={value === undefined ? undefined : current}
            data-difficulty={d}
            // The first D-pad press or Ⓐ lands on the current mode, else the recommended one.
            data-nav-default={(value ?? DEFAULT_DIFFICULTY) === d || undefined}
            onClick={() => onPick(d)}
          >
            <span class="fe-mode__head">
              <strong class="fe-mode__name">{difficultyName(d)}</strong>
              <DifficultyPips d={d} />
            </span>
            <span class="fe-mode__tags">
              {current && <Chip tone="gold" icon="confirm" label={t('difficulty.current')} />}
              {d === DEFAULT_DIFFICULTY && (
                <Chip icon={null} label={t('fe.difficulty.recommended')} />
              )}
            </span>
            <span class="fe-mode__tagline">{t(`difficulty.tagline.${d}`)}</span>
            <span class="fe-mode__summary">{difficultySummary(balance, d)}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * "NG+ n" and difficulty badges for a save (title Continue button and save cards). NG+ carries a
 * cross and bold text, the difficulty its rank pips, so neither depends on colour.
 */
export function SaveBadges({
  save,
}: {
  save: { readonly ngPlus?: unknown; readonly difficulty?: unknown } | null;
}) {
  if (!save) return null;
  const cycle = Math.max(0, Math.floor(Number(save.ngPlus) || 0));
  const d = isDifficulty(save.difficulty) ? save.difficulty : DEFAULT_DIFFICULTY;
  return (
    <span class="fe-badges">
      {cycle > 0 && (
        <Chip
          tone="gold"
          icon="cross"
          class="fe-badge-ngplus"
          label={t('ngPlus.badge', { n: cycle })}
        />
      )}
      <Chip icon={null} class="fe-badge-difficulty">
        <DifficultyPips d={d} />
        {difficultyName(d)}
      </Chip>
    </span>
  );
}
