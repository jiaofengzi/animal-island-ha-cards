# 家族重构说明

下表 feature_id 与旧入口保留用于兼容性追踪，不代表 23 种独立信息/交互模型。当前按 8 家族 + 3 展示原语组织，推荐入口和覆盖见 [FAMILIES.md](FAMILIES.md)。

# 能力矩阵 · 0.2.1

基线：Mushroom v5.2.3 / d8a90ffff1b217fbbf9cb8210ee672be99596231。
每行唯一 feature_id；“模板”不表示独立设备协议。所有实体为用户配置，不内置家庭实体或品牌。

| feature_id | 入口 | 已实现 | 类型 / 当前限制 | Mushroom 对照 |
|---|---|---|---|---|
| light | light | 开关、亮度 0–255及百分比显示、Kelvin色温/mired兼容、RGB颜色 | 原生 light；HS/XY/RGBW/RGBWW 模式通过 HA 转换 RGB；不独立调白光通道，灯组按组能力 | light 主要控制 |
| climate | climate | HVAC、单/双目标温度、湿度、预设、风量、摆风、水平摆风 | 功能位与枚举双门控；双目标发送两端有效值；辅助加热未实现 | climate 控制并扩展 |
| cover | cover | 开/关/停、位置和叶片角度 | 原生 cover；功能位门控、移动确认 | cover 主要控制 |
| fan | fan | 电源功能位门控、百分比风速、预设、摆风、方向 | 原生 fan；新风需映射 fan | fan 主要控制 |
| media | media | 电源、播/停/暂停、上下首、随机/循环、音量滑块/步进/静音、来源、媒体文字与音量百分比、可选控件列表 | 原生 media_player；无自动封面；具体属性/功能位和显示差异见 MEDIA.md | v5.2.3 文档的控制项已覆盖，显示配置部分适配 |
| vacuum | vacuum | 开始/暂停/停止/回充/定位、吸力 | 原生 vacuum；无地图/分区清扫 | vacuum 部分 |
| entity | entity | 状态、详情；switch/input_boolean 开关 | 其他域只读，不擅自猜服务 | entity 部分 |
| scene | scene | 场景和脚本执行确认 | 原生 scene/script；明确 entity 目标 | entity/action 部分 |
| number | number | min/max/step 滑块写入 | number/input_number；不合法范围不显示 | number slider |
| select | select | 设备 options 选择 | select/input_select，只有当前合法选项 | select |
| summary | summary | 按 ID 去重可用数、分区导航/详情 | 独立聚合 UI；一般 unknown/unavailable 不计可用，时间戳动作实体初始 unknown 可用；group 不展开 | template/title 组合语义 |
| laundry | laundry | 状态/进度/剩余时间可配置字段、确认动作 | **组合模板**，需现有传感器/按钮集成 | 无专用基线 |
| fridge | fridge | 温度/门状态可配置字段、确认动作 | **组合模板**，不保证温控能力 | 无专用基线 |
| water | water | 水质/寿命字段、确认动作 | **组合模板**，不虚构复位服务 | 无专用基线 |
| feeder | feeder | 份量/余量字段、投喂确认动作 | **组合模板**，服务由集成提供 | 无专用基线 |
| meal | meal | 最近餐盘记录字段、可选集成动作 | **组合模板**，无新建记录/照片上传/历史数据库 | 无专用基线 |
| printer | printer | 状态/进度/温度字段、确认动作 | **组合模板**，无通用打印机控制协议 | 无专用基线 |
| consumable | consumable | 剩余量/寿命字段、确认动作 | **组合模板**，阈值计算由 HA sensor 提供 | 无专用基线 |
| camera | camera | 默认隐藏，确认后打开 HA 详情 | 原生隐私入口；无自动图像/流，不实现本地播放器 | 非 Mushroom 专用卡 |
| health | health | 系统健康字段、确认动作 | **组合模板**，无自动诊断/扫描 | entity/template 组合语义 |
| chips | chips | 紧凑状态行、实体详情入口、可选整行手势 | 独立 UI；默认不统计/导航/执行服务 | chips 部分 |
| spacer | spacer | 0–600px 间距，隐藏辅助语义 | 展示组件 | empty |
| picture | picture | 安全来源、alt、懒加载、失败重试 | 展示组件；外部 origin 显式允许 | 非 Mushroom 专用卡 |

## 固定影音基线

逐项对照 [Mushroom 固定版本 media-player 文档](https://github.com/piitaya/lovelace-mushroom/blob/d8a90ffff1b217fbbf9cb8210ee672be99596231/docs/cards/media-player.md) 见 [MEDIA.md](MEDIA.md)。不把 seek/媒体浏览等 HA 域能力误称为该卡片文档承诺，也不声称完整上游克隆。

## 横向能力

| 能力 | 当前结果 |
|---|---|
| hass 状态更新 | 引用实体/服务变化触发，同 tick 合并；无关实体不重建 |
| unknown/unavailable/不可见 | 普通 unknown/不可见/离线禁止写入；scene/button/input_button 的初始 unknown 允许首次调用，危险操作仍确认 |
| 权限/服务失败 | HA 服务端裁决；拒绝和一般错误分别显示，服务缺失禁用 |
| 键盘/辅助功能 | 原生控件语义、三手势键盘等价、焦点可见/恢复、未提交草稿与新状态区分、aria live、reduced motion；非完整 WCAG 认证 |
| 危险动作 | 窗帘运动、清扫/回充、场景、自定义动作确认；停止直接执行 |
| 更多动作 | tap/hold/double：none/more-info/toggle/navigate/url/perform-action/call-service；target 支持 entity/device/area/floor/label，data 与 confirmation；不实现 assist/fire-dom-event/确认豁免 |
| 配置 UI | picker、stub、原生表单、动态字段/动作、实体建议、target/data/confirmation、折叠 JSON；自由结构服务参数仍需 JSON |
| 国际化/主题 | 中文内置文案，原始设备枚举保持原值；固定暖色浅色视觉；未接入 HA 全语言/主题编辑器 |
| 隐私 | 无凭据、遥测、远程字体/图标；camera 无自动请求；外部 picture 经显式允许后可请求 |

验收使用 mock，不代表家庭设备实测。23 类均有示例入口；8 个组合模板共享 renderer，不重复计算成独立协议能力。
