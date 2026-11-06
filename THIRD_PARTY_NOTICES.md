# Third-party notices

## Mushroom 5.2.3

Copyright Paul Bottein and Mushroom contributors. Source: https://github.com/piitaya/lovelace-mushroom

Pinned Git tree: d8a90ffff1b217fbbf9cb8210ee672be99596231.

Vendored source and license: vendor/mushroom-v5.2.3/. Root LICENSE is Apache-2.0, retained verbatim. Upstream package.json says ISC; this inconsistency is preserved and documented, not silently resolved. No upstream NOTICE file was present in the pinned Git tree.

The independently named Island fork changes namespace, appends visual CSS, and labels its banner. All generated fork files derive from this source; see docs/UPSTREAM.md and dist/transform-manifest.json. Upstream HA helpers retain their original notices.

## Original project and visual work

The root MIT LICENSE remains in place for original project work. It does not replace upstream licenses. The Animal Island design tokens and styling are based on the MIT-licensed animal-island-ui design system: https://github.com/guokaigdg/animal-island-ui. No Nintendo assets or affiliation are claimed.

## Bundled dependencies

Dependency versions and license metadata are retained in package-lock.json and installed package manifests. esbuild retains legal comments in emitted bundles. Lit, @mdi/js, color-name, culori, hammerjs, home-assistant-js-websocket, intl-messageformat, js-yaml, memoize-one, object-hash, sortablejs and superstruct are upstream runtime dependencies. See package-lock.json for exact resolved versions.

## React preview shell and legacy concept implementation

The comparison website and the superseded 23-case concept implementation bundle animal-island-ui 3.0.0 React components from https://github.com/guokaigdg/animal-island-ui (MIT; copyright 2026 guokaigdg), Naive Icons 1.14.0, React 18.3.1, React DOM 18.3.1, Scheduler, classnames and production dependencies under their licenses. The actual current HA fork is Lit, not React. Full original notices remain in licenses/.

Only visual design tokens/styles are translated into the Lit fork. No font files, @font-face declarations or font CDN requests are included by this project. Nunito and Noto Sans SC are optional system-installed preferences with system fallbacks. HA-hosted user/entity icons retain HA semantics.

The comparison preview may include unmodified official Mushroom v5.2.3 screenshot assets under Apache-2.0; fixed URLs/blob SHAs are recorded in demo/reference/image-sources.json, and its license is retained in demo/reference/LICENSE. Runtime comparison screenshots, when present, are generated in an isolated Home Assistant instance with synthetic entities. The current production HA bundle does contain modified Mushroom code; screenshots are preview assets, not runtime card dependencies.

This project has no affiliation with Mushroom, Animal Island UI, Nintendo or any game publisher.
