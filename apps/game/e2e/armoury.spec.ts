import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const scudi = async (page: Page) =>
  Number((await page.getByTestId('scudi').getAttribute('aria-label'))!.replace(/\D/g, ''));

test('the Armoury fits on one screen, buys and fits a weapon, sells a spare and leaves', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?armoury');
  await expect(page.getByTestId('armoury-screen')).toBeVisible();

  // Nothing on the page itself scrolls: only the shelf, rail and detail body do.
  const [h, ih, w, iw] = await page.evaluate(() => [
    document.documentElement.scrollHeight,
    innerHeight,
    document.documentElement.scrollWidth,
    innerWidth,
  ]);
  expect(h).toBeLessThanOrEqual(ih);
  expect(w).toBeLessThanOrEqual(iw);

  await page.getByTestId('pilot-chip-ninu').click();
  await page.getByTestId('shelf-tab-weapon').click();
  const before = await scudi(page);

  // Buy & equip a fine sword from the armourer's stock: the comparison shows first.
  await page.getByTestId('item-card-weapon-milanese-spada').click();
  await expect(page.getByTestId('item-detail')).toBeVisible();
  await expect(page.getByTestId('stat-delta-DMG')).toBeVisible();
  await page.getByTestId('action-buy-equip').click();
  await expect.poll(() => scudi(page)).toBe(before - 500);
  await expect(page.getByTestId('armourer-bark')).toBeVisible();
  await expect(
    page.locator('[data-testid="item-card-weapon-milanese-spada"]').first(),
  ).toHaveAttribute('data-source', 'fitted');
  await page.getByTestId('item-detail-close').click();
  await expect(page.getByTestId('slot-weapon')).toContainText('Milanese Spada');

  // The old arming sword went to the stores: sell it back at half price.
  await page.getByTestId('shelf-mode-sell').click();
  await page.getByTestId('item-card-weapon-arming-sword').click();
  await page.getByTestId('action-sell').click();
  await expect.poll(() => scudi(page)).toBeGreaterThan(before - 500);
  await expect(page.getByTestId('item-card-weapon-arming-sword')).toHaveCount(0);

  // Unspent stat points: the first To battle offers training, Spend later moves on.
  await page.getByTestId('to-battle').click();
  await expect(page.getByTestId('training-sheet')).toBeVisible();
  // Skills are listed; ones not reached yet are locked with the level they unlock at.
  const skills = page.getByTestId('roster-skills');
  await expect(skills.locator('.skill-row.active').first()).toBeAttached();
  await expect(skills.locator('.skill-row.locked').first()).toContainText(/Unlocks at Lv \d+/);
  await page.getByRole('button', { name: 'Spend later' }).click();
  await expect(page.getByTestId('armoury-screen')).toBeHidden();
  expect(errors).toEqual([]);
});

test('expensive purchases ask for a second tap', async ({ page }) => {
  await page.goto('./?armoury');
  await page.getByTestId('pilot-chip-ninu').click();
  // Spend down to under twice the price of a 500-scudi sword.
  await page.getByTestId('item-card-weapon-milanese-spada').click();
  await page.getByTestId('action-buy').click();
  await page.getByTestId('item-card-weapon-venetian-corsesca').click();
  await page.getByTestId('action-buy').click();
  await expect.poll(() => scudi(page)).toBe(500);
  await page.getByTestId('item-card-weapon-brescian-arquebus').click();
  await page.getByTestId('action-buy').click();
  await expect(page.getByTestId('action-confirm')).toBeVisible();
  await page.getByTestId('action-confirm').click();
  await expect.poll(() => scudi(page)).toBe(0);
  // Now the rest of the stock is out of reach, and says why.
  const mace = page.getByTestId('item-card-weapon-birgu-flanged-mace');
  await expect(mace).toHaveAttribute('data-blocked', 'true');
  await mace.click();
  await expect(page.getByTestId('action-reason')).toContainText('more scudi');
  await expect(page.getByTestId('action-buy-equip')).toBeDisabled();
});
