# 动作、确认和模板字段 · 0.2.0

支持 HA 风格 `tap_action`、`hold_action`、`double_tap_action`。长按需至少 500ms 并释放；双击识别窗 280ms，配置双击时单击延迟，以免执行两次。滚动、离开、pointercancel、配置变化、重绘或卸载会取消待识别手势。控件和链接有独立行为，不冒泡触发整卡动作。

有 entity 的卡片默认单击/长按打开详情，双击默认无动作。空白间距卡不支持动作。chips 每个状态按钮仍只打开该实体详情；可选整行手势是单独配置，不改变摘要导航的统计职责。

键盘：卡片背景可聚焦，Enter/Space 单击、Shift+Enter 长按、Alt+Enter 双击。内部按钮、滑块和选择器保持各自原生键盘语义。仅聚焦不会冻结 HA 新值；滑块有 input 后才保留未提交草稿，change/Escape 清除。服务忙时禁用控件，结束或取消确认后恢复稳定焦点；用户已移到其他控件时不抢焦点。

```yaml
type: custom:island-light-card
entity: light.demo_lantern
tap_action:
  action: toggle
hold_action:
  action: more-info
double_tap_action:
  action: perform-action
  perform_action: light.turn_on
  target:
    entity_id: light.demo_lantern
  data:
    brightness: 128
  confirmation:
    title: 阅读灯
    text: 将亮度调到约 50%？
    confirm_text: 调整
    dismiss_text: 保持
```

动作类型：`none`、`more-info`（可覆盖 entity）、`toggle`、`navigate`（navigation_path/navigation_replace）、`url`（url_path）、`perform-action`（perform_action/data/target）以及兼容别名 `call-service`（service/service_data/target）。不支持的动作类型会报配置错误，不静默忽略。`assist`、`fire-dom-event` 及确认用户豁免不在本版支持范围。

target 支持明确的 entity_id/device_id/area_id/floor_id/label_id，可为单个字符串或列表；禁止 `all`。默认使用动作 entity 或卡片 entity。data 必须为 JSON 对象，禁止嵌入目标键覆盖 target。执行时使用 HA callService 第四参数传递 target；区域/设备解析与最终权限由 HA 服务端负责，mock 不冒充已验证真实展开结果。

多实体或非实体目标、窗帘移动、场景/脚本、按钮、未知服务均强制确认，`confirmation: false` 不能跳过这些保护。显式 `confirmation` 可给普通动作增加确认。支持 text/title/confirm_text/dismiss_text；不支持 exemptions。组合模板动作始终确认。首次 `scene`、`button`、`input_button` 的 unknown 表示尚未执行，可以操作；unavailable、缺失和其他域 unknown 不能写入。相同卡片服务请求处理中不接受重复提交。

`navigate` 仅接受站内绝对路径；`url` 仅接受没有凭据的 HTTPS 地址，新窗口使用 noopener/noreferrer。影像详情包括手势入口都需要确认，默认无图片或流请求。允许外部图片只限显式 HTTPS origin；不插入 HTML、不执行表达式。

## 原生表单编辑器

通过 `getConfigElement` 提供 Web Component 表单：名称、只读、实体建议、图片来源/alt、间距、动态字段列表及角色/单位/进度范围、组合动作、三类手势、target/data 和确认文字。普通配置无需 JSON；自由结构的服务 data 用有校验的 JSON 对象输入。完整 JSON 放在折叠高级区，作为扩展路径。合法修改派发 `config-changed`；非法配置保留错误提示，不派发。演示页的“编辑灯光卡片”可实时验证。

## 组合字段语义

`role` 可选，提供语义名称和默认单位；name/unit 可以显式覆盖，attribute 选择标量属性。进度类 role 使用上游 Progress 组件，min/max 默认 0/100，可自定义。无效范围报错、不可用状态不显示旧进度。角色字典用于语义与展示，不推断设备能力。

| 模板 | 允许 role |
|---|---|
| laundry | status, progress, remaining, program |
| fridge | temperature, freezer, door, power |
| water | tds, filter, flow, status |
| feeder | remaining, portion, last_feed, status |
| meal | record, recorded_at, note |
| printer | status, progress, nozzle, bed, remaining |
| consumable | remaining, life, replacement |
| health | status, cpu, memory, disk, temperature, uptime |

餐盘无内置采集、上传、历史或记录写入。仅展示已有集成状态；如果用户另外配置服务动作，仍作为显式的集成调用确认执行，不能描述为卡片自带记录数据库。

参考：[HA Dashboard actions](https://www.home-assistant.io/dashboards/actions/)，固定 Mushroom v5.2.3 卡片配置及 HA 类型定义；实现为原创，不复制 Mushroom 源码。


## 家族入口中的动作层级

`actions[].role` 可选 primary / secondary / danger；同一状态最多一个 primary；互斥的 when_states 可以各自指定 primary。不按配置顺序推断主动作。全部组合动作仍需确认，role 不改变服务、目标、防重复或权限校验。`description` 可提供效果说明。新旧入口及 profile 解析见 [家族说明](FAMILIES.md)。
