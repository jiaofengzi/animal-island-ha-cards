/**
 * 店顶版头：使用 Animal Island 主题时，在 HA 仪表盘顶栏底边画一排半圆花边（像小店门口的遮阳棚），
 * 单视图仪表盘的标题做成米白药丸。HA 主题只能设变量，画不了这种装饰，所以由卡片包注入样式。
 *
 * 只作用于仪表盘（hui-root）的顶栏，不碰设置等其他页面。
 * 开关：主题名为 "Animal Island" 时自动开启；主题变量 `island-awning: on` 可在别的主题里开启，
 * `island-awning: none` 可在 Animal Island 里关掉。HA 改版后找不到顶栏时什么也不做。
 */
import { css } from "lit";

const STYLE_ID = "island-awning";
const THEME_NAME = "Animal Island";

const AWNING_CSS = css`
  .header::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    height: 12px;
    pointer-events: none;
    background: radial-gradient(circle at 12px 0, var(--app-header-background-color) 11.5px, transparent 12px) 0 0 / 24px 12px repeat-x;
  }
  .main-title {
    flex: 0 1 auto;
    margin: 0 8px;
    padding: 4px 16px 5px 12px;
    border-radius: 999px 999px 999px 8px;
    background: var(--card-background-color, #fffaf0);
    color: var(--primary-text-color, #5b4128);
    font-weight: 900;
    letter-spacing: 1px;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
  }
`.cssText;

interface HassLike { selectedTheme?: { theme?: string } | null; themes?: { theme?: string } }

function haRoot(): (HTMLElement & { hass?: HassLike }) | null {
  return document.querySelector("home-assistant");
}

function dashboardRoots(): ShadowRoot[] {
  const main = haRoot()?.shadowRoot?.querySelector("home-assistant-main");
  const roots: ShadowRoot[] = [];
  main?.shadowRoot?.querySelectorAll("ha-panel-lovelace").forEach((panel) => {
    const root = panel.shadowRoot?.querySelector("hui-root")?.shadowRoot;
    if (root) roots.push(root);
  });
  return roots;
}

function enabled(): boolean {
  const flag = getComputedStyle(document.documentElement).getPropertyValue("--island-awning").trim();
  if (flag === "none" || flag === "off") return false;
  if (flag === "on") return true;
  const hass = haRoot()?.hass;
  const name = hass?.selectedTheme?.theme || hass?.themes?.theme;
  return name === THEME_NAME;
}

function sync() {
  const on = enabled();
  for (const root of dashboardRoots()) {
    const existing = root.getElementById(STYLE_ID);
    if (on && !existing) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = AWNING_CSS;
      root.appendChild(style);
    } else if (!on && existing) {
      existing.remove();
    }
  }
}

export function installIslandAwning() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const w = window as Window & { __islandAwning?: boolean };
  if (w.__islandAwning) return;
  w.__islandAwning = true;
  // 仪表盘、视图切换或主题变化时重新检查；再加一个低频兜底，覆盖 HA 重建顶栏的情况
  window.addEventListener("location-changed", () => setTimeout(sync, 0));
  window.addEventListener("settheme", () => setTimeout(sync, 0));
  setInterval(sync, 2000);
  sync();
}
