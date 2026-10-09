import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * The lint guard against hard-coded UI text (eslint.config.js, ADR 0012): words written
 * straight into JSX fail `pnpm lint`; strings from the table, glyphs and numbers pass.
 */
const repo = join(import.meta.dirname, '../../../..');
const eslint = new ESLint({ cwd: repo });

async function hits(code: string, file = 'apps/game/src/ui/GuardSample.tsx'): Promise<number> {
  const [result] = await eslint.lintText(`import { t } from '../i18n';\n${code}\n`, {
    filePath: join(repo, file),
  });
  return result!.messages.filter((m) => m.message.startsWith('Hard-coded UI text')).length;
}

describe('hard-coded UI text guard', () => {
  it('flags words in JSX text, string children and template children', async () => {
    expect(await hits(`export const A = () => <p>Continue</p>;`)).toBe(1);
    expect(await hits(`export const A = () => <p>{'Continue'}</p>;`)).toBe(1);
    expect(await hits(`export const A = (o: boolean) => <p>{o ? 'On' : 'Off'}</p>;`)).toBe(2);
    expect(await hits('export const A = (n: number) => <p>{`Lv ${n}`}</p>;')).toBe(1);
    expect(await hits(`export const A = () => <>Skip</>;`)).toBe(1);
  }, 30_000);

  it('flags words in aria-label, title, placeholder and alt', async () => {
    expect(
      await hits(`export const A = () => (
        <div aria-label="Menu" title="Help">
          <input placeholder="Name" />
          <img alt="Portrait" src="x.png" />
        </div>
      );`),
    ).toBe(4);
    expect(
      await hits(`export const A = (o: boolean) => <i title={o ? 'Open' : undefined} />;`),
    ).toBe(1);
    expect(await hits('export const A = (n: string) => <i aria-label={`Face ${n}`} />;')).toBe(1);
  });

  it('passes the string table, glyphs, numbers and non-text attributes', async () => {
    expect(
      await hits(`export const A = (n: number, d: string) => (
        <div class="btn tab" data-testid="menu-button" aria-label={t('common.menu')}>
          ☰ × ▲ ◆◆ · Ⓐ {n} 1565 {'—'}
          <img alt="" src="x.png" title={t(\`facing.face.\${d}\`)} />
          {t('common.continue')}
        </div>
      );`),
    ).toBe(0);
  });
});
