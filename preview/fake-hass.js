// 预览专用：一个够卡片渲染和简单交互用的假 hass 对象。不连接任何真实设备。
const now = () => new Date().toISOString();

const STATE_ZH = {
  on: "开", off: "关", unavailable: "不可用", unknown: "未知",
  home: "在家", not_home: "外出", away: "外出",
  open: "打开", closed: "关闭", opening: "正在打开", closing: "正在关闭",
  locked: "已上锁", unlocked: "已解锁", locking: "正在上锁", unlocking: "正在解锁", open_lock: "已打开",
  playing: "播放中", paused: "已暂停", idle: "空闲", standby: "待机",
  cleaning: "清扫中", docked: "已回充", returning: "正在回充", error: "出错",
  heat: "制热", cool: "制冷", auto: "自动", dry: "除湿", fan_only: "送风", heat_cool: "制热/制冷",
  disarmed: "已撤防", armed_home: "在家布防", armed_away: "离家布防", armed_night: "夜间布防", arming: "布防中", triggered: "已触发",
  sunny: "晴", cloudy: "多云", partlycloudy: "局部多云", rainy: "雨",
  standard: "标准", quick: "快洗", wool: "羊毛", eco: "节能",
};

const UNITS = {
  current_temperature: "°C", temperature: "°C", target_temp_low: "°C", target_temp_high: "°C",
  current_position: "%", current_tilt_position: "%", percentage: "%",
  humidity: "%", current_humidity: "%", battery_level: "%",
};

function initialStates() {
  const s = (entity_id, state, attributes = {}) => ({
    entity_id, state, attributes, last_changed: now(), last_updated: now(),
    context: { id: entity_id, parent_id: null, user_id: null },
  });
  return {
    "light.living_lamp": s("light.living_lamp", "on", {
      friendly_name: "客厅吊灯", brightness: 190, color_mode: "rgb", rgb_color: [255, 196, 120], hs_color: [33, 53],
      supported_color_modes: ["color_temp", "rgb"], min_color_temp_kelvin: 2700, max_color_temp_kelvin: 6500, color_temp_kelvin: 3200, supported_features: 0,
    }),
    "light.bedroom_lamp": s("light.bedroom_lamp", "off", {
      friendly_name: "卧室台灯", supported_color_modes: ["brightness"], color_mode: null, brightness: null, supported_features: 0,
    }),
    "switch.kettle": s("switch.kettle", "off", { friendly_name: "烧水壶", icon: "mdi:kettle" }),
    "climate.living_ac": s("climate.living_ac", "cool", {
      friendly_name: "客厅空调", hvac_modes: ["off", "cool", "heat", "dry", "fan_only", "auto"], current_temperature: 27, temperature: 24,
      min_temp: 16, max_temp: 30, target_temp_step: 0.5, hvac_action: "cooling", supported_features: 1 | 128 | 256,
    }),
    "cover.living_curtain": s("cover.living_curtain", "open", {
      friendly_name: "客厅窗帘", current_position: 70, device_class: "curtain", supported_features: 1 | 2 | 4 | 8,
    }),
    "fan.bedroom_fan": s("fan.bedroom_fan", "on", {
      friendly_name: "卧室风扇", percentage: 60, percentage_step: 10, oscillating: true, direction: "forward", supported_features: 1 | 2 | 4 | 16 | 32,
    }),
    "humidifier.bedroom": s("humidifier.bedroom", "on", {
      friendly_name: "加湿器", humidity: 55, current_humidity: 42, min_humidity: 30, max_humidity: 80, device_class: "humidifier", supported_features: 0,
    }),
    "media_player.living_speaker": s("media_player.living_speaker", "playing", {
      friendly_name: "客厅音箱", media_title: "K.K.摇滚", media_artist: "K.K. Slider", volume_level: 0.4, is_volume_muted: false,
      media_content_type: "music", supported_features: 1 | 4 | 8 | 16 | 32 | 128 | 256 | 16384,
    }),
    "vacuum.robot": s("vacuum.robot", "docked", {
      friendly_name: "扫地机器人", battery_level: 86, supported_features: 4 | 8 | 16 | 512 | 4096 | 8192,
    }),
    "lock.front_door": s("lock.front_door", "locked", { friendly_name: "大门", supported_features: 1 }),
    "alarm_control_panel.home": s("alarm_control_panel.home", "disarmed", {
      friendly_name: "家庭安防", code_format: null, code_arm_required: false, supported_features: 1 | 2 | 4,
    }),
    "person.me": s("person.me", "home", { friendly_name: "我" }),
    "person.friend": s("person.friend", "not_home", { friendly_name: "室友" }),
    "number.feeder": s("number.feeder", "3", {
      friendly_name: "喂猫份数", min: 0, max: 10, step: 1, mode: "slider", icon: "mdi:cat",
    }),
    "select.washer_mode": s("select.washer_mode", "standard", {
      friendly_name: "洗衣模式", options: ["standard", "quick", "wool", "eco"], icon: "mdi:washing-machine",
    }),
    "update.home_assistant": s("update.home_assistant", "on", {
      friendly_name: "系统更新", installed_version: "2026.10.1", latest_version: "2026.11.0", in_progress: false,
      auto_update: false, release_summary: "新版本可用", supported_features: 1 | 4,
    }),
    "sensor.living_temperature": s("sensor.living_temperature", "26.5", {
      friendly_name: "室温", unit_of_measurement: "°C", device_class: "temperature",
    }),
    "sensor.living_humidity": s("sensor.living_humidity", "48", {
      friendly_name: "湿度", unit_of_measurement: "%", device_class: "humidity",
    }),
    "weather.home": s("weather.home", "sunny", {
      friendly_name: "小岛天气", temperature: 25, temperature_unit: "°C", humidity: 50,
    }),
  };
}

// ---------- 极简模板渲染，只覆盖预览用到的写法 ----------
function renderTemplate(tpl, states) {
  const val = (id) => states[id]?.state ?? "unknown";
  const attr = (id, a) => states[id]?.attributes?.[a] ?? "";
  let out = tpl.replace(/{%\s*if\s+is_state\('([^']+)',\s*'([^']+)'\)\s*%}([\s\S]*?){%\s*else\s*%}([\s\S]*?){%\s*endif\s*%}/g,
    (_, id, st, a, b) => (val(id) === st ? a : b));
  out = out.replace(/{{\s*([\s\S]*?)\s*}}/g, (_, expr) => {
    let m;
    if ((m = expr.match(/^states\('([^']+)'\)$/))) return val(m[1]);
    if ((m = expr.match(/^state_attr\('([^']+)',\s*'([^']+)'\)$/))) return String(attr(m[1], m[2]));
    if ((m = expr.match(/^now\(\)\.strftime\('%H:%M'\)$/))) return new Date().toTimeString().slice(0, 5);
    return "";
  });
  return out.trim();
}

export function createHassStore({ onToast } = {}) {
  let states = initialStates();
  const listeners = new Set();
  const templateSubs = new Set();
  let hass;

  const formatAttr = (stateObj, attribute, value) => {
    const v = value ?? stateObj.attributes[attribute];
    if (v == null) return "";
    if (typeof v === "string") return STATE_ZH[v] ?? v;
    if (attribute === "brightness") return `${Math.round((v / 255) * 100)}%`;
    if (attribute === "volume_level") return `${Math.round(v * 100)}%`;
    const unit = UNITS[attribute];
    const num = Number.isInteger(v) ? String(v) : Number(v).toFixed(1).replace(/\.0$/, "");
    return unit ? (unit === "%" ? `${num}%` : `${num} ${unit}`) : num;
  };

  const build = () => {
    hass = {
      states,
      entities: Object.fromEntries(Object.keys(states).map((id) => [id, { entity_id: id, platform: "demo", hidden: false }])),
      devices: {}, areas: {}, floors: {},
      services: {},
      config: { version: "2026.9.0", unit_system: { temperature: "°C", length: "km" }, components: [], time_zone: "Asia/Shanghai", location_name: "小岛" },
      connection: {
        haVersion: "2026.9.0",
        subscribeMessage: (cb, msg) => {
          if (msg.type !== "render_template") return Promise.resolve(() => {});
          const sub = { cb, msg };
          templateSubs.add(sub);
          queueMicrotask(() => cb({ result: renderTemplate(msg.template, states), listeners: { all: false, domains: [], entities: [], time: false } }));
          return Promise.resolve(() => templateSubs.delete(sub));
        },
        subscribeEvents: () => Promise.resolve(() => {}),
        sendMessagePromise: () => Promise.resolve({}),
      },
      themes: { darkMode: document.documentElement.dataset.theme === "dark", theme: "default", themes: {} },
      selectedTheme: null,
      user: { id: "preview", name: "岛民", is_admin: true, is_owner: true },
      language: "zh-Hans", selectedLanguage: "zh-Hans",
      translationMetadata: { fragments: [], translations: { "zh-Hans": { nativeName: "简体中文", isRTL: false } } },
      locale: { language: "zh-Hans", number_format: "language", time_format: "24", date_format: "language", first_weekday: "monday", time_zone: "local" },
      localize: (key) => {
        const last = String(key).split(".").pop();
        return STATE_ZH[last] ?? "";
      },
      formatEntityState: (stateObj, state) => {
        const st = state ?? stateObj.state;
        if (stateObj.entity_id.startsWith("update.")) return stateObj.attributes.in_progress ? "正在安装…" : st === "on" ? "有可用更新" : "已是最新";
        const unit = stateObj.attributes.unit_of_measurement;
        if (unit) return unit === "%" ? `${st}%` : `${st} ${unit}`;
        return STATE_ZH[st] ?? st;
      },
      formatEntityAttributeValue: (stateObj, attribute, value) => formatAttr(stateObj, attribute, value),
      formatEntityAttributeName: (_stateObj, attribute) => attribute,
      formatEntityName: (stateObj, name) => {
        if (typeof name === "string") return name;
        if (Array.isArray(name)) {
          const t = name.find((n) => n.type === "text");
          if (t) return t.text;
        }
        return stateObj?.attributes?.friendly_name ?? stateObj?.entity_id ?? "";
      },
      hassUrl: (p = "") => p,
      callService: async (domain, service, data = {}) => {
        callService(domain, service, data);
      },
      callWS: () => Promise.resolve({}),
    };
    return hass;
  };

  const commit = () => {
    build();
    for (const sub of templateSubs) {
      sub.cb({ result: renderTemplate(sub.msg.template, states), listeners: { all: false, domains: [], entities: [], time: false } });
    }
    for (const fn of listeners) fn(hass);
  };

  const patch = (id, state, attrs = {}) => {
    const old = states[id];
    if (!old) return;
    states = { ...states, [id]: { ...old, state: state ?? old.state, attributes: { ...old.attributes, ...attrs }, last_updated: now(), last_changed: state && state !== old.state ? now() : old.last_changed } };
  };

  const ids = (data) => [].concat(data.entity_id ?? []);
  const timers = new Map();

  function moveCover(id, target) {
    clearInterval(timers.get(id));
    const step = () => {
      const cur = states[id].attributes.current_position;
      if (cur === target) {
        clearInterval(timers.get(id));
        patch(id, target === 0 ? "closed" : "open");
        return commit();
      }
      const next = cur + Math.sign(target - cur) * Math.min(5, Math.abs(target - cur));
      patch(id, target > cur ? "opening" : "closing", { current_position: next });
      commit();
    };
    timers.set(id, setInterval(step, 120));
  }

  function callService(domain, service, data) {
    for (const id of ids(data)) {
      const d = id.split(".")[0];
      const st = states[id];
      if (!st) continue;
      const on = st.state !== "off";
      switch (`${d}.${service}`) {
        case `${d}.toggle`: patch(id, on ? "off" : "on", d === "light" && !on ? { brightness: st.attributes.brightness ?? 160 } : {}); break;
        case `${d}.turn_on`: {
          const a = {};
          if (data.brightness_pct != null) a.brightness = Math.round((data.brightness_pct / 100) * 255);
          if (data.brightness != null) a.brightness = data.brightness;
          if (data.rgb_color) { a.rgb_color = data.rgb_color; a.color_mode = "rgb"; }
          if (data.hs_color) { a.hs_color = data.hs_color; a.color_mode = "hs"; }
          if (data.color_temp_kelvin) { a.color_temp_kelvin = data.color_temp_kelvin; a.color_mode = "color_temp"; }
          if (d === "light" && a.brightness == null && st.attributes.brightness == null) a.brightness = 160;
          if (d === "climate") return patch(id, "cool"), commit();
          patch(id, d === "media_player" ? "playing" : "on", a); break;
        }
        case `${d}.turn_off`: patch(id, "off"); break;
        case "fan.set_percentage": patch(id, data.percentage === 0 ? "off" : "on", { percentage: data.percentage }); break;
        case "fan.oscillate": patch(id, null, { oscillating: data.oscillating }); break;
        case "fan.set_direction": patch(id, null, { direction: data.direction }); break;
        case "humidifier.set_humidity": patch(id, null, { humidity: data.humidity }); break;
        case "climate.set_hvac_mode": patch(id, data.hvac_mode, { hvac_action: data.hvac_mode === "off" ? "off" : data.hvac_mode === "heat" ? "heating" : "cooling" }); break;
        case "climate.set_temperature": patch(id, data.hvac_mode ?? null, { temperature: data.temperature ?? st.attributes.temperature }); break;
        case "cover.open_cover": moveCover(id, 100); break;
        case "cover.close_cover": moveCover(id, 0); break;
        case "cover.stop_cover": clearInterval(timers.get(id)); patch(id, st.attributes.current_position === 0 ? "closed" : "open"); break;
        case "cover.set_cover_position": moveCover(id, data.position); break;
        case "media_player.media_play_pause": patch(id, st.state === "playing" ? "paused" : "playing"); break;
        case "media_player.media_play": patch(id, "playing"); break;
        case "media_player.media_pause": patch(id, "paused"); break;
        case "media_player.media_next_track": patch(id, "playing", { media_title: ["K.K.摇滚", "K.K.爵士", "K.K.民谣", "K.K.咏叹调"][Math.floor(Math.random() * 4)] }); break;
        case "media_player.media_previous_track": patch(id, "playing", { media_title: "K.K.摇滚" }); break;
        case "media_player.volume_set": patch(id, null, { volume_level: data.volume_level }); break;
        case "media_player.volume_mute": patch(id, null, { is_volume_muted: data.is_volume_muted }); break;
        case "vacuum.start": patch(id, "cleaning"); break;
        case "vacuum.pause": patch(id, "paused"); break;
        case "vacuum.stop": patch(id, "idle"); break;
        case "vacuum.return_to_base": patch(id, "returning"); setTimeout(() => { patch(id, "docked"); commit(); }, 2500); break;
        case "vacuum.locate": onToast?.("扫地机器人：我在这儿！"); break;
        case "lock.lock": patch(id, "locking"); setTimeout(() => { patch(id, "locked"); commit(); }, 900); break;
        case "lock.unlock": patch(id, "unlocking"); setTimeout(() => { patch(id, "unlocked"); commit(); }, 900); break;
        case "lock.open": patch(id, "open"); break;
        case "alarm_control_panel.alarm_disarm": patch(id, "disarmed"); break;
        case "alarm_control_panel.alarm_arm_home": patch(id, "armed_home"); break;
        case "alarm_control_panel.alarm_arm_away": patch(id, "armed_away"); break;
        case "alarm_control_panel.alarm_arm_night": patch(id, "armed_night"); break;
        case "number.set_value": patch(id, String(data.value)); break;
        case "select.select_option": patch(id, data.option); break;
        case "update.install": patch(id, null, { in_progress: true }); commit(); setTimeout(() => { patch(id, "off", { in_progress: false, installed_version: st.attributes.latest_version }); commit(); }, 2500); break;
        default: onToast?.(`（预览）${domain}.${service}`);
      }
    }
    commit();
  }

  function toggleEntity(id) {
    const d = id.split(".")[0];
    if (d === "lock") return callService("lock", states[id].state === "locked" ? "unlock" : "lock", { entity_id: id });
    if (d === "cover") return callService("cover", states[id].state === "closed" ? "open_cover" : "close_cover", { entity_id: id });
    if (d === "media_player") return callService("media_player", "media_play_pause", { entity_id: id });
    callService(d, "toggle", { entity_id: id });
  }

  build();
  return {
    get hass() { return hass; },
    subscribe(fn) { listeners.add(fn); fn(hass); return () => listeners.delete(fn); },
    callService, toggleEntity, commit,
    reset() { states = initialStates(); commit(); },
    setDarkMode(dark) { document.documentElement.dataset.theme = dark ? "dark" : "light"; commit(); },
  };
}
