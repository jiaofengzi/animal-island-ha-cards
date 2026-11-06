/**
 * 手机底部导航栏。用法：在每个视图（页面）的最后放一张
 *   type: custom:island-navbar-card
 *   items:
 *     - { name: 首页, icon: island:house, path: /lovelace/home }
 *     - { name: 客厅, icon: island:sofa, path: /lovelace/living }
 *   show: mobile        # mobile（窄屏才显示，默认）| always
 * 栏固定在屏幕底部；卡片自身留出同样高度的空白，保证页面最后一张卡不被挡住。
 * 点击后用 HA 自己的导航方式切换视图（history.pushState + location-changed 事件）。
 */
import { css, html, LitElement, nothing, unsafeCSS } from "lit";
import { ISLAND_FONT_STACK } from "./fonts";
import { HassThemeLike, registerCustomCard } from "./globals";
import "./state-icon";

interface NavItem { name: string; icon?: string; path: string }
interface NavConfig { items?: NavItem[]; show?: "mobile" | "always" }

// 只有手机宽度才显示；平板按电脑处理，所有分区在一个页面里
const NARROW = "(max-width: 600px)";

export function islandNavigate(path: string) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

class IslandNavbarCard extends LitElement {
  static properties = { _config: { state: true }, _path: { state: true }, _narrow: { state: true }, forceMobile: { type: Boolean, attribute: "force-mobile" } };

  declare _config: NavConfig;
  declare _path: string;
  declare _narrow: boolean;
  declare forceMobile: boolean;
  set hass(h: HassThemeLike | undefined) { this.toggleAttribute("data-dark", Boolean(h?.themes?.darkMode)); }
  private _mq = typeof window !== "undefined" ? window.matchMedia(NARROW) : undefined;
  private _onLocation = () => { this._path = location.pathname + location.search; };
  private _onMq = () => { this._narrow = Boolean(this._mq?.matches); };

  constructor() {
    super();
    this._config = {};
    this._path = typeof location !== "undefined" ? location.pathname + location.search : "";
    this._narrow = Boolean(this._mq?.matches);
    this.forceMobile = false;
  }

  setConfig(config: NavConfig) {
    if (!Array.isArray(config?.items) || config.items.length === 0) throw new Error("island-navbar-card 需要 items 列表");
    this._config = config;
  }
  getCardSize() { return 1; }
  getGridOptions() { return { columns: 12, rows: "auto", min_rows: 0 }; }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
    this._mq?.addEventListener("change", this._onMq);
    this._onLocation();
  }
  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
    this._mq?.removeEventListener("change", this._onMq);
    super.disconnectedCallback();
  }

  private _visible() { return this._config.show === "always" || this.forceMobile || this._narrow; }

  private _isActive(item: NavItem, index: number) {
    const items = this._config.items ?? [];
    const target = (p: string) => { const u = new URL(p, location.href); return u.pathname + u.search; };
    const matches = items.map((it) => { const t = target(it.path); return this._path === t || this._path.startsWith(t + "/"); });
    if (!matches.some(Boolean)) return index === 0;
    return matches[index];
  }

  protected render() {
    this.toggleAttribute("data-visible", this._visible());
    if (!this._visible()) return nothing;
    const items = this._config.items ?? [];
    return html`
      <div class="spacer"></div>
      <nav class="bar" aria-label="页面">
        ${items.map((item, i) => {
          const active = this._isActive(item, i);
          return html`
            <a class="item ${active ? "active" : ""}" href=${item.path} aria-current=${active ? "page" : "false"}
               @click=${(e: MouseEvent) => { e.preventDefault(); if (!active) islandNavigate(item.path); }}>
              <span class="bump"></span>
              <island-state-icon bare .icon=${item.icon ?? "island:house"}></island-state-icon>
              <span class="label">${item.name}</span>
            </a>`;
        })}
      </nav>`;
  }

  static styles = css`
    :host { display: none; }
    :host([data-visible]) { display: block; }
    .spacer { height: 64px; }
    :host([data-dark]) { --island-nav-color: #2a7f78; --island-nav-active: #1f6660; }
    .bar {
      position: fixed;
      z-index: 6;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 64px;
      padding: 0 6px env(safe-area-inset-bottom);
      background: var(--island-nav-color, #3ec2ae);
      font-family: ${unsafeCSS(ISLAND_FONT_STACK)};
      box-shadow: 0 -4px 0 rgba(0, 0, 0, .06);
    }
    .item {
      position: relative;
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 2px;
      padding-bottom: 8px;
      color: #fff;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
    }
    .bump {
      position: absolute;
      left: 4px;
      right: 4px;
      top: -12px;
      bottom: 0;
      border-radius: 26px 26px 0 0;
      background: var(--island-nav-active, #2a9c8b);
      transform: translateY(100%);
      transition: transform .32s cubic-bezier(.3, 1.4, .5, 1);
    }
    .active .bump { transform: none; }
    island-state-icon {
      position: relative;
      --island-icon-size: 30px;
      transition: transform .32s cubic-bezier(.3, 1.6, .5, 1);
    }
    .active island-state-icon { transform: translateY(-6px) scale(1.4) rotate(-6deg); }
    .label {
      position: relative;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .5px;
    }
    .item:not(.active):active island-state-icon { transform: scale(.88); }
    .item:focus-visible { outline: 3px solid #ffcc3d; outline-offset: -3px; border-radius: 16px; }
    @media (prefers-reduced-motion: reduce) { .bump, island-state-icon { transition: none; } }
  `;
}

if (!customElements.get("island-navbar-card")) customElements.define("island-navbar-card", IslandNavbarCard);
registerCustomCard({ type: "island-navbar-card", name: "Animal Island 底部导航", description: "手机上固定在屏幕底部的页面切换栏。" });
