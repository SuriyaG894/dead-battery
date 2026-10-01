import { expect, test, type Page } from '@playwright/test';

/** Start a new game with the debug overlay. */
async function start(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?debug=1');
  await page.getByRole('button', { name: 'Pick up the phone' }).click();
  return errors;
}

async function unlock(page: Page) {
  await page.getByText('Tap to unlock').click();
  for (const d of '0614') await page.locator('.key', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.locator('.home')).toBeVisible();
}

async function openApp(page: Page, name: string) {
  if (!(await page.locator('.home').isVisible())) await page.locator('.home-indicator').click();
  await page.locator('.app-icon', { hasText: name }).click();
}

/** Run game time at ×10 only while waiting on the story, so the battery isn't burned during clicks. */
async function fastWhile(page: Page, wait: () => Promise<unknown>) {
  const x10 = page.getByRole('button', { name: 'x10' });
  await x10.click();
  try {
    await wait();
  } finally {
    await x10.click();
  }
}

async function answerCall(page: Page) {
  await fastWhile(page, () => page.getByRole('button', { name: 'Answer' }).click({ timeout: 30_000 }));
  await fastWhile(page, () => expect(page.locator('.call')).toBeHidden({ timeout: 30_000 }));
}

test('golden path reaches "The Lighthouse"', async ({ page }) => {
  const errors = await start(page);
  await unlock(page);

  await openApp(page, 'Messages');
  await page.locator('.thread-row', { hasText: 'Sam' }).click();
  await fastWhile(page, () => page.locator('.chip', { hasText: 'Say nothing' }).click({ timeout: 20_000 }));
  await answerCall(page); // chapter 1 → 2

  await openApp(page, 'Photos');
  await page.getByText('Recently Deleted').click();
  await page.locator('.photo-cell').first().click(); // recover (−1%)
  await page.locator('.photo-cell').first().click(); // open
  await page.getByRole('button', { name: 'Pin clue' }).click();
  await page.getByRole('button', { name: 'Zoom into signature' }).click();
  await page.locator('.zoom-paper').getByRole('button', { name: 'Pin clue' }).click();
  await page.locator('.zoom-paper').getByRole('button', { name: 'Close' }).click();

  await openApp(page, 'Notes');
  for (const d of '1107') await page.locator('.key', { hasText: new RegExp(`^${d}$`) }).click();
  await page.locator('.list-row', { hasText: 'READ THIS' }).click();
  await page.getByRole('button', { name: 'Pin clue' }).click();

  await answerCall(page); // the reveal

  await openApp(page, 'Evidence');
  await page.locator('.slot', { hasText: 'WHO' }).locator('.opt', { hasText: 'Contract signature' }).click();
  await page.locator('.slot', { hasText: 'WHERE' }).locator('.opt').first().click();
  await page.locator('.slot', { hasText: 'WHY' }).locator('.opt', { hasText: 'Deleted contract' }).click();
  await page.locator('.recipient', { hasText: 'Text 911' }).click();
  await page.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'The Lighthouse' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Share result')).toBeVisible();
  expect(errors).toEqual([]);
});

test('no horizontal overflow and lock screen renders', async ({ page }) => {
  const errors = await start(page);
  await expect(page.locator('.lock-time')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await unlock(page);
  await expect(page.locator('.app-icon')).toHaveCount(9);
  expect(errors).toEqual([]);
});

test('leaving the tab turns the screen off; tapping wakes it', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.screen-off')).toBeVisible();
  await page.locator('.screen-off').click();
  await expect(page.locator('.screen-off')).toBeHidden();
});

test('low battery offers Low Power Mode, which disables Maps', async ({ page }) => {
  await start(page);
  await unlock(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '-5%' }).click();
  await page.getByRole('button', { name: 'Low Power Mode' }).click();
  await expect(page.locator('.sb-pct')).toHaveClass(/red|yellow/);
  await expect(page.locator('.app-icon', { hasText: 'Maps' })).toHaveClass(/disabled/);
});

test('short or zoomed window: the phone scales down and every app stays on screen', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'phones run fullscreen');
  // A 871px-tall window at 150% browser zoom leaves ~580 CSS px of height.
  await page.setViewportSize({ width: 1280, height: 580 });
  await start(page);
  await unlock(page);
  const screen = (await page.locator('.screen').boundingBox())!;
  const icons = page.locator('.app-icon');
  await expect(icons).toHaveCount(9);
  for (let i = 0; i < 9; i++) {
    const b = (await icons.nth(i).boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(screen.x);
    expect(b.x + b.width).toBeLessThanOrEqual(screen.x + screen.width + 0.5);
  }
  const pct = (await page.locator('.sb-pct').boundingBox())!;
  const notch = (await page.locator('.notch').boundingBox())!;
  expect(pct.x).toBeGreaterThanOrEqual(notch.x + notch.width);
  await page.screenshot({ path: test.info().outputPath('short-window-home.png') });
});

test('voice memo: corrupted until the contract is recovered, then restored', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'layout covered by desktop run');
  await start(page);
  await unlock(page);

  await openApp(page, 'Voice Memos');
  await page.locator('.memo', { hasText: 'meeting_0923' }).getByRole('button', { name: 'Play' }).click();
  await expect(page.locator('.corrupt-block')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('.corrupt-block')).toContainText('3 segments unreadable');
  await expect(page.getByText('Recovering her deleted files may restore it')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: test.info().outputPath('memo-corrupted.png') });

  await openApp(page, 'Photos');
  await page.getByText('Recently Deleted').click();
  await page.locator('.photo-cell').first().click(); // recover the contract

  await openApp(page, 'Voice Memos');
  const memo = page.locator('.memo', { hasText: 'meeting_0923' });
  await expect(memo.locator('.corrupt-block')).toHaveCount(0);
  await memo.getByRole('button', { name: 'Play' }).click();
  await expect(memo.getByText("That's what partner relations is for.")).toBeVisible({ timeout: 60_000 });
  await expect(memo.getByText('Restored from her recovered files')).toBeVisible({ timeout: 15_000 });
  await expect(memo.locator('.transcript p b')).toHaveText(['Man:', 'Woman:', 'Man:', 'Man:']);
  await page.screenshot({ path: test.info().outputPath('memo-restored.png') });
});
