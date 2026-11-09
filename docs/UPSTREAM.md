# 上游来源与自维护说明

卡片运行时（`src/mushroom/`）派生自 [Mushroom](https://github.com/piitaya/lovelace-mushroom)（Paul Bottein 及贡献者），版本 **5.2.3**，Git tree `d8a90ffff1b217fbbf9cb8210ee672be99596231`。它用 Lit 实现，不是 React 版 animal-island-ui 组件库；Animal Island 只提供视觉设计语言。

## 从 v0.4 起：自行维护的源码

v0.3.x 之前，仓库里放着一份逐字节不改的 Mushroom 源码（`vendor/mushroom-v5.2.3/`），构建脚本在构建时用文本替换和 AST 改写“贴”上本项目的改动，并校验上游文件的哈希，以证明只改了外观、没改行为。

这种做法让任何行为层面的改动（比如给标题卡的可视化编辑器加字段）都只能写成越来越复杂的构建期补丁，所以从 v0.4 起改为：

- 把构建期改写后的源码一次性落地到 `src/mushroom/`，此后**直接修改源码**，与普通项目一样。
- 构建脚本 `scripts/build-cards.mjs` 只做普通的 esbuild 打包，并收集许可文件；不再校验上游哈希，也不再输出 `transform-manifest.json`。
- 落地时的产物与 v0.3.3 构建期改写的产物逐行比对过：除了文件路径注释、控制台版本号（改读本项目 `package.json`）、卡片文档链接固定到上游 `v5.2.3` 标签，以及 esbuild 对 `object-hash`/`hammerjs` 两个 CommonJS 包的 `__toESM(…, 1)` 互操作标记（这两个包都没有 `__esModule`，行为相同）之外没有差异。

## 落地时已经包含的改动（相对上游 5.2.3）

1. 所有 `mushroom-` 标识（元素名、选择器、配置/编辑器字符串、私有 CSS 变量）改为 `island-`，`PREFIX_NAME` 改为 `island`。HA 的 `ha-*`/`hui-*` 元素不改名，所以可以和官方 Mushroom 共存。
2. 卡片里的 `ha-state-icon` 换成 `island-state-icon`（插画图标，认不出的仍交给 HA 原生图标）。
3. 每个组件的静态样式后面追加 `islandSkin("<上游相对路径>")`，皮肤 CSS 在 `src/skin/styles.ts`，按上游路径取对应片段。
4. 共享 Button、Chip、InputNumber 各加一个 `installIslandMotion` 控制器（`src/skin/motion.ts`），只做按压回弹和点击涟漪。
5. Template Card 与 Template Badge 在 `willUpdate` 开头把 HA 深色模式写成 `data-island-theme` 属性。
6. 卡片选择器里的名称/描述把 Mushroom 换成 Animal Island；控制台横幅标明是 fork。
7. 入口 `mushroom.ts` 引入 `src/island/index.ts`（插画图标、随包字体、开屏动画、底部导航）。
8. 标题卡新增 `variant`、`color` 两个展示字段（见 `docs/SKIN.md`）。

此后的改动直接记录在 Git 历史里。

## 跟进上游

上游没有自动同步。要跟进 Mushroom 新版本时：

1. 取 Mushroom `v5.2.3` 与新版本之间的上游 diff。
2. 对上游 diff 做与上面第 1 条相同的 `mushroom-` → `island-` 替换后，手动合并进 `src/mushroom/`。
3. 跑 `npm run build` 并在 HA 里检查。

## 许可

上游根目录 LICENSE 为 Apache-2.0，原文保留在 `src/mushroom/LICENSE`，并随安装包复制为 `licenses/Mushroom-Apache-2.0.txt`。上游 `package.json` 标注 ISC，这个上游元数据不一致按原样记录，不把整个源码重新解释为 ISC。上游固定版本里没有 NOTICE 文件。复制进来的 HA 辅助文件保留其行内声明。

`src/mushroom/` 下的文件都是修改过的 Apache-2.0 文件；本文档与 Git 历史说明了改动。项目根目录的 MIT LICENSE 只适用于本项目的原创部分。见 `THIRD_PARTY_NOTICES.md`。
