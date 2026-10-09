import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * TV (10-foot) layout, ADR 0010. Runs in the tv-1080 and tv-4k projects (1920×1080 and
 * 3840×2160 at device scale 1). The title-safe zone is 5% per side (data/display.json).
 */
const SAFE = 0.05;

async function useDisplay(page: Page, display: 'tv' | 'auto', lastInput?: 'gamepad') {
  await page.addInitScript(
    ([d, input]) => {
      if (sessionStorage.getItem('tv-init')) return;
      sessionStorage.setItem('tv-init', '1');
      localStorage.setItem(
        'armatura.settings.v1',
        JSON.stringify({ display: d, fullscreen: false }),
      );
      if (input) localStorage.setItem('armatura.display.lastInput', input);
    },
    [display, lastInput ?? ''] as const,
  );
}

async function expectNoPageScroll(page: Page) {
  const [sw, sh, iw, ih] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.scrollHeight,
    innerWidth,
    innerHeight,
  ]);
  expect(sw).toBeLessThanOrEqual(iw);
  expect(sh).toBeLessThanOrEqual(ih);
}

/** The element is on screen and inside the title-safe area. */
async function expectInSafeArea(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = (await locator.boundingBox())!;
  const { width, height } = page.viewportSize()!;
  const slack = 1;
  expect(box.x).toBeGreaterThanOrEqual(width * SAFE - slack);
  expect(box.y).toBeGreaterThanOrEqual(height * SAFE - slack);
  expect(box.x + box.width).toBeLessThanOrEqual(width * (1 - SAFE) + slack);
  expect(box.y + box.height).toBeLessThanOrEqual(height * (1 - SAFE) + slack);
}

/** On-screen font size of an element, scaled to what it would be on a 1080p screen. */
async function fontAt1080(page: Page, locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    const zoom =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-zoom')) || 1;
    return (parseFloat(getComputedStyle(el).fontSize) * zoom * 1080) / innerHeight;
  });
}

test('title: scaled-up menu inside the safe area, readable from the sofa', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await useDisplay(page, 'tv');
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-display', 'tv');
  await expectNoPageScroll(page);
  await expectInSafeArea(page, page.getByRole('heading', { name: /Armatura/ }));
  const newGame = page.getByRole('button', { name: 'New Game', exact: true });
  await expectInSafeArea(page, newGame);
  await expectInSafeArea(page, page.getByRole('button', { name: 'Historical notes' }));
  expect(await fontAt1080(page, newGame)).toBeGreaterThanOrEqual(28);

  // Dialogs stay inside the safe area too, and Settings offers the Display choice.
  await page.getByRole('button', { name: 'Settings' }).click();
  const tvChoice = page.getByTestId('display-tv');
  await expect(tvChoice).toHaveAttribute('aria-pressed', 'true');
  await expectInSafeArea(
    page,
    page.getByRole('dialog', { name: 'Settings' }).locator('.modal-box'),
  );
  await page.getByTestId('display-handheld').click();
  await expect(page.locator('html')).toHaveAttribute('data-display', 'handheld');
  await page.getByTestId('display-tv').click();
  await expect(page.locator('html')).toHaveAttribute('data-display', 'tv');
  await page.screenshot({ path: `test-results/tv-title-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});

test('battle: full-bleed map, HUD in the safe area, pad prompts, capped render size', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await useDisplay(page, 'tv');
  await page.goto('./?battle=b1-marsaxlokk');
  const canvas = page.locator('canvas.battle-canvas');
  await expect(canvas).toBeVisible();
  await expectNoPageScroll(page);

  // The map runs to the screen edges; the HUD does not.
  const { width, height } = page.viewportSize()!;
  const box = (await canvas.boundingBox())!;
  expect(Math.round(box.x)).toBe(0);
  expect(Math.round(box.y)).toBe(0);
  expect(Math.round(box.width)).toBe(width);
  expect(Math.round(box.height)).toBe(height);
  await expectInSafeArea(page, page.getByTestId('turn-banner'));
  await expectInSafeArea(page, page.getByRole('button', { name: 'Menu', exact: true }));

  // Touch-only rotate buttons are hidden (LT/RT rotate); prompts show pad glyphs.
  await expect(page.getByRole('button', { name: 'Rotate left' })).toBeHidden();
  const actions = page.getByRole('navigation', { name: 'Actions' });
  await expect(actions).toBeVisible({ timeout: 20_000 });
  await expectInSafeArea(page, actions);
  await expect(actions.locator('kbd.key.pad').first()).toBeVisible();

  // The drawing buffer matches the screen at 1080p and is capped at 2560×1440 at 4K.
  const buffer = await canvas.evaluate((c: HTMLCanvasElement) => c.width * c.height);
  expect(buffer).toBeLessThanOrEqual(2560 * 1440 * 1.01);
  expect(buffer).toBeGreaterThanOrEqual(Math.min(width * height, 2560 * 1440) * 0.97);

  // Tapping the map still picks the tile under the pointer through the zoom.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
  await expect(page.getByTestId('terrain-label')).toHaveText(/^\d+H \d+% [A-Za-z]+$/);
  await page.screenshot({ path: `test-results/tv-battle-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});

test('armoury: fits the safe area without scrolling', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await useDisplay(page, 'tv');
  await page.goto('./?armoury');
  await expect(page.getByTestId('armoury-screen')).toBeVisible();
  await expectNoPageScroll(page);
  await expectInSafeArea(page, page.getByTestId('to-battle'));
  await expectInSafeArea(page, page.getByTestId('pilot-chip-ninu'));
  await expectInSafeArea(page, page.getByTestId('shelf-tab-weapon'));
  await page.getByTestId('item-card-weapon-milanese-spada').click();
  await expectInSafeArea(page, page.getByTestId('action-buy-equip'));
  await page.screenshot({ path: `test-results/tv-armoury-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});

test('Auto picks TV on a big screen after a gamepad, handheld otherwise', async ({ page }) => {
  await useDisplay(page, 'auto');
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-display', 'handheld');

  // A pad player is remembered between launches.
  await page.evaluate(() => localStorage.setItem('armatura.display.lastInput', 'gamepad'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-display', 'tv');

  // Touching the mouse switches back to the handheld layout.
  await page.mouse.click(5, 5);
  await expect(page.locator('html')).toHaveAttribute('data-display', 'handheld');
});
