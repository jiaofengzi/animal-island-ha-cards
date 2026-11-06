# Real Home Assistant validation

## Current evidence status

Two real GitHub-hosted runs have completed on official HA 2026.9.0. Run 42257254489 passed 1/15 tests; run 42259051527 passed 10/15. The second run passed server templates, service action, editor/default lifecycle comparison, paired capture, all 128 sizing cases, direct Sections geometry, mobile and unavailable-state checks. It failed two smoke getter checks, two dialog wrapper visibility checks and one incorrectly constrained 220px stack test. Those test-harness corrections are awaiting the next run; no all-green claim is made.

The next suite discovers 18 tests, including native dark theme propagation and all 18 cards in independently measured narrow containers. Local lint and static discovery pass. Local browser tests were not run; real runtime results come from GitHub-hosted CI.

The baseline is Mushroom v5.2.3. Both untouched original and namespaced island fork are loaded as actual Lovelace module resources in the same official HA frontend. The pinned container is `ghcr.io/home-assistant/home-assistant:2026.9.0`, corresponding to the [official September release](https://www.home-assistant.io/blog/2026/09/02/release-20269/). The pull must succeed; no fallback or floating version is used. CI records the pulled digest and checks `/api/config` reports exactly 2026.9.0.

## Isolation and privacy

A fresh config, owner account and random password are created on the ephemeral runner. HTTP binds only to 127.0.0.1. No real home, preexisting credentials, cloud account, or household entities are connected. Credentials stay in `.ha-secrets` and HA's ephemeral config. They are not printed, uploaded, traced or included in screenshots. The final cleanup removes the container and secrets even after failure. Never publish the runtime config or raw browser storage.

Synthetic entities are registered through the actual HA REST state API. They exercise HA localization, frontend entity rendering and server-side WebSocket template subscriptions. They **do not implement physical integrations or their service side effects**. The service action test instead uses a real `input_boolean` integration. Native HA handles the action and more-info dialog; no replacement `hass-action` handler is installed.

## Tests and limits

- Registration/render attachment of 18 cards, Template Badge and 11 chips in real Sections and Masonry dashboards.
- Live server template state updates across both cards, badges and chips.
- Default fixture config, sizing method return values, all 18 card editors and disconnect/reconnect comparison. The next run adds Template Badge and all 11 chip editor configuration checks, plus conditional-chip visibility transitions from actual backend states.
- A real service action through the entity card, native more-info dialog, hold/double-tap, and unavailable light rendering.
- Per-test uncaught frontend exception assertions, error-card checks, and visible content host checks. Rich showcase fixture options expose supported controls; default semantics are checked independently.
- 128 sizing formula cases against the research oracle and original/fork runtime methods. Older-version branches are checked statically; live HA uses its actual >=2026.9 branch.
- Independent live-HA 220/320/480px containers for all 18 cards check actual surface widths and horizontal overflow; mobile viewport capture. Separate directly placed Sections cards exercise actual 6/12-column and 1/2/auto-row layout with height/width assertions.
- Side-by-side whole-dashboard images and individual module images when nonzero-sized. Empty and spacer components may intentionally have no image.

This representative suite does **not** verify all 1,131 acceptance entries or all 392 HA-required entries. `summary.json` explicitly reports zero individually mapped acceptance passes, even when representative tests pass. Full option combinations, full action combinations and touch/keyboard parity, all editor control changes, feature-specific service contracts, min/max layouts and subscription leak detection remain gaps. Sizing method equality is not a claim of exhaustive pixel geometry parity.

## Execution

Run `npm ci`, `node scripts/build-parity.mjs`, and `node scripts/ha-parity/prepare.mjs`. Start the pinned official container with the generated `.ha-runtime` directory mounted at `/config`, port bound to loopback. Run `node scripts/ha-parity/bootstrap.mjs`, then `npx playwright test --config tests/ha-parity/playwright.config.ts` in a permitted browser environment. The workflow automates these steps and `node scripts/ha-parity/report.mjs`.

Only `ha-evidence/` is uploaded: runtime version, image digest, sanitized test results, screenshots, coverage limitations and optional runtime-evidence manifest. Test artifacts must be reviewed before being presented as verified evidence. `runtime-evidence.json` captures what was rendered; it is not by itself a parity approval. Preview publishers can copy the manifest and `runtime/` images without including secrets.
