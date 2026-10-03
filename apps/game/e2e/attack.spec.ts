import { expect, test } from '@playwright/test';

test('attacking goes through the technique menu, plays the duel and awards XP', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?battle=b1-marsaxlokk');
  await expect(page.locator('canvas.battle-canvas')).toBeVisible();

  // Play through any enemy turns until one of the player's units is waiting for orders.
  for (let i = 0; i < 100; i++) {
    const kind = await page.evaluate(() => window.__battle?.ctl.mode.kind);
    if (kind === 'command') break;
    if (kind === 'closeUp') await page.getByTestId('closeup').click();
    else if (kind === 'xp') await page.getByTestId('xp-continue').click();
    else if (kind === 'reaction') await page.getByTestId('react-go').click();
    else if (kind === 'levelUp')
      await page.getByRole('button', { name: /Continue|Save points/ }).click();
    else await page.waitForTimeout(200);
  }
  await expect.poll(() => page.evaluate(() => window.__battle?.ctl.mode.kind)).toBe('command');

  // Put the active unit next to an enemy with full AP, then attack through the UI.
  await page.evaluate(() => {
    const { ctl } = window.__battle!;
    const s = ctl.state;
    const me = s.units.find((u) => u.id === s.turn?.unitId)!;
    const foe = s.units.find((u) => u.side === 'enemy' && !u.defeated)!;
    const units = s.units.map((u) =>
      u.id === me.id ? { ...u, pos: { x: foe.pos.x, y: foe.pos.y + 1 }, ap: 100 } : u,
    );
    ctl.view.set({ ...ctl.view.get(), state: { ...s, units } });
  });

  const menu = page.getByRole('navigation', { name: 'Actions' });
  await menu.getByRole('button', { name: 'Attack' }).click();
  const list = page.getByRole('dialog', { name: 'Choose an attack' });
  await expect(list).toBeVisible();
  await list.locator('.am-item:not([disabled])').first().click();

  const pos = await page.evaluate(() => {
    const b = window.__battle!;
    const m = b.ctl.mode;
    if (m.kind !== 'target') return null;
    return b.view.tileScreenPosition(b.ctl.state.units.find((u) => u.id === m.targets[0])!.pos);
  });
  expect(pos).not.toBeNull();
  const box = (await page.locator('canvas.battle-canvas').boundingBox())!;
  await page.mouse.click(box.x + pos!.x, box.y + pos!.y);
  await page.getByRole('button', { name: 'Go!' }).click();
  await expect(page.getByTestId('closeup')).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/duel-${test.info().project.name}.png` });
  // Short duels can end on their own; only tap to skip if it's still playing.
  const closeup = page.getByTestId('closeup');
  if (await closeup.isVisible()) await closeup.click({ timeout: 2000 }).catch(() => undefined);
  await expect(closeup).toBeHidden();
  // A landed blow ends on the experience pop-up, which stays until tapped away.
  const xp = page.getByTestId('xp-panel');
  if (await xp.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expect(xp).toContainText(/\+\d+ XP/);
    await page.waitForTimeout(1500);
    await expect(xp).toBeVisible();
    await page.screenshot({ path: `test-results/xp-${test.info().project.name}.png` });
    await page.getByTestId('xp-continue').click();
    await expect(xp).toBeHidden();
  }

  const log = await page.evaluate(() => window.__battle!.ctl.view.get().log.join('\n'));
  expect(log).toMatch(/uses .+ on /);
  expect(errors).toEqual([]);
});
