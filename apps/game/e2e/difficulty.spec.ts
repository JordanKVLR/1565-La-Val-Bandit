import { expect, test } from '@playwright/test';

test('difficulty is chosen at New Game, shown and changeable in the menu, and kept in the save', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Choose difficulty' });
  await expect(picker.getByRole('button')).toHaveCount(4); // three modes and Back
  await picker.getByRole('button', { name: /^Squire/ }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  // Dismiss the chapter card (it covers the screen), then open the menu.
  await expect(page.getByTestId('chapter-card')).toBeVisible();
  await page.getByTestId('story-screen').click();
  await expect(page.getByTestId('chapter-card')).toBeHidden();

  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const shown = page.getByTestId('menu-difficulty');
  await expect(shown).toContainText('Difficulty: Squire');

  // Change it from the menu: the current mode is marked in text.
  await shown.getByRole('button', { name: 'Change' }).click();
  const change = page.getByRole('dialog', { name: 'Difficulty' });
  await expect(change.getByRole('button', { name: /^Squire/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(change.getByRole('button', { name: /^Squire/ })).toContainText('current');
  await change.getByRole('button', { name: /^Grand Master/ }).click();
  await expect(shown).toContainText('Difficulty: Grand Master');
  await page.getByRole('button', { name: 'Resume' }).click();

  // The autosave remembers it; the title's Continue button shows it.
  await page.reload();
  await expect(page.getByRole('button', { name: /Continue/ })).toContainText('Grand Master');
  expect(errors).toEqual([]);
});

test('a save that reached an ending offers New Game+, with an NG+ badge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: 'New Game+' })).toHaveCount(0);

  // Start a game to get a real save, then mark it as finished (an ending reached, first cycle).
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('chapter-card')).toBeVisible();
  await page.evaluate(() => {
    const key = 'armatura.save.auto';
    const save = JSON.parse(localStorage.getItem(key)!);
    localStorage.setItem(key, JSON.stringify({ ...save, ending: 'cross', scudi: 777 }));
  });
  await page.reload();

  await page.getByRole('button', { name: 'New Game+' }).click();
  const dialog = page.getByRole('dialog', { name: 'New Game+' });
  await expect(dialog).toContainText('Next: NG+ 1');
  await dialog.getByRole('button', { name: /Autosave/ }).click();
  await expect(page.getByTestId('chapter-card')).toBeVisible();
  await page.getByTestId('story-screen').click();
  await expect(page.getByTestId('chapter-card')).toBeHidden();

  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByTestId('menu-difficulty')).toContainText('NG+ 1');
  await page.getByRole('button', { name: 'Resume' }).click();

  await page.reload();
  await expect(page.getByRole('button', { name: /Continue/ })).toContainText('NG+ 1');
  expect(errors).toEqual([]);
});
