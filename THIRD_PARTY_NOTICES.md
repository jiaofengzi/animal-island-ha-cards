Animal Island HA Cards - public preview

Actual animal-island-ui 3.0.0 React components are bundled, from https://github.com/guokaigdg/animal-island-ui (MIT; copyright 2026 guokaigdg). All component import APIs are from the public package root. Upstream component CSS is included; only @font-face definitions and bundled font assets are excluded to provide a font-free bundle. CSS :root token scope is also made available as :host for HA Shadow DOM. No font CDN requests are made.

Naive Icons 1.14.0 is bundled through its public React exports (MIT). No emoji or hand-drawn icon substitutes are used in the rebuilt controls. Nunito and Noto Sans SC remain optional system-installed font preferences, with system fallbacks.

React 18.3.1, React DOM 18.3.1, Scheduler 0.23.2, classnames 2.5.1 and their included production dependencies are MIT licensed. dayjs 1.11.23 is also an upstream MIT dependency. Full notices are retained in licenses/. All required runtime code is locally bundled; no external npm runtime or CDN is used. docs/dependency-licenses.json records the locked dependency inventory.

The acceptance-only demo includes original screenshot assets from piitaya/lovelace-mushroom v5.2.3, Apache-2.0. Those images are unmodified and their fixed URLs/blob SHAs are recorded in demo/reference/image-sources.json. Its original LICENSE is retained in demo/reference/LICENSE and the acceptance output licenses/Mushroom-LICENSE. Mushroom is a comparison reference, not an affiliation or endorsement. The production HA card bundle does not contain Mushroom code or those screenshots.

This project has no affiliation with Nintendo or any game publisher.
