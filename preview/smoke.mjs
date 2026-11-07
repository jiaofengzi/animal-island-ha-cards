// 交互冒烟：点卧室台灯、点风扇摆头，检查状态是否变化。
import { chromium } from '@playwright/test';

const browser = await chromium.launch(process.env.ISLAND_CHROMIUM_PATH ? { executablePath: process.env.ISLAND_CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:4173/preview/index.html');
await page.waitForTimeout(1200);
const state = (id) => page.evaluate((x) => window.__islandPreview.hass.states[x].state, id);
const secondary = (_tag, i) => state(i === 1 ? 'light.bedroom_lamp' : 'lock.front_door');
const before = await secondary('island-light-card', 1);
await page.locator('island-light-card').nth(1).locator('.background, island-state-item').first().click();
await page.waitForTimeout(400);
const after = await secondary('island-light-card', 1);
await page.locator('island-lock-card').locator('island-button').first().click();
await page.waitForTimeout(1300);
const lock = await secondary('island-lock-card');
// 底部导航：切到手机宽度，点“家务”，检查地址和页面内容是否换了
await page.click('[data-width=phone]');
await page.waitForTimeout(1200);
await page.locator('island-navbar-card a', { hasText: '家务' }).click();
await page.waitForTimeout(1200);
const nav = { url: page.url(), hasVacuum: await page.locator('island-vacuum-card').count(), hasFan: await page.locator('island-fan-card').count() };
console.log(JSON.stringify({ before, after, lock, nav, errors }, null, 1));
await browser.close();
