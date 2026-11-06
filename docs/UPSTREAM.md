# Upstream provenance and reproducible fork

This implementation is a visual fork of [Mushroom](https://github.com/piitaya/lovelace-mushroom), by Paul Bottein and contributors, version **5.2.3**, pinned to Git tree **d8a90ffff1b217fbbf9cb8210ee672be99596231**. It uses Lit, not React. Animal Island supplies the visual design language; the runtime does not render the React animal-island-ui component library.

## Reproduce

Run `npm ci`, then `npm run build:parity`. The lockfile pins installed packages. Source from `vendor/mushroom-v5.2.3` is included locally, with its upstream tree inventory. No network source fetch occurs during builds.

The build verifies every included upstream blob with Git's SHA-1 blob algorithm, requires every upstream src file, and derives an isolated fork in `.cache/parity-island`. It builds:

- `_parity/mushroom-original.js`: unmodified official source bundled locally, not a claim of byte-identical official release packaging.
- `dist/island-ha-cards.js` and identical `_parity/island-ha-cards.js`: independently registered fork.
- `dist/transform-manifest.json` and `_parity/transform-manifest.json`: upstream blob hashes, source SHA-256, per-file modification classes, bundle hashes, dependency inputs and audits.

## Exact modification policy

1. Change all `mushroom-` identifiers, HTML tags, selectors, configuration/editor strings and private CSS custom properties to `island-`. Change `PREFIX_NAME` to `island`. Home Assistant's `ha-*` and `hui-*` tags remain untouched.
2. Append `islandSkin(relativeSourcePath)` to static style getter return values and static style property initializers using the TypeScript AST. Original style expressions remain intact and execute before the new CSS.
3. Identify the fork in its startup console banner.
4. In only the modern Template Card and Template Badge, mirror Home Assistant's dark-mode flag into a presentation-only data-island-theme attribute at the start of the existing willUpdate method. This allows the scoped skin to follow HA theme changes; it changes no service, action, config, state or grid calculation.

Business logic, conditions, actions, features, template subscriptions, editors, config validation and grid sizing remain upstream code. No duplicate-definition guards are introduced; both modules own separate custom-element names. The build does not import external fonts or CDNs.

Inventory is 18 current cards, the separately retained legacy Template Card, one Template Badge and all 11 chips. This is a source/registration audit, not proof of runtime behavior in a live Home Assistant server.

## License interpretation and limitations

The pinned repository's root LICENSE is Apache License 2.0 and is reproduced verbatim. Its package.json declares ISC, an upstream metadata inconsistency. We retain both original files and do not reinterpret the entire source as ISC. No upstream NOTICE file exists in the pinned tree. Copied Home Assistant helper files retain their inline notices, including Apache-2.0 references.

See `THIRD_PARTY_NOTICES.md` for scope. The old MIT LICENSE remains applicable to the project's original files, not upstream vendored code. Generated fork sources are modified files; this document, the build script, manifest, and bundle banners explicitly identify those changes.
