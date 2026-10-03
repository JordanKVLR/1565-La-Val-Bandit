import { expect, test } from '@playwright/test';

test('title screen starts a new game on the prologue card', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Armatura/ })).toBeVisible();
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('chapter-card')).toContainText('Prologue');
  await page.getByTestId('story-screen').click();
  await expect(page.getByTestId('dialogue-text')).not.toBeEmpty();
  await page.screenshot({ path: `test-results/story-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});

test('battle map renders with a terrain readout', async ({ page }) => {
  await page.goto('./?battle=b1-marsaxlokk');
  const canvas = page.locator('canvas.battle-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('turn-banner')).toHaveText(/^Round 1 · /);
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
  await expect(page.getByTestId('terrain-label')).toHaveText(/^\d+H \d+% [A-Za-z]+$/);
  await page.screenshot({ path: `test-results/battle-${test.info().project.name}.png` });
});

test('web app manifest is landscape and installable', async ({ request }) => {
  const res = await request.get('./manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.orientation).toBe('landscape');
  expect(manifest.icons.length).toBeGreaterThan(0);
});
