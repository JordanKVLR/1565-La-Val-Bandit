import { expect, test } from '@playwright/test';

test('title screen leads to a rendered battle map with a terrain readout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Armatura/ })).toBeVisible();
  await page.getByRole('button', { name: 'Begin' }).click();

  const canvas = page.locator('canvas.battle-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByText('Shore of Marsaxlokk')).toBeVisible();
  await expect(page.getByTestId('turn-banner')).toHaveText(/^Round 1 · /);

  // Tap near the centre of the map: a tile should be selected and its terrain label shown.
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas has no size');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('terrain-label')).toHaveText(/^\d+H \d+% [A-Za-z]+$/);

  await page.getByRole('button', { name: 'Rotate right' }).click();
  await page.screenshot({ path: `test-results/battle-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});

test('web app manifest is landscape and installable', async ({ request }) => {
  const res = await request.get('./manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.orientation).toBe('landscape');
  expect(manifest.icons.length).toBeGreaterThan(0);
});
