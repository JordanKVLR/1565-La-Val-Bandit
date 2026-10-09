import type { BalanceConfig, Difficulty } from '@m1565/core';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, difficultyMods, isDifficulty } from '@m1565/core';
import { t } from '../i18n';

/** The mode's name in the player's language. */
export const difficultyName = (d: Difficulty): string => t(`difficulty.name.${d}`);

/** Rank pips, so the modes differ by shape and count as well as by name (never by colour). */
const PIPS: Readonly<Record<Difficulty, string>> = {
  squire: '◆',
  knight: '◆◆',
  grandMaster: '◆◆◆',
};

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

/** The three modes as large buttons; the current one is marked in text, not only by style. */
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
    <div class="slots difficulty-picker" role="group" aria-label={t('difficulty.title')}>
      {DIFFICULTIES.map((d) => (
        <button
          type="button"
          key={d}
          class={`btn slot difficulty-option ${value === d ? 'on' : ''}`}
          aria-pressed={value === undefined ? undefined : value === d}
          data-difficulty={d}
          // The first D-pad press or Ⓐ lands on the current mode, else the recommended one.
          data-nav-default={(value ?? DEFAULT_DIFFICULTY) === d || undefined}
          onClick={() => onPick(d)}
        >
          <span class="difficulty-pips" aria-hidden="true">
            {PIPS[d]}
          </span>
          <span class="difficulty-text">
            <strong>
              {difficultyName(d)}
              {d === DEFAULT_DIFFICULTY && (
                <em class="difficulty-tag"> {t('difficulty.recommended')}</em>
              )}
              {value === d && <em class="difficulty-tag"> ✓ {t('difficulty.current')}</em>}
            </strong>
            <small>
              {t(`difficulty.tagline.${d}`)} {difficultySummary(balance, d)}
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}

/** "NG+ n" and difficulty badges for a save (title Continue button and save cards). */
export function SaveBadges({
  save,
}: {
  save: { readonly ngPlus?: unknown; readonly difficulty?: unknown } | null;
}) {
  if (!save) return null;
  const cycle = Math.max(0, Math.floor(Number(save.ngPlus) || 0));
  const d = isDifficulty(save.difficulty) ? save.difficulty : DEFAULT_DIFFICULTY;
  return (
    <span class="save-badges">
      {cycle > 0 && <span class="badge ngplus">{t('ngPlus.badge', { n: cycle })}</span>}
      <span class="badge">{difficultyName(d)}</span>
    </span>
  );
}
