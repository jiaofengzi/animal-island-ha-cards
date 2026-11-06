# 影音能力与固定基线差异

对照 Mushroom v5.2.3（`d8a90ffff1b217fbbf9cb8210ee672be99596231`）的 [media-player 配置文档](https://github.com/piitaya/lovelace-mushroom/blob/d8a90ffff1b217fbbf9cb8210ee672be99596231/docs/cards/media-player.md)，独立实现，不复制上游源码。

| 配置/能力 | Island 0.2.1 |
|---|---|
| `media_controls` | 支持 on_off、shuffle、previous、play_pause_stop、next、repeat；列表控制是否显示，仍受实体功能位约束 |
| `volume_controls` | 支持 volume_mute、volume_set、volume_buttons；步进不依赖音量滑块或 volume_level |
| 控件默认值 | 为保持 Island 0.1/0.2 配置兼容，省略列表时显示全部受支持控件；显式 `[]` 隐藏该组。上游默认空列表。来源选择独立显示，不属于这两个列表 |
| `use_media_info` | 默认 false；开启后 playing/paused/buffering 显示媒体标题及 artist、playlist 或剧集/季/集信息，其他类型可降级 app_name；缺失标题使用配置 name/实体名，停止、离线和未知状态不显示旧元数据。纯文本，**不替换图标或自动请求封面**，避免实体元数据触发外部网络访问 |
| `show_volume_level` | 默认 false；活动播放状态且 volume_level 为 0–1 的有效数值时，状态后显示百分比 |
| `entity` / `name` | 支持；name 是未启用或缺失媒体标题时的回退名称 |
| `layout` / `fill_container` | 未实现同名配置；采用移动优先自然换行和 HA grid 尺寸接口，保持本库的 Animal Island 设计 |
| `primary_info` / `secondary_info` | 未提供任意信息槽选择；固定标题、可选媒体描述和可见状态，避免隐藏设备可用性 |
| `icon` / `icon_type` | 未实现图标/实体图片模式；采用文字操作，未引入图标或封面资源 |
| `collapsible_controls` | 未实现自动折叠；关机时保持受支持控件布局，不引入状态切换的自动收缩 |
| 三种手势 | 均支持配置；tap/hold 默认 more-info，double 默认 none，与上游 double 默认 more-info 不同。动作范围见 ACTIONS.md |

控制门控依据 [HA Core 2026.9.0 常量](https://github.com/home-assistant/core/blob/2026.9.0/homeassistant/components/media_player/const.py)：

| 控件 | 功能位与属性 | 服务/参数 |
|---|---|---|
| 开/关 | TURN_ON=128 / TURN_OFF=256，依当前电源状态 | turn_on / turn_off |
| 播/暂停/停 | PLAY=16384 / PAUSE=1 / STOP=4096 | media_play / media_pause / media_stop |
| 上/下一首 | PREVIOUS_TRACK=16 / NEXT_TRACK=32 | media_previous_track / media_next_track |
| 随机 | SHUFFLE_SET=32768 且 shuffle 为布尔值；无属性时不猜状态、不显示切换按钮 | shuffle_set，shuffle 为当前值取反 |
| 循环 | REPEAT_SET=262144；标准 off/all/one，当前缺失/不合法时提示选择 | repeat_set，repeat 为明确选择值 |
| 音量滑块 | VOLUME_SET=4 且有效 volume_level | volume_set，volume_level 0–1 |
| 音量加减 | VOLUME_STEP=1024（Mushroom 的旧命名 VOLUME_BUTTONS），无需 volume_level | volume_up / volume_down，由集成决定步幅 |
| 静音 | VOLUME_MUTE=8 | volume_mute，is_volume_muted |
| 来源 | SELECT_SOURCE=2048 且非空 source_list | select_source，source |

所有服务还需要 hass.services 提供；不可用、缺失、普通 unknown、只读和繁忙状态禁止提交。HA 负责最终权限判断。操作不伪造状态，等待后续 hass 更新。

没有实现 seek 进度拖动、媒体浏览、播放队列或媒体上传；这些不在此固定版本的 media-player 卡片配置控制列表中，不能据此描述本轮漏实现了上游承诺。封面替换和上述显示布局选项是明确保留的差异。实际设备服务、权限及 Companion WebView 仍需获准的真实 HA 环境验证，本轮只使用隔离 mock。
