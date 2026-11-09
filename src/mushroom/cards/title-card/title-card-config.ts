import { assign, object, optional, string } from "superstruct";
import { ActionConfig, actionConfigStruct, LovelaceCardConfig } from "../../ha";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";

// 小岛标题样式与色板，对应 animal-island-ui Title 的 variant / color。
export const TITLE_VARIANTS = ["ribbon", "layer", "tab"] as const;
export const TITLE_COLORS = [
  "default",
  "app-pink",
  "purple",
  "app-blue",
  "app-yellow",
  "app-orange",
  "app-teal",
  "app-green",
  "app-red",
  "lime-green",
  "yellow-green",
  "brown",
  "warm-peach-pink",
] as const;
export const DEFAULT_TITLE_VARIANT = "ribbon";
export const DEFAULT_TITLE_COLOR = "app-yellow";

export interface TitleCardConfig extends LovelaceCardConfig {
  title?: string;
  subtitle?: string;
  alignment?: string;
  variant?: string;
  color?: string;
  title_tap_action?: ActionConfig;
  subtitle_tap_action?: ActionConfig;
}

export const titleCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  object({
    title: optional(string()),
    subtitle: optional(string()),
    alignment: optional(string()),
    variant: optional(string()),
    color: optional(string()),
    title_tap_action: optional(actionConfigStruct),
    subtitle_tap_action: optional(actionConfigStruct),
  })
);
