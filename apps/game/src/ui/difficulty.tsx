import type { BalanceConfig, Difficulty } from '@m1565/core';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, difficultyMods, isDifficulty } from '@m1565/core';

export const DIFFICULTY_NAMES: Readonly<Record<Difficulty, string>> = {
  squire: 'Squire',
  knight: 'Knight',
  grandMaster: 'Grand Master',
};

/** Rank pips, so the modes differ by shape and count as well as by name (never by colour). */
const PIPS: Readonly<Record<Difficulty, string>> = {
  squire: '◆',
  knight: '◆◆',
  grandMaster: '◆◆◆',
};

const TAGLINES: Readonly<Record<Difficulty, string>> = {
  squire: 'For the story.',
  knight: 'The intended challenge.',
  grandMaster: 'For veterans of the siege.',
};

const pct = (mult: number) => Math.round(Math.abs(mult - 1) * 100);

/** One line describing what a mode changes, built from the balance numbers themselves. */
export function difficultySummary(b: BalanceConfig, d: Difficulty): string {
  const m = difficultyMods(b, d);
  const parts: string[] = [];
  if (m.enemyLevel !== 0 || m.enemyStats !== 1) {
    const lv = Math.abs(m.enemyLevel);
    const level = m.enemyLevel
      ? `${lv} level${lv === 1 ? '' : 's'} ${m.enemyLevel > 0 ? 'higher' : 'lower'}`
      : '';
    const stats =
      m.enemyStats !== 1 ? `${pct(m.enemyStats)}% ${m.enemyStats > 1 ? 'stronger' : 'weaker'}` : '';
    parts.push(`Enemies ${[level, stats].filter(Boolean).join(', ')}`);
  } else {
    parts.push('Enemies as written');
  }
  if (m.scudi !== 1) parts.push(`${pct(m.scudi)}% ${m.scudi > 1 ? 'more' : 'fewer'} scudi`);
  parts.push(
    m.defeatKeepsXp
      ? 'A lost battle keeps its experience: retry for free'
      : 'A lost battle’s experience is lost on retry',
  );
  return parts.join(' · ');
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
    <div class="slots difficulty-picker" role="group" aria-label="Difficulty">
      {DIFFICULTIES.map((d) => (
        <button
          type="button"
          key={d}
          class={`btn slot difficulty-option ${value === d ? 'on' : ''}`}
          aria-pressed={value === undefined ? undefined : value === d}
          data-difficulty={d}
          onClick={() => onPick(d)}
        >
          <span class="difficulty-pips" aria-hidden="true">
            {PIPS[d]}
          </span>
          <span class="difficulty-text">
            <strong>
              {DIFFICULTY_NAMES[d]}
              {d === DEFAULT_DIFFICULTY && <em class="difficulty-tag"> (recommended)</em>}
              {value === d && <em class="difficulty-tag"> ✓ current</em>}
            </strong>
            <small>
              {TAGLINES[d]} {difficultySummary(balance, d)}
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
      {cycle > 0 && <span class="badge ngplus">NG+ {cycle}</span>}
      <span class="badge">{DIFFICULTY_NAMES[d]}</span>
    </span>
  );
}
