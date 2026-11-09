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

The standalone Title Card paints the official `ribbon` variant (animal-island-ui 3.0.3 `title.module.css`) with only the original h1 and its two noninteractive pseudo-elements; no wrappers, content, template subscriptions or action handlers change. All geometry is in `em`, so it scales with `--title-font-size`:

| Official layer | Here | Geometry (em) |
|---|---|---|
| `ribbonFront` | `.title::after` | `inset: 0 .1em`, radius `.2em`, `perspective(11.5em) rotateX(3deg)`, inset shadow `-.06em` |
| `ribbonBackLeft/Right` | `.title::before` background layers 3–4 | `1.7em` squares, `.6em` outside each edge, `.4em` below; swallowtail notch `.51em` (30%) via `clip-path` |
| `ribbonFoldLeft/Right` | `.title::before` background layers 1–2 | `.95em × .45em` dark triangles under the front's bottom corners (`.15em`/`.16em` inset) — the fold crease |
| `ribbonText` | `.title` | `min-height: 2em`, padding `.11em 1.6em 0`, letter-spacing `.04em` |

The other two official variants are selected with the card config field `variant` (default `ribbon`):

| `variant` | Official | Here | Geometry (em) |
|---|---|---|---|
| `layer` 双层纸 | `.layer::before` + `.layerFront` | `::before` back sheet, `::after` front sheet, h1 text | front `min-height: 2.1em`, padding `0 1.55em`, radius `.35em`; back `inset: -.3em .65em 0 -.26em` (peeks out top-left). The front is painted by `::after` rather than the h1 background because a negative-z back sheet would otherwise cover it. |
| `tab` 折角便签 | `.tab` + `.tab::after` + `.tabText` | h1 background, `::after` corner | `min-height: 2em`, padding `0 1.5em 0 1.9em` (official `.4em` text offset), radius `.32em`, top-left cut `linear-gradient(135deg, transparent .9em, front .9em)`, bottom-right `.9em` dark corner triangle |

Official `layer`/`tab` scale to 1.06 on hover; here that only applies when the title has a tap action (`.actionable`).

The card config field `color` picks any of the 13 official Title palette names: `default` (green), `app-pink`, `purple`, `app-blue`, `app-yellow` (default), `app-orange`, `app-teal`, `app-green`, `app-red`, `lime-green`, `yellow-green`, `brown`, `warm-peach-pink`. Values are copied from `title.module.css`. Both fields are exposed by a build transform that only adds `data-island-variant` / `data-island-color` attributes to the title card's `ha-card` and two optional strings to its config struct (so the visual editor still accepts the config; the fields are YAML-only, not shown in the editor form). Unknown values fall back to the ribbon and yellow.

Palette defaults to official `app-yellow` and is overridable per card (e.g. via card-mod or theme) with `--island-title-front` (`#f7cd67`), `--island-title-back` (`#d4a030`), `--island-title-fold` (`#8a6010`) and `--island-title-text` (`#725d42`). Any official color pair can be used, e.g. default green `#27d039 / #20992a / #115017 / #fff`, `app-blue` `#889df0 / #5068d8 / #2030a0 / #fff`.

The h1 gets `margin: 0 .6em .4em` so the tails and folds stay inside the card; this adds `.4em` below the title. Unlike the official component, `white-space` keeps upstream `pre-wrap`, so long or multiline titles grow the front (`min-height`) while tails and folds stay anchored to the bottom edge. The removed v0.3.2 variable `--island-title-color` (front only) is replaced by the four variables above.

Real-HA CI should verify the title pseudo-element backgrounds/clip-path, unchanged title/header dimensions, actionability, multiline/RTL rendering, and narrow layouts before this change is called visually validated.

## Interaction motion (reference-driven, presentation only)

The user's two motion-reference screenshots were inspected. Three suitable ideas are applied: tactile press/rebound, a ripple originating at the actual pointer contact, and synchronized slider feedback. Other suggestions (switch stretching, drawn checkbox ticks, favorites particles, card flipping/stacking, hamburger morphing and bottom sheets) do not map to independent controls in this fork and are not forced onto HA's private controls.

`src/skin/motion.ts` installs a Lit ReactiveController on shared Button, Chip, and Input Number. Visible control content presses toward 96% over 150ms, then gently rebounds through 101.5% to 100% over 250ms. The real native button/ha-card surface never scales: its dimensions and hit area stay fixed. Shared Button animates its existing assigned visual elements, Chip animates `.content`/`.avatar`, and Input Number animates only `ha-icon` inside the actual minus or plus button. No interactive DOM is cloned. The 350ms ripple uses pointer coordinates relative to that surface; Enter/Space feedback starts at the center. The existing tap, hold, double-tap, keyboard and touch handlers are untouched. No preventDefault, stopPropagation, pointer capture, synthetic click, service call, entity state, configuration or sizing change is introduced. A visual response indicates input, never device success.

The controller observes the actual surface and motion host’s own disabled property/attribute and native `:disabled` controls/fieldsets. It respects aria-disabled and inert across shadow ancestors, but does not treat arbitrary third-party custom ancestors’ disabled properties as disabling their children (for example a HA container may disable sorting while its cards remain interactive). Disabled controls do not animate. Reduced-motion preference prevents effects from starting; changing that preference during a gesture immediately cancels effects. Disconnect aborts all host/media/document listeners, cancels every animation, removes ripple DOM and clears the pressed attribute. Pointer cancellation, lifetime window blur (including keyboard input) and release outside the control clear pending feedback. Focus-out cancels only the currently pressed surface; an old minus-button focus-out cannot cancel a newly pressed plus button. At most three ripple layers can exist per controller; completion removes them without timers.

Wave layers are aria-hidden and pointer-events:none, clipped to the individual control's inherited radius; the card itself is not overflow-clipped. UI fonts and icon semantics are unchanged. Real-HA QA can observe `data-island-pressed`, `.island-motion-ripple`, and browser Animation objects, without test-only behavior.

Slider retains its original value source and gesture logic. Its controlled drag already disables track/indicator transitions, so the visual thumb and fill follow the same real gesture value immediately. No fake intermediate device value, number rolling, success pulse or delayed state interpolation is added. Existing 180ms settling transitions share the same easing and are disabled under reduced motion.

This motion layer requires a new real-HA integration run; the previously passing baseline does not by itself validate motion, event counts or cleanup.

### Hit-area and focus safety correction

The initial motion version scaled the action surface itself. Read-only review identified a possible edge-click loss and alternating minus/plus focus feedback cancellation, even though ordinary central input/service tests passed. The correction keeps real interaction surfaces fixed, animates only existing visual children, routes focus-out by the original composed event path, and listens for window blur for the controller's entire connected lifetime. Pointer coordinates and ripple origin still use the unscaled surface. CI must verify fixed geometry during press, original-boundary clicks, alternating focus, keyboard blur, and cleanup; previous animation evidence predates this correction.

A further disabled-check correction limits disabled properties to the actual motion host and native disabled controls/fieldsets. The CI pointer path contained HA sortable containers; their sorting-specific disabled state is not a valid proxy for child-control disabled state. Actual ancestor values remain a diagnostic to confirm the precise CI failure cause, not an assumed result.
