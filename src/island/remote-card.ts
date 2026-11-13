/**
 * 遥控器卡片：把一组“只能发指令、拿不到状态”的按键（红外遥控等）收进一张小岛风格的整卡。
 * 按键不显示开/关状态，按下后短暂变色表示“已发出”。可选在底部放一台有状态的播放器（如 SHIELD）的播放控制。
 *   type: custom:island-remote-card
 *   name: 投影
 *   icon: mdi:projector
 *   power:                                  # 标题右侧的按键（可选）
 *     - { label: 开, icon: mdi:power, script: script.tou_ying_yi_kai, accent: true }
 *     - { label: 关, icon: mdi:power, script: script.tou_ying_yi_guan }
 *   groups:
 *     - title: 信号源
 *       buttons:
 *         - { label: SHIELD, icon: mdi:television-box, script: script.hdmi_tv }
 *         - label: Switch
 *           icon: mdi:nintendo-switch
 *           action: { perform_action: remote.send_command, target: { entity_id: remote.x }, data: { command: HDMI1 } }
 *     - title: 方向
 *       dpad: { remote: remote.tou_ying }    # 十字键 + 确认；默认发 DPAD_UP/DOWN/LEFT/RIGHT/CENTER，可逐个改
 *   media:                                  # 有状态的播放器（可选）
 *     entity: media_player.tou_ying
 *     name: SHIELD
 *     remote: remote.tou_ying                # 有它才显示“主页”键
 *     apps: { com.example.app: 某应用 }       # 补充应用包名 → 中文名（可选，常见的已内置）
 *     position: top                          # 播放控制放在分组上方（默认在最下面）
 * 按键写 `script:` 等同于 perform_action: script.turn_on；也可写完整的 `action:`。
 */
import { css, html, LitElement, nothing, unsafeCSS } from "lit";
import { ISLAND_FONT_STACK } from "./fonts";
import { registerCustomCard } from "./globals";

interface ActionConfig { perform_action: string; target?: Record<string, unknown>; data?: Record<string, unknown> }
interface ButtonConfig { label?: string; icon?: string; script?: string; action?: ActionConfig; accent?: boolean }
interface DpadConfig { remote: string; up?: string; down?: string; left?: string; right?: string; ok?: string }
interface GroupConfig { title?: string; columns?: number; buttons?: ButtonConfig[]; dpad?: DpadConfig }
interface MediaConfig { entity: string; name?: string; remote?: string; apps?: Record<string, string>; position?: "top" | "bottom" }
interface RemoteConfig { name?: string; icon?: string; power?: ButtonConfig[]; groups?: GroupConfig[]; media?: MediaConfig }
interface StateObj { entity_id: string; state: string; attributes: Record<string, unknown> }
interface HassLike {
  states: Record<string, StateObj | undefined>;
  themes?: { darkMode?: boolean };
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
}

function toAction(b: ButtonConfig): ActionConfig | undefined {
  if (b.action) return b.action;
  if (b.script) return { perform_action: "script.turn_on", target: { entity_id: b.script } };
  return undefined;
}

function checkButton(b: ButtonConfig, where: string) {
  if (!b || (!b.label && !b.icon)) throw new Error(`${where}：按键需要 label 或 icon`);
  const a = toAction(b);
  if (!a) throw new Error(`${where}：按键需要 script 或 action`);
  if (typeof a.perform_action !== "string" || !a.perform_action.includes(".")) throw new Error(`${where}：perform_action 必须是 "域.服务"`);
}

const PLAYING = new Set(["playing", "paused", "buffering"]);

/** Android TV 只报应用包名，常见的换成中文名；认不出的包名不显示，免得出现一长串英文。 */
const APP_NAMES: Record<string, string> = {
  "com.google.android.tvlauncher": "主屏幕",
  "com.google.android.apps.tv.launcherx": "主屏幕",
  "com.nvidia.shield.nvcustomize": "主屏幕",
  "com.xiaodianshi.tv.yst": "哔哩哔哩",
  "com.ktcp.video": "云视听极光",
  "com.gitvdemo.video": "银河奇异果",
  "com.cibn.tv": "CIBN 酷喵",
  "com.netflix.ninja": "Netflix",
  "com.google.android.youtube.tv": "YouTube",
  "com.disney.disneyplus": "Disney+",
  "com.plexapp.android": "Plex",
  "org.jellyfin.androidtv": "Jellyfin",
  "org.xbmc.kodi": "Kodi",
  "com.nvidia.geforcenow": "GeForce NOW",
  "com.android.tv.settings": "设置",
};

function appLabel(raw: string | undefined, extra?: Record<string, string>): string | undefined {
  if (!raw) return undefined;
  const known = extra?.[raw] ?? APP_NAMES[raw];
  if (known) return known;
  return /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i.test(raw) ? undefined : raw;
}

class IslandRemoteCard extends LitElement {
  static properties = { _config: { state: true }, _media: { state: true }, _flash: { state: true } };
  declare _config: RemoteConfig;
  declare _media?: StateObj;
  declare _flash: string;
  private _hass?: HassLike;
  private _timer?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this._config = {};
    this._flash = "";
  }

  set hass(h: HassLike) {
    this._hass = h;
    this.toggleAttribute("data-dark", Boolean(h?.themes?.darkMode));
    const id = this._config.media?.entity;
    const next = id ? h?.states?.[id] : undefined;
    if (next !== this._media) this._media = next;
  }

  setConfig(config: RemoteConfig) {
    if (!config) throw new Error("island-remote-card 需要配置");
    config.power?.forEach((b, i) => checkButton(b, `power[${i}]`));
    config.groups?.forEach((g, gi) => {
      if (g?.dpad) {
        if (!g.dpad.remote?.startsWith("remote.")) throw new Error(`groups[${gi}].dpad.remote 必须是 remote 实体`);
        return;
      }
      if (!Array.isArray(g?.buttons) || !g.buttons.length) throw new Error(`groups[${gi}] 需要 buttons 或 dpad`);
      g.buttons.forEach((b, i) => checkButton(b, `groups[${gi}].buttons[${i}]`));
    });
    if (config.media && !config.media.entity?.startsWith("media_player.")) throw new Error("media.entity 必须是 media_player 实体");
    this._config = config;
  }

  getCardSize() { return 2 + (this._config.groups?.length ?? 0) * 2 + (this._config.media ? 2 : 0); }
  getGridOptions() { return { columns: 12, rows: "auto", min_rows: 3 }; }

  private async _run(key: string, action: ActionConfig) {
    const hass = this._hass;
    if (!hass) return;
    const [domain, service] = action.perform_action.split(".");
    let ok = true;
    try {
      await hass.callService(domain, service, action.data ?? {}, action.target);
    } catch (err) {
      console.error("island-remote-card", err);
      ok = false;
    }
    this._flash = `${ok ? "ok" : "err"}:${key}`;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._flash = ""; }, 900);
  }

  private _button(b: ButtonConfig, key: string, extra = "", showLabel = true) {
    const action = toAction(b)!;
    const flash = this._flash.endsWith(`:${key}`) ? this._flash.split(":")[0] : "";
    return html`<button
      type="button"
      class="btn ${extra} ${b.accent ? "accent" : ""} ${flash}"
      aria-label=${b.label ?? b.icon ?? ""}
      @click=${() => this._run(key, action)}
    >${b.icon ? html`<ha-icon .icon=${b.icon}></ha-icon>` : nothing}${b.label && showLabel ? html`<span>${b.label}</span>` : nothing}</button>`;
  }

  private _renderDpad(d: DpadConfig, gi: number) {
    const send = (command: string): ActionConfig => ({ perform_action: "remote.send_command", target: { entity_id: d.remote }, data: { command } });
    const key = (dir: string, icon: string, label: string, command: string) =>
      this._button({ icon, label, action: send(command) }, `g${gi}-${dir}`, `pad ${dir}`, false);
    return html`<div class="dpad">
      ${key("up", "mdi:chevron-up", "上", d.up ?? "DPAD_UP")}
      ${key("left", "mdi:chevron-left", "左", d.left ?? "DPAD_LEFT")}
      ${this._button({ label: "OK", action: send(d.ok ?? "DPAD_CENTER") }, `g${gi}-ok`, "pad center")}
      ${key("right", "mdi:chevron-right", "右", d.right ?? "DPAD_RIGHT")}
      ${key("down", "mdi:chevron-down", "下", d.down ?? "DPAD_DOWN")}
    </div>`;
  }

  private _renderGroup(g: GroupConfig, gi: number) {
    const cols = g.columns ?? Math.min(g.buttons?.length ?? 1, 4);
    return html`
      <div class="group">
        ${g.title ? html`<div class="title">${g.title}</div>` : nothing}
        ${g.dpad
          ? this._renderDpad(g.dpad, gi)
          : html`<div class="grid ${cols >= 4 ? "compact" : ""}" style="--cols:${cols}">
              ${(g.buttons ?? []).map((b, i) => this._button(b, `g${gi}-${i}`))}
            </div>`}
      </div>`;
  }

  private _renderMedia() {
    const m = this._config.media;
    if (!m) return nothing;
    const s = this._media;
    const on = Boolean(s && s.state !== "off" && s.state !== "unavailable" && s.state !== "unknown");
    const app = appLabel((s?.attributes?.app_name as string | undefined) ?? (s?.attributes?.app_id as string | undefined), m.apps);
    const title = s?.attributes?.media_title as string | undefined;
    const showing = app && app !== "主屏幕" ? (title ? `${app} · ${title}` : app) : app;
    const status = !s || s.state === "unavailable" ? "离线" : !on ? "" : showing ? (app === "主屏幕" ? showing : `正在播：${showing}`) : "";
    const ent = { entity_id: m.entity };
    const playing = s?.state === "playing";
    const item = (key: string, icon: string, label: string, action: ActionConfig, cls = "") =>
      html`<span class="tip" title=${label}>${this._button({ icon, label, action }, `media-${key}`, `round ${cls}`, false)}</span>`;
    return html`
      <div class="group">
        <div class="title">${m.name ?? s?.attributes?.friendly_name ?? "播放器"}${status ? html`<span class="status"> · ${status}</span>` : nothing}</div>
        <div class="media">
          ${item("power", "mdi:power", "开关", { perform_action: on ? "media_player.turn_off" : "media_player.turn_on", target: ent }, on ? "on" : "")}
          ${on
            ? html`
                ${item("prev", "mdi:skip-previous", "上一个", { perform_action: "media_player.media_previous_track", target: ent })}
                ${item("play", playing ? "mdi:pause" : "mdi:play", PLAYING.has(s?.state ?? "") ? "暂停/播放" : "播放", { perform_action: "media_player.media_play_pause", target: ent })}
                ${item("next", "mdi:skip-next", "下一个", { perform_action: "media_player.media_next_track", target: ent })}
                ${m.remote ? item("home", "mdi:home", "主页", { perform_action: "remote.send_command", target: { entity_id: m.remote }, data: { command: "HOME" } }) : nothing}`
            : nothing}
        </div>
      </div>`;
  }

  protected render() {
    const c = this._config;
    const top = c.media?.position === "top";
    const hasHead = Boolean(c.icon || c.name || c.power?.length);
    return html`
      <ha-card class=${hasHead ? "" : "headless"}>
        ${hasHead
          ? html`<div class="head">
              ${c.icon ? html`<island-state-icon class="logo" .icon=${c.icon}></island-state-icon>` : nothing}
              <div class="name">${c.name ?? ""}</div>
              ${c.power?.length ? html`<div class="power">${c.power.map((b, i) => this._button(b, `p${i}`, "pill"))}</div>` : nothing}
            </div>`
          : nothing}
        ${top ? this._renderMedia() : nothing}
        ${(c.groups ?? []).map((g, gi) => this._renderGroup(g, gi))}
        ${top ? nothing : this._renderMedia()}
      </ha-card>`;
  }

  static styles = css`
    :host { display: block; --ink: #5b4128; --ink-soft: #9a8466; --paper: #fffaf0; --well: #f3ead4; --edge: #e5d7b5; --accent: #3ec2ae; --accent-edge: #2a9c8b; }
    :host([data-dark]) { --ink: #f5eedb; --ink-soft: #c9bc9c; --paper: #2d3a5e; --well: #222d4b; --edge: #18203a; }
    ha-card {
      padding: 14px 14px 16px;
      border-radius: var(--ha-card-border-radius, 24px);
      background: var(--paper);
      color: var(--ink);
      font-family: ${unsafeCSS(ISLAND_FONT_STACK)};
      box-shadow: 0 5px 0 var(--edge), 0 14px 22px -10px rgba(91, 65, 40, .32);
      border: none;
    }
    .head { display: flex; align-items: center; gap: 12px; }
    .logo { --island-icon-size: 52px; flex: none; }
    .name { flex: 1; min-width: 0; font-size: 17px; font-weight: 900; }
    .power { display: flex; gap: 8px; flex: none; }
    .group { margin-top: 14px; }
    .title { margin: 0 4px 8px; font-size: 12.5px; font-weight: 800; color: var(--ink-soft); }
    .status { font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr)); gap: 8px; }
    /* 一排四个以上时图标在上、文字在下，窄屏也放得下 */
    .grid.compact .btn { flex-direction: column; gap: 2px; min-height: 56px; padding: 6px 4px; font-size: 12px; border-radius: 16px; }
    .media { display: flex; gap: 8px; }
    ha-card.headless > .group:first-child { margin-top: 0; }
    /* 十字键：圆盘上四个方向 + 中间确认 */
    .dpad {
      position: relative;
      width: min(240px, 78%);
      aspect-ratio: 1;
      margin: 4px auto 2px;
      border-radius: 50%;
      background: var(--well);
      box-shadow: 0 5px 0 var(--edge), inset 0 0 0 6px color-mix(in srgb, var(--paper) 55%, transparent);
      display: grid;
      grid-template: repeat(3, 1fr) / repeat(3, 1fr);
    }
    .btn.pad { min-height: 0; padding: 0; border-radius: 50%; background: transparent; box-shadow: none; color: var(--ink); }
    .btn.pad ha-icon { --mdc-icon-size: 34px; }
    .btn.pad:active { transform: scale(.9); background: color-mix(in srgb, var(--accent) 22%, transparent); }
    .pad.up { grid-area: 1 / 2; }
    .pad.left { grid-area: 2 / 1; }
    .pad.center { grid-area: 2 / 2; }
    .pad.right { grid-area: 2 / 3; }
    .pad.down { grid-area: 3 / 2; }
    .btn.pad.center {
      margin: 6%;
      background: var(--accent);
      color: #fff;
      font-size: 18px;
      letter-spacing: 1px;
      box-shadow: 0 4px 0 var(--accent-edge);
    }
    .btn.pad.center:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--accent-edge); background: var(--accent); }
    .btn.pad.center.ok { background: #6cc96a; box-shadow: 0 4px 0 #4f9e4d; }
    .btn.pad.center.err { background: #f4695a; box-shadow: 0 4px 0 #c94a3d; }
    .tip { flex: 1; display: flex; }
    .tip .btn { flex: 1; }
    button { font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 44px;
      padding: 0 12px;
      border: none;
      border-radius: 18px;
      background: var(--well);
      color: var(--ink);
      font-size: 14px;
      font-weight: 800;
      box-shadow: 0 3px 0 var(--edge);
      transition: transform .12s, box-shadow .12s, background-color .2s, color .2s;
    }
    .btn ha-icon { --mdc-icon-size: 20px; flex: none; }
    .btn span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .btn.pill, .btn.round { border-radius: 999px; }
    .btn.pill { min-height: 38px; padding: 0 14px; font-size: 13px; }
    .btn.accent, .btn.on { background: var(--accent); color: #fff; box-shadow: 0 3px 0 var(--accent-edge); }
    .btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--edge); }
    .btn.accent:active, .btn.on:active { box-shadow: 0 1px 0 var(--accent-edge); }
    .btn.ok { background: #6cc96a; color: #fff; box-shadow: 0 3px 0 #4f9e4d; }
    .btn.err { background: #f4695a; color: #fff; box-shadow: 0 3px 0 #c94a3d; }
    :focus-visible { outline: 3px solid #ffcc3d; outline-offset: 2px; }
  `;
}

if (!customElements.get("island-remote-card")) customElements.define("island-remote-card", IslandRemoteCard);
registerCustomCard({ type: "island-remote-card", name: "Animal Island 遥控器", description: "把红外遥控等只能发指令的按键收进一张整卡，可附带一台播放器的播放控制。" });
