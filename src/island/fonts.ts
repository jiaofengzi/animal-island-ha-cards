/**
 * 随包字体：Resource Han Rounded（中文圆体，SIL OFL）+ Nunito（拉丁字母与数字，SIL OFL）。
 * @font-face 必须写在主文档里，影子 DOM 里的声明浏览器不认，所以在这里注入一次。
 * 字体文件和本脚本放在同一目录的 fonts/ 下，按脚本自身地址解析，HA 的 /local/ 路径也适用。
 */
export const ISLAND_FONT_STACK = `"Island Nunito", "Island Rounded", Nunito, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;

export function installIslandFonts(): void {
  if (typeof document === "undefined" || document.getElementById("island-fonts")) return;
  const url = (file: string) => new URL(`./fonts/${file}`, import.meta.url).href;
  const rounded = [500, 700, 900].map((w) => `
    @font-face {
      font-family: "Island Rounded";
      src: url("${url(`island-rounded-${w}.woff2`)}") format("woff2");
      font-weight: ${w === 500 ? "100 599" : w === 700 ? "600 799" : "800 1000"};
      font-display: swap;
    }`).join("");
  const style = document.createElement("style");
  style.id = "island-fonts";
  style.textContent = `${rounded}
    @font-face {
      font-family: "Island Nunito";
      src: url("${url("island-nunito.woff2")}") format("woff2");
      font-weight: 200 1000;
      font-display: swap;
      unicode-range: U+0020-007E, U+00A0-00FF, U+2013-2014, U+2018-2019, U+201C-201D, U+2022, U+2026, U+20AC;
    }`;
  document.head.append(style);
}
