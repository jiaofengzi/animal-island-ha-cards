import { hsv2rgb, rgb2hsv } from "../../ha/common/color/convert-color";
import {
  LightColorMode,
  LightEntity,
  lightSupportsColor,
  lightSupportsBrightness,
} from "../../ha";

export function getBrightness(entity: LightEntity): number | undefined {
  return entity.attributes.brightness != null
    ? Math.max(Math.round((entity.attributes.brightness * 100) / 255), 1)
    : undefined;
}

export function getColorTemp(entity: LightEntity): number | undefined {
  return entity.attributes.color_temp != null
    ? Math.round(entity.attributes.color_temp)
    : undefined;
}

export function getRGBColor(entity: LightEntity): number[] | undefined {
  return entity.attributes.rgb_color != null
    ? entity.attributes.rgb_color
    : undefined;
}

export function improveColorContrast(rgbColor: number[]): number[] {
  const hsvColor = rgb2hsv([rgbColor[0], rgbColor[1], rgbColor[2]]);
  if (hsvColor[1] < 0.4) {
    if (hsvColor[1] < 0.1) {
      hsvColor[2] = 225;
    } else {
      hsvColor[1] = 0.4;
    }
  }
  return hsv2rgb(hsvColor);
}

export function supportsColorTempControl(entity: LightEntity): boolean {
  return (
    entity.attributes.supported_color_modes?.some((m) =>
      [LightColorMode.COLOR_TEMP].includes(m)
    ) ?? false
  );
}

export function supportsColorControl(entity: LightEntity): boolean {
  return lightSupportsColor(entity);
}

export function supportsBrightnessControl(entity: LightEntity): boolean {
  return lightSupportsBrightness(entity);
}

const lerp = (a: number[], b: number[], t: number) =>
  a.map((x, i) => Math.round(x + (b[i] - x) * Math.min(Math.max(t, 0), 1)));

/**
 * 小岛配色里灯“现在的颜色”：白光按色温给琥珀 / 奶黄 / 冷白（冷白略带银灰，免得和关着的米白卡片混在一起），
 * 彩光用实际颜色，但保证够亮、够饱和。只能调亮度的灯返回 undefined，沿用默认的橙色。
 */
export function getIslandLightColor(entity: LightEntity): number[] | undefined {
  const a = entity.attributes;
  const mode = a.color_mode as string | undefined;
  if (mode === "color_temp" || mode === "white") {
    const k = a.color_temp_kelvin as number | undefined;
    if (k == null) return mode === "white" ? [255, 214, 110] : undefined;
    const warm = [255, 170, 80], mid = [255, 214, 110], cool = [214, 220, 228];
    return k <= 4000 ? lerp(warm, mid, (k - 2700) / 1300) : lerp(mid, cool, (k - 4000) / 2500);
  }
  const rgb = a.rgb_color as number[] | undefined;
  if (!rgb || !mode || mode === "brightness" || mode === "onoff") return undefined;
  const max = Math.max(...rgb), min = Math.min(...rgb);
  const sat = max ? (max - min) / max : 0;
  let c = rgb.map((x) => (x * 255) / (max || 1));
  if (sat < 0.45) c = c.map((x) => 255 - (255 - x) * (0.45 / (sat || 0.45)));
  return c.map(Math.round);
}
