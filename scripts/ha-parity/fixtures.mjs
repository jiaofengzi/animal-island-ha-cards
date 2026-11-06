import {motionView} from './motion-fixtures.mjs';
export const HA_VERSION = '2026.9.0';
export const states = {
  'sensor.parity': {state:'21',attributes:{friendly_name:'Island temperature',unit_of_measurement:'°C'}},
  'light.parity': {state:'on',attributes:{friendly_name:'Island light',brightness:160,supported_color_modes:['hs','color_temp'],color_mode:'hs',hs_color:[35,65],rgb_color:[255,185,89],color_temp_kelvin:3000,min_color_temp_kelvin:2000,max_color_temp_kelvin:6500,supported_features:0}},
  'fan.parity': {state:'on',attributes:{friendly_name:'Island fan',percentage:50,percentage_step:10,oscillating:true,direction:'forward',preset_modes:['auto','sleep'],preset_mode:'auto',supported_features:63}},
  'cover.parity': {state:'open',attributes:{friendly_name:'Island cover',current_position:60,current_tilt_position:40,supported_features:255}},
  'climate.parity': {state:'heat',attributes:{friendly_name:'Island climate',temperature:22,current_temperature:21,hvac_modes:['off','heat','cool','auto'],min_temp:7,max_temp:35,target_temp_step:0.5,supported_features:1}},
  'humidifier.parity': {state:'on',attributes:{friendly_name:'Island humidifier',humidity:50,min_humidity:20,max_humidity:80,available_modes:['auto','normal'],mode:'auto',supported_features:1}},
  'lock.parity': {state:'locked',attributes:{friendly_name:'Island lock',supported_features:1}},
  'alarm_control_panel.parity': {state:'disarmed',attributes:{friendly_name:'Island alarm',supported_features:63,code_arm_required:false}},
  'media_player.parity': {state:'playing',attributes:{friendly_name:'Island player',media_title:'Island song',media_artist:'K.K.',volume_level:0.4,is_volume_muted:false,shuffle:false,repeat:'off',supported_features:1048575}},
  'number.parity': {state:'4',attributes:{friendly_name:'Island number',min:0,max:10,step:0.5,mode:'slider'}},
  'select.parity': {state:'Spring',attributes:{friendly_name:'Island season',options:['Spring','Summer','Autumn','Winter']}},
  'person.parity': {state:'home',attributes:{friendly_name:'Island villager'}},
  'update.parity': {state:'on',attributes:{friendly_name:'Island update',installed_version:'1.0',latest_version:'1.1',in_progress:false,supported_features:1}},
  'vacuum.parity': {state:'docked',attributes:{friendly_name:'Island vacuum',battery_level:80,fan_speed:'normal',fan_speed_list:['quiet','normal','turbo'],supported_features:8191}},
  'weather.parity': {state:'sunny',attributes:{friendly_name:'Island weather',temperature:22,temperature_unit:'°C',humidity:40}}
};
export const chips = [
  {type:'action',icon:'mdi:home',tap_action:{action:'navigate',navigation_path:'/lovelace/masonry'}},
  {type:'alarm-control-panel',entity:'alarm_control_panel.parity'},
  {type:'back'}, {type:'conditional',conditions:[{entity:'sensor.parity',state:'21'}],chip:{type:'entity',entity:'sensor.parity'}},
  {type:'entity',entity:'sensor.parity'}, {type:'light',entity:'light.parity'}, {type:'menu'}, {type:'quickbar'}, {type:'spacer'},
  {type:'template',entity:'sensor.parity',content:"{{ states('sensor.parity') }}",icon:'mdi:thermometer'},
  {type:'weather',entity:'weather.parity',show_temperature:true,show_conditions:true}
];
export const showcaseOptions = {
 'alarm-control-panel':{states:['armed_home','armed_away','armed_night','armed_vacation','armed_custom_bypass']},
 climate:{show_temperature_control:true,hvac_modes:['off','heat','cool','auto'],collapsible_controls:false},
 cover:{show_buttons_control:true,show_position_control:true,show_tilt_position_control:true},
 fan:{show_percentage_control:true,show_oscillate_control:true,show_direction_control:true,collapsible_controls:false},
 humidifier:{show_target_humidity_control:true,collapsible_controls:false},
 light:{show_brightness_control:true,show_color_temp_control:true,show_color_control:true,collapsible_controls:false,use_light_color:true},
 'media-player':{use_media_info:true,show_volume_level:true,volume_controls:['volume_mute','volume_set','volume_buttons'],media_controls:['on_off','shuffle','previous','play_pause_stop','next','repeat'],collapsible_controls:false},
 update:{show_buttons_control:true,collapsible_controls:false},
 vacuum:{commands:['on_off','start_pause','stop','locate','clean_spot','return_home']}
};
export const cards = [
  ...['alarm-control-panel','climate','cover','entity','fan','humidifier','light','lock','media-player','number','person','select','update','vacuum'].map(name=>({name,config:{entity:`${name==='entity'?'sensor':name.replaceAll('-','_')}.parity`,...(showcaseOptions[name]||{})}})),
  {name:'chips',config:{chips}}, {name:'empty',config:{}}, {name:'title',config:{title:'Island parity',subtitle:'Same HA, same entities'}},
  {name:'template',config:{entity:'light.parity',features:[{type:'light-brightness'}],features_position:'bottom',primary:"{{ states('sensor.parity') }}",secondary:'Live server template',icon:'mdi:leaf'}}
];
export const badge = {name:'template',config:{entity:'sensor.parity',label:'Island temperature',content:"{{ states('sensor.parity') }}",icon:'mdi:leaf'}};
export const cardConfig=(card,prefix)=>({type:`custom:${prefix}${card.name}-card`,...card.config});
export function dashboard() {
 const badges=['mushroom-','island-'].map(p=>({type:`custom:${p}template-badge`,...badge.config}));
 const pairs=cards.map(c=>({type:'horizontal-stack',cards:['mushroom-','island-'].map(p=>cardConfig(c,p))}));
 return {title:'HA parity laboratory',views:[motionView(),{title:'Sections',path:'sections',type:'sections',max_columns:2,badges,sections:[{type:'grid',cards:pairs}]},{title:'Grid sizing',path:'grid-sizing',type:'sections',max_columns:2,sections:['mushroom-','island-'].map(p=>({type:'grid',cards:[{columns:6,rows:1},{columns:6,rows:2},{columns:12,rows:'auto'}].map(grid_options=>({...cardConfig(cards.find(c=>c.name==='entity'),p),grid_options}))}))},{title:'Masonry',path:'masonry',type:'masonry',badges,cards:pairs}]};
}
