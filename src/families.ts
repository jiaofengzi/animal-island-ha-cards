import type {Kind} from './core';
import type {Config} from './types';

/** Interaction families, not a count of household devices or integration protocols. */
export type Family='control'|'climate'|'cover'|'media'|'task'|'monitor'|'action'|'summary'|'chips'|'picture'|'spacer';
export const familyForKind:Record<Kind,Family>={
 light:'control',fan:'control',entity:'control',number:'control',select:'control',
 climate:'climate',cover:'cover',media:'media',vacuum:'task',laundry:'task',printer:'task',
 fridge:'monitor',water:'monitor',consumable:'monitor',health:'monitor',meal:'monitor',
 scene:'action',feeder:'action',camera:'action',summary:'summary',chips:'chips',picture:'picture',spacer:'spacer'
};
export const familyNames:Record<Family,string>={control:'日常调节',climate:'温控',cover:'开合',media:'影音',task:'任务进度',monitor:'观察与维护',action:'明确行动',summary:'空间摘要',chips:'状态胶囊',picture:'图片',spacer:'留白'};
export const canonicalProfiles:Record<string,readonly Kind[]>={
 'custom:island-control-card':['light','fan','entity','number','select'],
 'custom:island-task-card':['vacuum','laundry','printer'],
 'custom:island-monitor-card':['fridge','water','consumable','health','meal'],
 'custom:island-action-card':['scene','feeder','camera']
};
/** Resolve canonical tags to existing capability schemas without changing config.type. */
export function resolveKind(config:Config,fallback:Kind):Kind {
 const profiles=canonicalProfiles[config.type];
 if(!profiles){
  if(config.profile!==undefined&&config.profile!==fallback)throw new Error('旧入口的 profile 必须与原类型一致，或省略');
  return fallback;
 }
 if(config.profile!==undefined){
  if(typeof config.profile!=='string'||!profiles.includes(config.profile as Kind))throw new Error(`profile 必须为 ${profiles.join('、')}`);
  return config.profile as Kind;
 }
 const domain=config.entity?.split('.')[0];
 const inferred:Partial<Record<string,Kind>>={light:'light',fan:'fan',number:'number',input_number:'number',select:'select',input_select:'select',vacuum:'vacuum',scene:'scene',script:'scene',camera:'camera'};
 const kind=domain?inferred[domain]:undefined;
 if(kind&&profiles.includes(kind))return kind;
 if(config.type==='custom:island-control-card'&&domain)return 'entity';
 throw new Error(`此家族需要明确 profile：${profiles.join('、')}`);
}
