/**
 * 手机底部导航栏。用法：在每个视图（页面）的最后放一张
 *   type: custom:island-navbar-card
 *   items:
 *     - { name: 首页, icon: island:house, path: /lovelace/home }
 *     - { name: 客厅, icon: island:sofa, path: /lovelace/living }
 *   show: mobile        # mobile（窄屏才显示，默认）| always
 * 栏固定在屏幕底部；卡片自身留出同样高度的空白，保证页面最后一张卡不被挡住。
 * 电脑上 HA 左侧有侧边栏：栏只铺在仪表盘面板的宽度内（跟随侧边栏展开/收起），不盖住侧边栏。
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
  private _onLocation = () => { this._path = location.pathname + location.search + location.hash; };
  private _onMq = () => { this._narrow = Boolean(this._mq?.matches); };
  // 仪表盘面板（不含 HA 侧边栏）的左右边界，用来摆放固定定位的栏
  private _panel?: Element;
  private _ro?: ResizeObserver;
  private _place = () => {
    if (typeof this.style?.setProperty !== "function") return;
    const r = this._panel?.getBoundingClientRect();
    this.style.setProperty("--island-nav-left", r ? `${Math.max(0, r.left)}px` : "0px");
    this.style.setProperty("--island-nav-right", r ? `${Math.max(0, window.innerWidth - r.right)}px` : "0px");
  };
  private _findPanel(): Element | undefined {
    let node: Node | null = this.parentNode ?? null;
    while (node) {
      // hui-view 与整个仪表盘面板同宽同位，而且侧边栏收起/展开时它的 ResizeObserver 会触发
      // （外层的 hui-root、ha-panel-lovelace 尺寸变了却不触发）
      if (node instanceof Element && ["hui-view", "hui-root", "ha-panel-lovelace"].includes(node.localName)) return node;
      node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null);
    }
    return undefined;
  }

  constructor() {
    super();
    this._config = {};
    this._path = typeof location !== "undefined" ? location.pathname + location.search + location.hash : "";
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
    window.addEventListener("resize", this._place);
    this._onLocation();
    // 连接后才能找到外层面板；等一帧让 HA 把卡片挂进视图
    const nextFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame
      : typeof setTimeout === "function" ? (fn: () => void) => setTimeout(fn, 0) : undefined;
    nextFrame?.(() => {
      if (!this.isConnected) return;
      this._panel = this._findPanel();
      if (this._panel && typeof ResizeObserver !== "undefined") {
        this._ro = new ResizeObserver(this._place);
        this._ro.observe(this._panel);
      }
      this._place();
    });
  }
  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
    this._mq?.removeEventListener("change", this._onMq);
    window.removeEventListener("resize", this._place);
    this._ro?.disconnect();
    this._ro = undefined;
    this._panel = undefined;
    super.disconnectedCallback();
  }

  private _visible() { return this._config.show === "always" || this.forceMobile || this._narrow; }

  private _target(path: string) {
    const url = new URL(path, location.href);
    return url.pathname + url.search + url.hash;
  }

  private _activeIndex() {
    const targets = (this._config.items ?? []).map((item) => this._target(item.path));
    const exact = targets.indexOf(this._path);
    if (exact !== -1) return exact;
    // Prefer the nearest configured parent, never an arbitrary first item.
    return targets.reduce((best, target, index) =>
      this._path.startsWith(target.endsWith("/") ? target : target + "/") &&
      (best === -1 || target.length > targets[best].length) ? index : best, -1);
  }

  protected render() {
    this.toggleAttribute("data-visible", this._visible());
    if (!this._visible()) return nothing;
    const items = this._config.items ?? [];
    const activeIndex = this._activeIndex();
    return html`
      <div class="spacer"></div>
      <nav class="bar" aria-label="页面">
        ${items.map((item, i) => {
          const active = i === activeIndex;
          return html`
            <a class="item ${active ? "active" : ""}" href=${item.path} aria-current=${active ? "page" : "false"}
               @click=${(e: MouseEvent) => { e.preventDefault(); if (this._path !== this._target(item.path)) islandNavigate(item.path); }}>
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
      left: var(--island-nav-left, 0px);
      right: var(--island-nav-right, 0px);
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
      transition: transform .3s cubic-bezier(.4, 0, .2, 1);
    }
    .active .bump { transform: none; }
    island-state-icon {
      position: relative;
      --island-icon-size: 30px;
      transition: transform .3s cubic-bezier(.4, 0, .2, 1);
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
