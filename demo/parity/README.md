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

Each side must have a screenshot or a documented `expected-blank` result, and host/state must be present to display a runtime pair. The preview displays capture commit, date, full fixtureStates, per-side config and dimensions from the real-HA manifest. The manifest does not need a top-level status; absent status is labeled captured, with test results deferred to the CI report. Relative local paths only; missing PNGs fail the build. Zero-size Empty/Spacer cases use null paths, status `expected-blank`, and a per-side `dimensions` entry containing null or a box with width/height below 1px. These are presented as intentional blank layout results, not pending screenshots. A mixed image/blank pair is supported per side. Unexpected zero-size cases remain unresolved and must not be replaced with fake images. Screenshots prove only appearance at the recorded state, not actions, services, editors, template lifecycles or full sizing parity.

When no paired evidence exists, the left side uses only a matching version-pinned official image if one is available. It explicitly identifies unknown source state/host and does not follow the state filter. The right side displays an honest pending-evidence placeholder. State filtering selects coverage requirements, not simulated runtime states.

## Publication boundary

The parent may publish `_parity-preview/` after review. The old `_acceptance/` is legacy and should not be called full parity. This preview does not claim that all acceptance checks or real HA integration pass. Current manifest is pending with zero runtime pairs.
