// 预览专用：用最小实现代替 HA 前端内置元素（ha-card、ha-icon 等）。
// 只为了让卡片在没有 HA 的情况下能画出来，外观尽量贴近 HA 默认样式。
import * as mdi from "@mdi/js";

const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };

export function iconPath(icon) {
  if (!icon) return mdi.mdiHelpCircleOutline;
  const name = String(icon).replace(/^mdi:/, "");
  const key = "mdi" + name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return mdi[key] ?? mdi.mdiHelpCircleOutline;
}

function stateIcon(stateObj) {
  if (!stateObj) return "mdi:help-circle-outline";
  if (stateObj.attributes.icon) return stateObj.attributes.icon;
  const [domain] = stateObj.entity_id.split(".");
  const s = stateObj.state;
  const dc = stateObj.attributes.device_class;
  switch (domain) {
    case "light": return s === "on" ? "mdi:lightbulb" : "mdi:lightbulb-off";
    case "switch": return s === "on" ? "mdi:toggle-switch-variant" : "mdi:toggle-switch-variant-off";
    case "climate": return "mdi:thermostat";
    case "cover": return s === "closed" ? "mdi:curtains-closed" : "mdi:curtains";
    case "fan": return s === "on" ? "mdi:fan" : "mdi:fan-off";
    case "humidifier": return s === "on" ? "mdi:air-humidifier" : "mdi:air-humidifier-off";
    case "media_player": return s === "playing" ? "mdi:speaker-play" : s === "off" ? "mdi:speaker-off" : "mdi:speaker";
    case "vacuum": return "mdi:robot-vacuum";
    case "lock": return s === "locked" ? "mdi:lock" : s === "unlocked" || s === "open" ? "mdi:lock-open-variant" : "mdi:lock-clock";
    case "alarm_control_panel": return ({ disarmed: "mdi:shield-off", armed_home: "mdi:shield-home", armed_away: "mdi:shield-lock", armed_night: "mdi:shield-moon", triggered: "mdi:bell-ring" })[s] ?? "mdi:shield-outline";
    case "person": return s === "home" ? "mdi:account" : "mdi:account-arrow-right";
    case "number": return "mdi:ray-vertex";
    case "select": return "mdi:format-list-bulleted";
    case "update": return s === "on" ? "mdi:package-up" : "mdi:package";
    case "weather": return "mdi:weather-sunny";
    case "sensor": return dc === "temperature" ? "mdi:thermometer" : dc === "humidity" ? "mdi:water-percent" : "mdi:eye";
    default: return "mdi:bookmark";
  }
}

const svg = (path) => `<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" role="img" aria-hidden="true"><path d="${path}"></path></svg>`;
const iconCss = `:host{display:inline-flex;align-items:center;justify-content:center;position:relative;vertical-align:middle;fill:currentcolor;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)}svg{width:100%;height:100%;pointer-events:none;display:block}`;

class BaseIcon extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  static get observedAttributes() { return ["icon"]; }
  attributeChangedCallback() { this.paint(); }
  connectedCallback() { this.paint(); }
  set icon(v) { this._icon = v; this.paint(); }
  get icon() { return this._icon ?? this.getAttribute("icon"); }
  set path(v) { this._path = v; this.paint(); }
  get path() { return this._path; }
  resolve() { return this.path ?? iconPath(this.icon); }
  paint() { this.shadowRoot.innerHTML = `<style>${iconCss}</style>${svg(this.resolve())}`; }
}
define("ha-icon", class extends BaseIcon {});
define("ha-svg-icon", class extends BaseIcon {});
define("ha-state-icon", class extends BaseIcon {
  set stateObj(v) { this._stateObj = v; this.paint(); }
  get stateObj() { return this._stateObj; }
  set hass(v) { this._hass = v; }
  resolve() { return iconPath(this.icon || stateIcon(this._stateObj)); }
});

define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>
      :host{background:var(--ha-card-background,var(--card-background-color,#fff));
      box-shadow:var(--ha-card-box-shadow,none);box-sizing:border-box;
      border-radius:var(--ha-card-border-radius,12px);border-width:var(--ha-card-border-width,1px);
      border-style:solid;border-color:var(--ha-card-border-color,var(--divider-color,#e0e0e0));
      color:var(--primary-text-color);display:block;transition:all .3s ease-out;position:relative}
    </style><slot></slot>`;
  }
});

define("ha-ripple", class extends HTMLElement {});
define("hui-card-features", class extends HTMLElement {});

define("ha-tile-icon", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>
      :host{--tile-icon-color:var(--disabled-color,#bdbdbd);--tile-icon-size:36px;position:relative;display:flex;flex:none;
        width:var(--tile-icon-size);height:var(--tile-icon-size);border-radius:var(--tile-icon-border-radius,18px);
        user-select:none;-webkit-tap-highlight-color:transparent}
      .container{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;
        border-radius:var(--tile-icon-border-radius,18px);color:var(--tile-icon-color);position:relative;
        transition:color .18s ease-in-out}
      .container::before{content:"";position:absolute;inset:0;background-color:var(--tile-icon-color);
        opacity:var(--tile-icon-opacity,.2);transition:background-color .18s ease-in-out}
      ::slotted([slot=icon]){--mdc-icon-size:24px;position:relative}
      img{width:100%;height:100%;object-fit:cover}
      :host([interactive]) {cursor:pointer}
    </style><div class="container"><slot name="icon"></slot></div><slot></slot>`;
    this.addEventListener("click", (e) => {
      if (!this.interactive) return;
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent("action", { detail: { action: "tap" }, bubbles: true, composed: true }));
    });
  }
  set interactive(v) { this._interactive = v; this.toggleAttribute("interactive", !!v); }
  get interactive() { return this._interactive; }
  set imageUrl(v) {
    this._imageUrl = v;
    const c = this.shadowRoot.querySelector(".container");
    c.querySelector("img")?.remove();
    if (v) { const i = document.createElement("img"); i.src = v; c.append(i); }
  }
});

define("ha-tile-badge", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>
      :host{position:absolute;top:-3px;right:-3px;display:flex;align-items:center;justify-content:center;
        width:16px;height:16px;border-radius:8px;background:var(--badge-color,var(--primary-color));color:#fff;
        font-size:10px;--mdc-icon-size:12px;font-weight:700}
    </style><slot></slot>`;
  }
});

define("ha-tile-info", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `<style>
      :host{display:flex;flex-direction:column;justify-content:center;min-width:0}
      .p,.s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .p{font-size:var(--tile-info-primary-font-size,14px);font-weight:var(--tile-info-primary-font-weight,500);
        line-height:var(--tile-info-primary-line-height,20px);color:var(--tile-info-primary-color,var(--primary-text-color))}
      .s{font-size:var(--tile-info-secondary-font-size,12px);font-weight:var(--tile-info-secondary-font-weight,400);
        line-height:var(--tile-info-secondary-line-height,16px);color:var(--tile-info-secondary-color,var(--primary-text-color))}
    </style><div class="p"><slot name="primary"></slot></div><div class="s"><slot name="secondary"></slot></div>`;
  }
});

define("ha-control-select-menu", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._open = false;
    this.options = [];
    this.value = "";
  }
  set options(v) { this._options = v; this.paint(); }
  get options() { return this._options; }
  set value(v) { this._value = v; this.paint(); }
  get value() { return this._value; }
  paint() {
    if (!this.shadowRoot) return;
    const opts = this._options ?? [];
    const current = opts.find((o) => o.value === this._value)?.label ?? this._value ?? "";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;position:relative;height:var(--control-select-menu-height,48px)}
      button.sel{all:unset;box-sizing:border-box;width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;
        padding:0 16px;border-radius:var(--control-select-menu-border-radius,10px);cursor:pointer;
        background:var(--control-select-menu-background-color,rgba(127,127,127,.15));color:var(--control-select-menu-text-color,var(--primary-text-color));font:inherit}
      ul{position:absolute;z-index:10;left:0;right:0;top:calc(100% + 4px);margin:0;padding:6px;list-style:none;
        background:var(--card-background-color,#fff);border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.18)}
      li{padding:10px 12px;border-radius:8px;cursor:pointer}
      li:hover,li[aria-selected=true]{background:rgba(127,127,127,.12)}
      svg{width:20px;height:20px;fill:currentColor}
    </style>
    <button class="sel" part="button"><span>${current}</span>${svg(mdi.mdiMenuDown)}</button>
    ${this._open ? `<ul role="listbox">${opts.map((o) => `<li role="option" tabindex="-1" data-v="${o.value}" aria-selected="${o.value === this._value}">${o.label}</li>`).join("")}</ul>` : ""}`;
    if (this._open) this.shadowRoot.querySelector("button.sel").focus();
    if (!this._outside) {
      this._outside = (e) => { if (this._open && !e.composedPath().includes(this)) { this._open = false; this.paint(); } };
      document.addEventListener("click", this._outside);
    }
    this.shadowRoot.querySelector("button.sel").onclick = (e) => { e.stopPropagation(); this._open = !this._open; this.paint(); };
    this.shadowRoot.querySelectorAll("li").forEach((li) => {
      li.onclick = (e) => {
        e.stopPropagation();
        this._open = false;
        this.paint();
        this.dispatchEvent(new CustomEvent("wa-select", { detail: { item: { value: li.dataset.v } }, bubbles: true, composed: true }));
      };
    });
  }
});
