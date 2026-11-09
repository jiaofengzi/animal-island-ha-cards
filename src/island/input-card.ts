/**
 * 输入框卡片：一行小岛风格的文字输入框，右边带一个发送按钮，下面可放几个“常用语”胶囊。
 *   type: custom:island-input-card
 *   entity: input_text.ke_ting_bo_bao_wen_ben     # 输入的文字先写进这个 input_text
 *   name: 客厅播报
 *   placeholder: 想让音箱说什么？
 *   button: 播报                                   # 发送按钮上的字，默认“发送”
 *   action:                                         # 写入后执行的动作（可选）
 *     perform_action: script.turn_on
 *     target: { entity_id: script.ke_ting_bo_bao }
 *   presets:                                        # 常用语（可选）：点一下直接发送这句话
 *     - 开开门
 *     - 吃饭啦
 * 按回车也会发送。发送成功后清空输入框，按钮短暂显示“已发送”。
 */
import { css, html, LitElement, nothing, unsafeCSS } from "lit";
import { ISLAND_FONT_STACK } from "./fonts";
import { registerCustomCard } from "./globals";

interface ActionConfig { perform_action: string; target?: Record<string, unknown>; data?: Record<string, unknown> }
interface InputConfig {
  entity: string;
  name?: string;
  placeholder?: string;
  button?: string;
  action?: ActionConfig;
  presets?: string[];
}
interface HassLike {
  states: Record<string, { state: string; attributes: Record<string, unknown> } | undefined>;
  themes?: { darkMode?: boolean };
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
}

class IslandInputCard extends LitElement {
  static properties = { _config: { state: true }, _value: { state: true }, _status: { state: true } };
  declare _config: InputConfig;
  declare _value: string;
  declare _status: "" | "sending" | "sent" | "error";
  private _hass?: HassLike;
  private _timer?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this._config = { entity: "" };
    this._value = "";
    this._status = "";
  }

  set hass(h: HassLike) {
    this._hass = h;
    this.toggleAttribute("data-dark", Boolean(h?.themes?.darkMode));
  }

  setConfig(config: InputConfig) {
    if (!config?.entity || !config.entity.startsWith("input_text.")) throw new Error("island-input-card 需要一个 input_text 实体");
    if (config.action && typeof config.action.perform_action !== "string") throw new Error("action.perform_action 必须是 \"域.服务\"");
    this._config = config;
  }
  getCardSize() { return this._config.presets?.length ? 3 : 2; }
  getGridOptions() { return { columns: 12, rows: "auto", min_rows: 2 }; }

  private async _send(text: string) {
    const value = text.trim();
    const hass = this._hass;
    if (!value || !hass || this._status === "sending") return;
    this._status = "sending";
    try {
      await hass.callService("input_text", "set_value", { value }, { entity_id: this._config.entity });
      const act = this._config.action;
      if (act) {
        const [domain, service] = act.perform_action.split(".");
        await hass.callService(domain, service, act.data ?? {}, act.target);
      }
      this._value = "";
      this._status = "sent";
    } catch (err) {
      console.error("island-input-card", err);
      this._status = "error";
    }
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._status = ""; }, 1800);
  }

  protected render() {
    const c = this._config;
    const label = this._status === "sent" ? "已发送" : this._status === "error" ? "没发出去" : this._status === "sending" ? "发送中" : (c.button ?? "发送");
    return html`
      <ha-card>
        ${c.name ? html`<div class="name">${c.name}</div>` : nothing}
        <form class="row" @submit=${(e: Event) => { e.preventDefault(); void this._send(this._value); }}>
          <input
            .value=${this._value}
            placeholder=${c.placeholder ?? "想说点什么？"}
            aria-label=${c.name ?? c.placeholder ?? "输入"}
            enterkeyhint="send"
            @input=${(e: InputEvent) => { this._value = (e.target as HTMLInputElement).value; }}
          />
          <button type="submit" class="send ${this._status}" ?disabled=${!this._value.trim() || this._status === "sending"}>${label}</button>
        </form>
        ${c.presets?.length
          ? html`<div class="presets">${c.presets.map((p) => html`<button type="button" class="preset" @click=${() => this._send(p)}>${p}</button>`)}</div>`
          : nothing}
      </ha-card>`;
  }

  static styles = css`
    :host { display: block; --ink: #5b4128; --paper: #fffaf0; --well: #f3ead4; --edge: #e5d7b5; --accent: #3ec2ae; --accent-edge: #2a9c8b; }
    :host([data-dark]) { --ink: #f5eedb; --paper: #2d3a5e; --well: #222d4b; --edge: #18203a; }
    ha-card {
      padding: 12px 14px 14px;
      border-radius: var(--ha-card-border-radius, 24px);
      background: var(--paper);
      color: var(--ink);
      font-family: ${unsafeCSS(ISLAND_FONT_STACK)};
      box-shadow: 0 5px 0 var(--edge), 0 14px 22px -10px rgba(91, 65, 40, .32);
      border: none;
    }
    .name { font-size: 15px; font-weight: 900; margin: 0 4px 8px; }
    .row { display: flex; gap: 10px; align-items: stretch; }
    input {
      flex: 1;
      min-width: 0;
      height: 44px;
      box-sizing: border-box;
      padding: 0 16px;
      border: 2px solid transparent;
      border-radius: 999px;
      background: var(--well);
      color: var(--ink);
      font: 700 15px/1 inherit;
      font-family: inherit;
      outline: none;
      transition: border-color .2s;
    }
    input::placeholder { color: color-mix(in srgb, var(--ink) 45%, transparent); font-weight: 600; }
    input:focus { border-color: var(--accent); }
    button { font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .send {
      flex: none;
      min-width: 76px;
      height: 44px;
      padding: 0 18px;
      border: none;
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
      box-shadow: 0 4px 0 var(--accent-edge);
      transition: transform .12s, box-shadow .12s, background-color .2s;
    }
    .send:active:not([disabled]) { transform: translateY(3px); box-shadow: 0 1px 0 var(--accent-edge); }
    .send[disabled] { opacity: .55; cursor: default; }
    .send.sent { background: #6cc96a; box-shadow: 0 4px 0 #4f9e4d; opacity: 1; }
    .send.error { background: #f4695a; box-shadow: 0 4px 0 #c94a3d; opacity: 1; }
    .presets { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .preset {
      padding: 6px 14px;
      border: 2px dashed color-mix(in srgb, var(--accent) 60%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 12%, var(--paper));
      color: var(--ink);
      font-size: 13px;
      font-weight: 800;
    }
    .preset:active { transform: scale(.95); }
    :focus-visible { outline: 3px solid #ffcc3d; outline-offset: 2px; }
  `;
}

if (!customElements.get("island-input-card")) customElements.define("island-input-card", IslandInputCard);
registerCustomCard({ type: "island-input-card", name: "Animal Island 输入框", description: "带发送按钮的文字输入框，可配常用语，例如让音箱播报一句话。" });
