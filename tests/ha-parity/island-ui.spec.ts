/* eslint-disable @typescript-eslint/no-explicit-any -- Exercise actual HA custom elements and hass runtime APIs. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
let auth: any;
test.beforeAll(async () => { auth = JSON.parse(await readFile('.ha-secrets/auth.json', 'utf8')); });
test.beforeEach(async ({ page, request }) => {
  const response = await request.post('/api/states/light.island_color_regression', {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    data: { state: 'on', attributes: { friendly_name: 'Color regression', supported_color_modes: ['rgb'], color_mode: 'rgb', rgb_color: [255, 0, 0], brightness: 255, supported_features: 0 } },
  });
  expect(response.ok()).toBeTruthy();
  await page.addInitScript(value => localStorage.setItem('hassTokens', JSON.stringify(value)), auth);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lovelace/sections');
  await expect(page.locator('island-entity-card').first()).toBeVisible();
});
async function mountNav(page: Page, paths: string[]) {
  await page.evaluate(async paths => {
    const card: any = document.createElement('island-navbar-card');
    card.id = 'island-nav-regression';
    card.setConfig({ show: 'always', items: paths.map((path, i) => ({ name: i ? 'Sections' : 'Home', path })) });
    document.body.append(card);
    await card.updateComplete;
  }, paths);
  return page.locator('#island-nav-regression');
}
test('navbar exact child wins over parent; Home click navigates and browser Back restores selection', async ({ page }) => {
  const nav = await mountNav(page, ['/lovelace', '/lovelace/sections']);
  await expect(nav.locator('a.active')).toHaveCount(1);
  await expect(nav.locator('a').nth(1)).toHaveAttribute('aria-current', 'page');
  // Record the real router event synchronously, before HA may canonicalize its default view.
  await page.evaluate(() => {
    (window as any).__islandDestinations = [];
    window.addEventListener('location-changed', () => (window as any).__islandDestinations.push(location.pathname));
  });
  await nav.locator('a').first().click();
  await expect.poll(() => page.evaluate(() => (window as any).__islandDestinations.includes('/lovelace'))).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/lovelace\/sections$/);
  await expect(nav.locator('a.active')).toHaveCount(1);
  await expect(nav.locator('a').nth(1)).toHaveAttribute('aria-current', 'page');
});
test('navbar unmatched path does not suppress first destination; repeated click and Back preserve history', async ({ page }) => {
  const nav = await mountNav(page, ['/lovelace/masonry']);
  await expect(nav.locator('a.active')).toHaveCount(0);
  await nav.locator('a').click();
  await expect(page).toHaveURL(/\/lovelace\/masonry$/);
  await expect(nav.locator('a')).toHaveAttribute('aria-current', 'page');
  const historyLength = await page.evaluate(() => history.length);
  await nav.locator('a').click();
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await page.goBack();
  await expect(page).toHaveURL(/\/lovelace\/sections$/);
  await expect(nav.locator('a.active')).toHaveCount(0);
});
async function mountColorCard(page: Page, id: string, kind: string, config: Record<string, unknown>) {
  await page.evaluate(async ({ id, kind, config }) => {
    const card: any = document.createElement(`island-${kind}-card`);
    card.id = id;
    card.style.cssText = 'display:block;width:320px;position:relative;z-index:10';
    card.setConfig({ type: `custom:island-${kind}-card`, entity: 'light.island_color_regression', ...config });
    card.hass = (document.querySelector('home-assistant') as any).hass;
    document.body.append(card);
    await card.updateComplete;
  }, { id, kind, config });
  await expect(page.locator(`#${id} island-state-icon .tile`)).toBeVisible();
}
async function colorFacts(page: Page, id: string) {
  return page.locator(`#${id} island-state-icon`).evaluate(icon => {
    const tile = icon.shadowRoot!.querySelector('.tile')!;
    const probe = document.createElement('span');
    probe.style.color = 'var(--icon-color)';
    icon.shadowRoot!.append(probe);
    const mapped = getComputedStyle(probe).color;
    probe.remove();
    return { tile: getComputedStyle(tile).backgroundColor, mapped, inline: (icon.parentElement as HTMLElement).style.getPropertyValue('--icon-color') };
  });
}
test('illustration honors configured icon_color and use_light_color including live config changes', async ({ page }) => {
  await mountColorCard(page, 'color-default', 'light', { use_light_color: false });
  await mountColorCard(page, 'color-rgb', 'light', { use_light_color: true });
  await mountColorCard(page, 'color-purple', 'light', { use_light_color: false, icon_color: 'purple' });
  await mountColorCard(page, 'color-entity', 'entity', { icon_color: 'blue' });
  for (const id of ['color-default', 'color-rgb', 'color-purple', 'color-entity']) {
    await expect.poll(async () => { const f = await colorFacts(page, id); return f.tile === f.mapped; }, `${id} tile must consume the upstream mapped color`).toBe(true);
  }
  const defaults = await colorFacts(page, 'color-default');
  const rgb = await colorFacts(page, 'color-rgb');
  const purple = await colorFacts(page, 'color-purple');
  const entity = await colorFacts(page, 'color-entity');
  expect(defaults.inline).toBe('');
  expect(rgb.inline).not.toBe('');
  expect(purple.inline).not.toBe('');
  expect(entity.inline).not.toBe('');
  expect(rgb.tile).not.toBe(defaults.tile);
  expect(purple.tile).not.toBe(rgb.tile);
  expect(entity.tile).not.toBe(purple.tile);
  // Flip the same live RGB card back to configured purple, then back to RGB.
  for (const useLightColor of [false, true]) {
    await page.locator('#color-rgb').evaluate(async (card: any, useLightColor) => {
      card.setConfig({ type: 'custom:island-light-card', entity: 'light.island_color_regression', icon_color: 'purple', use_light_color: useLightColor });
      await card.updateComplete;
    }, useLightColor);
    await expect.poll(async () => (await colorFacts(page, 'color-rgb')).tile).toBe(useLightColor ? rgb.tile : purple.tile);
  }
});
test('standalone illustrations retain palette fallback without upstream color', async ({ page }) => {
  await page.evaluate(async () => {
    const icon: any = document.createElement('island-state-icon');
    icon.id = 'color-fallback'; icon.icon = 'island:house';
    document.body.append(icon); await icon.updateComplete;
  });
  await expect(page.locator('#color-fallback .tile')).toBeVisible();
  const facts = await page.locator('#color-fallback').evaluate(icon => {
    const tile = icon.shadowRoot!.querySelector('.tile')!;
    return { upstream: getComputedStyle(icon).getPropertyValue('--icon-color').trim(), background: getComputedStyle(tile).backgroundColor };
  });
  expect(facts.upstream).toBe('');
  expect(facts.background).not.toBe('rgba(0, 0, 0, 0)');
});
