// Execute the complete TypeScript source with only Lit/DOM presentation stubbed.
// These unit tests do not claim browser CSS or Home Assistant integration coverage.
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
export function sourceHarness(path = '/lovelace/sections') {
  const registry = new Map(), listeners = new Map(), navigations = [];
  const location = new URL(path, 'https://example.test');
  const template = (strings, ...values) => ({ strings, values });
  class LitElement {
    constructor() { this.dataset = {}; this.attributes = new Set(); }
    toggleAttribute(name, value) { if (value) this.attributes.add(name); else this.attributes.delete(name); }
    hasAttribute(name) { return this.attributes.has(name); }
    connectedCallback() {}
    disconnectedCallback() {}
  }
  const window = {
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); },
  };
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    if (name === 'lit') return { LitElement, html: template, css: template, unsafeCSS: x => x, nothing: null };
    if (name === 'lit/directives/unsafe-svg.js') return { unsafeSVG: x => x };
    if (name === './fonts') return { ISLAND_FONT_STACK: 'sans-serif' };
    if (name === './globals') return { registerCustomCard() {} };
    const source = new URL(`../../src/island/${name.replace('./', '')}.ts`, import.meta.url);
    const js = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    cache.set(name, exports);
    vm.runInNewContext(js, {
      exports, require: load, URL, location, window,
      history: { pushState(_state, _title, path) { navigations.push(path); location.href = new URL(path, location).href; } },
      CustomEvent: class { constructor(type) { this.type = type; } },
      customElements: { get: name => registry.get(name), define: (name, value) => registry.set(name, value) },
    }, { filename: source.pathname });
    return exports;
  }
  return { load, registry, location, window, navigations };
}
export function anchors(template, result = []) {
  if (!template || typeof template !== 'object') return result;
  if (Array.isArray(template)) { template.forEach(x => anchors(x, result)); return result; }
  if (template.strings?.[0].includes('<a class="item ')) result.push(template);
  template.values?.forEach(x => anchors(x, result));
  return result;
}
