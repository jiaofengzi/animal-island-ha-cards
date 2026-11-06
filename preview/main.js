import "./ha-stubs.js";
import { createHassStore } from "./fake-hass.js";
import { views } from "./dashboard.js";

const toastBox = document.getElementById("toast");
let toastTimer;
function toast(text) {
  toastBox.textContent = text;
  toastBox.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove("show"), 1800);
}

const store = createHassStore({ onToast: toast });
let mounted = [];
window.__islandPreview = store; // 方便调试和冒烟测试

const frame = document.getElementById("frame");
// 模拟的设备宽度：手机 390、平板 820、电脑 1440，用来判断分区的屏幕条件
const SIM_WIDTH = { phone: 390, tablet: 820, desktop: 1440 };
const simWidth = () => SIM_WIDTH[frame.dataset.width] ?? 1440;
const isNarrow = () => frame.dataset.width === "phone";
const currentView = () => new URLSearchParams(location.search).get("view") ?? "home";

function navigate(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

async function mount(config, parent) {
  const tag = config.type.replace(/^custom:/, "");
  await customElements.whenDefined(tag);
  const el = document.createElement(tag);
  el.setConfig(config);
  el.hass = store.hass;
  if (isNarrow()) el.setAttribute("force-mobile", "");
  // 模拟 HA 分区视图的 12 列网格
  const wrap = document.createElement("div");
  wrap.className = "cell";
  wrap.style.gridColumn = `span ${config.grid_options?.columns ?? 12}`;
  wrap.dataset.cardType = tag;
  wrap.append(el);
  parent.append(wrap);
  mounted.push(el);
}

// HA 分区的 visibility 屏幕条件：预览里按模拟的设备宽度判断，而不是浏览器窗口宽度
function visible(section) {
  const w = simWidth();
  return (section.visibility ?? []).every((c) => {
    if (c.condition !== "screen") return true;
    const min = c.media_query.match(/min-width:\s*(\d+)px/);
    const max = c.media_query.match(/max-width:\s*(\d+)px/);
    return (!min || w >= Number(min[1])) && (!max || w <= Number(max[1]));
  });
}

let renderId = 0;
async function render() {
  const id = ++renderId;
  const view = views.find((v) => v.path === currentView()) ?? views[0];
  const grid = document.getElementById("view");
  grid.replaceChildren();
  mounted = [];
  frame.dataset.view = view.path;
  for (const sec of view.sections.filter(visible)) {
    if (id !== renderId) return;
    const box = document.createElement("section");
    box.className = "section" + (sec.full ? " full" : "");
    if (sec.ribbon) box.style.setProperty("--island-title-color", sec.ribbon);
    grid.append(box);
    for (const c of sec.cards) await mount(c, box);
  }
  document.querySelector(".ha-shell").scrollTop = 0;
}

store.subscribe((hass) => mounted.forEach((el) => { el.hass = hass; }));
window.addEventListener("location-changed", render);
window.addEventListener("popstate", render);

// 卡片通过 hass-action 事件把点击交给 HA，这里模拟 HA 的处理。
document.addEventListener("hass-action", (e) => {
  const { config, action } = e.detail;
  const ac = config[`${action}_action`] ?? (action === "tap" ? { action: "more-info" } : { action: "none" });
  const entity = ac.entity ?? config.entity;
  switch (ac.action) {
    case "toggle": if (entity) store.toggleEntity(entity); break;
    case "more-info": toast(`打开详情：${store.hass.states[entity]?.attributes.friendly_name ?? entity ?? "（无实体）"}`); break;
    case "navigate": navigate(ac.navigation_path); break;
    case "perform-action": case "call-service": {
      const [d, s] = (ac.perform_action ?? ac.service).split(".");
      store.callService(d, s, { ...(ac.data ?? ac.service_data), ...(ac.target ?? {}) });
      break;
    }
    case "none": break;
    default: toast(`（预览）${ac.action}`);
  }
});

// 工具栏：宽度、深色、重置、重播开屏
document.querySelectorAll("[data-width]").forEach((btn) => btn.addEventListener("click", () => {
  frame.dataset.width = btn.dataset.width;
  document.querySelectorAll("[data-width]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  // 电脑和平板上只有首页
  if (btn.dataset.width !== "phone" && currentView() !== "home") history.replaceState(null, "", "?view=home");
  render();
}));
document.getElementById("dark").addEventListener("change", (e) => store.setDarkMode(e.target.checked));
document.getElementById("reset").addEventListener("click", () => { store.reset(); toast("已恢复初始状态"); });
document.getElementById("splash").addEventListener("click", () => window.islandSplash?.play({ title: "我的小岛" }));

render().catch((err) => { console.error(err); toast("渲染出错：" + err.message); });
