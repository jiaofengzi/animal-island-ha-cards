import type { Config, Controls, Entity, Hass } from './types';
import {isActionReady,safeNavigation,validateAction,resolvedTarget} from './actions';
import {compositeSchemas} from './composites';
import {canonicalProfiles,resolveKind} from './families';

export const kinds = ['light','climate','cover','fan','media','vacuum','entity','scene','number','select','summary','laundry','fridge','water','feeder','meal','printer','consumable','camera','health','chips','spacer','picture'] as const;
export type Kind = typeof kinds[number];
export const names: Record<Kind,string> = {light:'灯光与灯组',climate:'空调',cover:'窗帘',fan:'新风与风机',media:'影音',vacuum:'扫地机器人',entity:'通用实体',scene:'场景动作',number:'数值',select:'选项',summary:'摘要导航',laundry:'洗衣干衣',fridge:'冰箱',water:'净水',feeder:'喂食',meal:'餐盘记录',printer:'3D 打印',consumable:'耗材',camera:'影像隐私入口',health:'系统健康',chips:'顶部状态小胶囊',spacer:'空白间距',picture:'图片插入'};
export const compositeKinds: Kind[] = ['laundry','fridge','water','feeder','meal','printer','consumable','health'];
const domains: Partial<Record<Kind,string[]>> = {light:['light'],climate:['climate'],cover:['cover'],fan:['fan'],media:['media_player'],vacuum:['vacuum'],scene:['scene','script'],number:['number','input_number'],select:['select','input_select'],camera:['camera']};
const entityPattern = /^[a-z_]+\.[a-z0-9_]+$/;
export const mediaControlOptions=['on_off','shuffle','previous','play_pause_stop','next','repeat'] as const;
export const volumeControlOptions=['volume_mute','volume_set','volume_buttons'] as const;
export function validate(config: Config, kind: Kind): Config {
  if (!config || typeof config.type!=='string') throw new Error('请配置有效 type');
  kind=resolveKind(config,kind);
  if (config.type !== `custom:island-${kind}-card` && !canonicalProfiles[config.type]?.includes(kind)) throw new Error(`type 必须是 custom:island-${kind}-card 或对应家族入口`);
  if(config.description!==undefined && typeof config.description!=='string')throw new Error('description 必须是文本');
  const noEntity = ['summary','chips','spacer','picture',...compositeKinds].includes(kind);
  if (!noEntity && !config.entity) throw new Error('请配置 entity');
  if (config.entity && (!entityPattern.test(config.entity) || (domains[kind] && !domains[kind]?.includes(config.entity.split('.')[0])))) throw new Error('entity 类型不匹配');
  if (config.name !== undefined && typeof config.name !== 'string') throw new Error('name 必须是文本');
  if(config.read_only!==undefined && typeof config.read_only!=='boolean')throw new Error('read_only 必须是布尔值');
  for(const key of ['use_media_info','show_volume_level'] as const)if(config[key]!==undefined&&(kind!=='media'||typeof config[key]!=='boolean'))throw new Error(`${key} 只适用于影音，必须为布尔值`);
  for(const [key,options] of [['media_controls',mediaControlOptions],['volume_controls',volumeControlOptions]] as const){const value=config[key];if(value!==undefined&&(kind!=='media'||!Array.isArray(value)||value.some(v=>!(options as readonly string[]).includes(v))||new Set(value).size!==value.length))throw new Error(`${key} 必须是无重复的合法影音控件列表`);}
  if(config.image!==undefined && typeof config.image!=='string')throw new Error('image 必须是文本');
  if(config.alt!==undefined && typeof config.alt!=='string')throw new Error('alt 必须是文本');
  if(config.allowed_image_origins!==undefined && (!Array.isArray(config.allowed_image_origins)||!config.allowed_image_origins.every(x=>{try{return typeof x==='string'&&new URL(x).origin===x&&x.startsWith('https://');}catch{return false;}})))throw new Error('allowed_image_origins 必须是 HTTPS origin 列表');
  if (config.entities !== undefined && !Array.isArray(config.entities)) throw new Error('entities 必须是列表');
  if (['summary','chips',...compositeKinds].includes(kind) && !config.entities?.length) throw new Error('请配置至少一个 entities 条目');
  for (const item of config.entities ?? []) {
    if (!item || !entityPattern.test(item.entity)) throw new Error('entities 条目需要有效 entity');
    if(item.severity!==undefined&&!['normal','warning','error'].includes(item.severity))throw new Error('severity 必须为 normal、warning 或 error');
    if (item.path !== undefined && !safePath(item.path)) throw new Error('导航只支持站内绝对路径');
    if(item.role!==undefined&&!compositeSchemas[kind]?.roles[item.role])throw new Error('此模板不支持该字段语义');
    if(item.unit!==undefined&&typeof item.unit!=='string')throw new Error('字段单位必须为文本');
    if([item.min,item.max].some(x=>x!==undefined&&!Number.isFinite(x))||(item.min??0)>=(item.max??100))throw new Error('进度范围必须为有效递增数值');
  }
  if (config.actions !== undefined && !Array.isArray(config.actions)) throw new Error('actions 必须是列表');
  for (const action of config.actions ?? []) {
    if (!action.label || !/^[a-z_]+\.[a-z_]+$/.test(action.service) || !entityPattern.test(action.entity)) throw new Error('动作需要 label、service 和 entity');
    if(action.when_states!==undefined&&(!compositeKinds.includes(kind)||!config.entities?.some(item=>item.role==='status')||!Array.isArray(action.when_states)||!action.when_states.length||action.when_states.some(s=>typeof s!=='string'||!s.trim())||new Set(action.when_states).size!==action.when_states.length))throw new Error('when_states 需要 status 字段及非空、无重复的状态文字列表');
    if(action.role!==undefined&&!['primary','secondary','danger'].includes(action.role))throw new Error('动作 role 必须为 primary、secondary 或 danger');
    if (action.data && (typeof action.data !== 'object' || Array.isArray(action.data))) throw new Error('动作 data 必须是对象');
    if (action.data && ['entity_id','device_id','area_id','floor_id','label_id'].some(k=>k in action.data!)) throw new Error('动作 data 不得覆盖目标');
  }
  const primary=(config.actions??[]).filter(a=>a.role==='primary');
  if(primary.some((a,i)=>primary.slice(i+1).some(b=>!a.when_states||!b.when_states||a.when_states.some(s=>b.when_states!.includes(s)))))throw new Error('同一状态最多指定一个 primary 动作');
  if (config.height !== undefined && (!Number.isFinite(config.height) || config.height < 0 || config.height > 600)) throw new Error('height 必须为 0–600');
  for(const key of ['tap_action','hold_action','double_tap_action'] as const){const a=config[key];if(a){validateAction(a);if(['perform-action','call-service'].includes(a.action))resolvedTarget(a,config);}}
  if(kind==='spacer'&&(config.tap_action||config.hold_action||config.double_tap_action))throw new Error('间距卡片不支持动作');
  if (kind === 'picture' && (!config.image || !config.alt)) throw new Error('图片需要 image 和 alt');
  return structuredClone(config);
}
export function safePath(path: string): boolean { return safeNavigation(path); }
export function safeImage(source: string, origin: string, allowed: string[] = []): string | undefined {
  try {
    if (!source || /[\\\s]/.test(source)) return;
    const u = new URL(source,origin);
    if (u.username || u.password || !['https:','http:'].includes(u.protocol)) return;
    if (u.origin === origin || (u.protocol === 'https:' && allowed.includes(u.origin))) return u.href;
  } catch { /* invalid URL is denied */ }
}
export function available(entity?: Entity): entity is Entity { return isActionReady(entity); }
export function stateText(entity?: Entity): string {
  if (!entity) return '实体不可见或不存在';
  if (entity.state === 'unavailable') return '不可用';
  if (entity.state === 'unknown') return isActionReady(entity)?'尚未执行':'未知';
  const states: Record<string,string> = {on:'已开启',off:'已关闭',open:'已打开',closed:'已关闭',playing:'播放中',paused:'已暂停',cleaning:'清扫中',docked:'已回充',idle:'待机'};
  return (states[entity.state] ?? entity.state) + (entity.attributes.unit_of_measurement ? ` ${String(entity.attributes.unit_of_measurement)}` : '');
}
export function serviceAvailable(hass: Hass | undefined, service: string): boolean {
  const [d,s] = service.split('.'); return !!hass?.services?.[d] && Object.hasOwn(hass.services[d],s);
}
export function mediaInfo(e:Entity|undefined,config:Pick<Config,'name'|'use_media_info'|'show_volume_level'>){
  const a=e?.attributes??{},text=(v:unknown)=>typeof v==='string'?v.trim():'';
  const active=!!e&&['playing','paused','buffering'].includes(e.state);
  const title=active&&config.use_media_info?text(a.media_title):'';
  let detail='';
  if(active&&config.use_media_info){
    if(a.media_content_type==='tvshow'){detail=text(a.media_series_title);for(const [key,label] of [['media_season','季'],['media_episode','集']]){const v=a[key];if((typeof v==='string'&&v.trim())||(typeof v==='number'&&Number.isFinite(v)))detail+=`${detail?' · ':''}${label} ${v}`;}}
    else detail=text(a.media_content_type==='playlist'?a.media_playlist:a.media_artist)||text(a.app_name);
  }
  const volume=active&&config.show_volume_level&&typeof a.volume_level==='number'&&Number.isFinite(a.volume_level)&&a.volume_level>=0&&a.volume_level<=1?` · ${Math.round(a.volume_level*100)}%`:'';
  return {title:title||config.name||text(a.friendly_name)||names.media,detail,status:stateText(e)+volume};
}
export function controlsFor(kind: Kind, e: Entity, config:Pick<Config,'media_controls'|'volume_controls'>={}): Controls {
  const c: Controls = {commands:[],ranges:[],choices:[]};
  const a=e.attributes, domain=e.entity_id.split('.')[0], features=Number(a.supported_features)||0;
  const supports=(bit:number)=>(features & bit)!==0;
  const command=(label:string,service:string,confirm=false)=>c.commands.push({label,service,confirm});
  const range=(label:string,field:string,service:string,value:unknown,min:unknown,max:unknown,step:unknown=1)=>{
    const nums=[value,min,max,step].map(Number);
    if([value,min,max,step].every(x=>x!==null&&x!==undefined&&x!=='') && nums.every(Number.isFinite) && nums[1]<nums[2] && nums[3]>0) c.ranges.push({label,field,service,value:Math.max(nums[1],Math.min(nums[2],nums[0])),min:nums[1],max:nums[2],step:nums[3]});
  };
  const choice=(label:string,field:string,service:string,options:unknown,value:unknown)=>{
    if(Array.isArray(options) && options.every(x=>typeof x==='string') && options.length) c.choices.push({label,field,service,options,value:String(value??'')});
  };
  const power=()=>command(e.state==='off'?'开启':'关闭',`${domain}.${e.state==='off'?'turn_on':'turn_off'}`);
  if(kind==='light') {
    power(); const modes=Array.isArray(a.supported_color_modes)?a.supported_color_modes:[];
    if(modes.some(x=>!['onoff','unknown'].includes(String(x)))) range('亮度','brightness','light.turn_on',a.brightness,0,255);
    if(modes.includes('color_temp')) {
      const min=a.min_color_temp_kelvin??(Number(a.max_mireds)>0?Math.ceil(1000000/Number(a.max_mireds)):undefined);
      const max=a.max_color_temp_kelvin??(Number(a.min_mireds)>0?Math.floor(1000000/Number(a.min_mireds)):undefined);
      range('色温 K','color_temp_kelvin','light.turn_on',a.color_temp_kelvin??(Number(a.color_temp)>0?Math.round(1000000/Number(a.color_temp)):undefined),min,max);
    }
    if(modes.some(x=>['hs','xy','rgb','rgbw','rgbww'].includes(String(x)))){
      const rgb=Array.isArray(a.rgb_color)&&a.rgb_color.length===3?a.rgb_color:[255,255,255];
      c.color='#'+rgb.map(n=>Math.round(Math.max(0,Math.min(255,Number(n)||0))).toString(16).padStart(2,'0')).join('');
    }
  }
  if(kind==='climate') {
    choice('运行模式','hvac_mode','climate.set_hvac_mode',a.hvac_modes,e.state);
    if(supports(1)&&e.state!=='heat_cool') range('目标温度','temperature','climate.set_temperature',a.temperature,a.min_temp,a.max_temp,a.target_temp_step??0.5);
    if(supports(2)&&e.state==='heat_cool'){
      range('温度下限','target_temp_low','climate.set_temperature',a.target_temp_low,a.min_temp,a.target_temp_high,a.target_temp_step??0.5);
      range('温度上限','target_temp_high','climate.set_temperature',a.target_temp_high,a.target_temp_low,a.max_temp,a.target_temp_step??0.5);
      for(const r of c.ranges)r.data={target_temp_low:a.target_temp_low,target_temp_high:a.target_temp_high};
    }
    if(supports(4))range('目标湿度 %','humidity','climate.set_humidity',a.humidity,a.min_humidity??30,a.max_humidity??99);
    if(supports(8))choice('风量模式','fan_mode','climate.set_fan_mode',a.fan_modes,a.fan_mode);
    if(supports(32))choice('摆风模式','swing_mode','climate.set_swing_mode',a.swing_modes,a.swing_mode);
    if(supports(512))choice('水平摆风','swing_horizontal_mode','climate.set_swing_horizontal_mode',a.swing_horizontal_modes,a.swing_horizontal_mode);
    if(supports(16)) choice('预设','preset_mode','climate.set_preset_mode',a.preset_modes,a.preset_mode);
  }
  if(kind==='cover') {
    if(supports(1)) command('打开','cover.open_cover',true);
    if(supports(2)) command('关闭','cover.close_cover',true);
    if(supports(8)) command('停止','cover.stop_cover');
    if(supports(4)) range('开合位置 %','position','cover.set_cover_position',a.current_position,0,100);
    if(supports(128)) range('叶片角度 %','tilt_position','cover.set_cover_tilt_position',a.current_tilt_position,0,100);
  }
  if(kind==='fan') {
    if((e.state==='off'&&supports(32))||(e.state!=='off'&&supports(16)))power();
    if(supports(4))choice('风向','direction','fan.set_direction',['forward','reverse'],a.direction);
    if(supports(1)) range('风速 %','percentage','fan.set_percentage',a.percentage,0,100,a.percentage_step??1);
    if(supports(8)) choice('预设','preset_mode','fan.set_preset_mode',a.preset_modes,a.preset_mode);
    if(supports(2)) c.commands.push({label:a.oscillating?'停止摆风':'开始摆风',service:'fan.oscillate',data:{oscillating:!a.oscillating}});
  }
  if(kind==='media') {
    if((e.state==='off' && supports(128)) || (e.state!=='off' && supports(256))) power();
    if(e.state==='playing' && supports(1)) command('暂停','media_player.media_pause');
    if(e.state!=='playing' && supports(16384)) command('播放','media_player.media_play');
    if(supports(16)) command('上一首','media_player.media_previous_track');
    if(supports(32)) command('下一首','media_player.media_next_track');
    if(supports(4096)) command('停止','media_player.media_stop');
    if(supports(4)) range('音量','volume_level','media_player.volume_set',a.volume_level,0,1,0.01);
    if(supports(8)) c.commands.push({label:a.is_volume_muted?'取消静音':'静音',service:'media_player.volume_mute',data:{is_volume_muted:!a.is_volume_muted}});
    if(supports(2048)) choice('来源','source','media_player.select_source',a.source_list,a.source);
    if(supports(32768)&&typeof a.shuffle==='boolean')c.commands.push({label:a.shuffle?'关闭随机播放':'开启随机播放',service:'media_player.shuffle_set',data:{shuffle:!a.shuffle}});
    if(supports(262144))choice('循环模式','repeat','media_player.repeat_set',['off','all','one'],a.repeat);
    if(supports(1024)){command('降低音量','media_player.volume_down');command('提高音量','media_player.volume_up');}
    const groups:Record<string,string>={turn_on:'on_off',turn_off:'on_off',shuffle_set:'shuffle',media_previous_track:'previous',media_play:'play_pause_stop',media_pause:'play_pause_stop',media_stop:'play_pause_stop',media_next_track:'next',repeat_set:'repeat',volume_mute:'volume_mute',volume_set:'volume_set',volume_up:'volume_buttons',volume_down:'volume_buttons'};
    const shown=(x:{service:string})=>{const group=groups[x.service.split('.')[1]];const options=group?.startsWith('volume_')?config.volume_controls:config.media_controls;return !group||options===undefined||(options as string[]).includes(group);};
    c.commands=c.commands.filter(shown);c.ranges=c.ranges.filter(shown);c.choices=c.choices.filter(shown);
  }
  if(kind==='vacuum') {
    if(supports(8192)) command('开始清扫','vacuum.start',true);
    if(supports(4)) command('暂停','vacuum.pause');
    if(supports(8)) command('停止','vacuum.stop');
    if(supports(16)) command('回充','vacuum.return_to_base',true);
    if(supports(512)) command('定位','vacuum.locate');
    if(supports(32)) choice('吸力','fan_speed','vacuum.set_fan_speed',a.fan_speed_list,a.fan_speed);
  }
  if(kind==='number') range('数值','value',`${domain}.set_value`,e.state,a.min,a.max,a.step??1);
  if(kind==='select') choice('选项','option',`${domain}.select_option`,a.options,e.state);
  if(kind==='scene') command('执行场景',`${domain}.turn_on`,true);
  if(kind==='entity' && ['switch','input_boolean'].includes(domain)) power();
  return c;
}
