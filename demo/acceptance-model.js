const landscape=new URL('./assets/local-landscape.svg',location.href).href;
const entity=(entity_id,state,attributes={})=>({entity_id,state,attributes:{friendly_name:entity_id,...attributes}});
const initial={
 'light.demo_lantern':entity('light.demo_lantern','on',{friendly_name:'门廊的小灯',brightness:153,supported_color_modes:['color_temp','rgb'],rgb_color:[255,180,90],color_temp_kelvin:3000,min_color_temp_kelvin:2200,max_color_temp_kelvin:6500}),
 'climate.demo_room':entity('climate.demo_room','cool',{friendly_name:'凉风小屋',supported_features:17,hvac_modes:['off','cool','heat','auto'],temperature:24,current_temperature:26,hvac_action:'cooling',min_temp:16,max_temp:30,target_temp_step:.5,preset_modes:['eco','comfort'],preset_mode:'eco'}),
 'cover.demo_blinds':entity('cover.demo_blinds','open',{friendly_name:'窗边的阳光',supported_features:143,current_position:80,current_tilt_position:50}),
 'fan.demo_breeze':entity('fan.demo_breeze','on',{friendly_name:'森林来风',supported_features:63,direction:'forward',percentage:40,percentage_step:10,oscillating:false,preset_modes:['sleep','normal'],preset_mode:'normal'}),
 'media_player.demo_radio':entity('media_player.demo_radio','playing',{friendly_name:'岛屿电台',supported_features:316797,shuffle:false,repeat:'off',media_title:'海风来信',media_artist:'小岛乐队',media_content_type:'music',volume_level:.3,is_volume_muted:false,source_list:['radio','line in'],source:'radio'}),
 'vacuum.demo_rover':entity('vacuum.demo_rover','cleaning',{friendly_name:'勤劳的小巡游',supported_features:8764,battery_level:82,fan_speed_list:['quiet','normal'],fan_speed:'quiet'}),
 'switch.demo_socket':entity('switch.demo_socket','off',{friendly_name:'阅读角插座'}),
 'scene.demo_evening':entity('scene.demo_evening','2026-10-30T21:30:00Z',{friendly_name:'晚安小岛'}),
 'number.demo_portion':entity('number.demo_portion','2',{friendly_name:'每次份量',min:1,max:5,step:1,unit_of_measurement:'份'}),
 'select.demo_program':entity('select.demo_program','eco',{friendly_name:'运行计划',options:['eco','normal']}),
 'sensor.demo_laundry_phase':entity('sensor.demo_laundry_phase','漂洗',{friendly_name:'洗衣阶段'}),
 'sensor.demo_laundry_progress':entity('sensor.demo_laundry_progress','62',{unit_of_measurement:'%'}),
 'sensor.demo_laundry_remaining':entity('sensor.demo_laundry_remaining','24',{unit_of_measurement:'分钟'}),
 'sensor.demo_laundry_program':entity('sensor.demo_laundry_program','棉麻轻洗'),
 'sensor.demo_temperature':entity('sensor.demo_temperature','4',{friendly_name:'冷藏温度',unit_of_measurement:'°C'}),
 'sensor.demo_freezer':entity('sensor.demo_freezer','-18',{friendly_name:'冷冻温度',unit_of_measurement:'°C'}),
 'binary_sensor.demo_fridge_door':entity('binary_sensor.demo_fridge_door','off',{friendly_name:'冰箱门',device_class:'door'}),
 'sensor.demo_tds':entity('sensor.demo_tds','12',{friendly_name:'出水 TDS',unit_of_measurement:'ppm'}),
 'sensor.demo_filter':entity('sensor.demo_filter','18',{friendly_name:'滤芯余量',unit_of_measurement:'%'}),
 'sensor.demo_feed_portion':entity('sensor.demo_feed_portion','2',{friendly_name:'投喂动作固定份量',unit_of_measurement:'份'}),
 'sensor.demo_last_feed':entity('sensor.demo_last_feed','07:30',{friendly_name:'上次投喂'}),
 'sensor.demo_food_remaining':entity('sensor.demo_food_remaining','540',{unit_of_measurement:'g'}),
 'sensor.demo_meal':entity('sensor.demo_meal','午餐 · 南瓜与鸡肉',{friendly_name:'最近餐盘记录'}),
 'sensor.demo_meal_time':entity('sensor.demo_meal_time','今天 12:10'),
 'sensor.demo_meal_note':entity('sensor.demo_meal_note','来自已有餐盘记录'),
 'sensor.demo_print_phase':entity('sensor.demo_print_phase','打印中'),
 'sensor.demo_print_progress':entity('sensor.demo_print_progress','42',{unit_of_measurement:'%'}),
 'sensor.demo_print_remaining':entity('sensor.demo_print_remaining','1 小时'),
 'sensor.demo_nozzle':entity('sensor.demo_nozzle','210',{unit_of_measurement:'°C'}),
 'sensor.demo_bed':entity('sensor.demo_bed','60',{unit_of_measurement:'°C'}),
 'sensor.demo_consumable':entity('sensor.demo_consumable','35',{friendly_name:'滚刷寿命',unit_of_measurement:'%'}),
 'sensor.demo_health':entity('sensor.demo_health','已接入的诊断正常'),
 'sensor.demo_cpu':entity('sensor.demo_cpu','13',{unit_of_measurement:'%'}),
 'sensor.demo_memory':entity('sensor.demo_memory','46',{unit_of_measurement:'%'}),
 'sensor.demo_disk':entity('sensor.demo_disk','28',{unit_of_measurement:'GB'}),
 'sensor.demo_value':entity('sensor.demo_value','62',{friendly_name:'洗衣进度',unit_of_measurement:'%'}),
 'sensor.demo_status':entity('sensor.demo_status','漂洗'),
 'button.demo_feed':entity('button.demo_feed','unknown',{friendly_name:'模拟投喂两份'}),
 'button.demo_laundry_pause':entity('button.demo_laundry_pause','unknown'),
 'button.demo_laundry_resume':entity('button.demo_laundry_resume','unknown'),
 'button.demo_print_pause':entity('button.demo_print_pause','unknown'),
 'button.demo_print_resume':entity('button.demo_print_resume','unknown'),
 'button.demo_print_cancel':entity('button.demo_print_cancel','unknown'),
 'camera.demo_view':entity('camera.demo_view','idle',{friendly_name:'门口的影像',entity_picture:'/forbidden-camera-image'})
};
const item=(id,role,name)=>({entity:id,role,...(name?{name}:{})});
const profiles=['chips','summary','light','climate','cover','fan','media','vacuum','entity','scene','number','select','laundry','fridge','water','feeder','meal','printer','consumable','camera','health','spacer','picture'];
const familyOf={light:'control',fan:'control',entity:'control',number:'control',select:'control',climate:'climate',cover:'cover',media:'media',vacuum:'task',laundry:'task',printer:'task',fridge:'monitor',water:'monitor',consumable:'monitor',health:'monitor',meal:'monitor',scene:'action',feeder:'action',camera:'action',summary:'summary',chips:'chips',spacer:'spacer',picture:'picture'};
const byProfile={
 chips:{entities:[{entity:'light.demo_lantern',name:'灯光'},{entity:'climate.demo_room',attribute:'current_temperature',name:'室温',unit:'°C'},{entity:'sensor.demo_filter',name:'滤芯'}]},
 summary:{name:'今天的小岛',entities:[{entity:'light.demo_lantern',name:'灯光角落',path:location.pathname+'#module-light'},{entity:'sensor.demo_laundry_phase',name:'洗衣房',path:location.pathname+'#module-laundry'},{entity:'sensor.demo_filter',name:'滤芯余量',severity:'warning'}]},
 light:{entity:'light.demo_lantern'},climate:{entity:'climate.demo_room'},cover:{entity:'cover.demo_blinds'},fan:{entity:'fan.demo_breeze'},
 media:{entity:'media_player.demo_radio',use_media_info:true,show_volume_level:true},vacuum:{entity:'vacuum.demo_rover'},entity:{entity:'switch.demo_socket'},
 scene:{entity:'scene.demo_evening',description:'关闭客厅灯，留下门廊微光'},number:{entity:'number.demo_portion'},select:{entity:'select.demo_program'},
 laundry:{name:'洗衣房的小日常',entities:[item('sensor.demo_laundry_phase','status'),item('sensor.demo_laundry_progress','progress'),item('sensor.demo_laundry_remaining','remaining'),item('sensor.demo_laundry_program','program')],actions:[{label:'暂停洗衣',role:'primary',when_states:['漂洗','running'],service:'button.press',entity:'button.demo_laundry_pause'},{label:'继续洗衣',role:'primary',when_states:['已暂停'],service:'button.press',entity:'button.demo_laundry_resume'}]},
 fridge:{name:'厨房的凉意',entities:[item('sensor.demo_temperature','temperature'),item('sensor.demo_freezer','freezer'),item('binary_sensor.demo_fridge_door','door')]},
 water:{name:'饮水小站',entities:[{...item('sensor.demo_filter','filter'),severity:'warning'},item('sensor.demo_tds','tds')]},
 feeder:{name:'小碗开饭',entities:[item('sensor.demo_feed_portion','portion'),item('sensor.demo_last_feed','last_feed'),item('sensor.demo_food_remaining','remaining')],actions:[{label:'投喂 2 份',role:'primary',service:'button.press',entity:'button.demo_feed'}]},
 meal:{name:'小碗的午餐记录',entities:[item('sensor.demo_meal','record'),item('sensor.demo_meal_time','recorded_at'),item('sensor.demo_meal_note','note')]},
 printer:{name:'小岛模型工坊',entities:[item('sensor.demo_print_phase','status'),item('sensor.demo_print_progress','progress'),item('sensor.demo_print_remaining','remaining'),item('sensor.demo_nozzle','nozzle'),item('sensor.demo_bed','bed')],actions:[{label:'暂停打印',role:'primary',when_states:['打印中'],service:'button.press',entity:'button.demo_print_pause'},{label:'继续打印',role:'primary',when_states:['已暂停'],service:'button.press',entity:'button.demo_print_resume'},{label:'取消打印',role:'danger',when_states:['打印中','已暂停'],service:'button.press',entity:'button.demo_print_cancel'}]},
 consumable:{name:'小巡游的滚刷',entities:[item('sensor.demo_consumable','life')]},camera:{entity:'camera.demo_view'},
 health:{name:'小岛运行手记',entities:[item('sensor.demo_health','status'),item('sensor.demo_cpu','cpu'),item('sensor.demo_memory','memory'),item('sensor.demo_disk','disk')]},
 spacer:{height:28},picture:{name:'窗外的一角',image:landscape,alt:'本地演示图片：薄荷色山丘与暖黄太阳'}
};

export const configs=profiles.map(profile=>({type:`custom:island-${profile}-card`,...byProfile[profile]}));
export {profiles,familyOf};
const serviceNames={light:['turn_on','turn_off'],climate:['set_hvac_mode','set_temperature','set_preset_mode','set_humidity','set_fan_mode','set_swing_mode','set_swing_horizontal_mode'],cover:['open_cover','close_cover','stop_cover','set_cover_position','set_cover_tilt_position'],fan:['turn_on','turn_off','set_percentage','oscillate','set_preset_mode','set_direction'],media_player:['turn_on','turn_off','media_play','media_pause','media_next_track','media_previous_track','media_stop','volume_set','volume_mute','select_source','shuffle_set','repeat_set','volume_up','volume_down'],vacuum:['start','pause','stop','return_to_base','locate','set_fan_speed'],switch:['turn_on','turn_off'],scene:['turn_on'],number:['set_value'],select:['select_option'],button:['press']};
const services=()=>Object.fromEntries(Object.entries(serviceNames).map(([d,names])=>[d,Object.fromEntries(names.map(s=>[s,{}]))]));

const calls=[],pending=[],cards=[];let mode='normal';
const listeners=new Set();
export function subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
function notify(){cards.forEach(card=>{card.hass={...hass};});listeners.forEach(fn=>fn());}
function mutate(id,state,attributes={}){const before=hass.states[id];if(!before)return;hass.states={...hass.states,[id]:{...before,state:state??before.state,attributes:{...before.attributes,...attributes}}};}
function apply(domain,service,data,target){
 const ids=target?.entity_id??data.entity_id;for(const id of typeof ids==='string'?[ids]:Array.isArray(ids)?ids:[]){
  const e=hass.states[id];if(!e)continue;
  const stateByService={turn_on:'on',turn_off:'off',media_play:'playing',media_pause:'paused',media_stop:'idle',start:'cleaning',pause:'paused',stop:'idle',return_to_base:'returning',open_cover:'opening',close_cover:'closing',stop_cover:'open'};
  if(stateByService[service])mutate(id,stateByService[service]);
  const fields={set_temperature:['temperature','target_temp_low','target_temp_high'],set_humidity:['humidity'],set_fan_mode:['fan_mode'],set_swing_mode:['swing_mode'],set_swing_horizontal_mode:['swing_horizontal_mode'],set_preset_mode:['preset_mode'],set_percentage:['percentage'],oscillate:['oscillating'],set_direction:['direction'],volume_set:['volume_level'],volume_mute:['is_volume_muted'],select_source:['source'],shuffle_set:['shuffle'],repeat_set:['repeat'],set_fan_speed:['fan_speed'],turn_on:['brightness','rgb_color','color_temp_kelvin']};
  for(const field of fields[service]??[])if(data[field]!==undefined)mutate(id,undefined,{[field]:data[field]});
  if(service==='set_hvac_mode')mutate(id,data.hvac_mode,{hvac_action:data.hvac_mode==='off'?'off':'idle'});
  if(service==='set_value')mutate(id,String(data.value));if(service==='select_option')mutate(id,data.option);
  if(service==='set_cover_position')mutate(id,data.position===0?'closed':'open',{current_position:data.position});
  if(service==='set_cover_tilt_position')mutate(id,undefined,{current_tilt_position:data.tilt_position});
  if(service==='volume_up'||service==='volume_down')mutate(id,undefined,{volume_level:Math.min(1,Math.max(0,Number(e.attributes.volume_level)+(service==='volume_up'?.05:-.05)))});
  if(service==='media_next_track'||service==='media_previous_track')mutate(id,undefined,{media_title:service==='media_next_track'?'午后的潮汐':'海风来信'});
  if(domain==='scene')mutate(id,'2026-10-31T08:00:00Z');
  if(service==='press'){
   mutate(id,'2026-10-31T08:00:00Z');
   if(id==='button.demo_feed'){mutate('sensor.demo_last_feed','刚刚 · 模拟投喂 2 份');mutate('sensor.demo_food_remaining','520');}
   if(id==='button.demo_laundry_pause')mutate('sensor.demo_laundry_phase','已暂停');
   if(id==='button.demo_laundry_resume')mutate('sensor.demo_laundry_phase','漂洗');
   if(id==='button.demo_print_pause')mutate('sensor.demo_print_phase','已暂停');
   if(id==='button.demo_print_resume')mutate('sensor.demo_print_phase','打印中');
   if(id==='button.demo_print_cancel')mutate('sensor.demo_print_phase','已取消');
  }
 }notify();
}

export const hass={states:structuredClone(initial),services:services(),language:'zh-CN',config:{unit_system:{temperature:'°C'}},async callService(domain,service,data={},target){
 calls.push({domain,service,data:structuredClone(data),target:target?structuredClone(target):undefined});notify();
 if(mode==='readonly')throw new Error('Read only mock');
 if(mode==='error')throw new Error('模拟服务失败：请重试');
 if(mode==='pending')await new Promise((resolve,reject)=>{pending.push({resolve,reject});notify();});
 apply(domain,service,data,target);
}};
export function mount(card,index){card.setConfig({...configs[index],read_only:mode==='readonly'});card.hass={...hass};cards.push(card);return ()=>{const i=cards.indexOf(card);if(i>=0)cards.splice(i,1);};}
export function setMode(value){
 while(pending.length)pending.shift().reject(new Error('模拟状态已改变'));
 mode=value;hass.states=structuredClone(initial);hass.services=services();
 if(value==='unavailable')Object.values(hass.states).forEach(e=>{e.state='unavailable';});
 if(value==='off'){for(const id of ['light.demo_lantern','fan.demo_breeze','switch.demo_socket','climate.demo_room','media_player.demo_radio'])mutate(id,'off');mutate('cover.demo_blinds','closed',{current_position:0});mutate('vacuum.demo_rover','docked');mutate('sensor.demo_laundry_phase','已完成');mutate('sensor.demo_laundry_progress','100');mutate('sensor.demo_print_phase','已完成');}
 if(value==='paused'){mutate('media_player.demo_radio','paused');mutate('vacuum.demo_rover','paused');mutate('sensor.demo_print_phase','已暂停');mutate('sensor.demo_laundry_phase','已暂停');}
 cards.forEach(card=>{const index=profiles.indexOf(card.dataset.profile);card.setConfig({...configs[index],read_only:value==='readonly'});});notify();
}
export function releasePending(){while(pending.length)pending.shift().resolve();notify();}
export function reset(){calls.length=0;setMode('normal');}
export function setState(id,state,attributes={}){mutate(id,state,attributes);notify();}
export const model={configs,profiles,familyOf,cards,hass,calls,setMode,setState,reset,releasePending,get mode(){return mode;},get pendingCount(){return pending.length;}};
window.islandDemo=model;
