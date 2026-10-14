import { expect, test } from '@playwright/test';

test('a new game opens on the cinematic, which plays and can be skipped', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Playwright's Chromium cannot decode H.264, so the browser falls through to the VP9 source.
  const film = page.waitForResponse((r) => /cinematic\/armatura-intro\.(mp4|webm)/.test(r.url()));
  await page.goto('./');
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await expect(page.getByRole('region', { name: 'Opening cinematic' })).toBeVisible();
  expect([200, 206]).toContain((await film).status());
  const video = page.getByTestId('intro-video');
  await expect(video).toBeVisible();
  await expect(page.locator('.intro-loading')).toBeHidden({ timeout: 15000 });
  // It really plays: the clock moves on, with the picture decoded at full size.
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10000 })
    .toBeGreaterThan(1);
  expect(await video.evaluate((v: HTMLVideoElement) => [v.videoWidth, v.videoHeight])).toEqual([
    1920, 1080,
  ]);
  expect(await video.evaluate((v: HTMLVideoElement) => v.duration)).toBeCloseTo(43.2, 0);
  await page.screenshot({ path: `test-results/intro-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByTestId('chapter-card')).toContainText('Prologue');
  expect(errors).toEqual([]);
});

test('the cinematic ends by itself and the Prologue begins', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  const video = page.getByTestId('intro-video');
  await expect(video).toBeVisible();
  await expect(page.locator('.intro-loading')).toBeHidden({ timeout: 15000 });
  // Jump to the last second instead of sitting through all 43 s.
  await video.evaluate((v: HTMLVideoElement) => {
    v.currentTime = v.duration - 0.5;
  });
  await expect(page.getByTestId('chapter-card')).toContainText('Prologue', { timeout: 15000 });
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

test('a video that cannot load never holds the player back', async ({ page }) => {
  await page.route('**/cinematic/**', (route) => route.abort());
  await page.goto('./');
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await expect(page.getByTestId('chapter-card')).toContainText('Prologue', { timeout: 15000 });
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
  await expect(page.getByRole('region', { name: 'Opening cinematic' })).toBeVisible();
  const video = page.getByTestId('intro-video');
  await expect(page.locator('.intro-loading')).toBeHidden({ timeout: 15000 });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10000 })
    .toBeGreaterThan(0.5);
});
