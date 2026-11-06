// 截图工具：node preview/shot.mjs [desktop|tablet|phone] [输出文件] [dark|x] [splash毫秒|-] [view] [scrollY]
// 电脑宽度截整页；手机/平板截“手机屏幕”那一屏（底部导航栏会在画面里）。
import { chromium } from '@playwright/test';

const [width = 'desktop', out = 'preview/_shot.png', dark, splashAt = '-', view = 'home', scrollY = '0'] = process.argv.slice(2);
const sizes = { desktop: { width: 1440, height: 900 }, tablet: { width: 900, height: 1290 }, phone: { width: 430, height: 1010 } };
const browser = await chromium.launch(process.env.ISLAND_CHROMIUM_PATH ? { executablePath: process.env.ISLAND_CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: sizes[width], deviceScaleFactor: width === 'phone' ? 2 : 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:4173/preview/index.html?view=${view}`);
await page.evaluate(() => sessionStorage.clear());
if (splashAt !== '-') {
  await page.reload();
  await page.waitForTimeout(Number(splashAt));
  await page.screenshot({ path: out });
} else {
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('island-splash-overlay')?.remove());
  await page.evaluate((w) => document.querySelector(`[data-width="${w}"]`)?.click(), width);
  if (dark === 'dark') await page.check('#dark');
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.querySelector('island-splash-overlay')?.remove());
  if (width === 'desktop') {
    await page.addStyleTag({ content: '#frame{height:auto!important;overflow:visible!important}.ha-shell{height:auto!important}' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: out, fullPage: true });
  } else {
    await page.evaluate((y) => { document.querySelector('.ha-shell').scrollTop = Number(y); }, scrollY);
    await page.waitForTimeout(500);
    await page.screenshot({ path: out });
  }
}
console.log(JSON.stringify({ out, errors }, null, 1));
await browser.close();
