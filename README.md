# Animal Island HA Cards

面向 Home Assistant 的动森风格卡片。本轮以 **Mushroom v5.2.3** 为功能基线：保留其 Lit 配置、状态、操作、模板、编辑器及尺寸逻辑，在独立 `island-*` 命名下改造共享视觉层。

[公开逐项验收页](https://jiaofengzi.github.io/animal-island-ha-cards/) · [源码与许可来源](docs/UPSTREAM.md) · [视觉转换边界](docs/SKIN.md) · [真实 HA 验证说明](docs/HA-VALIDATION.md)

这是独立维护的预览项目，与 Mushroom、Animal Island UI、任天堂或其他游戏厂商无隶属关系。它采用 Animal Island 的设计规范转换到 Lit，**不是直接使用 React 同一组件库**。网页壳可以使用 React；卡片运行时是上游 Lit fork。网页版本与测试状态以页内证据为准。

## 完整目标范围

18 种现行卡片：Alarm Control Panel、Chips、Climate、Cover、Empty、Entity、Fan、Humidifier、Light、Lock、Media Player、Number、Person、Select、Template、Title、Update、Vacuum。

另含独立 **Template Badge**；Chips Card 内全部 11 种子类型：Action、Alarm Control Panel、Back、Conditional、Entity、Light、Menu、Quickbar、Spacer、Template、Weather。

Legacy Template 仅作为额外兼容项保留，不计入18种现行卡，也不用于替代新版 Template。先前23个家庭场景是旧概念展示，不作为这次完整对标数量。

## 安装与配置

使用当前成功 CI 的完整 `dist/` 安装包，复制全部内容到 Home Assistant 的 `config/www/island-ha-cards/`。资源添加 `/local/island-ha-cards/island-ha-cards.js?v=0.2.0-parity.1`，类型为 JavaScript 模块。保留随包的 LICENSE、NOTICE、依赖许可与来源清单。

配置沿用固定 Mushroom v5.2.3 的字段，只将顶层类型前缀改成 `island-`。例如：

```yaml
type: custom:island-light-card
entity: light.your_light
show_brightness_control: true
```

顶栏徽章使用 `custom:island-template-badge`，放在视图的 `badges` 中。Chips Card 使用 `custom:island-chips-card`，内部 `chips: [{type: entity, entity: ...}]` 的子类型名保持原样。

旧概念版的 `island-media-card` 等别名和家庭组合字段不是本轮官方配置接口；升级前按官方对应卡片配置迁移，不要仅更换文件就假定所有旧配置兼容。详见固定版 [Mushroom 文档](https://github.com/piitaya/lovelace-mushroom/tree/v5.2.3/docs)。

没有随包字体，没有 `@font-face` 或 CDN。字体只使用设备已有的 Nunito、Noto Sans SC 和系统回退。用户配置的 HA 实体图标、图片与原生 features 保留宿主语义，不伪造替换。详情、菜单、Quickbar、Assist、条件规则及 Jinja 模板依赖真实 HA 宿主。

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
