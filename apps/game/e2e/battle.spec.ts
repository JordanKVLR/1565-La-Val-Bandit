import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Handles whatever the battle is waiting on; returns false when nothing was actionable. */
async function step(page: Page, opts: { move: boolean }): Promise<boolean> {
  const closeup = page.getByTestId('closeup');
  if (await closeup.isVisible()) {
    await closeup.click();
    return true;
  }
  const levelUp = page.getByRole('dialog', { name: 'Level up' });
  if (await levelUp.isVisible()) {
    await levelUp.getByRole('button', { name: 'Raise POW' }).click();
    await levelUp.getByRole('button', { name: /Continue|Save points/ }).click();
    return true;
  }
  const react = page.getByTestId('react-go');
  if (await react.isVisible()) {
    await react.click();
    return true;
  }
  const menu = page.getByRole('navigation', { name: 'Actions' });
  if (await menu.isVisible()) {
    const move = menu.getByRole('button', { name: 'Move' });
    if (opts.move && (await move.isEnabled())) {
      await move.click();
      // Pick the first reachable tile that isn't the unit's own and tap it on screen.
      const pos = await page.evaluate(() => {
        const b = window.__battle!;
        const mode = b.ctl.mode;
        if (mode.kind !== 'move') return null;
        const dest = [...mode.reach.values()].find((r) => r.path.length > 0);
        const last = dest?.path[dest.path.length - 1];
        return last ? b.view.tileScreenPosition(last) : null;
      });
      if (pos) {
        const box = (await page.locator('canvas.battle-canvas').boundingBox())!;
        // First tap previews the route: the AP bar shows the cost before anything moves.
        await page.mouse.click(box.x + pos.x, box.y + pos.y);
        await expect(page.getByTestId('active-card').locator('.vb-ap .changing')).toHaveText(
          /\d+→\d+/,
        );
        // Second tap on the same tile moves.
        await page.mouse.click(box.x + pos.x, box.y + pos.y);
        await expect(menu.getByRole('button', { name: 'Undo' })).toBeVisible();
      }
      return true;
    }
    await menu.getByRole('button', { name: 'End Turn' }).click();
    await page.getByRole('dialog', { name: 'Choose facing' }).getByRole('button').first().click();
    return true;
  }
  return false;
}

test('a player can move, end turns and answer enemy attacks through round 2', async ({ page }) => {
  // Plays two full rounds of animated turns; allow for slower CI machines.
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?battle=b1-marsaxlokk');
  await expect(page.locator('canvas.battle-canvas')).toBeVisible();

  let moved = false;
  for (let i = 0; i < 80; i++) {
    const banner = await page
      .getByTestId('turn-banner')
      .textContent()
      .catch(() => '');
    if (banner?.startsWith('Round 3')) break;
    const acted = await step(page, { move: !moved });
    if (acted && !moved) {
      moved = await page.getByRole('button', { name: 'Undo' }).isVisible();
    }
    if (!acted) await page.waitForTimeout(150);
  }
  expect(moved).toBe(true);
  await expect(page.getByTestId('turn-banner')).toHaveText(/Round (2|3)/);
  expect(errors).toEqual([]);
});
