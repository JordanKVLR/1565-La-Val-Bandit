import { expect, test } from '@playwright/test';

test('new game plays through the prologue into the first battle, and Continue resumes it', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: /^Knight/ }).click();
  await page.getByRole('button', { name: 'Skip' }).click();

  const story = page.getByTestId('story-screen');
  const battle = page.locator('canvas.battle-canvas');
  let choicesMade = 0;
  for (let i = 0; i < 200 && !(await page.getByTestId('turn-banner').isVisible()); i++) {
    const choices = page.getByRole('group', { name: 'Choices' });
    if (await choices.isVisible()) {
      await choices.getByRole('button').first().click();
      choicesMade++;
      continue;
    }
    if (await story.isVisible()) {
      // Two taps: the first completes the typewriter line, the second advances.
      await story.click({ position: { x: 20, y: 60 } });
      await story.click({ position: { x: 20, y: 60 } });
    }
  }
  expect(choicesMade).toBeGreaterThan(0);
  await expect(battle).toBeVisible();
  await expect(page.getByTestId('turn-banner')).toBeVisible();

  // Leave and come back: Continue resumes the battle.
  await page.reload();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('turn-banner')).toBeVisible();
  expect(errors).toEqual([]);
});
