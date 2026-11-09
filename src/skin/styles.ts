import { css, CSSResult, unsafeCSS } from "lit";
import { TONES } from "../island/art";
import { ISLAND_FONT_STACK } from "../island/fonts";

/**
 * 小岛皮肤。构建时追加在每个 Mushroom 组件原有样式之后。
 * 设计要点：
 * - 每张卡按图标的颜色家族（tone）上色：开着的设备是带波点的彩色卡，关着的是素色米白卡。
 * - 卡片、按钮、胶囊都有“游戏按钮”式的底部厚边；按下只改变阴影，图标动效由 motion 控制器负责。
 * - 状态文字、胶囊、徽章用不规则的气泡形状。
 */

const tokens = css`
  :host {
    --island-ink: #5b4128;
    --island-ink-soft: #8a7356;
    --island-paper: #fffaf0;
    --island-paper-hi: #ffffff;
    --island-well: #f3ead4;
    --island-edge: #e5d7b5;
    --island-tile-off: #ece4cf;
    --island-tile-off-edge: #d6caae;
    --island-tile-off-ink: #b3a689;
    --island-accent: #3ec2ae;
    --island-font: ${unsafeCSS(ISLAND_FONT_STACK)};

    /* 兼容旧变量名，供外部主题覆盖 */
    --animal-font-family: var(--island-font);
    --animal-text-color: var(--island-ink);
    --animal-text-color-secondary: var(--island-ink-soft);
    --animal-bg-color: var(--island-paper);
    --animal-primary-color: #3ec2ae;

    --primary-text-color: var(--island-ink);
    --secondary-text-color: var(--island-ink-soft);
    --rgb-primary-text-color: 91, 65, 40;
    --rgb-secondary-text-color: 138, 115, 86;
    --rgb-disabled: 196, 187, 166;
    --ha-card-background: var(--island-paper);
    --card-background-color: var(--island-paper);
    --ha-card-border-radius: 28px;
    --ha-card-border-width: 0px;
    --ha-card-box-shadow: none;
    --primary-font-family: var(--island-font);
    --mdc-typography-font-family: var(--island-font);
    font-family: var(--island-font);
    color: var(--island-ink);
    -webkit-font-smoothing: antialiased;
  }
  /* 深色 = 夜里的小岛：卡片是夜空蓝，不再把彩色混进卡片底色（混进棕/蓝底会发脏），
     颜色只出现在图标、卡片底边、状态气泡和控件上。 */
  :host([dark-mode]), :host([data-island-theme="dark"]) {
    --island-ink: #f5eedb;
    --island-ink-soft: #b8c1dc;
    --island-paper: #2d3a5e;
    --island-paper-hi: #3d4c78;
    --island-well: #222d4b;
    --island-edge: #18203a;
    --island-tile-off: #3d4a70;
    --island-tile-off-edge: #2d3a5e;
    --island-tile-off-ink: #7d88a8;
    --rgb-primary-text-color: 245, 238, 219;
    --rgb-secondary-text-color: 184, 193, 220;
    --rgb-disabled: 110, 122, 156;
  }
`;

const theme = css`
  :host {
    --spacing: var(--mush-spacing, 12px);
    --icon-size: var(--mush-icon-size, 46px);
    --icon-border-radius: var(--mush-icon-border-radius, 32%);
    --icon-symbol-size: 0.6em;
    --card-primary-font-size: var(--mush-card-primary-font-size, 15px);
    --card-primary-line-height: var(--mush-card-primary-line-height, 20px);
    --card-primary-font-weight: var(--mush-card-primary-font-weight, 800);
    --card-primary-letter-spacing: 0.2px;
    --card-secondary-font-size: var(--mush-card-secondary-font-size, 12.5px);
    --card-secondary-line-height: var(--mush-card-secondary-line-height, 16px);
    --card-secondary-font-weight: var(--mush-card-secondary-font-weight, 700);
    --card-secondary-letter-spacing: 0.3px;
    --card-primary-color: var(--mush-card-primary-color, var(--island-ink));
    --card-secondary-color: var(--mush-card-secondary-color, var(--island-ink));
    --control-height: var(--mush-control-height, 40px);
    --control-border-radius: var(--mush-control-border-radius, 999px);
    --control-icon-size: 0.5em;
    --control-spacing: var(--mush-control-spacing, 10px);
    --chip-height: var(--mush-chip-height, 36px);
    --chip-padding: 0 0.32em 0 0.16em;
    --chip-border-radius: var(--mush-chip-border-radius, 999px);
    --chip-border-width: 0px;
    --chip-box-shadow: none;
    --chip-font-size: 0.34em;
    --chip-font-weight: 800;
    --chip-icon-size: 0.66em;
    --chip-background: var(--island-paper);
    --chip-spacing: 10px;
    --badge-size: 18px;
    --title-padding: var(--mush-title-padding, 4px 10px 2px);
    --title-font-size: var(--mush-title-font-size, 19px);
    --title-line-height: var(--mush-title-line-height, 26px);
    --title-font-weight: 900;
    --title-color: var(--island-ink);
    --title-letter-spacing: 1px;
    --subtitle-font-size: 13.5px;
    --subtitle-line-height: 20px;
    --subtitle-font-weight: 700;
    --subtitle-color: var(--island-ink-soft);
    --rgb-pink: var(--mush-rgb-pink, 255, 143, 171);
    --rgb-red: var(--mush-rgb-red, 244, 105, 90);
    --rgb-purple: var(--mush-rgb-purple, 180, 140, 242);
    --rgb-deep-purple: var(--mush-rgb-deep-purple, 150, 115, 230);
    --rgb-indigo: var(--mush-rgb-indigo, 120, 140, 240);
    --rgb-blue: var(--mush-rgb-blue, 90, 167, 240);
    --rgb-light-blue: var(--mush-rgb-light-blue, 92, 200, 232);
    --rgb-cyan: var(--mush-rgb-cyan, 92, 200, 232);
    --rgb-teal: var(--mush-rgb-teal, 62, 194, 174);
    --rgb-green: var(--mush-rgb-green, 108, 201, 106);
    --rgb-light-green: var(--mush-rgb-light-green, 150, 215, 100);
    --rgb-lime: var(--mush-rgb-lime, 190, 220, 80);
    --rgb-yellow: var(--mush-rgb-yellow, 255, 204, 61);
    --rgb-amber: var(--mush-rgb-amber, 255, 184, 0);
    --rgb-orange: var(--mush-rgb-orange, 255, 154, 60);
    --rgb-deep-orange: var(--mush-rgb-deep-orange, 255, 122, 80);
    --rgb-brown: var(--mush-rgb-brown, 211, 154, 92);
    /* 让滑条、按钮的状态色和插画图标的颜色家族一致 */
    --rgb-state-fan: var(--mush-rgb-state-fan, var(--rgb-teal));
    --rgb-state-humidifier: var(--mush-rgb-state-humidifier, var(--rgb-light-blue));
    --rgb-state-media-player: var(--mush-rgb-state-media-player, var(--rgb-purple));
    --rgb-state-vacuum: var(--mush-rgb-state-vacuum, var(--rgb-orange));
    --rgb-state-cover-open: var(--mush-rgb-state-cover-open, var(--rgb-green));
    --rgb-state-number: var(--mush-rgb-state-number, var(--rgb-orange));
    --rgb-state-entity: var(--mush-rgb-state-entity, var(--rgb-teal));
  }
  :host([layout="grid"]) { --spacing: var(--mush-spacing, 10px); }
`;

const focus = css`
  :focus-visible, .button:focus-visible, [role="button"]:focus-visible {
    outline: 3px solid #ffcc3d;
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }
  }
`;

const toneRules = Object.entries(TONES)
  .map(([name, hex]) => `ha-card:has(island-state-icon[data-tone="${name}"]) { --island-accent: ${hex}; }`)
  .join("\n");

const card = css`
  ha-card {
    --island-tint: 26%;
    --island-edge-mix: 55%;
    background-color: color-mix(in srgb, var(--island-accent) var(--island-tint), var(--island-paper));
    background-image: radial-gradient(color-mix(in srgb, var(--island-accent) 34%, transparent) 1.7px, transparent 2.3px);
    background-size: 18px 18px;
    background-position: 5px 5px;
    border: none;
    border-radius: var(--ha-card-border-radius, 24px);
    box-shadow:
      0 5px 0 color-mix(in srgb, var(--island-accent) var(--island-edge-mix), var(--island-edge)),
      0 14px 22px -10px rgba(91, 65, 40, .32);
    color: var(--island-ink);
    font-family: var(--island-font);
    transition: background-color .35s cubic-bezier(.4, 0, .2, 1), box-shadow .35s cubic-bezier(.4, 0, .2, 1);
  }
  ${unsafeCSS(toneRules)}
  ha-card {
    --island-pill-bg: color-mix(in srgb, var(--island-accent) 34%, var(--island-paper));
    --island-pill-ink: var(--island-ink);
  }
  ha-card:has(island-state-icon[data-inactive]) {
    --island-tint: 0%;
    --island-edge-mix: 0%;
    --island-accent: #c4bba6;
    background-image: none;
  }
  :host([dark-mode]) ha-card:not(.header):not(:has(> .chip-container)),
  :host([data-island-theme="dark"]) ha-card:not(.header):not(:has(> .chip-container)) {
    --island-tint: 0%;
    --island-edge-mix: 100%;
    --island-pill-bg: var(--island-accent);
    --island-pill-ink: #2a2316;
    background-image: radial-gradient(color-mix(in srgb, var(--island-accent) 22%, transparent) 1.7px, transparent 2.3px);
    box-shadow: 0 6px 0 var(--island-accent), 0 14px 22px -10px rgba(0, 0, 0, .5);
  }
  :host([dark-mode]) ha-card:has(island-state-icon[data-inactive]),
  :host([data-island-theme="dark"]) ha-card:has(island-state-icon[data-inactive]) {
    --island-accent: var(--island-tile-off);
    --island-pill-bg: var(--island-well);
    --island-pill-ink: var(--island-ink-soft);
    background-image: none;
    box-shadow: 0 6px 0 var(--island-edge), 0 14px 22px -10px rgba(0, 0, 0, .5);
  }
  /* Keep cards and their controls stationary throughout hover and press.
     The motion controller animates visual children, never hit areas or ancestors. */
  ha-card:has(.background:focus-visible) {
    box-shadow: 0 6px 0 var(--island-edge);
    outline: 3px solid #ffcc3d;
    outline-offset: 2px;
  }

  /* 图标：彩色插画方块直接填满原来的圆形底座 */
  island-shape-icon:has(> island-state-icon) {
    --shape-color: transparent;
    --shape-color-disabled: transparent;
    --shape-outline-color: transparent;
    --shape-animation: none;
  }
  island-shape-icon > island-state-icon {
    --island-icon-size: var(--icon-size);
    animation: none !important;
  }
  island-badge-icon { --main-color: var(--island-ink); }

  /* 大图标：带控件（滑条、按钮）的卡片，图标占满左侧一整列。
     卡片太窄（竖排小方块）时不启用，保持图标在上、文字在下。 */
  ha-card { position: relative; container-type: inline-size; }
  @container (min-width: 280px) {
    island-card:has(> .actions) {
      --island-hero-w: clamp(70px, 23cqi, 100px);
      --island-icon-pos: static;
      --island-si-pl: 0px;
      --island-si-pt: 10px;
      /* 右侧空间变窄，按钮略小、间距略紧，保持圆形 */
      --control-height: 38px;
      --control-spacing: 8px;
      padding-left: calc(var(--island-hero-w) + 10px);
    }
    island-card:has(> .actions) island-shape-icon[slot="icon"] {
      position: absolute;
      left: 10px;
      top: 10px;
      bottom: 10px;
      width: var(--island-hero-w);
      --icon-size: 100%;
    }
    island-card:has(> .actions) island-shape-icon[slot="icon"] > island-state-icon {
      --island-icon-size: var(--island-hero-w);
      --island-icon-w: 100%;
      --island-icon-h: 100%;
      --island-art-scale: 76%;
    }
    island-card:has(> .actions) > .actions { padding: 0 12px 10px; }
    island-card:has(> .actions) island-badge-icon[slot="badge"] {
      position: absolute;
      top: 6px;
      left: calc(var(--island-hero-w) - 4px);
      --badge-size: 24px;
    }
  }
`;

const surfaces: Record<string, CSSResult> = {
  "src/shared/button.ts": css`
    :host {
      --bg-color: color-mix(in srgb, var(--island-paper-hi) 70%, var(--island-paper));
      --bg-color-disabled: var(--island-well);
      --icon-color: var(--island-ink);
      --icon-color-disabled: var(--island-tile-off-ink);
    }
    .button {
      position: relative;
      font-family: var(--island-font);
      box-shadow: 0 4px 0 color-mix(in srgb, var(--island-accent, #3ec2ae) 50%, var(--island-edge));
      transition: background-color .25s cubic-bezier(.4, 0, .2, 1), box-shadow .15s cubic-bezier(.4, 0, .2, 1);
    }
    .button:not(:disabled):hover { filter: brightness(1.04); }
    .button:not(:disabled):active { box-shadow: 0 1px 0 color-mix(in srgb, var(--island-accent, #3ec2ae) 50%, var(--island-edge)); }
    .button:disabled { box-shadow: none; }
    :host([data-island-primary]) .button:not(:disabled) { background: #3ec2ae; --icon-color: #fff; }
  `,
  "src/shared/input-number.ts": css`
    :host { --bg-color: var(--island-well); --icon-color: var(--island-ink); --text-color: var(--island-ink); }
    .container { border-radius: 999px; box-shadow: inset 0 3px 0 rgba(91, 65, 40, .08); padding: 5px; gap: 4px; }
    .button {
      position: relative;
      height: 100%;
      aspect-ratio: 1;
      padding: 0 !important;
      border-radius: 50%;
      background: var(--island-paper-hi);
      box-shadow: 0 3px 0 color-mix(in srgb, var(--island-accent, #3ec2ae) 50%, var(--island-edge));
      transition: box-shadow .15s cubic-bezier(.4, 0, .2, 1);
    }
    .button:not(:disabled):active { box-shadow: 0 1px 0 var(--island-edge); }
    .button:disabled { box-shadow: none; opacity: .5; }
    .value { font-family: var(--island-font); font-size: 18px; font-weight: 900; font-variant-numeric: tabular-nums; }
    .container:focus-within { outline: 3px solid #ffcc3d; outline-offset: 2px; }
  `,
  "src/shared/slider.ts": css`
    :host { --bg-color: var(--island-well); }
    /* 不透明底，滑条空的部分不再透出卡片的波点 */
    .slider { border-radius: 999px; background: var(--island-paper-hi); }
    .slider::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow: inset 0 3px 0 rgba(91, 65, 40, .1);
      pointer-events: none;
    }
    .slider .slider-track-active {
      background-image: linear-gradient(to bottom, rgba(255, 255, 255, .38) 0 32%, transparent 32%);
      transition-timing-function: cubic-bezier(.4, 0, .2, 1);
    }
    .slider .slider-track-indicator {
      top: 6px;
      bottom: 6px;
      width: 12px;
      border-radius: 999px;
      left: calc(var(--value, 0) * (100% - 18px) + 3px);
      box-shadow: 0 2px 0 rgba(91, 65, 40, .25);
    }
    .slider .slider-track-indicator:after { display: none; }
    .slider:focus-visible { outline: 3px solid #ffcc3d; outline-offset: 2px; }
  `,
  "src/shared/shape-icon.ts": css`
    :host { --shape-color: var(--island-well); --shape-color-disabled: var(--island-well); }
    .shape { border-radius: var(--icon-border-radius, 32%); }
    ::slotted(island-state-icon) { --island-icon-size: var(--icon-size); }
  `,
  "src/shared/state-item.ts": css`
    .container { padding: var(--island-si-pt, 12px) 14px 10px; padding-left: var(--island-si-pl, 14px); gap: 12px; }
    .icon { position: var(--island-icon-pos, relative); }
    .container.vertical {
      --icon-size: 54px;
      --island-pill-align: center;
      gap: 6px;
      padding: 12px 8px 10px;
    }
  `,
  "src/shared/state-info.ts": css`
    .primary { font-family: var(--island-font); color: var(--island-ink); }
    .secondary {
      align-self: var(--island-pill-align, flex-start);
      max-width: 100%;
      box-sizing: border-box;
      margin-top: 3px;
      padding: 1px 9px 2px;
      border-radius: 12px 13px 13px 4px;
      background: var(--island-pill-bg, color-mix(in srgb, var(--island-accent, #3ec2ae) 34%, var(--island-paper)));
      color: var(--island-pill-ink, var(--island-ink));
      font-family: var(--island-font);
    }
    .multiline_secondary { white-space: pre-wrap; }
  `,
  "src/shared/chip.ts": css`
    ha-card {
      position: relative;
      background: var(--island-paper);
      border-radius: var(--island-blob, 999px);
      box-shadow: 0 4px 0 var(--island-edge), 0 10px 16px -10px rgba(91, 65, 40, .35);
      font-family: var(--island-font);
    }
    /* Press feedback lives on .content/.avatar through the motion controller. */
    ::slotted(island-state-icon) { --island-icon-size: var(--chip-icon-size); display: flex; }
    ::slotted(span) { color: var(--island-ink); }
    ::slotted(*:not(:last-child)) { margin-right: 0.22em; }
  `,
  "src/shared/shape-avatar.ts": css`
    img, .shape, .picture { border-radius: 32%; }
  `,
  "src/shared/badge-icon.ts": css`
    .badge { border-radius: 50%; box-shadow: 0 0 0 2.5px var(--island-paper); }
  `,
  "src/cards/select-card/controls/select-option-control.ts": css`
    ha-control-select-menu {
      border-radius: 999px;
      box-shadow: 0 4px 0 color-mix(in srgb, var(--island-accent, #3ec2ae) 50%, var(--island-edge));
      --control-select-menu-border-radius: 999px;
      --control-select-menu-background-color: var(--island-paper-hi);
      --control-select-menu-background-opacity: 1;
      --control-select-menu-text-color: var(--island-ink);
      --control-select-menu-font-weight: 800;
      --mdc-theme-primary: var(--island-accent);
      font-family: var(--island-font);
      font-weight: 800;
    }
  `,
  "src/cards/title-card/title-card.ts": css`
    .header { background: none; border: none; box-shadow: none; padding: var(--title-padding); }
    .header:hover { transform: none; }
    /* 折纸飘带：按 animal-island-ui 3.0.3 Title(ribbon) 的几何换算，全部用 em，随字号缩放。
       官方 5 层 = 正面 + 左右燕尾 + 左右折痕；这里只用 h1 的两个伪元素：
       ::after 画正面，::before 用四层渐变画两条燕尾和两块折痕三角，再用 clip-path 剪出燕尾缺口。 */
    .title {
      --rf: var(--island-title-front, #f7cd67);
      --rb: var(--island-title-back, #d4a030);
      --rk: var(--island-title-fold, #8a6010);
      --rt: var(--island-title-text, #725d42);
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      min-height: 2em;
      margin: 0 0.6em 0.4em !important;
      padding: 0.11em 1.6em 0;
      color: var(--rt);
      font-family: var(--island-font);
      letter-spacing: 0.04em;
      text-shadow: 0 0.04em 0.08em rgba(0, 0, 0, 0.05);
      filter: drop-shadow(0 0.08em 0.12em rgba(0, 0, 0, 0.05));
    }
    .title::before, .title::after { content: ""; position: absolute; pointer-events: none; }
    .title::after {
      inset: 0 0.1em;
      z-index: -1;
      background: var(--rf);
      border-radius: 0.2em;
      transform: perspective(11.5em) rotateX(3deg);
      box-shadow: inset 0 -0.06em rgba(0, 0, 0, 0.05);
    }
    .title::before {
      z-index: -2;
      left: -0.6em;
      right: -0.6em;
      bottom: -0.4em;
      height: 1.7em;
      background:
        linear-gradient(to bottom left, var(--rk) 50%, transparent 50%) left 0.75em bottom 0 / 0.95em 0.45em no-repeat,
        linear-gradient(to bottom right, var(--rk) 50%, transparent 50%) right 0.76em bottom 0 / 0.95em 0.45em no-repeat,
        linear-gradient(var(--rb), var(--rb)) left / 1.7em 100% no-repeat,
        linear-gradient(var(--rb), var(--rb)) right / 1.7em 100% no-repeat;
      clip-path: polygon(0 0, 100% 0, calc(100% - 0.51em) 50%, 100% 100%, 0 100%, 0.51em 50%);
    }
    .subtitle { margin: 4px 14px 0 !important; font-family: var(--island-font); }
    .actionable { border-radius: 12px; }
  `,
  /* 调色条：色相位置不变，只换成低饱和的糖果色，免得刺眼 */
  "src/cards/light-card/controls/light-color-control.ts": css`
    island-slider {
      --gradient: linear-gradient(to right, #ffb0aa 0%, #ffe9a0 17%, #bfeab0 33%, #b3e8ee 50%, #b6c6fa 66%, #e9b8f2 83%, #ffb0aa 100%);
    }
  `,
  /* 下拉框展开时，整张卡浮到相邻卡片上面，菜单不会被下一张卡盖住 */
  "src/cards/select-card/select-card.ts": css`
    ha-card:focus-within, ha-card:has(island-select-option-control:focus-within) { z-index: 5; }
  `,
  /* 播放器一排按钮多，卡片不够宽时不用大图标，免得按钮被挤扁 */
  "src/cards/media-player-card/media-player-card.ts": css`
    @container (max-width: 419px) {
      island-card:has(> .actions) {
        --island-icon-pos: relative;
        --island-si-pl: 16px;
        --island-si-pt: 12px;
        --control-height: 40px;
        --control-spacing: 10px;
        padding-left: 0;
      }
      island-card:has(> .actions) island-shape-icon[slot="icon"] {
        position: static;
        width: auto;
        --icon-size: 46px;
      }
      island-card:has(> .actions) island-shape-icon[slot="icon"] > island-state-icon {
        --island-icon-size: 46px;
        --island-icon-w: 1em;
        --island-icon-h: 1em;
        --island-art-scale: 84%;
      }
      island-card:has(> .actions) > .actions { padding-left: 12px; padding-right: 12px; }
    }
  `,
  "src/cards/empty-card/empty-card.ts": css`
    ha-card { background: none; box-shadow: none; }
  `,
  "src/cards/chips-card/chips-card.ts": css`
    ha-card { background: none; border: none; border-radius: 0; box-shadow: none; }
    ha-card:hover { transform: none; }
    .chip-container { padding: 4px 2px 8px; }
    .chip-container > *:nth-child(4n + 1) { --island-blob: 46% 54% 50% 44% / 58% 52% 48% 42%; --island-tilt: -2deg; }
    .chip-container > *:nth-child(4n + 2) { --island-blob: 54% 46% 42% 56% / 48% 58% 42% 52%; --island-tilt: 2deg; }
    .chip-container > *:nth-child(4n + 3) { --island-blob: 50% 50% 56% 44% / 54% 46% 54% 46%; --island-tilt: -1deg; }
    .chip-container > *:nth-child(4n + 4) { --island-blob: 44% 56% 48% 52% / 46% 54% 46% 54%; --island-tilt: 1.5deg; }
  `,
  "src/cards/template-card/template-card.ts": css`
    .content { padding-inline: 16px; gap: 14px; }
    .vertical { padding: 16px 10px; }
    ha-tile-icon {
      --tile-icon-size: 52px;
      --tile-icon-border-radius: 32%;
      --tile-icon-color: transparent;
    }
    island-state-icon[slot="icon"] { --island-icon-size: 52px; }
    ha-tile-info {
      font-family: var(--island-font);
      --tile-info-primary-font-size: 16px;
      --tile-info-primary-font-weight: 800;
      --tile-info-primary-color: var(--island-ink);
      --tile-info-secondary-font-size: 12.5px;
      --tile-info-secondary-font-weight: 700;
      --tile-info-secondary-color: var(--island-ink);
    }
    span[slot="secondary"] {
      display: inline-block;
      max-width: 100%;
      box-sizing: border-box;
      margin-top: 4px;
      padding: 2px 10px 3px;
      border-radius: 12px 13px 13px 4px;
      background: var(--island-pill-bg, color-mix(in srgb, var(--island-accent) 34%, var(--island-paper)));
      color: var(--island-pill-ink, var(--island-ink));
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: top;
    }
    hui-card-features { --feature-border-radius: 999px; }
  `,
  "src/badges/template/template-badge.ts": css`
    .badge {
      overflow: visible;
      background: var(--island-paper);
      border: none;
      border-radius: 52% 48% 50% 46% / 60% 56% 44% 40%;
      box-shadow: 0 4px 0 var(--island-edge), 0 10px 16px -10px rgba(91, 65, 40, .35);
      font-family: var(--island-font);
    }
    .badge::after {
      content: "";
      position: absolute;
      left: 22px;
      bottom: -9px;
      width: 13px;
      height: 11px;
      background: var(--island-edge);
      clip-path: polygon(0 0, 100% 0, 15% 100%);
      pointer-events: none;
    }
    .badge:focus-visible { box-shadow: 0 4px 0 var(--island-edge); outline: 3px solid #ffcc3d; outline-offset: 2px; }
    island-state-icon { --island-icon-size: 24px; }
    .content { font-weight: 800; color: var(--island-ink); }
    .label { font-weight: 700; color: var(--island-ink-soft); }
  `,
};

export function islandSkin(sourcePath: string): CSSResult {
  const path = sourcePath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (path.includes("-editor") || path.includes("/ha/")) return css``;
  const isRoot = path === "src/utils/base-element.ts" || path === "src/cards/template-card/template-card.ts" || path === "src/badges/template/template-badge.ts";
  const isCard = /^src\/cards\/[^/]+\/[^/]+-card\.ts$/.test(path);
  // unsafeCSS 只拼接本文件里写死的样式，不含任何用户输入。
  return unsafeCSS([
    isRoot ? tokens.cssText : "",
    isRoot ? theme.cssText : "",
    isCard ? card.cssText : "",
    surfaces[path]?.cssText || "",
    focus.cssText,
  ].join("\n"));
}

export default islandSkin;
