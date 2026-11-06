# Animal Island skin for the Mushroom 5.2.3 Lit fork

## Implementation and provenance

`src/skin/styles.ts` exports `islandSkin(sourcePath)` (also as default). The build appends it **after** original component CSS, including both static getters and static properties. This is a Lit/CSS visual translation of the installed `animal-island-ui` package, not usage of its React components. Original card logic, selectors, event handlers, services, subscriptions, editors, custom configuration, and HA feature rendering are retained.

The installed package's `dist/index.css` was inspected. Its actual Card uses `#f7f3df`, 20px radius, 16px/24px padding, no shadow; runtime root tokens use a different `#f8f8f0` generic background. This fork deliberately follows Card. Accent fills copy pink `#f8a6b2`, purple `#b77dee`, blue `#889df0`, yellow `#f7cd67`, teal `#82d5bb`, green `#8ac68a`. Foreground on saturated icons is dark brown for readability, rather than the package's sometimes low-contrast white. Controls are 50px pills, 45px tall when unconstrained. Inline/section layouts keep their original control heights.

Nunito and Noto Sans SC are named, then system fonts. There are no bundled fonts, font imports, font-face declarations, or CDN dependencies. No document/root selectors, global HA patches or original Mushroom registrations are modified by the skin.

## Coverage and deliberate exceptions

All 18 card entry points inherit common card/base styles or explicit independent-root styles. Shared Button, Input Number, Slider, Shape Icon, Shape Avatar, Badge Icon, State Info, State Item, Card and Button Group retain their original layouts; scoped overrides apply to the visual surfaces that need changes. All 11 chip types inherit the shared Chip skin; conditional chip logic and empty/no-content behavior are untouched. Template Badge has its own token/style block. Modern Template styles native `ha-tile-icon`, `ha-tile-info`, `ha-tile-badge` and `hui-card-features` without substituting fake implementations.

The usual State Item is padded 16px vertically and 24px horizontally. Section-grid cards keep the upstream 56px row contract (36px icon + 20px vertical space) and layout-derived sizing; modern Template preserves its native row-height calculation. Chip/badge height stays 36px. No outer min-height or fixed card height is introduced. Empty Card still renders nothing outside preview. Title keeps its upstream layout and actions; its standalone heading now has paint-only ribbon decoration, as documented below. Chips Card remains a transparent layout wrapper. No blanket overflow rule clips menus or feature popovers.

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

## Standalone Title mapping correction

The installed official `Title.d.ts` has three variants: `ribbon`, `layer`, and `tab`; `Title.js` defaults to `ribbon`. Plain bold text is not an official variant. The earlier standalone Title mapping was therefore incomplete (ordinary entity names are not Title components and stay plain).

The standalone Title Card now uses a paint-only swallowtail ribbon, with the official `app-yellow` palette: front `#f7cd67`, back `#d4a030`, text `#725d42` (official fold token `#8a6010` retained for reference). Its two noninteractive pseudo-elements paint behind the original h1; no wrappers, content, template subscriptions, action handlers, padding, width, font size, line height or sizing methods change. Alignment, RTL, subtitle and multiline content continue using upstream semantics. The tails extend 8px horizontally and 5px down within the default 12px horizontal padding and 8px title/subtitle gap. This is a compact HA-compatible visual translation, not a claim that the React Title's multi-span 2em-height geometry is identical. Custom title padding smaller than those defaults may require user spacing adjustment.

Real-HA CI should verify the title pseudo-element backgrounds/clip-path, unchanged title/header dimensions, actionability, multiline/RTL rendering, and narrow layouts before this change is called visually validated.

## Interaction motion (reference-driven, presentation only)

The user's two motion-reference screenshots were inspected. Three suitable ideas are applied: tactile press/rebound, a ripple originating at the actual pointer contact, and synchronized slider feedback. Other suggestions (switch stretching, drawn checkbox ticks, favorites particles, card flipping/stacking, hamburger morphing and bottom sheets) do not map to independent controls in this fork and are not forced onto HA's private controls.

`src/skin/motion.ts` installs a Lit ReactiveController on shared Button, Chip, and Input Number. Button/Chip surfaces press toward 96% over 150ms, then gently rebound through 101.5% to 100% over 250ms. Input Number animates only the actual minus or plus button. The 350ms ripple uses pointer coordinates relative to that surface; Enter/Space feedback starts at the center. The existing tap, hold, double-tap, keyboard and touch handlers are untouched. No preventDefault, stopPropagation, pointer capture, synthetic click, service call, entity state, configuration or sizing change is introduced. A visual response indicates input, never device success.

The controller observes disabled properties/attributes, aria-disabled and inert across shadow ancestors. Disabled controls do not animate. Reduced-motion preference prevents effects from starting; changing that preference during a gesture immediately cancels effects. Disconnect aborts all host/media/document listeners, cancels every animation, removes ripple DOM and clears the pressed attribute. Pointer cancellation, blur and release outside the control clear pending feedback. At most three ripple layers can exist per controller; completion removes them without timers.

Wave layers are aria-hidden and pointer-events:none, clipped to the individual control's inherited radius; the card itself is not overflow-clipped. UI fonts and icon semantics are unchanged. Real-HA QA can observe `data-island-pressed`, `.island-motion-ripple`, and browser Animation objects, without test-only behavior.

Slider retains its original value source and gesture logic. Its controlled drag already disables track/indicator transitions, so the visual thumb and fill follow the same real gesture value immediately. No fake intermediate device value, number rolling, success pulse or delayed state interpolation is added. Existing 180ms settling transitions share the same easing and are disabled under reduced motion.

This motion layer requires a new real-HA integration run; the previously passing baseline does not by itself validate motion, event counts or cleanup.
