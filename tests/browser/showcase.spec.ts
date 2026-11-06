import { test, expect } from '@playwright/test';

test('static project subdirectory isolates assets across all 23 cases without external requests', async ({ page }) => {
  const external: string[] = [], errors: string[] = [], failed: string[] = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' || !url.pathname.startsWith('/_site/')) { external.push(url.href); await route.abort(); }
    else await route.continue();
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto('/_site/');
  await expect(page).toHaveTitle('Island Cards · 测试夹具');
  await expect(page.locator('#cards > *')).toHaveCount(8);
  await expect(page.getByRole('link', { name: '日常一览' })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('island-light-card').getByRole('slider', { name: '亮度' })).toBeVisible();
  await page.getByRole('link', { name: '全部用例', exact: true }).click();
  await expect(page.locator('#cards > *')).toHaveCount(23);
  const picture = page.locator('island-picture-card img');
  await picture.scrollIntoViewIfNeeded();
  await expect(picture).toBeVisible();
  expect(await picture.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const camera = page.locator('island-camera-card');
  await camera.getByRole('button', { name: '查看影像详情' }).click();
  await camera.getByRole('button', { name: '取消', exact: true }).click();
  expect(external).toEqual([]); expect(errors).toEqual([]); expect(failed).toEqual([]);
});

test('family navigation, summary navigation and browser history stay inside the deployed path', async ({ page }) => {
  await page.goto('/_site/');
  await page.locator('island-summary-card').getByRole('link', { name: /灯光角落/ }).click();
  await expect(page).toHaveURL(/\/_site\/\?family=control$/);
  await expect(page.locator('#cards > *')).toHaveCount(5);
  await expect(page.getByRole('link', { name: '日常调节', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: '温控', exact: true }).click();
  await expect(page.locator('#cards > *')).toHaveCount(1);
  await page.goBack();
  await expect(page.locator('#cards > *')).toHaveCount(5);
  await page.getByRole('link', { name: '全部用例', exact: true }).click();
  await expect(page.locator('#cards > *')).toHaveCount(23);
  const picture = page.locator('island-picture-card img');
  await picture.scrollIntoViewIfNeeded();
  await expect(picture).toBeVisible();
  expect(await picture.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test('controls change mock state, confirmations cancel safely and reset restores the demo', async ({ page }) => {
  await page.goto('/_site/');
  const light = page.locator('island-light-card');
  await light.getByRole('switch', { name: '关闭', exact: true }).click();
  await expect(light).toContainText('已关闭');
  const climate = page.locator('island-climate-card');
  await climate.getByRole('button', { name: '提高目标温度' }).click();
  await expect(climate.getByRole('spinbutton', { name: '目标温度' })).toHaveValue('24.5');
  const feeder = page.locator('island-feeder-card');
  await feeder.getByRole('button', { name: '投喂 2 份' }).click();
  await feeder.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page.locator('#calls')).toContainText('2 次');
  await page.getByRole('button', { name: '重置演示' }).click();
  await expect(light.getByRole('switch', { name: '关闭', exact: true })).toBeEnabled();
  await expect(climate.getByRole('spinbutton', { name: '目标温度' })).toHaveValue('24');
  await expect(page.locator('#calls')).toHaveText('0 次 mock 服务调用');
});

for (const width of [320, 390, 768, 1440]) test(`showcase is usable at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 960 });
  await page.goto('/_site/');
  await expect(page.locator('#cards > *')).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('link', { name: '影音', exact: true }).click();
  const media = page.locator('island-media-card');
  await media.getByRole('button', { name: '暂停', exact: true }).click();
  await expect(media.getByRole('button', { name: '播放', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '日常一览' }).click();
  await page.screenshot({ path: testInfo.outputPath(`showcase-${width}.png`), fullPage: true });
});

test('paper showcase navigation remains legible with a dark system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/_site/');
  await expect(page.getByRole('link', { name: '影音', exact: true })).toHaveCSS('color', 'rgb(98, 94, 80)');
  await expect(page.getByRole('link', { name: '日常一览' })).toHaveCSS('color', 'rgb(40, 94, 76)');
  await page.getByRole('link', { name: '影音', exact: true }).click();
  await expect(page.locator('island-media-card')).toBeVisible();
});
