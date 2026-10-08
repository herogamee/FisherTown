import { test, expect } from '@playwright/test';

test('Sunny Bay main page, approved art, real buttons and full catch sequence', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveURL(/\/sunny-bay\/$/);
  await expect(page.locator('.wood-logo')).toBeVisible();
  await expect(page.locator('#cast')).toBeEnabled();
  await expect(page.locator('#hook')).toBeDisabled();
  const scene = await request.get('/sunny-bay/assets/sunny-bay-scene.webp');
  expect(scene.ok()).toBeTruthy();
  expect((await scene.body()).byteLength).toBeGreaterThan(100_000);
  const logoLoaded = await page.locator('.wood-logo').evaluate((el: HTMLImageElement) =>
    el.complete && el.naturalWidth > 0);
  expect(logoLoaded).toBeTruthy();

  // Run real cast input and use a deterministic bite hook for this smoke test.
  await page.goto('/sunny-bay/?test=1');
  const cast = page.locator('#cast');
  await cast.dispatchEvent('pointerdown', { pointerId: 3, button: 0, pointerType: 'touch' });
  await expect(page.locator('#state-title')).toHaveText('กำลังเล็งระยะ');
  await page.waitForTimeout(250);
  await cast.dispatchEvent('pointerup', { pointerId: 3, button: 0, pointerType: 'touch' });
  await expect(page.locator('#state-title')).toHaveText('เหยื่อลงน้ำแล้ว');
  await page.evaluate(() => (window as any).__fishertownTest.triggerBite());
  await expect(page.locator('#hook')).toBeEnabled();
  await page.locator('#hook').click();
  await expect(page.locator('#reel')).toBeEnabled();
  await page.locator('#reel').dispatchEvent('pointerdown', { pointerId: 4, button: 0, pointerType: 'touch' });
  await page.locator('#reel').dispatchEvent('pointerup', { pointerId: 4, button: 0, pointerType: 'touch' });
  await page.evaluate(() => (window as any).__fishertownTest.land());
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#modal .panel-button')).toHaveText(/ปล่อยคืนสู่ธรรมชาติ/);
  await page.screenshot({ path: 'test-results/sunny-bay-portrait-catch.png', fullPage: true });
  await page.locator('#modal .panel-button').click();
  expect(await page.evaluate(() => (window as any).__fishertownTest.getState().phase)).toBe('idle');
  expect(await page.evaluate(() => (window as any).__fishertownTest.getState().totalCatches)).toBeGreaterThan(0);
  await page.locator('.bottom-nav [data-panel="fishdex"]').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#modal-title')).toContainText('Fishdex');
  expect(errors).toEqual([]);
});

test('Sunny Bay landscape orientation and safe return to portrait', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/sunny-bay/?test=1');
  await expect(page.locator('#cast')).toBeVisible();
  await expect(page.locator('.bottom-nav')).toBeVisible();
  const landscape = await page.locator('#app').boundingBox();
  expect(landscape).not.toBeNull();
  expect(landscape!.width).toBeLessThanOrEqual(844);
  expect(landscape!.height).toBeLessThanOrEqual(391);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#cast')).toBeVisible();
  const portrait = await page.locator('#app').boundingBox();
  expect(portrait).not.toBeNull();
  expect(portrait!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/sunny-bay-portrait.png', fullPage: true });
});
