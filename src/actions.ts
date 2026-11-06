import type {Config,DashboardAction,Entity,Hass,Target} from './types';
const ids=/^[a-z_]+\.[a-z0-9_]+$/;
const targetKeys=['entity_id','device_id','area_id','floor_id','label_id'];
export function isActionReady(entity?:Entity):entity is Entity{return !!entity&&entity.state!=='unavailable'&&(entity.state!=='unknown'||['scene','button','input_button'].includes(entity.entity_id.split('.')[0]));}
export function targetEntities(target?:Target):string[]{const value=target?.entity_id;return value===undefined?[]:Array.isArray(value)?value:[value];}
export function validateTarget(target:Target){
  if(!target||typeof target!=='object'||Array.isArray(target)||!Object.keys(target).length)throw new Error('target 不能为空');
  for(const [key,value] of Object.entries(target)){
    const values=Array.isArray(value)?value:[value];
    if(!targetKeys.includes(key)||!values.length||values.some(v=>typeof v!=='string'||!v.trim()||v==='all'||(key==='entity_id'&&!ids.test(v))))throw new Error('target 需要明确的实体、设备、区域、楼层或标签 ID，不能使用 all');
  }
}
export function validateData(data:Record<string,unknown>){if(!data||typeof data!=='object'||Array.isArray(data)||targetKeys.some(k=>k in data))throw new Error('data 必须是对象且不得覆盖 target');}
export function safeNavigation(path:unknown):path is string{return typeof path==='string'&&/^\/(?!\/)[^\\\s]*$/.test(path)&&!/%(?:2f|5c|0[0-9a-f])/i.test(path);}
export function safeExternal(path:unknown):path is string{try{const u=new URL(String(path));return typeof path==='string'&&u.protocol==='https:'&&!u.username&&!u.password&&!/[\\\s]/.test(path);}catch{return false;}}
export function validateAction(a:DashboardAction){
  if(!a||!['none','more-info','toggle','navigate','url','perform-action','call-service'].includes(a.action))throw new Error('不支持的 action');
  if(a.entity!==undefined&&(typeof a.entity!=='string'||!ids.test(a.entity)))throw new Error('action.entity 无效');
  if(a.action==='navigate'&&!safeNavigation(a.navigation_path))throw new Error('导航只支持站内绝对路径');
  if(a.action==='url'&&!safeExternal(a.url_path))throw new Error('url action 只支持无凭据的 HTTPS URL');
  if(a.action==='perform-action'||a.action==='call-service'){
    if(!/^[a-z_]+\.[a-z_]+$/.test(a.perform_action??a.service??''))throw new Error('请填写有效的 domain.service');
    if(a.data!==undefined)validateData(a.data);if(a.service_data!==undefined)validateData(a.service_data);
    if(a.data!==undefined&&a.service_data!==undefined)throw new Error('不要同时配置 data 和 service_data');
    if(a.target)validateTarget(a.target);
  }
  if(a.confirmation!==undefined&&typeof a.confirmation!=='boolean'){
    if(!a.confirmation||typeof a.confirmation!=='object'||Array.isArray(a.confirmation))throw new Error('confirmation 必须是布尔值或对象');
    for(const [k,v]of Object.entries(a.confirmation))if(!['text','title','confirm_text','dismiss_text'].includes(k)||(v!==undefined&&typeof v!=='string'))throw new Error('确认只支持 text/title/confirm_text/dismiss_text，不支持豁免');
  }
}
export function resolvedTarget(a:DashboardAction,config:Config):Target{const target=a.target??{entity_id:a.entity??config.entity??''};validateTarget(target);return target;}
export function actionWriteError(hass:Hass|undefined,target:Target,service:string,readOnly:boolean,busy:boolean):string|undefined{
  if(readOnly)return '只读模式无法执行操作';if(busy)return '已有操作正在执行';
  const [d,s]=service.split('.');if(!hass?.services?.[d]||!Object.hasOwn(hass.services[d],s))return '服务未提供';
  if(targetEntities(target).some(id=>!isActionReady(hass.states[id])))return '目标实体不可用或无查看权限';
}
export function requiresConfirmation(service:string,target:Target):boolean{
  if(Object.keys(target).some(k=>k!=='entity_id')||targetEntities(target).length>1)return true;
  // Only familiar, reversible controls can omit confirmation. Unknown services stay conservative.
  return !/^(light|switch|input_boolean|fan|media_player|climate|number|input_number|select|input_select)\.(turn_on|turn_off|toggle|set_percentage|oscillate|set_direction|set_preset_mode|set_hvac_mode|set_temperature|set_humidity|set_fan_mode|set_swing_mode|set_swing_horizontal_mode|set_value|select_option|media_play|media_pause|media_stop|media_next_track|media_previous_track|volume_set|volume_mute|volume_up|volume_down|shuffle_set|repeat_set|select_source)$/.test(service);
}
export function toggleService(entity:string,hass?:Hass):string{
  const domain=entity.split('.')[0],e=hass?.states[entity];
  const features=Number(e?.attributes.supported_features)||0;
  if(domain==='fan'&&!(features&(e?.state==='off'?32:16)))throw new Error('风机未提供此电源能力');
  if(domain==='cover'&&!(features&(e?.state==='closed'?1:2)))throw new Error('窗帘未提供此移动能力');
  if(['light','switch','input_boolean','fan'].includes(domain))return `${domain}.${e?.state==='off'?'turn_on':'turn_off'}`;
  if(domain==='cover')return `cover.${e?.state==='closed'?'open_cover':'close_cover'}`;
  if(domain==='scene'||domain==='script')return `${domain}.turn_on`;
  throw new Error('此实体不支持安全 toggle，请配置明确服务');
}
