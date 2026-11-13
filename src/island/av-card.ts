/**
 * 影音遥控器卡片：一整屏的手机遥控器，给“投影仪 + 回音壁（带 HDMI 切换）+ 电视盒子 / 游戏机”这种组合用。
 * 设计为放在 panel 视图里独占一屏：顶部细栏是一次性的开关（投影仪、回音壁电源、线路），
 * 中间是满宽十字键圆盘（四角放功能键），其下是应用快捷入口，最底部是音量条，拇指最顺手。
 *
 *   type: custom:island-av-card
 *   projector: { on: script.tou_ying_yi_kai, off: script.tou_ying_yi_guan }
 *   soundbar:
 *     power: script.hui_yin_bi_dian_yuan
 *     volume_up: script.vol_up
 *     volume_down: script.vol_down
 *     mute: script.hui_yin_bi_jing_yin
 *   tv:
 *     input: script.hdmi_tv                 # 切到这条线路的脚本
 *     media_player: media_player.tou_ying   # 有状态的电视盒子：开关、正在用哪个应用
 *     remote: remote.tou_ying               # 十字键 / 返回 / 主页走这里（Android TV 键名）
 *     launcher: remote.nvidia_shield        # 打开应用走这里，发 "APP:包名"（可选，默认用 remote）
 *     menu: com.android.tv.settings         # 齿轮键打开的应用（可选）
 *     apps:
 *       - { name: 小电视, art: tvface, package: com.xiaodianshi.tv.yst }
 *   console:
 *     input: script.hdmi_switch
 *     hint: 手柄在手，开玩
 *
 * 线路切换不记状态：每次打开默认 TV 页，点 NS 才切过去（同时发切换指令）。
 * 只有能拿到真实状态的东西才显示状态：电视盒子的开关、正在用的应用。
 */
import { css, html, LitElement, nothing, svg, unsafeCSS } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import {
  mdiArrowULeftTop, mdiChevronDown, mdiChevronLeft, mdiChevronRight, mdiChevronUp, mdiCog, mdiHome,
  mdiNintendoSwitch, mdiPlayPause, mdiPower, mdiRemoteTv, mdiTelevision, mdiVolumeMinus, mdiVolumeOff, mdiVolumePlus,
} from "@mdi/js";
import { ART, TONES, type Tone } from "./art";
import { ISLAND_FONT_STACK } from "./fonts";
import { registerCustomCard } from "./globals";

interface AppConfig { name: string; package: string; art?: string; tone?: Tone }
interface AvConfig {
  projector?: { on: string; off: string };
  soundbar: { power?: string; volume_up: string; volume_down: string; mute?: string };
  tv: { input?: string; media_player?: string; remote: string; launcher?: string; menu?: string; apps?: AppConfig[] };
  console?: { input?: string; hint?: string };
}
interface StateObj { entity_id: string; state: string; attributes: Record<string, unknown> }
interface HassLike {
  states: Record<string, StateObj | undefined>;
  themes?: { darkMode?: boolean };
  callService(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>): Promise<unknown>;
}

const icon = (path: string, size: number) =>
  html`<svg class="mdi" style="--s:${size}px" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${path}></path>`}</svg>`;

function art(key: string | undefined, size: number, tone?: Tone) {
  const a = key ? ART[key] : undefined;
  if (!a) return html`<span class="art" style="--s:${size}px;--tile:${TONES[tone ?? "grey"]}"></span>`;
  return html`<span class="art" style="--s:${size}px;--tile:${TONES[tone ?? a.tone]}"><svg viewBox="0 0 48 48" aria-hidden="true">${unsafeSVG(a.svg)}</svg></span>`;
}

const isScript = (id: unknown) => typeof id === "string" && id.startsWith("script.");

class IslandAvCard extends LitElement {
  static properties = { _config: { state: true }, _page: { state: true }, _flash: { state: true }, _media: { state: true }, _activity: { state: true } };
  declare _config: AvConfig;
  declare _page: "tv" | "console";
  declare _flash: string;
  declare _media?: StateObj;
  declare _activity?: string;
  private _hass?: HassLike;
  private _timer?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this._page = "tv";
    this._flash = "";
  }

  set hass(h: HassLike) {
    this._hass = h;
    this.toggleAttribute("data-dark", Boolean(h?.themes?.darkMode));
    const tv = this._config?.tv;
    const media = tv?.media_player ? h?.states?.[tv.media_player] : undefined;
    if (media !== this._media) this._media = media;
    const remote = tv?.remote ? h?.states?.[tv.remote] : undefined;
    const activity = (remote?.attributes?.current_activity as string | undefined) ?? (media?.attributes?.app_id as string | undefined);
    if (activity !== this._activity) this._activity = activity;
  }

  setConfig(config: AvConfig) {
    if (!config?.soundbar?.volume_up || !config.soundbar.volume_down) throw new Error("island-av-card 需要 soundbar.volume_up / volume_down");
    if (!config.tv?.remote?.startsWith("remote.")) throw new Error("island-av-card 需要 tv.remote（remote 实体）");
    for (const id of [config.projector?.on, config.projector?.off, config.soundbar.power, config.soundbar.mute, config.soundbar.volume_up, config.soundbar.volume_down, config.tv.input, config.console?.input]) {
      if (id !== undefined && !isScript(id)) throw new Error(`island-av-card：${id} 应该是 script 实体`);
    }
    this._config = config;
  }

  getCardSize() { return 12; }
  getGridOptions() { return { columns: 12, rows: "auto", min_rows: 8 }; }

  // —— 动作 ——
  private async _call(key: string, domain: string, service: string, data: Record<string, unknown>, target?: Record<string, unknown>) {
    const hass = this._hass;
    if (!hass) return;
    let ok = true;
    try { await hass.callService(domain, service, data, target); } catch (err) { console.error("island-av-card", err); ok = false; }
    this._flash = `${ok ? "fx-ok" : "fx-err"}:${key}`;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._flash = ""; }, 700);
  }
  private _script(key: string, id?: string) { if (id) void this._call(key, "script", "turn_on", {}, { entity_id: id }); }
  private _key(key: string, command: string) { void this._call(key, "remote", "send_command", { command }, { entity_id: this._config.tv.remote }); }
  private _launch(key: string, pkg: string) {
    const tv = this._config.tv;
    if (tv.launcher) void this._call(key, "remote", "send_command", { command: `APP:${pkg}` }, { entity_id: tv.launcher });
    else void this._call(key, "remote", "turn_on", { activity: pkg }, { entity_id: tv.remote });
  }
  private _tvPower() {
    const id = this._config.tv.media_player;
    if (!id) return;
    void this._call("tvpower", "media_player", this._tvOn ? "turn_off" : "turn_on", {}, { entity_id: id });
  }
  private get _tvOn() {
    const s = this._media?.state;
    return Boolean(s && s !== "off" && s !== "unavailable" && s !== "unknown" && s !== "standby");
  }
  private _pick(page: "tv" | "console") {
    this._page = page;
    this._script(`src-${page}`, page === "tv" ? this._config.tv.input : this._config.console?.input);
  }
  private _fx(key: string) { return this._flash.endsWith(`:${key}`) ? this._flash.split(":")[0] : ""; }

  // —— 渲染 ——
  private _strip() {
    const c = this._config;
    return html`<div class="strip">
      ${c.projector
        ? html`<span class="chip" aria-label="投影仪">${art("projector", 34)}
            <button class="mini ${this._fx("pon")}" aria-label="打开投影仪" @click=${() => this._script("pon", c.projector!.on)}>开</button>
            <button class="mini ${this._fx("poff")}" aria-label="关闭投影仪" @click=${() => this._script("poff", c.projector!.off)}>关</button>
          </span>`
        : nothing}
      ${c.soundbar.power
        ? html`<span class="chip" aria-label="回音壁">${art("speaker", 34)}
            <button class="mini ${this._fx("sbp")}" aria-label="回音壁电源" @click=${() => this._script("sbp", c.soundbar.power)}>${icon(mdiPower, 22)}</button>
          </span>`
        : nothing}
      ${c.console
        ? html`<span class="seg" role="tablist" aria-label="回音壁线路">
            <button role="tab" class=${this._page === "tv" ? "on" : ""} aria-selected=${this._page === "tv"} aria-label="电视盒子" @click=${() => this._pick("tv")}>${icon(mdiTelevision, 22)}</button>
            <button role="tab" class=${this._page === "console" ? "on" : ""} aria-selected=${this._page === "console"} aria-label="游戏机" @click=${() => this._pick("console")}>${icon(mdiNintendoSwitch, 22)}</button>
          </span>`
        : nothing}
    </div>`;
  }

  private _tv() {
    const tv = this._config.tv;
    const apps = tv.apps ?? [];
    const dir = (key: string, path: string, label: string, cmd: string) =>
      html`<button class="dir ${this._fx(key)}" aria-label=${label} @click=${() => this._key(key, cmd)}>${icon(path, 44)}</button>`;
    return html`
      <div class="deck">
        <div class="pad">
          <span></span>${dir("up", mdiChevronUp, "上", "DPAD_UP")}<span></span>
          ${dir("left", mdiChevronLeft, "左", "DPAD_LEFT")}
          <button class="ok ${this._fx("ok")}" aria-label="播放 / 确认" @click=${() => this._key("ok", "DPAD_CENTER")}>${icon(mdiPlayPause, 50)}</button>
          ${dir("right", mdiChevronRight, "右", "DPAD_RIGHT")}
          <span></span>${dir("down", mdiChevronDown, "下", "DPAD_DOWN")}<span></span>
        </div>
        ${tv.media_player
          ? html`<button class="key corner tl ${this._tvOn ? "lit" : ""} ${this._fx("tvpower")}" aria-label="电视盒子开关" @click=${() => this._tvPower()}>${icon(mdiRemoteTv, 24)}</button>`
          : nothing}
        ${tv.menu
          ? html`<button class="key corner tr ${this._fx("menu")}" aria-label="菜单" @click=${() => this._launch("menu", tv.menu!)}>${icon(mdiCog, 24)}</button>`
          : nothing}
        <button class="key corner bl big ${this._fx("back")}" aria-label="返回" @click=${() => this._key("back", "BACK")}>${icon(mdiArrowULeftTop, 30)}</button>
        <button class="key corner br big ${this._fx("home")}" aria-label="主页" @click=${() => this._key("home", "HOME")}>${icon(mdiHome, 30)}</button>
      </div>
      ${apps.length
        ? html`<div class="apps" style="--n:${Math.min(apps.length, 5)}">
            ${apps.map((a, i) => html`<button class="app ${this._activity === a.package ? "on" : ""} ${this._fx(`app${i}`)}" @click=${() => this._launch(`app${i}`, a.package)}>
              ${art(a.art, 62, a.tone)}<span>${a.name}</span></button>`)}
          </div>`
        : nothing}
      <div class="vol" aria-label="音量">
        <button class="key ${this._fx("vd")}" aria-label="音量减" @click=${() => this._script("vd", this._config.soundbar.volume_down)}>${icon(mdiVolumeMinus, 32)}</button>
        ${this._config.soundbar.mute
          ? html`<button class="key bare ${this._fx("mute")}" aria-label="静音" @click=${() => this._script("mute", this._config.soundbar.mute)}>${icon(mdiVolumeOff, 28)}</button>`
          : html`<span></span>`}
        <button class="key ${this._fx("vu")}" aria-label="音量加" @click=${() => this._script("vu", this._config.soundbar.volume_up)}>${icon(mdiVolumePlus, 32)}</button>
      </div>`;
  }

  private _console() {
    const sb = this._config.soundbar;
    return html`<div class="ns">
      ${art("gamepad", 168)}
      <div class="hint">${this._config.console?.hint ?? "手柄在手，开玩"}</div>
      <div class="ns-vol" aria-label="音量">
        <div class="pair">
          <button class="key ${this._fx("nvd")}" aria-label="音量减" @click=${() => this._script("nvd", sb.volume_down)}>${icon(mdiVolumeMinus, 38)}</button>
          <button class="key ${this._fx("nvu")}" aria-label="音量加" @click=${() => this._script("nvu", sb.volume_up)}>${icon(mdiVolumePlus, 38)}</button>
        </div>
        ${sb.mute ? html`<button class="key bare ${this._fx("nmute")}" aria-label="静音" @click=${() => this._script("nmute", sb.mute)}>${icon(mdiVolumeOff, 26)}</button>` : nothing}
      </div>
    </div>`;
  }

  protected render() {
    if (!this._config?.tv) return nothing;
    return html`<div class="wrap">${this._strip()}${this._page === "tv" ? this._tv() : this._console()}</div>`;
  }

  static styles = css`
    :host {
      display: block;
      --ink: #794f27; --ink-soft: #9f927d; --line: #dcd8d1; --line-soft: #e8e2d6;
      --paper: #f8f8f0; --parch: #f7f3df; --press: #bdaea0; --mint: #19c8b9; --mint-deep: #0cc0b5;
      --ease: cubic-bezier(.4, 0, .2, 1);
      color: var(--ink);
      font-family: ${unsafeCSS(ISLAND_FONT_STACK)};
      font-weight: 500;
    }
    :host([data-dark]) { --ink: #f5eedb; --ink-soft: #c9bc9c; --line: #3a4a72; --line-soft: #34436a; --paper: #2d3a5e; --parch: #26325a; --press: #18203a; }
    /* 撑满 HA 顶栏和底部导航之间的一屏；桌面上限制宽度居中 */
    .wrap {
      box-sizing: border-box;
      display: flex; flex-direction: column; gap: 12px;
      width: 100%; max-width: 460px; margin: 0 auto;
      height: var(--island-av-height, calc(100dvh - var(--header-height, 56px) - 64px - env(safe-area-inset-bottom, 0px)));
      min-height: 560px;
      padding: 12px 16px 14px;
    }
    button { font-family: inherit; color: inherit; cursor: pointer; border: none; background: none; padding: 0; margin: 0; -webkit-tap-highlight-color: transparent; }
    button:focus-visible { outline: 3px solid #ffcc3d; outline-offset: 2px; }
    .mdi { width: var(--s); height: var(--s); fill: currentColor; flex: none; display: block; }
    .art { display: inline-grid; place-items: center; width: var(--s); height: var(--s); border-radius: 30%; background: var(--tile); flex: none; }
    .art svg { width: 80%; height: 80%; }

    .strip { display: flex; align-items: center; gap: 6px; padding: 5px; border-radius: 999px; background: color-mix(in srgb, var(--paper) 85%, transparent); flex: none; }
    .chip { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 999px; background: var(--parch); }
    .mini { height: 34px; min-width: 34px; padding: 0 9px; border-radius: 999px; font-weight: 800; font-size: 13px; display: inline-grid; place-items: center; transition: background .2s var(--ease); }
    .mini:active { background: color-mix(in srgb, var(--mint) 18%, transparent); }
    .seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; background: var(--parch); margin-left: auto; }
    .seg button { width: 46px; height: 34px; border-radius: 999px; display: grid; place-items: center; transition: background .25s var(--ease), color .25s var(--ease); }
    .seg button.on { background: var(--mint-deep); color: #fff9e3; }

    .apps { display: grid; grid-template-columns: repeat(var(--n), 1fr); flex: none; }
    .app { display: flex; flex-direction: column; align-items: center; gap: 5px; font-weight: 800; font-size: 12px; color: var(--ink-soft); }
    .app .art { transition: box-shadow .25s var(--ease), transform .15s var(--ease); }
    .app:active .art { transform: scale(.94); }
    .app.on { color: var(--ink); }
    .app.on .art { box-shadow: 0 0 0 3px var(--paper), 0 0 0 6px var(--mint); }

    .deck { flex: 1; min-height: 0; position: relative; display: grid; place-items: center; container-type: size; }
    .pad {
      position: relative; width: min(100cqw, 100cqh, 320px); aspect-ratio: 1; border-radius: 50%; background: var(--parch);
      display: grid; grid-template: 1fr 1.25fr 1fr / 1fr 1.25fr 1fr; place-items: center;
    }
    .pad::before { content: ""; position: absolute; inset: 14px; border-radius: 50%; border: 2px dashed color-mix(in srgb, var(--ink) 15%, transparent); pointer-events: none; }
    .dir { width: 72px; height: 72px; border-radius: 50%; display: grid; place-items: center; transition: background .15s var(--ease); }
    .dir:active, .dir.fx-ok { background: color-mix(in srgb, var(--mint) 18%, transparent); }
    .ok { width: clamp(84px, 34cqmin, 112px); aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; background: var(--paper); border: 2px solid var(--paper); box-shadow: 0 6px 0 var(--press); transition: transform .15s var(--ease), box-shadow .15s var(--ease); }
    .ok:active { transform: translateY(5px); box-shadow: 0 1px 0 var(--press); }

    .key { display: grid; place-items: center; border-radius: 999px; background: var(--paper); border: 2px solid var(--line-soft); transition: border-color .2s var(--ease), transform .15s var(--ease), background .2s var(--ease); }
    .key:active { border-color: var(--mint); transform: translateY(1px); }
    .key.bare { background: transparent; border-color: transparent; }
    .key.lit { border-color: var(--mint); color: var(--mint-deep); }
    .key.fx-ok, .mini.fx-ok { border-color: #6cc96a; }
    .key.fx-err, .mini.fx-err, .dir.fx-err, .ok.fx-err, .app.fx-err .art { box-shadow: 0 0 0 3px #f4695a; }
    .corner { position: absolute; width: 48px; height: 48px; }
    .corner.big { width: 60px; height: 60px; }
    .tl { top: 2px; left: 0; } .tr { top: 2px; right: 0; } .bl { bottom: 2px; left: 0; } .br { bottom: 2px; right: 0; }

    .vol { display: grid; grid-template-columns: 1fr 70px 1fr; gap: 6px; padding: 6px; border-radius: 999px; background: var(--parch); flex: none; }
    .vol .key { height: 66px; }

    .ns { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    .ns .art { border-radius: 30%; }
    .hint { padding: 6px 14px; border-radius: 999px; background: color-mix(in srgb, var(--paper) 85%, transparent); font-weight: 700; font-size: 13px; color: var(--ink-soft); }
    .ns-vol { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px; border-radius: 40px; background: var(--parch); }
    .ns-vol .pair { display: flex; gap: 10px; }
    .ns-vol .pair .key { width: 104px; height: 80px; border-radius: 30px; }
    .ns-vol .bare { width: 64px; height: 44px; }

    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  `;
}

if (!customElements.get("island-av-card")) customElements.define("island-av-card", IslandAvCard);
registerCustomCard({ type: "island-av-card", name: "Animal Island 影音遥控器", description: "一整屏的手机遥控器：投影仪、回音壁线路与音量、电视盒子十字键和应用。" });
