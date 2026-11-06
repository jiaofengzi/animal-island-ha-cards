# Animal Island HA Cards

以 Animal Island UI 3.0.0 实际 React 组件构建的 Home Assistant 自定义卡片。8 个交互家族、23 个模块入口，提供独立可交互的原版对照预览。

这是公开预览版，仍待视觉验收。仅在隔离 mock HA 中验证，未连接真实家庭设备。项目独立维护，与 Animal Island UI、Mushroom、任天堂或其他游戏厂商无隶属关系。

## 运行对照预览

```sh
npm ci --ignore-scripts
npm run build:acceptance
npm run dev
```

打开 `http://127.0.0.1:4173/_acceptance/`。页面提供 23 组原版/新版并排、家族和单模块筛选、7 种模拟状态、服务日志与重置。`_acceptance/offline.html` 内嵌 JS/CSS/官方参考图；图片模块受生产安全策略限制，在 file 模式下显示说明，完整图片需 HTTP 预览。

左侧是固定 Mushroom v5.2.3 官方文档原图，右侧是可交互的 Island 模块。两侧实体和状态不同，没有运行 Mushroom bundle 或 HA 沙箱；无对应卡的项目明确说明，不将组合设计称作官方专用卡。见 [验收说明](docs/ACCEPTANCE.md)。

页面与卡片使用包根导出的 Card、Title、Button、Input、Select、Switch、Collapse、Tag、Progress 和 naive-icons。上游没有 Slider，数值滑杆以原生 range 提供键盘/指针语义，实际 Progress 提供外观。多行 JSON 保留 textarea，使用官方 token。没有字体文件或 CDN，系统字体与官方演示字形可能有差异。

## 安装

1. 从构建产物或源码包复制**整个 `dist/` 目录的内容**到 Home Assistant 的 `config/www/island-ha-cards/`，保持相对目录：`island-ha-cards.js`、`licenses/` 和 `THIRD_PARTY_NOTICES.md`。**本版不含字体文件**，不注册 `@font-face`，不主动请求字体或 CDN；默认使用设备已有字体及系统回退。可选字体名称/字重见 [字体说明](docs/FONTS.md)。
2. 设置 → 仪表盘 → 右上角菜单 → 资源，添加 `/local/island-ha-cards/island-ha-cards.js?v=0.1.0-preview.1`，类型选择 JavaScript 模块。资源菜单需要高级模式。
3. 在仪表盘 YAML 中添加卡片，替换示例实体为自己的实体。仓库没有真实家庭实体。不要把凭据放在配置或图片 URL 中。

```yaml
type: custom:island-control-card
profile: light
entity: light.demo_lantern
name: 门廊的小灯
```

也可添加自定义卡片后使用原生表单编辑器；普通配置无需 JSON，自由结构服务参数使用 JSON 输入。完整 JSON 是折叠的高级选项。旧入口的 23 项家庭用例示例见 [examples/cards.yaml](examples/cards.yaml)，[动作与字段说明](docs/ACTIONS.md)。未发布 npm 包或 GitHub Release；当前采用手动安装，不声称 HACS 安装已经验证。

兼容目标为 Home Assistant **2026.9+**、支持 ES2022 的现代浏览器。该最低目标由固定 Mushroom 基线及当前 HA API 制定，**尚未在真实 HA 2026.9 运行时验证**。React 和所需组件依赖均本地打包，运行时不访问 CDN 或 npm。

## 配置与操作

通用项：`type`、`name`、`read_only`；设备控制卡使用 `entity`。仅在设备属性/功能位支持且 `hass.services` 提供服务时显示/启用对应控件。`unavailable`、不可见实体、只读模式会阻止写入。一般 `unknown` 也不能操作；scene/button/input_button 的初始 unknown 表示尚未执行，允许首次确认调用。HA 服务端仍是权限裁决者；UI 无法预知全部授权，无权限/服务错误均在卡片显示。

组合模板使用 `entities: [{entity, name?, attribute?, role?, unit?, min?, max?}]` 显示已有状态或标量属性；每类有独立 role 字典，进度字段可显示 meter。可选 `actions: [{label, service, entity, data?}]`；每个组合动作都需要显式确认，目标为明确实体，data 不得覆盖目标。不提供模板脚本执行、eval 或任意 HTML。餐盘卡只展示集成提供的最近记录，**不保存餐盘、不上传照片，也不提供历史数据库**；另行配置的集成服务仍是显式确认动作。

摘要导航使用 `entities: [{entity, name?, path?}]`：实体按 ID 去重展示配置状态，显式 severity 标记需要关注的项目，提供站内路径导航或详情入口；不自动展开 HA group 成员。顶部 chips 是紧凑状态展示原语，仅有实体详情入口，不做聚合统计和分区导航。二者渲染结构和测试分别覆盖。

影像入口不读取 `entity_picture`、不请求摄像头图像、不开流。用户确认后才派发 HA `hass-more-info` 事件；后续影像加载/关闭由 HA 详情界面负责。图片卡使用 `image` 和必填 `alt`，仅默认允许同源 URL；外部 HTTPS 必须逐个加入 `allowed_image_origins`（例如 `https://images.example.com`）。外部来源应为你信任的服务器，重定向由浏览器处理；不允许 data/javascript、URL 用户名密码或非 HTTPS 外源。图片懒加载，失败有重试提示，不发送 referrer。

支持 `tap_action` / `hold_action` / `double_tap_action`，包括 more-info、toggle、navigate、HTTPS url、perform-action 和 call-service 别名。target 支持明确实体/设备/区域/楼层/标签，data 独立传给 HA。危险操作、未知服务、多实体或广域目标强制确认；普通动作可配置确认文字。内部控件不触发整卡手势，繁忙状态阻止重复提交，异步结束/取消恢复键盘焦点。详细配置与支持边界见 [动作说明](docs/ACTIONS.md)。

影音支持 `use_media_info`、`show_volume_level` 及可选 `media_controls` / `volume_controls` 列表，编辑器中可直接设置。省略列表时自动显示设备支持的控件，`[]` 隐藏该组。媒体信息仅显示文字，不自动加载封面；详细门控与固定基线差异见 [影音说明](docs/MEDIA.md)。

## 开发与验证

Node 24。`npm run check` 执行 ESLint、TypeScript、核心测试、两个静态构建、浏览器回归和依赖许可证检查。CI 使用隔离 Chromium 与 mock HA；不会连接真实设备。CI 通过不等于真实 HA 兼容认证或用户视觉验收。

`demo/index.html` 与 `_site/` 仅为回归测试夹具。公开 GitHub Pages 只发布 `_acceptance/`，不发布源码目录或测试日志。部署必须先通过检查。

参考：[家族映射](docs/FAMILIES.md)、[能力矩阵](docs/CAPABILITIES.md)、[动作](docs/ACTIONS.md)、[影音](docs/MEDIA.md)。

## 许可

本项目 MIT。Animal Island UI、naive-icons、React 及本地打包依赖保留各自许可证；Mushroom 官方参考图按 Apache-2.0 保留来源。见 [第三方许可](THIRD_PARTY_NOTICES.md) 与 `licenses/`。
