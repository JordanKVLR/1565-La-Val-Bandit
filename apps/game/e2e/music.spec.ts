import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Resolves with the status of the first request for a music file whose name matches. */
const trackLoaded = (page: Page, name: RegExp) =>
  page
    .waitForResponse((r) => /\.mp3$/.test(new URL(r.url()).pathname) && name.test(r.url()))
    .then((r) => r.status());

test('Gentle Piano plays outside battle and Thunderous Charge in battle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const piano = trackLoaded(page, /gentle-piano/);
  await page.goto('./');
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  expect([200, 206]).toContain(await piano);

  const charge = trackLoaded(page, /thunderous-charge/);
  await page.goto('./?battle=b1-marsaxlokk');
  await expect(page.locator('canvas.battle-canvas')).toBeVisible();
  await page.locator('canvas.battle-canvas').click({ position: { x: 20, y: 20 } });
  expect([200, 206]).toContain(await charge);
  expect(errors).toEqual([]);
});
