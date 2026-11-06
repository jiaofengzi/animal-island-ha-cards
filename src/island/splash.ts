/**
 * 开屏动画。用法：在仪表盘任意位置放一张
 *   type: custom:island-splash-card
 *   title: 我的小岛        # 可选
 *   subtitle: 欢迎回来     # 可选，默认按时间问候
 *   mode: session          # session（每个浏览器会话一次，默认）| always（每次打开页面）
 * 卡片本身不占位置，只在页面上盖一层全屏动画，点击任意处可跳过。
 * 画法和图标一致：完全扁平，不画描边，只用色块拼。
 */
import { ISLAND_FONT_STACK } from "./fonts";
import { registerCustomCard } from "./globals";

interface SplashOptions { title?: string; subtitle?: string }

const KEY = "island-splash-shown";
const LETTER_COLORS = ["#3ec2ae", "#ff9a3c", "#5aa7f0", "#ff8fab", "#6cc96a", "#b48cf2", "#ffb800"];

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "早上好！今天也要元气满满";
  if (h >= 11 && h < 14) return "中午好！记得吃饭哦";
  if (h >= 14 && h < 18) return "下午好！来杯咖啡吧";
  if (h >= 18 && h < 23) return "晚上好！辛苦啦";
  return "夜深了，早点休息吧";
}

// 标题上方的叶子：左右两半深浅两色，叶脉是浅色色块
const LEAF = `<svg viewBox="0 0 120 120" class="leaf" aria-hidden="true">
  <g transform="rotate(28 60 60)">
    <path d="M60 6C24 30 18 78 60 104 102 78 96 30 60 6z" fill="#7fcf4f"/>
    <path d="M60 6c36 24 42 72 0 98z" fill="#5fb83a"/>
    <path d="M58.5 18h3v94h-3z" fill="#a9e27a"/>
    <path d="M60 42l-16-10 2-3 16 10zM60 62l-20-12 2-3 20 12zM60 82l-16-10 2-3 16 10z" fill="#a9e27a"/>
    <path d="M60 42l16-10-2-3-16 10zM60 62l20-12-2-3-20 12zM60 82l16-10-2-3-16 10z" fill="#8fd062"/>
    <rect x="57" y="100" width="6" height="16" rx="3" fill="#5fb83a"/>
  </g>
</svg>`;

// 一片椰子叶：向右伸出的弯叶，下沿是锯齿；叶尖换浅色
const FROND = `
  <path d="M0 0C26-30 78-34 116 2l-12-1-3 12-10-8-5 14-10-10-6 14-9-11-8 13-8-12-8 10-6-12-8 7z" fill="#2fb35a"/>
  <path d="M74-22c18 2 32 10 42 24l-12-1-3 12-10-8-5 14-10-10z" fill="#6cc24a"/>`;

const fronds = [
  { r: -40, s: 0.86, d: 0 }, { r: -2, s: 1, d: 0.4 }, { r: 34, s: 0.8, d: 0.8 },
].flatMap(({ r, s, d }) => [
  `<g class="frond" style="animation-delay:-${d}s"><g transform="rotate(${r}) scale(${s})">${FROND}</g></g>`,
  `<g class="frond" style="animation-delay:-${d + 0.5}s"><g transform="scale(-1 1) rotate(${r}) scale(${s})">${FROND}</g></g>`,
]).join("");

const ISLAND = `<svg viewBox="0 0 300 340" class="island" aria-hidden="true">
  <!-- 树干：上细下粗，黄橙两色交替的节 -->
  <g class="palm">
    <path d="M128 232h40l-6-40h-28z" fill="#e9a548"/>
    <path d="M134 192h28l-5-36h-22z" fill="#f4c45c"/>
    <path d="M135 156h22l-4-32h-17z" fill="#e9a548"/>
    <path d="M136 124h17l-3-28h-13z" fill="#f4c45c"/>
    <path d="M152 232h16l-6-40h-6zM155 156h2l-4-32h-1z" fill="#d98d36"/>
    <g transform="translate(143 98)">
      ${fronds}
      <g class="frond" style="animation-delay:-1.2s">
        <path d="M0 0C-14-24-10-50 8-68 18-46 16-20 0 0z" fill="#2fb35a"/>
        <path d="M8-68c10 22 8 44-8 68 4-24 6-46 8-68z" fill="#6cc24a"/>
      </g>
    </g>
    <circle cx="136" cy="104" r="7" fill="#a5713f"/><circle cx="150" cy="106" r="7" fill="#8f5f32"/>
  </g>
  <!-- 小山：圆顶 + 草丛 + 深浅三角色块 -->
  <path d="M50 300c0-72 44-108 100-108s100 36 100 108z" fill="#34b25a"/>
  <path d="M150 192c56 0 100 36 100 108h-40c0-60-22-96-60-108z" fill="#2fa654"/>
  <path d="M112 204l10-30 10 22 10-28 10 26 12-22 6 30z" fill="#34b25a"/>
  <path d="M142 168l10 26-14 2zM164 174l6 26-12-2z" fill="#2fa654"/>
  <path d="M86 236l26 4-18 18z" fill="#79c24a"/>
  <path d="M176 222l22 30-30-4z" fill="#79c24a"/>
  <path d="M120 262l20 14-24 4z" fill="#5fae45"/>
  <path d="M206 262l16 18-24-2z" fill="#5fae45"/>
  <circle cx="96" cy="270" r="6" fill="#ff8fab"/><circle cx="96" cy="270" r="2.4" fill="#ffd95a"/>
  <circle cx="218" cy="236" r="5" fill="#ff8fab"/><circle cx="218" cy="236" r="2" fill="#ffd95a"/>
  <!-- 沙滩崖：上沿锯齿咬进草地，下沿圆钝 -->
  <path d="M46 292l14-14 14 16 16-18 14 18 16-16 14 18 16-18 16 18 14-16 16 18 14-18 16 16 14-14 6 34c-30 22-180 22-206 0z" fill="#f2b77a"/>
  <path d="M150 294l16-18 16 18 14-16 16 18 14-18 16 16 14-14 6 34c-14 10-60 16-112 16z" fill="#e8a265"/>
  <path d="M72 300l22 6-14 14zM188 304l24-2-10 18zM128 312l18 10-22 2z" fill="#f8cf9c"/>
</svg>`;

// 海浪：固定尺寸的一段波峰横向平铺并平移，手机和电脑上的波长、浪高一致
const crest = (fill: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 40"><path d="M0 20Q55 0 110 20T220 20V40H0z" fill="${fill}"/></svg>`)}")`;

const CSS = `
  :host { all: initial; position: fixed; inset: 0; z-index: 2147483000; display: block; font-family: ${ISLAND_FONT_STACK}; }
  .stage {
    position: absolute; inset: 0; overflow: hidden; cursor: pointer;
    background: #f8f2e2;
    -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent var(--island-hole), #000 calc(var(--island-hole) + 1px));
    mask-image: radial-gradient(circle at 50% 50%, transparent var(--island-hole), #000 calc(var(--island-hole) + 1px));
    transition: --island-hole .8s cubic-bezier(.6, 0, .3, 1);
  }
  .stage.out { --island-hole: 150vmax; }
  .stage.fade { transition: opacity .5s ease; }
  .stage.fade.out { opacity: 0; }
  .dots-bg { position: absolute; inset: 0; background-image: radial-gradient(#efe4c8 3px, transparent 3.6px); background-size: 36px 36px; animation: drift 40s linear infinite; }
  .sun { position: absolute; top: 9vh; right: 12vw; width: 13vmin; height: 13vmin; border-radius: 50%; background: #ffe39a; box-shadow: 0 0 0 2.4vmin #fff0c4; animation: sun 4s ease-in-out infinite; }
  .cloud { position: absolute; width: 130px; height: 38px; border-radius: 38px; background: #fff; }
  .cloud::before, .cloud::after { content: ""; position: absolute; background: #fff; border-radius: 50%; }
  .cloud::before { width: 58px; height: 58px; left: 18px; top: -30px; }
  .cloud::after { width: 44px; height: 44px; left: 64px; top: -20px; }
  .c1 { top: 14%; left: -160px; animation: cloud 18s linear infinite; }
  .c2 { top: 28%; left: -160px; scale: .7; animation: cloud 24s linear -10s infinite; }
  .center { position: absolute; left: 0; right: 0; top: 0; height: 58%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
  .leaf { width: min(24vw, 112px); height: auto; opacity: 0; transform: scale(.2) rotate(-40deg); animation: leaf .8s cubic-bezier(.3, 1.6, .5, 1) .25s forwards, sway 2.4s ease-in-out 1.1s infinite; transform-origin: 50% 92%; }
  h1 { margin: 0; font-size: clamp(34px, 9vw, 64px); font-weight: 900; line-height: 1.1; letter-spacing: .04em; white-space: nowrap; }
  h1 span { display: inline-block; opacity: 0; transform: translateY(24px) scale(.6); animation: letter .5s cubic-bezier(.3, 1.8, .5, 1) forwards;
    color: var(--c); -webkit-text-stroke: .12em #fff; paint-order: stroke fill; text-shadow: 0 .08em 0 #eadfc2; }
  .sub { margin: 0; padding: 8px 20px; border-radius: 999px 999px 999px 12px; background: #fff; color: #5b4128; font-size: clamp(15px, 3.6vw, 20px); font-weight: 700;
    box-shadow: 0 5px 0 #eadfc2; opacity: 0; transform: translateY(10px); animation: rise .45s ease-out 1.25s forwards; }
  .sub i { display: inline-block; width: .32em; height: .32em; margin-left: .18em; border-radius: 50%; background: #3ec2ae; animation: dot 1s ease-in-out infinite; vertical-align: middle; }
  .sub i:nth-child(2) { animation-delay: .15s; background: #ff9a3c; } .sub i:nth-child(3) { animation-delay: .3s; background: #ff8fab; }

  /* 海和小岛：后浪 → 小岛 → 前浪，前浪盖住小岛底部，像浮在水里 */
  .sea { position: absolute; left: 0; right: 0; bottom: 0; }
  .sea::before { content: ""; position: absolute; left: 0; right: 0; top: -39px; height: 40px; background: var(--crest) repeat-x 0 0 / 220px 40px; animation: wave var(--t) linear infinite; }
  .sea.back { height: 24vh; background: #a9dde2; --crest: ${crest("#a9dde2")}; --t: 7s; }
  .sea.front { height: 6vh; background: #86ccd3; --crest: ${crest("#86ccd3")}; --t: 4.5s; }
  .sea.front::before { animation-direction: reverse; }
  .isle { position: absolute; left: 50%; bottom: calc(7vh + 4px); width: min(58vw, 320px); translate: -50% 0; opacity: 0; transform: translateY(60px); animation: island 1s cubic-bezier(.3, 1.4, .5, 1) .1s forwards; }
  @media (min-aspect-ratio: 4/3) { .isle { left: 70%; } }
  .island { display: block; width: 100%; height: auto; overflow: visible; animation: bob 3.2s ease-in-out 1.2s infinite; }
  .palm { transform-box: view-box; transform-origin: 148px 232px; animation: palm 3.4s ease-in-out infinite; }
  .frond { animation: frond 2.6s ease-in-out infinite; }
  .skip { position: absolute; right: 16px; bottom: 14px; color: #fff; font-size: 13px; font-weight: 800; opacity: .9; }

  @keyframes leaf { to { opacity: 1; transform: scale(1) rotate(0); } }
  @keyframes sway { 0%, 100% { rotate: -5deg; } 50% { rotate: 5deg; } }
  @keyframes letter { to { opacity: 1; transform: none; } }
  @keyframes rise { to { opacity: 1; transform: none; } }
  @keyframes dot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes island { to { opacity: 1; transform: none; } }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
  @keyframes palm { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(3deg); } }
  @keyframes frond { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(5deg); } }
  @keyframes wave { to { background-position: 220px 0; } }
  @keyframes cloud { to { left: 110%; } }
  @keyframes drift { to { background-position: 360px 0; } }
  @keyframes sun { 0%, 100% { box-shadow: 0 0 0 2.4vmin #fff0c4; } 50% { box-shadow: 0 0 0 3.6vmin #fff0c4; } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; }
  }
`;

let registered = false;
function registerHoleProperty() {
  if (registered) return;
  registered = true;
  try {
    window.CSS.registerProperty({ name: "--island-hole", syntax: "<length>", inherits: false, initialValue: "0px" });
  } catch { /* 已注册或浏览器不支持时退化为淡出 */ }
}

export function playIslandSplash(options: SplashOptions = {}): void {
  if (typeof document === "undefined" || document.querySelector("island-splash-overlay")) return;
  registerHoleProperty();
  const host = document.createElement("island-splash-overlay");
  const root = host.attachShadow({ mode: "open" });
  const title = options.title || "欢迎来到小岛";
  const letters = [...title].map((ch, i) => `<span style="--c:${LETTER_COLORS[i % LETTER_COLORS.length]};animation-delay:${0.55 + i * 0.07}s">${ch === " " ? "&nbsp;" : ch.replace(/[<>&"]/g, "")}</span>`).join("");
  const sub = (options.subtitle || greeting()).replace(/[<>&"]/g, "");
  const supportsHole = typeof window.CSS?.registerProperty === "function";
  root.innerHTML = `<style>${CSS}</style>
    <div class="stage${supportsHole ? "" : " fade"}" role="presentation">
      <div class="dots-bg"></div>
      <div class="sun"></div>
      <div class="cloud c1"></div><div class="cloud c2"></div>
      <div class="center">${LEAF}<h1 aria-label="${title.replace(/"/g, "")}">${letters}</h1><p class="sub">${sub}<i></i><i></i><i></i></p></div>
      <div class="sea back"></div>
      <div class="isle">${ISLAND}</div>
      <div class="sea front"></div>
      <span class="skip">点一下跳过</span>
    </div>`;
  const stage = root.querySelector(".stage") as HTMLElement;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    stage.classList.add("out");
    setTimeout(() => host.remove(), 900);
  };
  stage.addEventListener("click", finish);
  const onKey = () => { finish(); window.removeEventListener("keydown", onKey); };
  window.addEventListener("keydown", onKey);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  setTimeout(finish, reduced ? 900 : 3200);
  document.body.append(host);
}

class IslandSplashCard extends HTMLElement {
  private _config: SplashOptions & { mode?: string } = {};
  public preview?: boolean;
  public hass?: unknown;

  setConfig(config: SplashOptions & { mode?: string }) { this._config = config ?? {}; }
  getCardSize() { return 0; }
  getGridOptions() { return { columns: 12, rows: 0, min_rows: 0 }; }

  connectedCallback() {
    this.style.display = "none";
    // 编辑器的卡片预览里不播放。
    if (this.preview || this.closest?.("hui-card-preview, hui-dialog-edit-card")) return;
    const once = this._config.mode !== "always";
    try {
      if (once && sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch { /* 无痕模式下没有 sessionStorage，照常播放 */ }
    playIslandSplash(this._config);
  }
}

if (!customElements.get("island-splash-overlay")) customElements.define("island-splash-overlay", class extends HTMLElement {});
if (!customElements.get("island-splash-card")) customElements.define("island-splash-card", IslandSplashCard);

registerCustomCard({ type: "island-splash-card", name: "Animal Island 开屏动画", description: "打开仪表盘时播放一段小岛风格的开屏动画。" });
