import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Controller-only play, as on a console: from the title screen to the first battle and its
 * menu with nothing but the keys the gamepad layer sends (arrows, Enter, Esc and the letters in
 * platform/input/controls.ts), plus a mocked gamepad for some steps. No mouse or touch at all.
 * The page is only read (`window.__battle`) to decide which key to press next.
 */

/** A standard-mapping pad behind a mocked `navigator.getGamepads`, driven from the test. */
function installMockPad(): void {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = {
    id: 'Mock controller (STANDARD GAMEPAD)',
    index: 0,
    connected: false,
    mapping: 'standard',
    timestamp: 0,
    axes: [0, 0, 0, 0],
    buttons,
  };
  const fire = (type: string) => {
    const e = new Event(type);
    Object.defineProperty(e, 'gamepad', { value: pad });
    window.dispatchEvent(e);
  };
  Object.defineProperty(Navigator.prototype, 'getGamepads', {
    configurable: true,
    value: () => [pad.connected ? pad : null, null, null, null],
  });
  (window as unknown as { __mockPad: unknown }).__mockPad = {
    connect() {
      pad.connected = true;
      fire('gamepadconnected');
    },
    disconnect() {
      pad.connected = false;
      fire('gamepaddisconnected');
    },
    button(i: number, down: boolean) {
      buttons[i]!.pressed = down;
      buttons[i]!.value = down ? 1 : 0;
      pad.timestamp++;
    },
    axis(i: number, v: number) {
      pad.axes[i] = v;
      pad.timestamp++;
    },
  };
}

type MockPad = {
  connect(): void;
  disconnect(): void;
  button(i: number, down: boolean): void;
  axis(i: number, v: number): void;
};

/** Standard mapping: 0 Ⓐ, 1 Ⓑ, 2 Ⓧ, 3 Ⓨ, 4 LB, 5 RB … */
async function padPress(page: Page, button: number): Promise<void> {
  await page.evaluate(
    (b) => (window as unknown as { __mockPad: MockPad }).__mockPad.button(b, true),
    button,
  );
  await page.waitForTimeout(120);
  await page.evaluate(
    (b) => (window as unknown as { __mockPad: MockPad }).__mockPad.button(b, false),
    button,
  );
  await page.waitForTimeout(120);
}

const pad = (page: Page, call: 'connect' | 'disconnect') =>
  page.evaluate((c) => (window as unknown as { __mockPad: MockPad }).__mockPad[c](), call);

const mode = (page: Page) => page.evaluate(() => window.__battle?.ctl.mode.kind ?? null);

/** Whose turn it is, when the player is being asked for a command. */
const playerTurn = (page: Page) =>
  page.evaluate(() => {
    const ctl = window.__battle?.ctl;
    const m = ctl?.mode.kind;
    return !!ctl && ctl.active()?.controller === 'human' && (m === 'move' || m === 'command');
  });

/** Moves the tile cursor to `to` with the arrow keys (learning which way each arrow goes). */
async function cursorTo(page: Page, to: { x: number; y: number }): Promise<void> {
  const cursor = () =>
    page.evaluate(() => {
      const c = window.__battle!.ctl.cursor()!;
      return { x: c.x, y: c.y };
    });
  const step = async (key: string, back: string) => {
    const a = await cursor();
    await page.keyboard.press(key);
    const b = await cursor();
    await page.keyboard.press(back);
    return { x: b.x - a.x, y: b.y - a.y };
  };
  // At the map's edge an arrow may not move; then its opposite tells the way.
  const delta = async (key: string, back: string) => {
    const d = await step(key, back);
    if (d.x || d.y) return d;
    const o = await step(back, key);
    return { x: -o.x, y: -o.y };
  };
  const up = await delta('ArrowUp', 'ArrowDown');
  const right = await delta('ArrowRight', 'ArrowLeft');
  // Each arrow walks one grid axis, so the moves needed are dot products with those axes.
  const from = await cursor();
  const d = { x: to.x - from.x, y: to.y - from.y };
  const ups = d.x * up.x + d.y * up.y;
  const rights = d.x * right.x + d.y * right.y;
  for (let i = 0; i < Math.abs(ups); i++)
    await page.keyboard.press(ups > 0 ? 'ArrowUp' : 'ArrowDown');
  for (let i = 0; i < Math.abs(rights); i++)
    await page.keyboard.press(rights > 0 ? 'ArrowRight' : 'ArrowLeft');
  expect(await cursor()).toEqual(to);
}

test('the whole opening plays with a controller alone: title to a battle turn and its menu', async ({
  page,
}) => {
  // The story to the first battle and a few animated rounds of it, at the fastest battle speed.
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(installMockPad);
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'armatura.settings.v1',
      JSON.stringify({ battleSpeed: 4, closeUps: false }),
    );
  });
  await page.reload();

  // Title: the first press lands on New Game; Enter opens the difficulty picker.
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'New Game', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const picker = page.getByRole('dialog', { name: 'Choose difficulty' });
  await expect(picker).toBeVisible();
  // The first press lands on the recommended mode.
  await page.keyboard.press('ArrowDown');
  await expect(picker.getByRole('button', { name: /^Knight/ })).toBeFocused();
  await page.keyboard.press('Enter');

  // The opening cinematic: Esc (the pad's Ⓑ) skips it.
  await expect(page.getByRole('region', { name: 'Opening cinematic' })).toBeVisible();
  await page.keyboard.press('Escape');
  const story = page.getByTestId('story-screen');
  await expect(story).toBeVisible();
  await expect(page.getByTestId('chapter-card')).toBeVisible();

  // A real (mocked) gamepad: Ⓐ dismisses the chapter card.
  await pad(page, 'connect');
  await padPress(page, 0);
  await expect(page.getByTestId('chapter-card')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-input', 'gamepad');
  // Ⓐ again: the line completes or the next one shows.
  const firstLine = await page.getByTestId('dialogue-text').textContent();
  await padPress(page, 0);
  await padPress(page, 0);
  await expect(page.getByTestId('dialogue-text')).not.toHaveText(firstLine ?? '');

  // The story with keys: Enter for lines; Enter, Enter (focus, press) for choices.
  const banner = page.getByTestId('turn-banner');
  const choices = page.getByRole('group', { name: 'Choices' });
  let choicesMade = 0;
  for (let i = 0; i < 400 && !(await page.locator('.battle-screen').isVisible()); i++) {
    if (await choices.isVisible()) {
      await page.keyboard.press('Enter');
      await expect(choices.getByRole('button').first()).toBeFocused();
      await page.keyboard.press('Enter');
      choicesMade++;
      continue;
    }
    await page.keyboard.press('Enter');
  }
  expect(choicesMade).toBeGreaterThan(0);
  await expect(page.locator('canvas.battle-canvas')).toBeVisible();

  let disconnectChecked = false;
  let moved = false;
  let attacked = false;
  let endedAfterAttack = false;
  for (let i = 0; i < 400 && !endedAfterAttack; i++) {
    const m = await mode(page);
    // Whatever the battle is waiting on besides a command: Enter answers it.
    if (m === 'xp' || m === 'levelUp' || m === 'closeUp' || m === 'reaction') {
      await page.keyboard.press('Enter');
      continue;
    }
    if (!(await playerTurn(page))) {
      await page.waitForTimeout(100);
      continue;
    }

    if (!disconnectChecked) {
      // The controller drops out mid-battle: the game pauses and keys go to the notice only.
      await page.evaluate(() =>
        (window as unknown as { __mockPad: MockPad }).__mockPad.axis(3, -1),
      );
      await page.waitForTimeout(150);
      await page.evaluate(() => (window as unknown as { __mockPad: MockPad }).__mockPad.axis(3, 0));
      await page.waitForTimeout(100);
      await expect(page.locator('html')).toHaveAttribute('data-input', 'gamepad');
      const before = await mode(page);
      await pad(page, 'disconnect');
      const notice = page.getByRole('alertdialog', { name: 'Controller disconnected' });
      await expect(notice).toBeVisible();
      // E would end the turn; with the notice up it only closes the notice.
      await page.keyboard.press('e');
      await expect(notice).toBeHidden();
      expect(await mode(page)).toBe(before);
      disconnectChecked = true;
      continue;
    }

    if (!moved) {
      // Move towards the nearest enemy: arrows to a reachable tile, Enter to go there.
      const target = await page.evaluate(() => {
        const ctl = window.__battle!.ctl;
        const mode = ctl.mode;
        if (mode.kind !== 'move') return null;
        const enemies = ctl.state.units.filter((u) => u.side === 'enemy' && !u.defeated);
        const dist = (a: { x: number; y: number }) =>
          Math.min(...enemies.map((e) => Math.abs(e.pos.x - a.x) + Math.abs(e.pos.y - a.y)));
        let best: { x: number; y: number } | null = null;
        for (const r of mode.reach.values()) {
          const end = r.path[r.path.length - 1];
          if (end && (!best || dist(end) < dist(best))) best = { x: end.x, y: end.y };
        }
        return best;
      });
      if (target) {
        await cursorTo(page, target);
        await expect.poll(() => mode(page)).toBe('move');
        await page.keyboard.press('Enter');
        await expect
          .poll(() => page.evaluate(() => window.__battle!.ctl.mode.kind), { timeout: 10_000 })
          .toBe('command');
        moved = true;
      }
    }

    const canStrike = await page.evaluate(() =>
      window
        .__battle!.ctl.attackOptions()
        .some((o) => o.unlocked && o.affordable && o.targets.length),
    );
    if (canStrike && !attacked && (await mode(page)) === 'command') {
      // A (the pad's Ⓧ) opens the attack menu; Enter focuses the default technique, Enter picks
      // it; ] jumps the cursor to a target; Enter opens the forecast; Enter strikes.
      await page.keyboard.press('a');
      await expect(page.getByRole('dialog', { name: 'Choose an attack' })).toBeVisible();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      await expect.poll(() => mode(page)).toBe('target');
      await page.keyboard.press(']');
      await page.keyboard.press('Enter');
      await expect.poll(() => mode(page)).toBe('forecast');
      const logLength = () => page.evaluate(() => window.__battle!.ctl.view.get().log.length);
      const before = await logLength();
      await page.keyboard.press('Enter');
      await expect.poll(() => mode(page)).not.toBe('forecast');
      // The strike was resolved: it is in the battle log.
      await expect.poll(logLength).toBeGreaterThan(before);
      attacked = true;
      continue;
    }

    if ((await mode(page)) !== 'command' && (await mode(page)) !== 'move') continue;
    // E (the pad's Ⓨ) ends the turn; Enter focuses the current facing, Enter keeps it.
    await page.keyboard.press('e');
    const facing = page.getByRole('dialog', { name: 'Choose facing' });
    await expect(facing).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(
      facing.getByRole('button', { name: /^Face/ }).and(page.locator(':focus')),
    ).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(facing).toBeHidden();
    if (attacked) endedAfterAttack = true;
    moved = false;
  }
  expect(disconnectChecked).toBe(true);
  expect(attacked).toBe(true);
  expect(endedAfterAttack).toBe(true);

  // The battle menu, on the next player turn: Esc opens it, Down focuses Resume, Esc closes it.
  // (Esc first backs out of the movement range to the command menu.)
  await expect.poll(() => playerTurn(page), { timeout: 60_000 }).toBe(true);
  const menu = page.getByRole('dialog', { name: 'Battle menu' });
  for (let i = 0; i < 3 && !(await menu.isVisible()); i++) await page.keyboard.press('Escape');
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('button', { name: 'Resume' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(banner).toBeVisible();
  expect(errors).toEqual([]);
});

test('a controller disconnect on the title screen shows the notice; reconnecting closes it', async ({
  page,
}) => {
  await page.addInitScript(installMockPad);
  await page.goto('./');
  await pad(page, 'connect');
  await padPress(page, 13); // D-pad down: focus moves to the first button
  await expect(page.locator('html')).toHaveAttribute('data-input', 'gamepad');
  await pad(page, 'disconnect');
  const notice = page.getByRole('alertdialog', { name: 'Controller disconnected' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('press any key or tap to continue');
  await page.screenshot({ path: `test-results/controller-notice-${test.info().project.name}.png` });
  await pad(page, 'connect');
  await expect(notice).toBeHidden();
});
