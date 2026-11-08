# Animal Island HA Cards

面向 Home Assistant 的动森风格卡片。本轮以 **Mushroom v5.2.3** 为功能基线：保留其 Lit 配置、状态、操作、模板、编辑器及尺寸逻辑，在独立 `island-*` 命名下改造共享视觉层。

[公开逐项验收页](https://jiaofengzi.github.io/animal-island-ha-cards/) · [源码与许可来源](docs/UPSTREAM.md) · [视觉转换边界](docs/SKIN.md) · [真实 HA 验证说明](docs/HA-VALIDATION.md)

这是独立维护的预览项目，与 Mushroom、Animal Island UI、任天堂或其他游戏厂商无隶属关系。它采用 Animal Island 的设计规范转换到 Lit，**不是直接使用 React 同一组件库**。网页壳可以使用 React；卡片运行时是上游 Lit fork。网页版本与测试状态以页内证据为准。

## 三个版本的真实 HA 对照

[官方 Mushroom × 此前版本 × 修复后新版](https://jiaofengzi.github.io/animal-island-ha-cards/three-way/) 在同一 Home Assistant 2026.9.0 测试环境里使用相同合成实体和配置，逐项显示 18 种卡片、11 种 Chip 和 1 种 Badge 的真实截图。页面标注每个版本的提交与构建来源、桌面和手机容器尺寸，以及空白组件。它是截图对照，不是连接家庭设备的实时控制面板。

原有公开验收页与旧安装包保持原地址和原内容；新版安装包位于三方对照页的下载链接。

## 完整目标范围

18 种现行卡片：Alarm Control Panel、Chips、Climate、Cover、Empty、Entity、Fan、Humidifier、Light、Lock、Media Player、Number、Person、Select、Template、Title、Update、Vacuum。

另含独立 **Template Badge**；Chips Card 内全部 11 种子类型：Action、Alarm Control Panel、Back、Conditional、Entity、Light、Menu、Quickbar、Spacer、Template、Weather。

Legacy Template 仅作为额外兼容项保留，不计入18种现行卡，也不用于替代新版 Template。先前23个家庭场景是旧概念展示，不作为这次完整对标数量。

## 本地预览（不需要 HA）

```sh
npm ci --ignore-scripts
npm run preview
```

然后打开 http://127.0.0.1:4173/preview/index.html 。页面加载的是真实构建出来的卡片包，HA 部分用 `preview/fake-hass.js` 里的假设备代替，可以开关灯、拖滑条、切换手机/平板/电脑宽度和深色模式。仪表盘布局在 `preview/dashboard.js`，写法和 HA 里的 YAML 一一对应。

## 小岛风格改造（v0.3）

- **插画图标**：`src/island/art.ts` 里是重新绘制的彩色图标。构建时把卡片里的 `ha-state-icon` 换成 `island-state-icon`：认得的图标画成插画，认不得的仍显示 HA 原生图标，只是放进同款彩色方块。设备关闭时方块变成灰米色，打开时会弹一下，风扇、音箱、扫地机等在工作时有小动画。
- **颜色分家**：每张卡按图标的颜色家族自动上色（灯是橙色、空调制冷是蓝色、制热是橙色……），开着的设备是带波点的彩色卡，关着的是素色卡。
- **大小分层**：建议在“分区”视图里，需要调节的设备用整行大卡，只看状态或一点就开关的设备用 `layout: vertical` + `grid_options: {columns: 4}` 的小方块。示例见 `preview/dashboard.js`。
- **字体**：随包附带 Resource Han Rounded（中文圆体，GB2312 子集）和 Nunito，均为 SIL OFL 许可，见 `src/fonts/`。重新生成字体用 `scripts/fonts/subset.py`。
- **开屏动画**：在仪表盘里加一张 `type: custom:island-splash-card`（可选 `title`、`subtitle`、`mode: session|always`），卡片不占位置，打开页面时播放一次，点击跳过。
- **底部导航（手机）**：在每个视图最后放一张 `type: custom:island-navbar-card`，`items` 里写 `{name, icon, path}`。屏幕宽度不超过 870px 时固定在底部，电脑上自动隐藏（`show: always` 可强制显示）。
- **一屏布局**：电脑只有首页一个视图，四个分区铺开；手机首页只显示“早安”分区（分区的 `visibility` 屏幕条件），客厅/卧室/家务做成 `subview: true` 的子视图，电脑顶栏不会出现页签，手机用底部导航进入。不使用顶部徽章（badges）。写法见 `preview/dashboard.js`。
- **深色模式**：夜空蓝卡片，颜色只放在图标、卡片底边和状态气泡上，不再混进卡片底色。
- **主题**：`themes/animal-island.yaml` 负责页面背景、顶栏、侧栏和字体。顶栏底部的波浪花边只在预览页里有，HA 主题做不到。

## 安装与配置

### 用 HACS 安装（推荐）

1. HACS → 右上角 ⋮ → **自定义存储库**，地址填 `https://github.com/jiaofengzi/animal-island-ha-cards`，类别选 **Dashboard**（旧版 HACS 叫 Lovelace / Plugin）。
2. 在 HACS 里搜索 **Animal Island HA Cards** → 下载 → 按提示刷新浏览器。HACS 会自动添加仪表盘资源，字体随包一起下载。
3. 以后有新版本时，HACS 里会出现更新提示，点更新即可。

每次 `package.json` 版本号变化并推到 main，`.github/workflows/release.yml` 会自动构建 `dist/` 并发布 `v<版本号>`。dist 只提交在发布标签上，main 不含构建产物。

### 手动安装

从 [Releases](https://github.com/jiaofengzi/animal-island-ha-cards/releases) 下载 `island-ha-cards.zip`，把里面全部内容（含 `fonts/`）解压到 Home Assistant 的 `config/www/island-ha-cards/`。在“设置 → 仪表盘 → 资源”添加 `/local/island-ha-cards/island-ha-cards.js?v=0.3.0`，类型为 JavaScript 模块。字体按 JS 文件所在位置加载，所以 `fonts/` 必须和 JS 在同一目录。保留随包的 LICENSE、NOTICE、依赖许可与来源清单。

### 示例

- `examples/dashboard.yaml`：完整的一屏式小岛仪表盘（分区视图、手机底部导航、开屏动画），新建仪表盘后在“原始配置编辑器”里粘贴，再把示例实体换成自己的。
- `examples/cards.yaml` / `examples/cards.json`：每种卡片的单独写法。

配置沿用固定 Mushroom v5.2.3 的字段，只将顶层类型前缀改成 `island-`。例如：

```yaml
type: custom:island-light-card
entity: light.your_light
show_brightness_control: true
```

顶栏徽章使用 `custom:island-template-badge`，放在视图的 `badges` 中。Chips Card 使用 `custom:island-chips-card`，内部 `chips: [{type: entity, entity: ...}]` 的子类型名保持原样。

旧概念版的 `island-media-card` 等别名和家庭组合字段不是本轮官方配置接口；升级前按官方对应卡片配置迁移，不要仅更换文件就假定所有旧配置兼容。详见固定版 [Mushroom 文档](https://github.com/piitaya/lovelace-mushroom/tree/v5.2.3/docs)。

随包附带 Resource Han Rounded 与 Nunito 的 WOFF2 子集（SIL OFL 1.1），同源加载，不请求 CDN，详见 [docs/FONTS.md](docs/FONTS.md)。认得的实体图标显示为原创插画图标，认不得的仍交给 HA 原生图标；图片与原生 features 保留宿主语义。详情、菜单、Quickbar、Assist、条件规则及 Jinja 模板依赖真实 HA 宿主。

## 尺寸与行为

保留各卡的 `getCardSize`、`getGridOptions` 与兼容布局接口。Sections 推荐行列由内容、布局、控件和活动状态决定；Chips/Title 与 Empty、Template 有各自规则，不能统一硬设高度。用户的 `grid_options` 由 HA 布局系统解释。

Masonry、Sections、窄容器和固定网格高度是不同测试维度。原版与新版必须在相同实体、配置及容器条件下比较，不把调整浏览器宽度等同于调整卡片列宽。

## 开发

Node 24。依赖锁定在 `package-lock.json`。

```sh
npm ci --ignore-scripts
npm run check:static
```

构建会逐文件核对 vendored 上游 Git blob SHA，再产出：
- `_parity/mushroom-original.js`：未经行为修改的官方源码本地构建，不声称与官方发布 bundle 字节相同。
- `dist/island-ha-cards.js` 与 `_parity/island-ha-cards.js`：独立命名、追加动森视觉的 fork。
- `dist/transform-manifest.json`：来源哈希、修改类别、注册清单与构建哈希。

两套自有元素可以在同一 HA 页面共存，`ha-*`/`hui-*` 宿主元素不改名。业务逻辑不会重新实现为简化 mock；模板仍通过 HA 的 `render_template` 订阅，动作仍交给宿主 `hass-action` 处理。

CI 的真实 HA 工作流启动隔离的官方 Home Assistant 2026.9.0 容器，使用合成实体验证并截图，不连接家庭设备。部分硬件域的服务效果无法由合成状态证明。1131条规格清单不代表1131条测试已经通过；实际通过、未运行和仍需真实集成验证的内容分别记载。

旧23场景源码保留用于历史回归，通过 `npm run check:legacy` 在独立缓存目录执行，不覆盖本轮产物，也不再自动部署旧验收页。

## 许可证

- Vendored Mushroom v5.2.3 与衍生 fork 保留 **Apache-2.0** 许可、来源和改动标记。
- 上游 package.json 标注 ISC，但根 LICENSE 为 Apache-2.0。这里明确记录冲突，不将其解释为任意选择双许可。
- 本项目原有独立代码仍适用 MIT；各依赖保留其许可。见 `THIRD_PARTY_NOTICES.md`、`vendor/mushroom-v5.2.3/LICENSE` 和安装包 `licenses/`。
