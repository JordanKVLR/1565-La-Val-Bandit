import { expect, test } from '@playwright/test';

test('a new game opens on the cinematic, which plays to the song and can be skipped', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const song = page.waitForResponse((r) => /under-the-red-sun\.mp3/.test(r.url()));
  await page.goto('./');
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await expect(page.getByRole('region', { name: 'Opening cinematic' })).toBeVisible();
  expect([200, 206]).toContain((await song).status());
  const film = page.frameLocator('iframe[title="Opening cinematic"]');
  await expect(film.locator('canvas#c')).toBeVisible();
  await expect(page.locator('.intro-loading')).toBeHidden({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/intro-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('chapter-card')).toContainText('Prologue');
  expect(errors).toEqual([]);
});

test('Settings on the title screen replays the cinematic and returns to the title', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Watch intro' }).click();
  await expect(page.getByRole('region', { name: 'Opening cinematic' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: /Armatura/ })).toBeVisible();
});

test('the cinematic still plays once the offline service worker controls the page', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await expect(page.locator('.intro-loading')).toBeHidden({ timeout: 15000 });
  await expect(page.getByRole('region', { name: 'Opening cinematic' })).toBeVisible();
  const film = page.frame({ url: /intro\/index\.html/ });
  expect(await film?.evaluate(() => typeof (window as { renderFrame?: unknown }).renderFrame)).toBe(
    'function',
  );
});
