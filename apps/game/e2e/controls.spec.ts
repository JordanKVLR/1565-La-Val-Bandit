import { expect, test } from '@playwright/test';

/** Keyboard-only play (the gamepad sends the same keys): tile cursor, menus, help, notes. */

test('the arrow keys move a tile cursor that previews and makes a move', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?battle=b1-marsaxlokk');
  const actions = page.getByRole('navigation', { name: 'Actions' });
  // Wait for the player's first turn (enemies may act first).
  await expect(actions).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => window.__battle!.ctl.mode.kind)).toBe('move');

  const state = () =>
    page.evaluate(() => {
      const ctl = window.__battle!.ctl;
      const mode = ctl.mode;
      return {
        cursor: ctl.cursor() ?? null,
        unit: ctl.active()?.pos ?? null,
        pending: mode.kind === 'move' ? (mode.pending?.to ?? null) : null,
      };
    });
  const start = await state();
  expect(start.cursor).toEqual(start.unit);

  // Find an arrow that lands on a reachable tile: the route there previews at once.
  const opposite = {
    ArrowUp: 'ArrowDown',
    ArrowDown: 'ArrowUp',
    ArrowLeft: 'ArrowRight',
    ArrowRight: 'ArrowLeft',
  } as const;
  let previewed = false;
  for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'] as const) {
    await page.keyboard.press(key);
    const s = await state();
    if (s.pending) {
      expect(s.pending).toEqual(s.cursor);
      previewed = true;
      break;
    }
    await page.keyboard.press(opposite[key]);
  }
  expect(previewed).toBe(true);
  await expect(page.getByTestId('terrain-label')).toHaveText(/^\d+H \d+% /);
  const target = (await state()).cursor;

  await page.keyboard.press('Enter');
  await expect(actions.getByRole('button', { name: 'Undo' })).toBeVisible();
  expect((await state()).unit).toEqual(target);

  // With nothing left to cancel, Esc opens the battle menu; arrows move focus inside it.
  await page.keyboard.press('Escape');
  const menu = page.getByRole('dialog', { name: 'Battle menu' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('button', { name: 'Resume' })).toBeFocused();
  // (One column on a Deck, two on a phone: either way focus moves on to another button.)
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('button', { name: 'Resume' })).not.toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.closest('[role=dialog]') !== null)).toBe(
    true,
  );

  // How to play has a Controls page listing keyboard and gamepad controls.
  await menu.getByRole('button', { name: 'How to play' }).click();
  const help = page.getByRole('dialog', { name: 'How to play' });
  await help.getByRole('tab', { name: 'Controls' }).click();
  await expect(help.getByTestId('help-controls')).toContainText('Move the tile cursor');
  await expect(help.getByTestId('help-controls')).toContainText('Ⓧ');
  await page.screenshot({ path: `test-results/help-controls-${test.info().project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(help).toBeHidden();
  expect(errors).toEqual([]);
});

test('historical notes open from the title, label fiction and close with Esc', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.screenshot({ path: `test-results/title-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Historical notes' }).click();
  const notes = page.getByRole('dialog', { name: 'Historical notes' });
  await expect(notes).toBeVisible();
  await expect(notes.getByTestId('codex-entry')).toContainText('Historical');

  await notes.getByRole('tab', { name: 'Fiction' }).click();
  await expect(notes.getByTestId('codex-armature')).toContainText('Fiction');
  await expect(notes.getByTestId('codex-st-elmo')).toHaveCount(0);
  // The story's twist stays locked on a fresh save.
  await expect(notes.getByTestId('codex-valette-secret')).toHaveCount(0);
  await expect(notes).toContainText(/unlock as the story/);

  await notes.getByTestId('codex-armature').click();
  await expect(notes.getByRole('heading', { name: 'The Armature' })).toBeVisible();
  await page.screenshot({ path: `test-results/codex-${test.info().project.name}.png` });

  await page.keyboard.press('Escape');
  await expect(notes).toBeHidden();
  await expect(page.getByRole('heading', { name: /Armatura/ })).toBeVisible();
});
