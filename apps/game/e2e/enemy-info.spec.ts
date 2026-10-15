import { expect, test } from '@playwright/test';

test('an enemy unit lists its techniques (and skills) in its details, any time', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?battle=b1-marsaxlokk');
  await expect(page.locator('canvas.battle-canvas')).toBeVisible();
  // Inspect the first enemy by tapping its tile through the controller.
  const name = await page.evaluate(() => {
    const b = window.__battle!;
    const enemy = b.ctl.state.units.find((u) => u.side === 'enemy' && !u.defeated)!;
    b.ctl.tapTile(enemy.pos);
    return enemy.name;
  });
  await page.getByRole('button', { name: `Details for ${name}` }).click();
  await page.getByRole('tab', { name: 'Techniques' }).click();
  const list = page.getByTestId('unit-techniques');
  await expect(list).toBeVisible();
  // At least the enemy's starter attacks, drawn as technique cards, never the old "revealed in
  // battle" message.
  await expect(list.locator('.ov-tc').first()).toBeVisible();
  await expect(page.getByText('only revealed in battle')).toHaveCount(0);
  expect(errors).toEqual([]);
});
