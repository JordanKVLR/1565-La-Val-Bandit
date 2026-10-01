import { expect, test } from '@playwright/test';

test('attack back lets the player choose the technique to strike back with', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?battle=b1-marsaxlokk');
  await expect(page.locator('canvas.battle-canvas')).toBeVisible();

  const reactions = page.getByRole('navigation', { name: 'Reactions' });
  const quick = { timeout: 3000 };
  let picked = false;
  for (let i = 0; i < 150 && !picked; i++) {
    const kind = await page.evaluate(() => window.__battle?.ctl.mode.kind);
    if (kind === 'reaction') {
      const attackBack = reactions.getByRole('button', { name: /^Attack/ });
      if (await attackBack.isEnabled()) {
        await attackBack.click();
        await expect(reactions.getByText('Strike back with')).toBeVisible();
        await page.screenshot({
          path: `test-results/strikeback-list-${test.info().project.name}.png`,
        });
        const option = reactions.locator('.fc-choice:not([disabled])').first();
        const name = (await option.locator('span').first().textContent()) ?? '';
        await option.click();
        // Back on the main list, Attack names the chosen technique and its FP.
        await expect(reactions.getByRole('button', { name: /^Attack/ })).toContainText(name);
        await page.screenshot({ path: `test-results/strikeback-${test.info().project.name}.png` });
        await page.getByTestId('react-go').click();
        picked = true;
        break;
      }
      await page
        .getByTestId('react-go')
        .click(quick)
        .catch(() => undefined);
    } else if (kind === 'closeUp') {
      await page
        .getByTestId('closeup')
        .click(quick)
        .catch(() => undefined);
    } else if (kind === 'levelUp') {
      await page
        .getByRole('button', { name: /Continue|Save points/ })
        .click(quick)
        .catch(() => undefined);
    } else if (kind === 'command') {
      // Walk the active unit toward the enemy so they meet head-on, then end the turn.
      await page.evaluate(() => {
        const { ctl } = window.__battle!;
        const s = ctl.state;
        const me = s.units.find((u) => u.id === s.turn?.unitId)!;
        const foe = s.units.find((u) => u.side === 'enemy' && !u.defeated)!;
        const units = s.units.map((u) =>
          u.id === me.id
            ? { ...u, pos: { x: foe.pos.x, y: foe.pos.y + 1 }, facing: 'north' as const }
            : u,
        );
        ctl.view.set({ ...ctl.view.get(), state: { ...s, units } });
      });
      const menu = page.getByRole('navigation', { name: 'Actions' });
      await menu
        .getByRole('button', { name: 'End Turn' })
        .click(quick)
        .catch(() => undefined);
      await page
        .getByRole('dialog', { name: 'Choose facing' })
        .getByRole('button', { name: /north/i })
        .click(quick)
        .catch(() =>
          page
            .getByRole('dialog', { name: 'Choose facing' })
            .getByRole('button')
            .first()
            .click(quick)
            .catch(() => undefined),
        );
    } else {
      await page.waitForTimeout(150);
    }
  }
  expect(picked).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__battle!.ctl.view.get().log.join('\n')))
    .toMatch(/Strikes back with /);
  expect(errors).toEqual([]);
});
