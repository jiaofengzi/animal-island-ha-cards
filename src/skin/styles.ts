import { css, CSSResult, unsafeCSS } from "lit";

/** Presentation only. Appended after upstream styles by the fork build. */
const tokens = css`
  :host {
    --animal-primary-color: #19c8b9;
    --animal-primary-color-hover: #3dd4c6;
    --animal-primary-color-active: #50b9ab;
    --animal-primary-color-bg: #e6f9f6;
    --animal-warning-color: #f5c31c;
    --animal-text-color: #725d42;
    --animal-text-color-secondary: #84745e;
    --animal-text-color-disabled: #a99b82;
    --animal-border-color: #dcd8d1;
    --animal-border-color-light: #e8e2d6;
    --animal-bg-color: #f7f3df;
    --animal-bg-color-secondary: #f0e8d8;
    --animal-bg-color-disabled: #f0ece2;
    --animal-card-pink: #f8a6b2;
    --animal-card-purple: #b77dee;
    --animal-card-blue: #889df0;
    --animal-card-yellow: #f7cd67;
    --animal-card-teal: #82d5bb;
    --animal-card-green: #8ac68a;
    --animal-font-family: Nunito, "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    --animal-motion-duration-base: .25s;
    --animal-motion-ease: cubic-bezier(.4, 0, .2, 1);
    --primary-text-color: var(--animal-text-color);
    --secondary-text-color: var(--animal-text-color-secondary);
    --disabled-text-color: var(--animal-text-color-disabled);
    --ha-card-background: var(--animal-bg-color);
    --card-background-color: var(--animal-bg-color);
    --ha-card-border-radius: 20px;
    --ha-card-box-shadow: none;
    --ha-card-border-width: 0px;
    --ha-card-border-color: var(--animal-border-color-light);
    --divider-color: var(--animal-border-color-light);
    --primary-font-family: var(--animal-font-family);
    --paper-font-common-base_-_font-family: var(--animal-font-family);
    --mdc-typography-font-family: var(--animal-font-family);
    --mdc-theme-primary: var(--animal-primary-color);
    font-family: var(--animal-font-family);
    color: var(--animal-text-color);
    font-weight: 500;
  }
  :host([dark-mode]), :host-context([dark-mode]), :host([data-island-theme="dark"]) {
    --animal-text-color: #f4e8cc;
    --animal-text-color-secondary: #c7b99e;
    --animal-text-color-disabled: #9d907a;
    --animal-bg-color: #352f25;
    --animal-bg-color-secondary: #463d2f;
    --animal-bg-color-disabled: #40392e;
    --animal-border-color: #675a45;
    --animal-border-color-light: #554a39;
    --animal-primary-color-bg: #294c43;
  }
`;
const theme = css`
  :host {
    --spacing: var(--mush-spacing, 16px);
    --control-border-radius: var(--mush-control-border-radius, 50px);
    --control-height: var(--mush-control-height, 45px);
    --control-spacing: var(--mush-control-spacing, 12px);
    --icon-border-radius: var(--mush-icon-border-radius, 50px);
    --card-primary-font-weight: var(--mush-card-primary-font-weight, 800);
    --card-secondary-font-weight: var(--mush-card-secondary-font-weight, 500);
    --card-primary-color: var(--mush-card-primary-color, var(--animal-text-color));
    --card-secondary-color: var(--mush-card-secondary-color, var(--animal-text-color-secondary));
    --chip-background: var(--mush-chip-background, var(--animal-bg-color));
    --chip-border-radius: var(--mush-chip-border-radius, 50px);
    --chip-border-width: var(--mush-chip-border-width, 0px);
    --chip-box-shadow: none;
    --chip-font-weight: var(--mush-chip-font-weight, 700);
    --title-font-weight: var(--mush-title-font-weight, 900);
    --subtitle-font-weight: var(--mush-subtitle-font-weight, 500);
    --title-color: var(--mush-title-color, var(--animal-text-color));
    --subtitle-color: var(--mush-subtitle-color, var(--animal-text-color-secondary));
    --rgb-pink: var(--mush-rgb-pink, 248,166,178);
    --rgb-red: var(--mush-rgb-red, 252,115,109);
    --rgb-purple: var(--mush-rgb-purple, 183,125,238);
    --rgb-deep-purple: var(--mush-rgb-deep-purple, 183,125,238);
    --rgb-blue: var(--mush-rgb-blue, 136,157,240);
    --rgb-indigo: var(--mush-rgb-indigo, 136,157,240);
    --rgb-light-blue: var(--mush-rgb-light-blue, 136,157,240);
    --rgb-teal: var(--mush-rgb-teal, 130,213,187);
    --rgb-cyan: var(--mush-rgb-cyan, 130,213,187);
    --rgb-green: var(--mush-rgb-green, 138,198,138);
    --rgb-light-green: var(--mush-rgb-light-green, 138,198,138);
    --rgb-yellow: var(--mush-rgb-yellow, 247,205,103);
    --rgb-amber: var(--mush-rgb-amber, 247,205,103);
    --rgb-orange: var(--mush-rgb-orange, 247,205,103);
    --rgb-deep-orange: var(--mush-rgb-deep-orange, 229,146,102);
  }
  /* A HA grid row remains 56px: 36px icon + 10px on either side. */
  :host([layout="grid"]) { --spacing: var(--mush-spacing, 10px); }
`;
const focus = css`
  :focus-visible, .button:focus-visible, [role="button"]:focus-visible {
    outline: 2px solid var(--animal-primary-color, #19c8b9);
    outline-offset: -2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }
  }
`;
const card = css`
  ha-card {
    border-radius: var(--ha-card-border-radius);
    background: var(--ha-card-background);
    box-shadow: none;
    color: var(--animal-text-color);
    font-family: var(--animal-font-family);
  }
  /* Preserve upstream flex, fill-container and section grid sizing. */
  ha-card:has(.background:focus-visible) {
    box-shadow: none;
    outline: 2px solid var(--animal-primary-color);
    outline-offset: -2px;
  }
`;
const saturatedStates: Record<string, string> = {
  "alarm-control-panel": "", // State-dependent armed/triggered colors remain upstream.
  "climate": "", // Preserve current HVAC-mode colors.
  "cover": "state-cover-open",
  "entity": "state-entity",
  "fan": "state-fan",
  "humidifier": "state-humidifier",
  "light": "state-light",
  "lock": "", // Locked/unlocked/pending retains its safety meaning.
  "media-player": "state-media-player",
  "number": "state-number",
  "select": "state-entity",
  "vacuum": "state-vacuum",
};
const surfaces: Record<string, CSSResult> = {
  "src/shared/button.ts": css`
    :host { --bg-color: var(--animal-bg-color-secondary); --bg-color-disabled: var(--animal-bg-color-disabled); }
    .button { position: relative; border-radius: 50px; font-family: var(--animal-font-family); transition: background-color .25s var(--animal-motion-ease); box-shadow: none; }
    .button:not(:disabled):hover { filter: brightness(1.03); }
    .button:not(:disabled):active { filter: brightness(.96); }
    /* Opt-in visual primary only; upstream disabled/actions remain untouched. */
    :host([data-island-primary]) .button:not(:disabled) { background: var(--animal-primary-color); box-shadow: 0 3px 0 var(--animal-primary-color-active); }
  `,
  "src/shared/input-number.ts": css`
    :host { --bg-color: var(--animal-bg-color-secondary); }
    .container, .button { border-radius: 50px; box-shadow: none; }
    .button { position: relative; }
    .value { font-weight: 800; font-variant-numeric: tabular-nums; }
    .container:focus-within { outline: 2px solid var(--animal-warning-color); outline-offset: -2px; }
  `,
  "src/shared/slider.ts": css`
    .slider { border-radius: 50px; }
    .slider .slider-track-indicator { border-radius: 50px; box-shadow: none; }
    .slider .slider-track-active, .slider .slider-track-indicator { transition-timing-function: var(--animal-motion-ease); }
    .slider:focus-visible { outline: 2px solid var(--animal-warning-color); outline-offset: -2px; }
  `,
  "src/shared/shape-icon.ts": css`
    :host { --shape-color: var(--animal-bg-color-secondary); --shape-color-disabled: var(--animal-bg-color-disabled); }
    .shape { transition-timing-function: var(--animal-motion-ease); }
  `,
  "src/shared/state-item.ts": css`
    .container { padding-inline: calc(var(--spacing) * 1.5); }
  `,
  "src/shared/state-info.ts": css`
    .primary { font-weight: var(--card-primary-font-weight, 800); }
    .secondary { color: var(--card-secondary-color); }
  `,
  "src/shared/chip.ts": css`
    ha-card { position: relative; border-radius: 50px; box-shadow: none; }
  `,
  "src/shared/shape-avatar.ts": css`
    img, .shape, .picture { border-radius: 50%; }
  `,
  "src/shared/badge-icon.ts": css`
    .badge { border-radius: 50px; }
  `,
  "src/cards/select-card/controls/select-option-control.ts": css`
    ha-control-select-menu {
      --control-select-menu-border-radius: 50px;
      --mdc-theme-primary: var(--animal-primary-color);
      --mdc-text-field-fill-color: var(--animal-bg-color-secondary);
      --mdc-text-field-ink-color: var(--animal-text-color);
    }
  `,
  "src/cards/title-card/title-card.ts": css`
    .header { background: none; border: none; box-shadow: none; }
    :host {
      /* Official Title color=app-yellow: front / back / fold / text. */
      --animal-title-front: #f7cd67;
      --animal-title-back: #d4a030;
      --animal-title-fold: #8a6010;
      --animal-title-text: #725d42;
    }
    .title {
      position: relative;
      isolation: isolate;
      font-weight: var(--title-font-weight);
      color: var(--mush-title-color, var(--animal-title-text));
    }
    /* Paint-only ribbon: original h1 box, line wrapping, alignment and actions remain. */
    .title::before, .title::after {
      content: "";
      position: absolute;
      pointer-events: none;
      z-index: -1;
    }
    .title::before {
      inset: 5px -8px -5px;
      background: var(--animal-title-back);
      clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 50%, 100% 100%, 0 100%, 6px 50%);
    }
    .title::after {
      inset: 0;
      border-radius: .2em;
      background: var(--animal-title-front);
    }
    .actionable { border-radius: 12px; }
    /* Only standalone Title Card gets the ribbon, never ordinary entity names. */
  `,
  "src/cards/empty-card/empty-card.ts": css`
    ha-card { background: none; box-shadow: none; }
  `,
  "src/cards/chips-card/chips-card.ts": css`
    ha-card { background: none; border: none; border-radius: 0; box-shadow: none; }
  `,
  "src/cards/template-card/template-card.ts": css`
    .content { padding-inline: 16px; gap: 12px; }
    .vertical { padding: 10px 16px; }
    ha-tile-icon { --tile-icon-border-radius: 50px; }
    ha-tile-info { font-family: var(--animal-font-family); }
    hui-card-features { --feature-border-radius: 50px; }
    /* Leave the native feature height and all inline/below layout equations alone. */
  `,
  "src/badges/template/template-badge.ts": css`
    .badge { background: var(--animal-bg-color); border-radius: 50px; border-color: var(--animal-border-color-light); box-shadow: none; }
    .badge:focus-visible { box-shadow: none; outline: 2px solid var(--animal-primary-color); outline-offset: -2px; }
    .content { font-weight: 800; }
    .label { font-weight: 500; }
  `,
};

export function islandSkin(sourcePath: string): CSSResult {
  const path = sourcePath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (path.includes("-editor") || path.includes("/ha/")) return css``;
  const isRoot = path === "src/utils/base-element.ts" || path === "src/cards/template-card/template-card.ts" || path === "src/badges/template/template-badge.ts";
  const isCard = /^src\/cards\/[^/]+\/[^/]+-card\.ts$/.test(path);
  const kind = path.match(/^src\/cards\/([^/]+)-card\//)?.[1];
  const state = kind ? saturatedStates[kind] : undefined;
  // Inline configured icon colors and actual light RGB continue to win.
  const stateSkin = isCard && state
    ? `island-shape-icon { --shape-color: rgb(var(--rgb-${state})); --icon-color: var(--animal-text-color-on-accent, #574631); }`
    : "";
  // unsafeCSS only joins fixed, locally authored CSSResults. No user/config input.
  return unsafeCSS([
    isRoot ? tokens.cssText : "",
    path === "src/utils/base-element.ts" ? theme.cssText : "",
    isCard ? card.cssText : "",
    stateSkin,
    surfaces[path]?.cssText || "",
    focus.cssText,
  ].join("\n"));
}

export default islandSkin;
