# Animal Island skin for the Mushroom 5.2.3 Lit fork

## Implementation and provenance

`src/skin/styles.ts` exports `islandSkin(sourcePath)` (also as default). The build appends it **after** original component CSS, including both static getters and static properties. This is a Lit/CSS visual translation of the installed `animal-island-ui` package, not usage of its React components. Original card logic, selectors, event handlers, services, subscriptions, editors, custom configuration, and HA feature rendering are retained.

The installed package's `dist/index.css` was inspected. Its actual Card uses `#f7f3df`, 20px radius, 16px/24px padding, no shadow; runtime root tokens use a different `#f8f8f0` generic background. This fork deliberately follows Card. Accent fills copy pink `#f8a6b2`, purple `#b77dee`, blue `#889df0`, yellow `#f7cd67`, teal `#82d5bb`, green `#8ac68a`. Foreground on saturated icons is dark brown for readability, rather than the package's sometimes low-contrast white. Controls are 50px pills, 45px tall when unconstrained. Inline/section layouts keep their original control heights.

Nunito and Noto Sans SC are named, then system fonts. There are no bundled fonts, font imports, font-face declarations, or CDN dependencies. No document/root selectors, global HA patches or original Mushroom registrations are modified by the skin.

## Coverage and deliberate exceptions

All 18 card entry points inherit common card/base styles or explicit independent-root styles. Shared Button, Input Number, Slider, Shape Icon, Shape Avatar, Badge Icon, State Info, State Item, Card and Button Group retain their original layouts; scoped overrides apply to the visual surfaces that need changes. All 11 chip types inherit the shared Chip skin; conditional chip logic and empty/no-content behavior are untouched. Template Badge has its own token/style block. Modern Template styles native `ha-tile-icon`, `ha-tile-info`, `ha-tile-badge` and `hui-card-features` without substituting fake implementations.

The usual State Item is padded 16px vertically and 24px horizontally. Section-grid cards keep the upstream 56px row contract (36px icon + 20px vertical space) and layout-derived sizing; modern Template preserves its native row-height calculation. Chip/badge height stays 36px. No outer min-height or fixed card height is introduced. Empty Card still renders nothing outside preview. Title remains an upstream title, without fabricating a library ribbon or altering its actions. Chips Card remains a transparent layout wrapper. No blanket overflow rule clips menus or feature popovers.

Semantically active icons use saturated fills for straightforward domains; lock/alarm/climate/person/update colors retain original state mapping, and user-configured colors/actual light RGB retain inline priority. The palette changes RGB defaults, not state computation. Disabled shape styles still win inside their shadow root. Buttons have no general shadow; `data-island-primary` is an explicit visual-only opt-in for a local primary-button shadow, not inferred from an action's name. No button behavior is changed.

The React library prescribes `naive-icons`. This is intentionally **not** applied to HA's entity icons, configured MDI strings, weather SVGs, or control icons: replacing them would break upstream icon configuration and domain semantics. No icons are hidden or replaced with emoji/decoration. A future opt-in default-icon adapter would need a separately reviewed semantic mapping and must never override configured icons.

## Shadow DOM and dark mode boundaries

CSS inside this fork cannot reach HA's private shadow trees. Supported exposed variables are passed to `ha-card`, `ha-control-select-menu`, `ha-tile-icon`, and features; feature internals, tile-info typography details, menu popups, more-info dialogs and HA editors remain HA-owned. This is not a pixel-identical restyle of every native Home Assistant widget. Actual integration verification must run against a real compatible HA frontend, not DOM stubs.

Mushroom BaseElement already reflects HA dark mode as `[dark-mode]`; warm dark tokens follow that exact attribute and remain scoped. Modern Template/Badge do not inherit that behavior, so the deterministic build adds a narrowly scoped presentation hook to their existing willUpdate methods. It reflects `hass.themes.darkMode` as `data-island-theme="dark"` and removes that attribute in light mode. The original lifecycle body remains unchanged, and the transformation is listed separately in the build manifest. No template, action or entity-state calculation is replaced.

Reduced-motion preference disables transitions/animations within each fork shadow tree; focus outlines are mint, input focus yellow. No external styles or remote writes are required.

## First real-HA visual review (2026-11-06)

Reviewed the 30-module evidence manifest and all 28 visible fork PNGs from the first real-HA CI capture. Empty Card and Spacer Chip have no visible image by design; first-run classification of those zero-size entries needs the test correction, not a skin filler. This is visual evidence only, not a statement that the first CI behavior suite passed.

No radius fix was made: the apparent square cards in the reduced contact sheet were rectangular screenshots composited onto a green page. In the original Cover and Template PNGs, pixel `(0,0)` is the HA canvas `(250,250,250)`, whereas `(20,0)` is the exact parchment `(247,243,223)`, consistent with the visibly rounded 20px corner. Template Badge and entity Chip also show real pill corners. The HA canvas color outside the component is not a fork surface and is deliberately not globally recolored.

The captured surfaces show exact parchment and the intended saturated blue/purple/green state colors. Light color retains its actual entity RGB; inactive/domain-specific colors retain original semantics. The screenshots show unclipped labels and controls in the tested fixtures; they do not prove every configuration, popup, dark theme, or viewport. No speculative CSS changes were made. Next CI diagnostic request: record computed backgrounds/radii/shadows/dimensions for all 30 roots, State Item padding, button height/radius, and actual Template/Badge dark-mode reflection and resulting colors.
