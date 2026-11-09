// 预览仪表盘：结构和 HA 的仪表盘 YAML 一一对应（views → sections → cards），只是换成了 JS 对象。
// grid_options.columns 和 HA “分区（Sections）”视图一致：每个分区 12 列，12 = 整行，6 = 半行，4 = 三分之一。
// 目标：电脑一屏、手机每页一屏，不用上下滑。需要调节的设备用整行卡；只看状态或点一下的用方块。
const tile = (extra) => ({ layout: "vertical", fill_container: true, grid_options: { columns: 4 }, ...extra });
const half = (extra) => ({ layout: "vertical", fill_container: true, grid_options: { columns: 6 }, ...extra });

// 电脑上只有首页一个页面，四个分区铺开；手机上首页只留“早安”分区，房间去底部导航里切。
// HA 里用分区的 visibility 屏幕条件实现；房间页设为 subview，电脑顶栏不会出现页签。
// 平板（601px 以上）按电脑处理：一个页面，四个分区排成两列两行。
const DESKTOP_ONLY = [{ condition: "screen", media_query: "(min-width: 601px)" }];
const MOBILE_ONLY = [{ condition: "screen", media_query: "(max-width: 600px)" }];

const navbar = {
  type: "custom:island-navbar-card",
  items: [
    { name: "首页", icon: "island:house", path: "?view=home" },
    { name: "客厅", icon: "island:sofa", path: "?view=living" },
    { name: "卧室", icon: "island:bed", path: "?view=bedroom" },
    { name: "家务", icon: "island:washer", path: "?view=chores" },
  ],
};

const greeting = {
  ribbon: "#ffcc3d",
  cards: [
    { type: "custom:island-splash-card", title: "我的小岛", mode: "session" },
    { type: "custom:island-title-card", title: "早上好，岛民！", subtitle: "今天也是悠闲的一天" },
    {
      type: "custom:island-chips-card",
      chips: [
        { type: "weather", entity: "weather.home", show_conditions: true, show_temperature: true },
        { type: "entity", entity: "sensor.living_temperature" },
        { type: "light", entity: "light.living_lamp", use_light_color: true },
        { type: "template", icon: "mdi:music", content: "{{ state_attr('media_player.living_speaker', 'media_title') }}", entity: "media_player.living_speaker" },
        { type: "alarm-control-panel", entity: "alarm_control_panel.home" },
      ],
    },
    tile({ type: "custom:island-person-card", entity: "person.me" }),
    tile({ type: "custom:island-person-card", entity: "person.friend" }),
    tile({ type: "custom:island-lock-card", entity: "lock.front_door", tap_action: { action: "toggle" } }),
    { type: "custom:island-alarm-control-panel-card", entity: "alarm_control_panel.home", states: ["armed_home", "armed_away"] },
  ],
};

const living = {
  ribbon: "#ff9a3c",
  cards: [
    { type: "custom:island-title-card", title: "客厅", color: "default" },
    { type: "custom:island-light-card", entity: "light.living_lamp", show_brightness_control: true, show_color_temp_control: true, show_color_control: true, use_light_color: true, tap_action: { action: "toggle" } },
    { type: "custom:island-climate-card", entity: "climate.living_ac", show_temperature_control: true, hvac_modes: ["cool", "heat", "dry", "off"] },
    { type: "custom:island-media-player-card", entity: "media_player.living_speaker", use_media_info: true, show_volume_level: true, media_controls: ["on_off", "previous", "play_pause_stop", "next"], volume_controls: ["volume_mute", "volume_set"] },
    { type: "custom:island-cover-card", entity: "cover.living_curtain", show_buttons_control: true, show_position_control: true },
  ],
};

const bedroom = {
  ribbon: "#3ec2ae",
  cards: [
    { type: "custom:island-title-card", title: "卧室", variant: "layer", color: "app-blue" },
    tile({ type: "custom:island-light-card", entity: "light.bedroom_lamp", tap_action: { action: "toggle" } }),
    tile({ type: "custom:island-entity-card", entity: "switch.kettle", tap_action: { action: "toggle" } }),
    tile({ type: "custom:island-entity-card", entity: "sensor.living_humidity" }),
    { type: "custom:island-fan-card", entity: "fan.bedroom_fan", show_percentage_control: true, show_oscillate_control: true, icon_animation: true },
    { type: "custom:island-humidifier-card", entity: "humidifier.bedroom", show_target_humidity_control: true },
  ],
};

const chores = {
  ribbon: "#ff8fab",
  cards: [
    { type: "custom:island-title-card", title: "家务", variant: "tab", color: "app-orange" },
    { type: "custom:island-vacuum-card", entity: "vacuum.robot", commands: ["start_pause", "stop", "locate", "return_home"] },
    { type: "custom:island-number-card", entity: "number.feeder", display_mode: "buttons" },
    { type: "custom:island-select-card", entity: "select.washer_mode" },
    { type: "custom:island-update-card", entity: "update.home_assistant", tap_action: { action: "perform-action", perform_action: "update.install", target: { entity_id: "update.home_assistant" } } },
  ],
};

// 导航栏单独一个分区，只在手机上显示，固定在屏幕底部
const nav = { cards: [navbar], full: true, visibility: MOBILE_ONLY };

export const views = [
  { path: "home", title: "首页", sections: [greeting, { ...living, visibility: DESKTOP_ONLY }, { ...bedroom, visibility: DESKTOP_ONLY }, { ...chores, visibility: DESKTOP_ONLY }, nav] },
  { path: "living", title: "客厅", subview: true, sections: [living, nav] },
  { path: "bedroom", title: "卧室", subview: true, sections: [bedroom, nav] },
  { path: "chores", title: "家务", subview: true, sections: [chores, nav] },
];
