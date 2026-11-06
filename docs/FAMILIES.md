# 以任务划分的卡片家族

本库重构为 **8 个交互家族 + 3 个展示原语**。家庭的设备清单不是卡片设计数量指标；同一交互模型可用于多个设备。`profile` 是已有 Home Assistant 实体能力或字段语义的配置，不是新设备协议。保留全部 23 个旧配置入口；无须为了升级逐张改 YAML。

## 覆盖映射

|家族|设备/用途|推荐入口与 profile|首屏任务与渐进展开|
|---|---|---|---|
|日常调节 control|灯、灯组、新风风机、通用实体、数值、选项|`island-control-card`；light / fan / entity / number / select|状态与日常调节；光色、风向等低频项展开|
|温控 climate|空调|`island-climate-card`|目标与实际温度分开，模式/高级功能展开|
|开合 cover|窗帘|`island-cover-card`|开度与方向，移动时停止优先；叶片展开|
|影音 media|播放器、电视、音箱|`island-media-card`|内容与播放运输控制；电源、随机、循环等次级|
|任务 task|扫地、洗衣干衣、3D 打印|`island-task-card`；vacuum / laundry / printer|当前阶段、真实进度、剩余时间；具体集成动作仍需配置|
|观察与维护 monitor|冰箱、净水、耗材、系统健康、餐盘记录|`island-monitor-card`；fridge / water / consumable / health / meal|关键读数或最近记录；异常只由实际值或明确配置表达|
|明确行动 action|场景、喂食、影像隐私入口|`island-action-card`；scene / feeder / camera|行动目的/份量及上下文；风险动作显式确认|
|空间摘要 summary|区域摘要与导航|`island-summary-card`|区域状态和关注事项、导航；不以在线率充当生活主焦点|

三个非操作原语：`island-chips-card` 状态胶囊、`island-picture-card` 图片、`island-spacer-card` 留白。它们不为了凑数量算作操作家族。

八个原组合模板（laundry/fridge/water/feeder/meal/printer/consumable/health）跨三家族复用信息结构，不是八套新集成协议。所有原生能力门控和模板 role 字典继续生效。

## 兼容与解析

所有入口都加 `custom:` 前缀。新入口不更改底层服务、目标实体或 `config.type`；解析得到旧 `kind`，复用原验证和能力层。

- control 无 profile 时按 entity domain 推断 light/fan/number/input_number/select/input_select；其余域采用 entity。sensor 仍只读，不伪装开关。
- task 无 profile 只推断 vacuum；洗衣和打印必须指定 profile。
- action 无 profile 只推断 scene/script/camera；喂食必须指定 feeder。不能因 button 域就猜测投喂语义。
- monitor 必须明确 profile，避免将同一 sensor 数值套入错误字段语义。
- 显式 profile 只能取上述对应家族的旧 kind 名称。
- 旧入口可以省略 profile；如提供必须与原 kind 相同，避免两份类型定义互相矛盾。
- climate/cover/media/summary 的入口本身已是家族，不新增重复别名。

旧配置仍可直接使用：

```yaml
type: custom:island-light-card
entity: light.demo_lantern
name: 门廊的小灯
```

等价推荐写法：

```yaml
type: custom:island-control-card
profile: light
entity: light.demo_lantern
name: 门廊的小灯
```

## 任务与监测示例

全部为虚构示例实体，使用时替换为自己的集成实体。没有字段时不填，不用占位数字假装真实状态。

```yaml
type: custom:island-task-card
profile: laundry
name: 洗衣房
entities:
  - entity: sensor.demo_laundry_phase
    role: status
  - entity: sensor.demo_laundry_remaining
    role: remaining
    unit: 分钟
  - entity: sensor.demo_laundry_progress
    role: progress
```

```yaml
type: custom:island-monitor-card
profile: fridge
name: 厨房冰箱
entities:
  - entity: sensor.demo_fridge_temperature
    role: temperature
  - entity: sensor.demo_freezer_temperature
    role: freezer
  - entity: binary_sensor.demo_fridge_door
    role: door
```

## 明确行动，不猜按钮顺序

`description` 是可选文字，说明场景效果或卡片用途；不是 HTML，不运行模板。`actions[].role` 可为 primary / secondary / danger，同一状态最多一个 primary。省略不代表第一个动作自动变为主动作；所有组合动作继续显式确认。`danger` 只增加呈现隔离，不降低已有确认/权限保护。

```yaml
type: custom:island-action-card
profile: feeder
name: 小碗开饭
entities:
  - entity: sensor.demo_portions
    role: portion
  - entity: sensor.demo_last_feed
    role: last_feed
actions:
  - label: 投喂 2 份
    role: primary
    service: button.press
    entity: button.demo_feed_two_portions
```

按钮实体必须确实代表标签中所述的两份投喂；本库不会根据传感器文字替集成计算投喂量，也不会添加自动重复操作。请求成功只说明服务已发送；设备实际结果以实体状态为准。

`entities[].severity` 可显式配置 normal / warning / error。它是静态呈现强调，不是自动诊断、动态阈值表达式或安全结论；不要将始终存在的正常项永久设为 error。需要随值变化的警报，应由集成提供对应状态。未配置不能把未知值假设为健康。

## 安全与边界

- unknown/unavailable、不存在实体、只读、服务缺失和后端权限错误保持可辨别；不填零、不假称成功。
- 投喂、危险动作、取消、宽目标动作保持确认和防重复；结果未知不自动重试。
- 影像入口默认不读取封面/摄像头图像，不开流；用户确认后交由 HA more-info。关闭入口不意味着关闭摄像头采集。
- 餐盘只读已有记录，不写入、不上传、不新增数据库。水质/余量不构成食用或饮水安全判断。
- 模拟展示验证不等于真实家庭设备验证。不得在源码、演示、截图或测试中提交真实家庭实体 ID。

## 许可与来源

家族设计和实现为本项目独立实现。可以参照 Home Assistant 官方服务能力约定，但不复制 Mushroom 的组件源码、CSS、图标或许可受限资产。既有第三方许可说明随安装产物保留；没有新增运行时依赖、公共站点或公开 Release。


## 隔离画廊与验证 API

- `/`：23 个兼容入口的实际组件示例，8 家族代表排在前面。
- `/?view=overview`：仅显示 8 个代表用例。
- `/?profile=light`：单个旧 profile；可选全部 23 个旧 kind。
- `/?family=task`：按家族筛选；也可使用 chips/picture/spacer 查看展示原语。
- `/?profile=light&state=unavailable`：直接进入测试状态。
- state 可为 normal / unknown / unavailable / missing / readonly / no-service / denied / error / pending。

`window.islandDemo` 提供 `configs`、`cards`、`hass`、`calls`、`profiles`、`familyOf`，以及 `setMode(mode)`、`setState(entityId, state, attributes?)`、`reset()`、`releasePending(error=false)`。`pendingCount` 可检查防重复请求。模拟服务不会访问 HA；正常响应修改内存状态，等待模式需显式释放，拒绝/失败模式不会修改设备状态。切换状态会拒绝尚未完成的模拟响应，避免隐藏请求意外执行。

按钮与选项测试选择器保留旧 tag，以及 `#cards` / `#mode` / `#calls` / `#update` / `#clear` / `#edit-light` / `#editor-panel`。新版主次结构、首屏可见性和语义样例已变化，旧测试不能再断言首个服务高亮、待机 68%、投喂一份或图片默认加载失败。


### 按任务状态切换动作

组合动作可设置 `when_states: [打印中]`。只匹配本卡 `entities` 中 `role: status` 对应实体的原始 state；须显式提供该字段，不能根据进度、翻译文字或服务名猜测设备协议。不可用/未知状态不显示条件动作。省略条件保持原行为。多个 primary 仅在 when_states 互斥时允许；暂停与继续可共享首屏动作位置，取消仍设置 danger 并确认。

```yaml
actions:
  - label: 暂停打印
    role: primary
    when_states: [打印中]
    service: button.press
    entity: button.demo_print_pause
  - label: 继续打印
    role: primary
    when_states: [已暂停]
    service: button.press
    entity: button.demo_print_resume
```

状态文字须替换为真实集成原始 state；上例为模拟数据，不声称所有打印集成都使用中文状态。

画廊额外支持 `?profile=cover&scenario=cover-moving`、`?profile=printer&scenario=print-paused` 和 `?profile=media&scenario=media-paused`，便于只通过地址栏与可见控件验证状态场景。

画廊验证工具默认折叠，`?qa=1` 可展开；`?capture=1` 隐藏测试工具、家族导航与页脚，仅保留标题及演示数据标识用于截图。

验证工具的“设备场景”下拉只更新模拟实体状态，不重置配置或关闭确认框。可用于验证“打开动作确认后状态变化”的竞态；真实执行前重新读取任务状态，不再适用的动作必须拒绝发送。

原生编辑器切换同一家族的 profile 时使用一次验证事务：选择匹配域的可见实体（没有则使用明确 demo 占位），组合字段保留但清除不兼容 role，原 profile 的集成动作清除以免误触旧设备。切换前界面有明确提示；跨家族需更换 type。

模拟画廊的固定投喂动作使用独立 `sensor.demo_feed_portion`（2 份），不与可编辑的 number 示例共享状态。集成的动作标签、服务 data/目标与份量读数必须一致；卡片不会根据展示数值自动改变服务参数或推断份量。
