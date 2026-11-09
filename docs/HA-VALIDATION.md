> **历史文档**：以下是 v0.3 时期“官方 Mushroom × fork”真实 HA 对照工作流的记录。v0.4 起卡片代码改为自行维护，该工作流与相关脚本已移除，内容仅供参考。

# Real Home Assistant validation

## Current evidence status

The latest baseline, run 42261250358 at commit `18f212f10b07e95272e91dc0b3b49288a56938b5`, passed all 18 real-HA aggregate tests. Earlier runs passed 1/15, 10/15 and 15/18 while test-harness issues were corrected. The baseline covers server templates, services, native more-info/hold/double-tap, card/Badge/chip editor contracts, all cards at 220/320/480px, mobile, paired capture, 128 sizing cases, direct Sections geometry, unavailable states, dark theme propagation and conditional-chip visibility. Spacer's absent editor is explicitly checked against upstream.

The current suite contains 22 aggregate checks, including four motion scenarios. Per-commit CI results and the published validation summary determine which checks passed, failed or were skipped. Local browser tests were not run; real runtime results come from GitHub-hosted CI.

The baseline is Mushroom v5.2.3. Both untouched original and namespaced island fork are loaded as actual Lovelace module resources in the same official HA frontend. The pinned container is `ghcr.io/home-assistant/home-assistant:2026.9.0`, corresponding to the [official September release](https://www.home-assistant.io/blog/2026/09/02/release-20269/). The pull must succeed; no fallback or floating version is used. CI records the pulled digest and checks `/api/config` reports exactly 2026.9.0.

## Isolation and privacy

A fresh config, owner account and random password are created on the ephemeral runner. HTTP binds only to 127.0.0.1. No real home, preexisting credentials, cloud account, or household entities are connected. Credentials stay in `.ha-secrets` and HA's ephemeral config. They are not printed, uploaded, traced or included in screenshots. The final cleanup removes the container and secrets even after failure. Never publish the runtime config or raw browser storage.

Synthetic entities are registered through the actual HA REST state API. They exercise HA localization, frontend entity rendering and server-side WebSocket template subscriptions. They **do not implement physical integrations or their service side effects**. The service action test instead uses a real `input_boolean` integration. Native HA handles the action and more-info dialog; no replacement `hass-action` handler is installed.

## Tests and limits

- Registration/render attachment of 18 cards, Template Badge and 11 chips in real Sections and Masonry dashboards.
- Live server template state updates across both cards, badges and chips.
- Default fixture config, sizing method return values, all 18 card editors and disconnect/reconnect comparison. Template Badge and 10 chip editors must accept their fixture configs; Spacer must expose no editor. Conditional-chip visibility transitions use actual backend states.
- A real service action through the entity card, native more-info dialog, hold/double-tap, and unavailable light rendering.
- Per-test uncaught frontend exception assertions, error-card checks, and visible content host checks. Rich showcase fixture options expose supported controls; default semantics are checked independently.
- 128 sizing formula cases against the research oracle and original/fork runtime methods. Older-version branches are checked statically; live HA uses its actual >=2026.9 branch.
- Independent live-HA 220/320/480px containers for all 18 cards check actual surface widths and horizontal overflow; mobile viewport capture. Separate directly placed Sections cards exercise actual 6/12-column and 1/2/auto-row layout with height/width assertions.
- Side-by-side whole-dashboard images and individual module images when nonzero-sized. Empty and spacer components may intentionally have no image.

This representative suite does **not** verify all 1,131 acceptance entries or all 392 HA-required entries. `summary.json` explicitly reports zero individually mapped acceptance passes, even when representative tests pass. Full option combinations, full action combinations and touch/keyboard parity, all editor control changes, feature-specific service contracts, min/max layouts and subscription leak detection remain gaps. Sizing method equality is not a claim of exhaustive pixel geometry parity.

## Execution

Run `npm ci`, `node scripts/build-parity.mjs`, and `node scripts/ha-parity/prepare.mjs`. Start the pinned official container with the generated `.ha-runtime` directory mounted at `/config`, port bound to loopback. Run `node scripts/ha-parity/bootstrap.mjs`, then `npx playwright test --config tests/ha-parity/playwright.config.ts` in a permitted browser environment. The workflow automates these steps and `node scripts/ha-parity/report.mjs`.

Only `ha-evidence/` is uploaded: runtime version, image digest, sanitized test results, screenshots, coverage limitations and optional runtime-evidence manifest. Test artifacts must be reviewed before being presented as verified evidence. `runtime-evidence.json` captures what was rendered; it is not by itself a parity approval. Preview publishers can copy the manifest and `runtime/` images without including secrets.

## Verified baseline and motion checks

Run 42261250358 (commit `18f212f10b07e95272e91dc0b3b49288a56938b5`) passed all 18 real-HA aggregate tests. Its manifest contains all 30 modules, 56 screenshots for 28 visible pairs and exactly two expected blanks (Empty and Spacer). All 128 sizing cases passed. Actual computed styles confirm light backgrounds rgb(247,243,223), dark modern Template/Badge backgrounds rgb(53,47,37), 20px card and 50px badge radii. The preview's separate browser check failed afterward, so this run did not publish Pages.

Four motion scenarios bring the suite to 22 aggregate tests. Their per-commit status is recorded by CI, rather than implied by this document. They use a dedicated live HA view with real input_boolean/input_number integrations. They check one service call per pointer/keyboard/touch operation, pointer-origin ripple and 96% scale, disabled/reduced-motion behavior, disconnect cleanup, and actual slider label/fill/backend synchronization. They do not insert synthetic service handlers or animate fabricated device readings.

The motion video is recorded from the real authenticated synthetic dashboard. A raw recording stays outside artifact directories; ffmpeg trims it to the verified dashboard-only time window. ffprobe validates geometry and duration. First/middle/last review frames are emitted for human inspection before publishing; the public video must be allowlisted separately. No login, trace, token, raw browser storage, or raw recording is included in public artifacts. Video illustrates interaction, while service correctness is established by tests rather than by appearance.

The HA suite runs headed Chromium on GitHub-hosted Ubuntu under Xvfb (`HA_HEADED=1`). The keyboard cleanup check requires an actual browser window blur and loss of document focus when another tab is brought forward. This is browser focus on a virtual display, not a physical desktop, and no synthetic blur event substitutes for it. Headless run 42273619629 passed 21/22 checks but did not emit that window blur; its focus prerequisite failed, so it was not published.

Playwright forces Chromium focus emulation by default, including headed runs. The actual blur scenario disables that override through CDP before the keyboard gesture, then switches browser tabs and requires an `isTrusted` native blur plus `document.hasFocus() === false`. This changes only test automation focus emulation, not Home Assistant or component behavior.
