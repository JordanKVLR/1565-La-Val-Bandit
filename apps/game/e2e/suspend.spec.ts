import { expect, test } from '@playwright/test';

/**
 * Suspend/resume: a console or phone can suspend the game and kill it without warning. Every
 * story line and battle command is saved at once, so a reload (the "kill") and Continue resume
 * exactly where the player was.
 */
test('a killed game resumes on the same story line and after the same battle move', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('armatura.settings.v1', JSON.stringify({ battleSpeed: 4 }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('chapter-card')).toBeVisible();
  for (let i = 0; i < 7; i++) await page.keyboard.press('Enter');
  const line = page.getByTestId('dialogue-text');
  await expect(line).not.toBeEmpty();
  const said = await line.textContent();

  // The app is hidden (suspend): it saves, holds sound and gameplay, and marks the page.
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('html')).toHaveAttribute('data-suspended', '');
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(page.locator('html')).not.toHaveAttribute('data-suspended', '');

  await page.reload();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(line).toHaveText(said ?? '');

  // On into the first battle, then one move; the reload must keep it.
  for (let i = 0; i < 400 && !(await page.locator('.battle-screen').isVisible()); i++) {
    const choices = page.getByRole('group', { name: 'Choices' });
    if (await choices.isVisible()) await choices.getByRole('button').first().click();
    else await page.keyboard.press('Enter');
  }
  const playerTurn = () =>
    page.evaluate(() => {
      const ctl = window.__battle?.ctl;
      return ctl?.active()?.controller === 'human' && ctl.mode.kind === 'move';
    });
  await expect.poll(playerTurn, { timeout: 60_000 }).toBe(true);
  const moved = await page.evaluate(() => {
    const ctl = window.__battle!.ctl;
    const mode = ctl.mode;
    if (mode.kind !== 'move') return null;
    const r = [...mode.reach.values()].find((x) => x.path.length > 0);
    const to = r?.path[r.path.length - 1];
    if (!to) return null;
    ctl.tapTile(to);
    ctl.confirmMove();
    return { id: ctl.active()!.id, to: { x: to.x, y: to.y } };
  });
  expect(moved).not.toBeNull();
  await expect
    .poll(() => page.evaluate(() => window.__battle!.ctl.mode.kind), { timeout: 10_000 })
    .toBe('command');

  await page.reload();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect
    .poll(
      () =>
        page.evaluate((id) => {
          const u = window.__battle?.ctl.state.units.find((x) => x.id === id);
          return u ? { x: u.pos.x, y: u.pos.y } : null;
        }, moved!.id),
      { timeout: 30_000 },
    )
    .toEqual(moved!.to);
  expect(errors).toEqual([]);
});
