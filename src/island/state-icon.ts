/**
 * <island-state-icon>：替换卡片里的 <ha-state-icon>。
 * 认得的图标画成彩色插画方块；认不得的仍交给 HA 原生 ha-state-icon，只是放进同款彩色方块里，
 * 这样用户配置的任何图标都会显示，不会被换成别的意思。
 */
import { css, html, LitElement, PropertyValues } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { ART, INACTIVE, resolveArt, resolveTone, StateLike, TONES } from "./art";

const LIVE_STATES = new Set(["on", "playing", "cleaning", "returning", "heat", "cool", "heat_cool", "auto", "dry", "fan_only", "triggered", "opening", "closing", "unlocking", "locking", "arming", "pending"]);

export class IslandStateIcon extends LitElement {
  static properties = {
    hass: { attribute: false },
    stateObj: { attribute: false },
    icon: {},
    stateValue: { attribute: false },
  };

  /** 原样转交给 HA 的 ha-state-icon，本组件不读取它。 */
  declare hass: unknown;
  declare stateObj?: StateLike;
  declare icon?: string;
  declare stateValue?: string;
  private _wasInactive?: boolean;

  protected willUpdate(): void {
    const s = this.stateObj;
    const state = this.stateValue ?? s?.state;
    const art = resolveArt(this.icon, s);
    const inactive = s ? INACTIVE.has(state ?? "") : false;
    const live = !inactive && (!s || LIVE_STATES.has(state ?? ""));
    this.toggleAttribute("data-inactive", inactive);
    this.toggleAttribute("data-unavailable", state === "unavailable" || state === "unknown");
    this.toggleAttribute("data-live", live);
    this.toggleAttribute("data-art", Boolean(art));
    this.dataset.tone = resolveTone(art, s);
  }

  protected updated(changed: PropertyValues): void {
    const inactive = this.hasAttribute("data-inactive");
    if (this._wasInactive === true && !inactive) {
      const tile = this.renderRoot.querySelector(".tile");
      tile?.classList.remove("pop");
      void (tile as HTMLElement | null)?.offsetWidth;
      tile?.classList.add("pop");
    }
    this._wasInactive = inactive;
    super.updated(changed);
  }

  private _tileColor(): string {
    // Upstream resolves icon_color, use_light_color and theme/state colors.
    // Inherit that result instead of reading RGB attributes independently.
    const fallback = TONES[this.dataset.tone as keyof typeof TONES] ?? TONES.teal;
    return `var(--icon-color, ${fallback})`;
  }

  protected render() {
    const art = resolveArt(this.icon, this.stateObj);
    const svg = art ? ART[art]?.svg : undefined;
    return html`<div class="tile" style="--tile:${this._tileColor()}" @animationend=${(e: AnimationEvent) => e.animationName === "island-pop" && (e.currentTarget as HTMLElement).classList.remove("pop")}>
      ${svg
        ? html`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${unsafeSVG(svg)}</svg>`
        : html`<ha-state-icon .hass=${this.hass} .stateObj=${this.stateObj} .icon=${this.icon} .stateValue=${this.stateValue}></ha-state-icon>`}
    </div>`;
  }

  static styles = css`
    :host {
      --_size: var(--island-icon-size, var(--mdc-icon-size, 24px));
      display: inline-block;
      position: relative;
      flex: none;
      font-size: var(--_size);
      width: var(--island-icon-w, 1em);
      height: var(--island-icon-h, 1em);
      line-height: 0;
      vertical-align: middle;
    }
    .tile {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      /* 微微不规则的圆角方块，纯色，不加渐变和高光 */
      border-radius: 34% 38% 36% 40% / 38% 34% 40% 36%;
      overflow: hidden;
      background: var(--tile);
      transition: background-color .35s cubic-bezier(.4, 0, .2, 1);
    }
    svg { position: relative; width: var(--island-art-scale, 84%); height: var(--island-art-scale, 84%); overflow: visible; transition: filter .35s cubic-bezier(.4, 0, .2, 1); }
    ha-state-icon {
      position: relative;
      color: #fff;
      --mdc-icon-size: .6em;
    }
    /* 关着：保留一点自身的颜色，一眼还能认出是哪类设备；不可用才是彻底的灰 */
    :host([data-inactive]) .tile { background: color-mix(in srgb, var(--tile) 24%, var(--island-tile-off, #ebe3cd)); }
    :host([data-unavailable]) .tile { background: var(--island-tile-off, #ebe3cd); }
    /* bare：只画插画，不要底色方块（用在底部导航栏这类有自己底色的地方） */
    :host([bare]) .tile { background: none; overflow: visible; }
    :host([bare]) svg { width: 100%; height: 100%; }
    :host([data-inactive]) svg { filter: grayscale(.4) opacity(.85); }
    /* 关着时不画光线、蒸汽，开着才发光 */
    :host([data-inactive]) .glow, :host([data-inactive]) .steam { opacity: 0; }
    :host([data-inactive]) ha-state-icon { color: color-mix(in srgb, var(--tile) 65%, var(--island-tile-off-ink, #b3a689)); filter: none; }
    :host([data-unavailable]) svg { filter: grayscale(.9) opacity(.6); }
    :host([data-unavailable]) ha-state-icon { color: var(--island-tile-off-ink, #b3a689); }

    .pop { animation: island-pop .35s cubic-bezier(.4, 0, .2, 1); }
    @keyframes island-pop { 0% { transform: scale(.82); } 55% { transform: scale(1.12); } 100% { transform: scale(1); } }

    @media (prefers-reduced-motion: no-preference) {
      :host([data-live]) .spin { animation: island-spin 1.1s linear infinite; transform-box: view-box; transform-origin: 24px 20px; }
      :host([data-live]) .glow { animation: island-glow 1.8s ease-in-out infinite; }
      :host([data-live]) .wind path { animation: island-wind 1.4s ease-in-out infinite; }
      :host([data-live]) .wind path:nth-child(2) { animation-delay: .2s; }
      :host([data-live]) .wind path:nth-child(3) { animation-delay: .4s; }
      :host([data-live]) .notes .n1 { animation: island-note 1.8s ease-in-out infinite; }
      :host([data-live]) .notes .n2 { animation: island-note 1.8s ease-in-out .9s infinite; }
      :host(:not([data-live])) .notes { opacity: 0; }
      :host([data-live]) .wiggle { animation: island-wiggle 1.6s ease-in-out infinite; transform-box: view-box; transform-origin: 24px 26px; }
      :host([data-live]) .puff { animation: island-puff 2.2s ease-in-out infinite; transform-box: view-box; transform-origin: 25px 12px; }
      :host([data-live]) .steam { animation: island-glow 1.6s ease-in-out infinite; }
      :host([data-live]) .ring { animation: island-ring .9s ease-in-out infinite; transform-box: view-box; transform-origin: 24px 9px; }
      :host([data-live]) .rays { animation: island-spin 14s linear infinite; transform-box: view-box; transform-origin: 24px 24px; }
      :host([data-live]) .bob { animation: island-bob 2.4s ease-in-out infinite; }
      :host([data-live]) .drops path { animation: island-drop 1.2s ease-in infinite; }
      :host([data-live]) .drops path:nth-child(2) { animation-delay: .4s; }
      :host([data-live]) .drops path:nth-child(3) { animation-delay: .8s; }
    }
    @keyframes island-spin { to { transform: rotate(360deg); } }
    @keyframes island-glow { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
    @keyframes island-wind { 0%, 100% { transform: translateY(0); opacity: .5; } 50% { transform: translateY(2px); opacity: 1; } }
    @keyframes island-note { 0% { transform: translateY(3px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(-6px); opacity: 0; } }
    @keyframes island-wiggle { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
    @keyframes island-puff { 0%, 100% { transform: scale(.85); opacity: .6; } 50% { transform: scale(1.08) translateY(-1.5px); opacity: 1; } }
    @keyframes island-ring { 0%, 100% { transform: rotate(-12deg); } 50% { transform: rotate(12deg); } }
    @keyframes island-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    @keyframes island-drop { 0% { transform: translateY(-3px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(4px); opacity: 0; } }
  `;
}

if (!customElements.get("island-state-icon")) customElements.define("island-state-icon", IslandStateIcon);
