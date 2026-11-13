// 小岛扩展：插画图标、随包字体、开屏动画、底部导航、店顶版头、输入框卡片、遥控器卡片、影音遥控器卡片。由卡片入口 src/mushroom/mushroom.ts 引入。
import { ART } from "./art";
import { installIslandAwning } from "./awning";
import { installIslandFonts } from "./fonts";
import { islandWindow } from "./globals";
import "./state-icon";
import "./navbar";
import "./input-card";
import "./remote-card";
import "./av-card";
import { playIslandSplash } from "./splash";

installIslandFonts();
installIslandAwning();
islandWindow().islandSplash = { play: playIslandSplash };
islandWindow().islandIcons = Object.keys(ART);
