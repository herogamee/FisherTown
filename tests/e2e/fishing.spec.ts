import { test, expect } from '@playwright/test';

test('phone portrait camera fills a tall viewport and fish controls work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const uncaught: string[] = [];
  page.on('pageerror', error => uncaught.push(error.message));

  await page.goto('/?classic=1');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#mobile-panel')).toBeVisible();
  await expect(page.locator('#mobile-title')).toContainText('พร้อมตกปลา', { timeout: 25_000 });
  const box = await page.locator('#game').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(360);
  expect(box!.height / box!.width).toBeGreaterThan(1.05);
  await expect(page.locator('#mobile-cast')).toBeEnabled();
  await expect(page.locator('#mobile-release')).toBeHidden();
  await expect.poll(async () => page.evaluate(() =>
    performance.getEntriesByType('resource').some(entry =>
      entry.name.includes('bg_thailand_sunset.webp'))
  )).toBeTruthy();

  await page.locator('#quality-select').selectOption('low');
  await expect(page.locator('#quality-info')).toContainText('LOW');

  const cast = page.locator('#mobile-cast');
  await cast.dispatchEvent('pointerdown', { pointerId: 7, button: 0, pointerType: 'touch' });
  await expect(page.locator('#mobile-title')).toContainText('กำลังเล็งระยะ');
  await page.waitForTimeout(280);
  await cast.dispatchEvent('pointerup', { pointerId: 7, button: 0, pointerType: 'touch' });
  await expect(page.locator('#mobile-title')).toContainText('เหยื่อลงน้ำแล้ว', { timeout: 5_000 });
  await expect(page.locator('#mobile-cast')).toContainText('เก็บสาย');
  await page.screenshot({ path: 'test-results/portrait-fishing.png', fullPage: true });
  expect(uncaught).toEqual([]);
});

test('wide orientation keeps original 16:9 controls and can reflow to portrait', async ({ page }) => {
  await page.setViewportSize({ width: 980, height: 550 });
  await page.goto('/?classic=1');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page.locator('#mobile-panel')).toBeHidden();
  await expect(page.locator('#quality-select')).toBeVisible();

  const landscape = await page.locator('#game').boundingBox();
  expect(landscape).not.toBeNull();
  expect(landscape!.width / landscape!.height).toBeGreaterThan(1.7);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#mobile-panel')).toBeVisible();
  await expect.poll(async () => {
    const box = await page.locator('#game').boundingBox();
    return box ? box.height / box.width : 0;
  }).toBeGreaterThan(1.05);
  await page.screenshot({ path: 'test-results/rotated-portrait.png', fullPage: true });
  await page.setViewportSize({ width: 980, height: 550 });
  await expect(page.locator('#mobile-panel')).toBeHidden();
  console.log('post-rotation layout', await page.evaluate(() => {
    const game = document.getElementById('game')!;
    const frame = document.getElementById('game-frame')!;
    const canvas = game.querySelector('canvas')!;
    const g = game.getBoundingClientRect(), f = frame.getBoundingClientRect();
    const s = getComputedStyle(game);
    return {
      innerWidth, innerHeight, game: [g.width,g.height], frame:[f.width,f.height],
      canvas:[canvas.clientWidth,canvas.clientHeight],
      inlineStyle:game.getAttribute('style'),
      styleHeight:s.height,styleWidth:s.width
    };
  }));
  await expect.poll(async () => {
    const box = await page.locator('#game').boundingBox();
    return box ? box.width / box.height : 0;
  }).toBeGreaterThan(1.7);
});
