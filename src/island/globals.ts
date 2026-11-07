// 小岛扩展用到的全局对象类型。
interface CustomCardEntry { type: string; name: string; description: string }

export interface IslandWindow extends Window {
  customCards?: CustomCardEntry[];
  islandSplash?: { play: (options?: { title?: string; subtitle?: string }) => void };
  islandIcons?: string[];
}

export const islandWindow = (): IslandWindow => window as IslandWindow;

/** 登记到 HA 的“添加卡片”列表里。 */
export function registerCustomCard(entry: CustomCardEntry): void {
  const w = islandWindow();
  w.customCards = w.customCards || [];
  w.customCards.push(entry);
}

/** 只用到 hass 里的深色模式标记。 */
export interface HassThemeLike { themes?: { darkMode?: boolean } }
