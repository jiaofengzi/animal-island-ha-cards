import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceHarness, anchors } from './source-harness.mjs';
function navbar(path, paths) {
  const h = sourceHarness(path); h.load('./navbar');
  const card = new (h.registry.get('island-navbar-card'))();
  card.setConfig({ show: 'always', items: paths.map((path, index) => ({ name: String(index), path })) });
  card.connectedCallback();
  return { ...h, card };
}
const active = card => anchors(card.render()).map(a => a.values[0] === 'active');
function click(card, index) {
  let prevented = false;
  anchors(card.render())[index].values.find(v => typeof v === 'function')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
}
test('exact child wins over parent; Home is navigable and repeated exact click is suppressed', () => {
  const h = navbar('/lovelace/living', ['/lovelace', '/lovelace/living']);
  assert.deepEqual(active(h.card), [false, true]);
  click(h.card, 0); assert.deepEqual(h.navigations, ['/lovelace']);
  assert.deepEqual(active(h.card), [true, false]);
  click(h.card, 0); assert.equal(h.navigations.length, 1);
});
test('unmatched route has no active fallback and first item remains navigable', () => {
  const h = navbar('/lovelace/unlisted', ['/lovelace/home', '/lovelace/living']);
  assert.deepEqual(active(h.card), [false, false]);
  click(h.card, 0); assert.deepEqual(h.navigations, ['/lovelace/home']);
});
test('most-specific parent highlights but still navigates to its exact destination', () => {
  const h = navbar('/lovelace/living/detail', ['/lovelace', '/lovelace/living']);
  assert.deepEqual(active(h.card), [false, true]);
  click(h.card, 1); assert.deepEqual(h.navigations, ['/lovelace/living']);
});
test('popstate refreshes selection and disconnect removes navigation listeners', () => {
  const h = navbar('/lovelace/home', ['/lovelace/home', '/lovelace/living']);
  click(h.card, 1);
  h.location.href = 'https://example.test/lovelace/home'; h.window.dispatchEvent({ type: 'popstate' });
  assert.deepEqual(active(h.card), [true, false]);
  h.card.disconnectedCallback();
  h.location.href = 'https://example.test/lovelace/living'; h.window.dispatchEvent({ type: 'popstate' });
  assert.deepEqual(active(h.card), [true, false]);
});
test('query and hash destinations are exact and path prefixes respect segment boundaries', () => {
  const h = navbar('/lovelace/living-room', ['/lovelace/living', '/lovelace/home?tab=2#light']);
  assert.deepEqual(active(h.card), [false, false]);
  click(h.card, 1); assert.deepEqual(active(h.card), [false, true]);
  click(h.card, 1); assert.equal(h.navigations.length, 1);
});
test('illustration consumes upstream color with palette fallback, never unconditional entity RGB', () => {
  const h = sourceHarness(); const { IslandStateIcon } = h.load('./state-icon');
  const icon = new IslandStateIcon(); icon.icon = 'mdi:lightbulb';
  icon.stateObj = { entity_id: 'light.test', state: 'on', attributes: { rgb_color: [255, 0, 0] } };
  icon.willUpdate();
  assert.equal(icon._tileColor(), 'var(--icon-color, #ff9a3c)');
  assert.equal(icon.render().values[0], icon._tileColor());
  icon.stateObj.attributes.rgb_color = [0, 0, 255];
  assert.equal(icon._tileColor(), 'var(--icon-color, #ff9a3c)');
  icon.stateObj = undefined; icon.icon = 'mdi:unknown-icon'; icon.willUpdate();
  assert.match(icon._tileColor(), /^var\(--icon-color, #[a-f0-9]{6}\)$/);
});
