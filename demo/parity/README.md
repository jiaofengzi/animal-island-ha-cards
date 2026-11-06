# Full Mushroom parity comparison preview

This replaces the public 23-household-use-case comparison. It lists exactly 18 current cards (no Legacy Template), Template Badge separately, and all 11 chip types as children of a Chips card. It does not mount a fake Home Assistant DOM or present React drawings as upstream or fork runtime.

## Build

`node scripts/build-parity-preview.mjs` builds `_parity-preview/` without changing the separate `_parity/` HA module build. It bundles the installed Animal Island React shell and strips font declarations and imports. No downloaded font, CDN stylesheet, or script is needed.

`PARITY_STATIC_ONLY=1 node tests/parity-preview/check.mjs` checks matrix counts, nested chips, type mapping and absence of remote fonts.

`node tests/parity-preview/check.mjs` additionally checks 1440px, 390px and 320px rendering, filter selections and keyboard dropdown closing, and captures each of the 30 rows plus full-page screenshots into `tests/parity-preview/artifacts/`. Uses the installed Playwright browser by default; set `ISLAND_CHROMIUM_PATH` only for an explicit executable override. Local browser execution is currently blocked by the environment, so run browser QA in CI. These tests do not validate HA behavior.

## Fixtures

`fixtures.json` contains the complete official v5.2.3 matrix metadata, shared contracts, and source conflicts. Its synthetic entities/configuration come from the canonical `scripts/ha-parity/fixtures.mjs`. Keep changes synchronized with that file; do not edit configs independently. No user entities or credentials belong here.

## Runtime evidence integration

The real HA workflow writes `ha-evidence/runtime-evidence.json` and `ha-evidence/runtime/`. After review of a successful run, copy the manifest to this directory and runtime images into `demo/parity/runtime/`, then rebuild. Do not fabricate PNGs or mark pending cases as passed.

Manifest example:

```json
{
  "schemaVersion": 1,
  "status": "captured-not-parity-approved",
  "host": "isolated Home Assistant",
  "haVersion": "2026.9.0",
  "generatedAt": "ISO date",
  "cases": {
    "card:light": {
      "original": "runtime/card-light-original.png",
      "island": "runtime/card-light-island.png",
      "state": "synthetic fixture",
      "host": "isolated Home Assistant",
      "status": "captured",
      "grid": "Sections columns 6; rows auto"
    }
  }
}
```

Each side must have a screenshot or a documented `expected-blank` result, and host plus an explicit state field must be present to display a runtime pair. The preview displays capture commit, date, full fixtureStates, per-side config and dimensions from the real-HA manifest. The manifest does not need a top-level status; absent status is labeled captured, with test results deferred to the CI report. Relative local paths only; missing PNGs fail the build. Zero-size Empty/Spacer cases use null paths, status `expected-blank`, and a per-side measured `dimensions` entry. A blank layout can have nonzero geometry. These are presented as intentional blank layout results, not pending screenshots. A mixed image/blank pair is supported per side. Unexpected zero-size cases remain unresolved and must not be replaced with fake images. Screenshots prove only appearance at the recorded state, not actions, services, editors, template lifecycles or full sizing parity.

When no paired evidence exists, the left side uses only a matching version-pinned official image if one is available. It explicitly identifies unknown source state/host and does not follow the state filter. The right side displays an honest pending-evidence placeholder. State filtering selects coverage requirements, not simulated runtime states.

## Publication boundary

The parent may publish `_parity-preview/` after review. The old `_acceptance/` is legacy and should not be called full parity. This preview does not claim that all acceptance checks or real HA integration pass. Current manifest is pending with zero runtime pairs.

## Assemble a reviewed real-HA run

Run in the exact tested checkout, with the downloaded `ha-evidence/` artifact directory:

```sh
GITHUB_SHA=<exact tested 40-character commit> node scripts/assemble-parity-preview.mjs
```

For a different artifact location, set `PARITY_EVIDENCE_DIR`. The assembler does not deploy anything or change the checked-in fixture/evidence files. It validates inputs first, builds using temporary staging, and replaces only generated `_parity-preview/` on success.

The gate requires executed, nonempty passing results for exactly every test listed by this checkout's Playwright HA configuration. It rejects failures, skips, flaky/retried failures, missing tests, commit/version mismatch, missing fixture states, stale configs, unexpected modules, missing dimensions, and malformed or misnamed PNGs. It requires 28 pairs and two explicit Empty/Spacer `expected-blank` results with null image paths. Intentional blank layout may still have a nonzero box; the recorded dimensions remain visible. Listing tests does not launch a browser.

Only `runtime-evidence.json`, exact referenced `runtime/*.png`, and a newly generated safe `validation-summary.json` enter the preview. No raw Playwright report, errors, failure images, storage, auth, or secrets are copied. Manifest fields are rebuilt from validated allowlists. Existing fixtures and source licenses are included by the normal preview builder.

The page states the number of passing representative aggregate tests and executions. It explicitly states that the 1,131 acceptance cases are not individually mapped as passed (current mapped count 0), and synthetic states do not prove hardware service effects. Never publish a failed run as successful evidence.

Run validator negative tests without a browser:

```sh
node --test tests/parity-preview/assembly.test.mjs
```

Actual per-component entityStates and computedStyles are validated and published through bounded field allowlists. A no-entity module has explicit state null, displayed as no entity state rather than missing evidence. Missing state fields fail the gate.

A successful assembly also creates `downloads/animal-island-ha-cards.zip` and `downloads/SHA256SUMS`. The ZIP contains only the fork JS, LICENSE, NOTICE (full third-party attribution), THIRD_PARTY_NOTICES.md, dependency licenses, transform-manifest.json, and manual INSTALL.md. It does not include the upstream original runtime, HA storage, or authentication data. Before packaging, the assembler verifies JS bytes/SHA-256 against the transform manifest and checks all recorded build-input hashes against the current checkout. Stale or mismatched dist files stop assembly. The page links the full package, not an attribution-free bare JS file; no HACS release is implied.

## Actual HA motion evidence

The optional `ha-evidence/motion-evidence.json` must match the tested commit and HA version, with host `Home Assistant`, status `captured`, `authenticatedSyntheticDashboard: true`, the exact video path `motion/island-motion.webm`, actual width/height, durationSeconds (0–60), and observed codes from `press-scale`, `release-bounce`, `pointer-ripple`, `slider-sync`, `backend-state-change`, `reduced-motion`. Only the declared, EBML-signature checked WebM is copied (maximum 32 MiB). A declared video that is missing fails assembly. No login pages, storage, traces or broad video directory copies are accepted.

The preview labels this as actual authenticated synthetic HA recording, uses native playback controls, no autoplay or looping, and preload none. It does not simulate animations using React cards. Images reserve aspect-ratio space from measured runtime dimensions or the actual official PNG dimensions; the placeholder is static and does not imply device loading or success. CI checks image load does not change each comparison row's height.
