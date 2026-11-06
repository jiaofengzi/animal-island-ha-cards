import {available,compositeKinds,controlsFor,kinds,names,safeImage,serviceAvailable,stateText,validate,mediaInfo} from './core';
import type {Kind} from './core';
import type {Config,Hass,Item,Confirmation,DashboardAction,Target,Entity,Command,RangeControl,ChoiceControl} from './types';
import {renderIslandTree} from './component-renderer';
import {actionWriteError,requiresConfirmation,resolvedTarget,targetEntities,toggleService} from './actions';
import {bindGestures} from './gestures';
import type {Gesture} from './gestures';
import './editor';
import {compositeSchemas} from './composites';
import {resolveKind,familyForKind,canonicalProfiles,familyNames} from './families';

function el<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string,className?:string):HTMLElementTagNameMap[K] {
  const node=document.createElement(tag); if(text!==undefined) node.textContent=text;if(className)node.className=className;return node;
}
export class IslandCard extends HTMLElement {
  static kind: Kind = 'entity';
  private config?:Config;
  private expanded=false;
  private infoExpanded=false;
  private lightMode='temperature';
  private state?:Hass;
  private scheduled=false;
  private busy=false;
  private outstanding=0;
  private activeStop=false;
  private requestSerial=0;
  private message='';
  private error=false;
  private revision=0;
  private failedImage='';
  private pending?:{label:string;run:()=>void;options?:Confirmation;origin?:string};
  private focusReturn?:string;
  private drafts=new Map<string,string>();
  private clearGestures?:()=>void;
  private observed=new Map<string,unknown>();
  private observedServices?:Hass['services'];
  private root:ShadowRoot;
  constructor(){super();this.root=this.attachShadow({mode:'open'});}
  get kind():Kind{const fallback=(this.constructor as typeof IslandCard).kind;return this.config?resolveKind(this.config,fallback):fallback;}
  setConfig(config:Config){this.config=validate(config,resolveKind(config,(this.constructor as typeof IslandCard).kind));this.expanded=false;this.infoExpanded=false;this.revision++;this.clearGestures?.();this.pending=undefined;this.drafts.clear();this.focusReturn=undefined;this.message='';this.failedImage='';this.requestRender();}
  set hass(hass:Hass){
    const previous=this.state;this.state=hass;
    const ids=new Set([this.config?.entity,...(this.config?.entities??[]).map(x=>x.entity),...(this.config?.actions??[]).map(x=>x.entity),...(['tap_action','hold_action','double_tap_action'] as const).flatMap(k=>targetEntities(this.config?.[k]?.target))]);
    const changed=[...ids].some(id=>id&&this.observed.get(id)!==hass.states[id]);
    if(!previous||this.observedServices!==hass.services||previous.language!==hass.language||changed)this.requestRender();
    this.observed=new Map([...ids].filter((id):id is string=>!!id).map(id=>[id,hass.states[id]]));this.observedServices=hass.services;
  }
  get hass():Hass|undefined{return this.state;}
  connectedCallback(){this.requestRender();}
  disconnectedCallback(){this.pending=undefined;this.clearGestures?.();this.drafts.clear();this.focusReturn=undefined;}
  getCardSize(){return this.kind==='spacer'?Math.ceil((this.config?.height??24)/50):this.kind==='chips'?1:3;}
  getGridOptions(){return {columns:12,min_columns:6,rows:this.kind==='chips'?1:this.kind==='spacer'?1:'auto'};}
  static getConfigElement(){return document.createElement('island-card-editor');}
  static getStubConfig(){const kind=this.kind;return {type:`custom:island-${kind}-card`,...(['summary','chips',...compositeKinds].includes(kind)?{entities:[{entity:'sensor.demo_value'}]}:kind==='spacer'?{}:kind==='picture'?{image:'/local/example.png',alt:'请替换示例图片'}:{entity:`${({media:'media_player',scene:'scene',number:'number',select:'select',entity:'sensor'} as Record<string,string>)[kind]??kind}.demo_example`})};}
  private requestRender(){if(this.scheduled)return;this.scheduled=true;queueMicrotask(()=>{this.scheduled=false;this.render();});}
  private button(label:string,fn:()=>void,disabled=false,primary=false){const b=el('button',label,primary?'primary':'');b.type='button';b.dataset.focus=label;b.disabled=disabled;b.addEventListener('click',ev=>{ev.stopPropagation();fn();});return b;}
  private moreInfo(entity:string,confirmed=false){if(entity.startsWith('camera.')&&!confirmed){this.confirm('打开影像详情并允许 Home Assistant 加载影像',()=>this.moreInfo(entity,true));return;}this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:entity},bubbles:true,composed:true}));}
  private confirm(label:string,run:()=>void,options?:Confirmation){const revision=this.revision;const origin=(this.root.activeElement as HTMLElement|null)?.dataset.focus;this.pending={label,options,origin,run:()=>{if(revision!==this.revision)return;this.pending=undefined;this.focusReturn=origin;run();this.requestRender();}};this.requestRender();queueMicrotask(()=>this.root.querySelector<HTMLButtonElement>('[data-cancel]')?.focus());}
  private failure(message:string){this.error=true;this.message=message;this.requestRender();}
  private effectiveAction(key:Gesture):DashboardAction{ return this.config?.[key]??(this.config?.entity&&key!=='double_tap_action'?{action:'more-info'}:{action:'none'}); }
  private perform(key:Gesture,confirmed=false){
    const c=this.config!,a=this.effectiveAction(key);if(a.action==='none'||this.busy||this.pending)return;
    if(a.confirmation&&!confirmed){this.confirm('执行卡片操作',()=>this.perform(key,true),typeof a.confirmation==='object'?a.confirmation:undefined);return;}
    try{
      if(a.action==='more-info'){const id=a.entity??c.entity;if(!id||!this.state?.states[id])throw new Error('实体不可见或不存在');this.moreInfo(id,confirmed);}
      else if(a.action==='navigate'){const replace=!!a.navigation_replace;history[replace?'replaceState':'pushState'](null,'',a.navigation_path);window.dispatchEvent(new CustomEvent('location-changed',{detail:{replace}}));}
      else if(a.action==='url'){window.open(a.url_path,'_blank','noopener,noreferrer');}
      else {const target=resolvedTarget(a,c);const entity=a.entity??c.entity;const service=a.action==='toggle'?toggleService(entity??'',this.state):(a.perform_action??a.service)!;void this.invokeTarget('执行卡片操作',service,target,a.data??a.service_data??{},!confirmed&&requiresConfirmation(service,target));}
    }catch(e){this.failure(e instanceof Error?e.message:'动作配置无效');}
  }
  private gestures(node:HTMLElement){if(this.kind==='spacer')return;const c=this.config!;if(!c.tap_action&&!c.hold_action&&!c.double_tap_action)return;node.tabIndex=0;node.dataset.focus='card-action';node.setAttribute('aria-keyshortcuts','Enter Space Shift+Enter Alt+Enter');node.setAttribute('aria-description','Enter 执行单击；Shift+Enter 执行长按；Alt+Enter 执行双击。');this.clearGestures=bindGestures(node,k=>this.perform(k),!!c.double_tap_action&&c.double_tap_action.action!=='none',this.effectiveAction('hold_action').action!=='none');}
  private safetyStop(service:string){return service==='cover.stop_cover'||service==='vacuum.stop';}
  private blocked(entity:string,service:string){return (this.safetyStop(service)?this.activeStop:this.busy)||!!this.config?.read_only||!available(this.state?.states[entity])||!serviceAvailable(this.state,service);}
  private async invoke(label:string,service:string,entity:string,data:Record<string,unknown>={},confirm=false){
    return this.invokeTarget(label,service,{entity_id:entity},data,confirm,true);
  }
  private async invokeTarget(label:string,service:string,target:Target,data:Record<string,unknown>={},confirm=false,legacy=false){
    const stopping=this.safetyStop(service);const blocked=actionWriteError(this.state,target,service,!!this.config?.read_only,stopping?this.activeStop:this.busy);if(blocked){if(!this.busy)this.failure(blocked);return;}
    if(confirm){this.confirm(label,()=>void this.invokeTarget(label,service,target,data,false,legacy));return;}
    this.focusReturn??=(this.root.activeElement as HTMLElement|null)?.dataset.focus;
    this.pending=undefined;this.outstanding++;this.busy=true;if(stopping)this.activeStop=true;const request=++this.requestSerial;this.error=false;this.message='正在发送…';this.requestRender();
    const revision=this.revision;
    try {const [domain,action]=service.split('.');await this.state!.callService(domain,action,legacy?{...data,entity_id:target.entity_id}:data,legacy?undefined:target);if(revision===this.revision&&request===this.requestSerial)this.message='请求已发送，等待设备状态更新。';}
    catch(cause){if(revision===this.revision&&request===this.requestSerial){const code=typeof cause==='object'&&cause!==null&&'code' in cause?String(cause.code):'';this.error=true;this.message= /unauthorized|forbidden|permission/i.test(code)?'无操作权限，请联系 Home Assistant 管理员。':'操作失败，请检查连接与设备后重试。';}}
    finally{this.outstanding=Math.max(0,this.outstanding-1);this.busy=this.outstanding>0;if(stopping)this.activeStop=false;this.requestRender();}
  }
  private itemName(item:Item){return item.name??(item.role?compositeSchemas[this.kind]?.roles[item.role]?.name:undefined)??String(this.state?.states[item.entity]?.attributes.friendly_name??item.entity);}
  private itemValue(item:Item){const e=this.state?.states[item.entity];if(!available(e))return stateText(e);const unit=item.unit??(item.role?compositeSchemas[this.kind]?.roles[item.role]?.unit:undefined);if(!item.attribute&&!unit)return stateText(e);const v=item.attribute?e.attributes[item.attribute]:e.state;return v===undefined?'暂无数据':typeof v==='object'?'不支持的复合属性':String(v)+(unit?` ${unit}`:'');}
  private uiIcon(name:string){const n=el('span');n.dataset.animalIcon=name;return n;}
  private glyphButton(label:string,glyph:string,fn:()=>void,disabled=false,primary=false,showLabel=false){const b=this.button('',fn,disabled,primary);b.setAttribute('aria-label',label);b.dataset.focus=label;b.classList.add(showLabel?'glyph-label':'icon-button');b.append(this.uiIcon(glyph));if(showLabel)b.append(el('span',label));return b;}
  private friendly(value:unknown):string{const words:Record<string,string>={open:'已打开',closed:'已关闭',cool:'制冷',heat:'制热',heat_cool:'自动温区',auto:'自动',dry:'除湿',fan_only:'送风',off:'关闭',on:'开启',eco:'节能',comfort:'舒适',sleep:'睡眠',normal:'标准',quiet:'安静',forward:'正向',reverse:'反向',all:'全部循环',one:'单曲循环',idle:'待机',cooling:'正在制冷',heating:'正在制热',drying:'正在除湿',fan:'送风',opening:'正在打开',closing:'正在关闭',returning:'正在回充',paused:'已暂停',error:'设备故障',buffering:'缓冲中',docked:'已回充',cleaning:'清扫中',completed:'已完成',running:'运行中'};return words[String(value)]??String(value??'');}
  private entityStatus(e?:Entity){if(!available(e))return stateText(e);if(this.kind==='climate'){const action=e.attributes.hvac_action;return this.friendly(e.state)+(action?` · ${this.friendly(action)}`:'');}if(this.kind==='scene')return this.config?.description??'准备就绪，轻触执行';if(this.kind==='cover'){const p=e.attributes.current_position;return this.friendly(e.state)==='open'?'已打开'+(typeof p==='number'?` · ${p}%`:''):this.friendly(e.state)+(typeof p==='number'?` · ${p}%`:'');}return this.friendly(stateText(e));}
  private render(){
    if(!this.config)return;const active=this.root.activeElement as HTMLInputElement|null,focusKey=this.focusReturn??active?.dataset.focus;this.clearGestures?.();const c=this.config,kind=this.kind;
    if(kind==='spacer'){const space=el('div',undefined,'spacer');space.style.setProperty('--space',`${c.height??24}px`);space.setAttribute('aria-hidden','true');renderIslandTree(this.root,space);return;}
    if(kind==='chips'){const strip=el('div',undefined,'chips');strip.setAttribute('role','group');strip.setAttribute('aria-label',c.name??names.chips);for(const item of c.entities??[]){const b=this.button('',()=>this.moreInfo(item.entity),!this.state?.states[item.entity]);b.dataset.focus=item.entity;b.className=`chip ${item.severity??''}`;b.append(el('span',this.itemName(item)),el('strong',this.itemValue(item)),this.uiIcon('chevron'));strip.append(b);}this.feedback(strip);renderIslandTree(this.root,strip);const actual=this.root.querySelector<HTMLElement>('.chips');if(actual)this.gestures(actual);this.restoreFocus(focusKey);return;}
    const card=document.createElement('ha-card');card.className=`family-${familyForKind[kind]} profile-${kind}`;card.setAttribute('role','region');card.setAttribute('aria-label',c.name??names[kind]);card.dataset.family=familyForKind[kind];
    const e=c.entity?this.state?.states[c.entity]:undefined,media=kind==='media'?mediaInfo(e,c):undefined;
    if(e&&!available(e))card.classList.add('unavailable');if(e?.state==='off')card.classList.add('is-off');
    const header=el('div',undefined,'card-header'),badge=el('span',undefined,'device-icon');badge.append(this.uiIcon(kind));const heading=el('div',undefined,'heading');heading.append(el('h2',media?.title??c.name??String(e?.attributes.friendly_name??names[kind])));
    if(e||c.entity){let status=kind==='camera'?'预览未打开':this.entityStatus(e);if(media)status=[media.detail,media.status.replace(/ · \d+%$/,'')].filter(Boolean).join(' · ');if(available(e)&&kind==='number'){const r=controlsFor(kind,e,c).ranges[0];status=r?`范围 ${r.min}–${r.max}${e.attributes.unit_of_measurement?' '+String(e.attributes.unit_of_measurement):''}`:status;}if(!(kind==='select'&&available(e)))heading.append(el('p',status,'state'));}else if(c.description)heading.append(el('p',c.description,'state'));
    if(kind==='summary'){const warnings=(c.entities??[]).filter(i=>i.severity==='warning'||i.severity==='error').length;if(warnings)heading.append(el('p',`${warnings} 项需要关注`,'state'));}
    header.append(badge,heading);
    if(available(e)&&['light','fan','entity'].includes(kind)){const cmd=controlsFor(kind,e,c).commands.find(x=>/turn_(on|off)$/.test(x.service));if(cmd)header.append(this.commandButton(cmd,e.entity_id,false,'power',true));}
    else if(e&&kind!=='camera')header.append(this.glyphButton('实体详情','more',()=>this.moreInfo(e.entity_id),false,false));
    if(compositeKinds.includes(kind)){const details=this.glyphButton(this.detailLabel(),'more',()=>{this.infoExpanded=!this.infoExpanded;this.requestRender();});details.setAttribute('aria-expanded',String(this.infoExpanded));header.append(details);}
    card.append(header);
    if(kind==='summary')this.renderSummary(card);
    else if(compositeKinds.includes(kind))this.renderComposite(card);
    else if(kind==='picture')this.renderPicture(card);
    else if(kind==='camera'){const privacy=el('div',undefined,'privacy');privacy.append(this.uiIcon('lock'),el('p','影像默认不加载。','privacy-title'),el('p','打开的是 Home Assistant 影像详情，不代表停止或开始采集。','meta'));privacy.append(this.glyphButton('查看影像详情','camera',()=>this.moreInfo(c.entity!),!available(e),true,true));card.append(privacy);}
    else if(available(e))this.renderControls(card,e.entity_id);
    else card.append(el('p','请检查实体是否存在、已连接，以及当前账户是否有查看权限。','empty-state'));
    if(c.read_only)card.append(el('p','只读模式','mode-note'));this.feedback(card);renderIslandTree(this.root,card);const actual=this.root.querySelector<HTMLElement>('.island-card');if(actual)this.gestures(actual);this.restoreFocus(focusKey);
  }
  private restoreFocus(focusKey?:string){if(focusKey&&!this.pending&&(document.activeElement===this||document.activeElement===document.body)){const target=Array.from(this.root.querySelectorAll<HTMLInputElement>('[data-focus]')).find(x=>x.dataset.focus===focusKey);if(target&&!target.disabled){target.focus();this.focusReturn=undefined;}}}
  private feedback(card:HTMLElement){
    if(this.pending){const p=el('section',undefined,'confirmation');p.dataset.noGesture='true';p.setAttribute('aria-label','操作确认');const options=this.pending.options;p.append(el('h3',options?.title??'操作确认'),el('p',options?.text??`确认${this.pending.label}？`));const row=el('div',undefined,'row');const cancel=this.button(options?.dismiss_text??'取消',()=>{this.focusReturn=this.pending?.origin;this.pending=undefined;this.requestRender();});cancel.dataset.cancel='true';const ok=this.button(options?.confirm_text??'确认执行',()=>this.pending?.run(),this.busy,true);row.append(cancel,ok);p.append(row);card.append(p);}
    const message=el('p',this.message,`message${this.error?' error':''}`);message.setAttribute('role',this.error?'alert':'status');message.setAttribute('aria-live','polite');card.append(message);
  }
  private commandButton(cmd:Command,entity:string,primary=false,glyph?:string,showLabel=false,disabled=false){const run=()=>void this.invoke(cmd.label,cmd.service,entity,cmd.data,cmd.confirm);const blocked=this.blocked(entity,cmd.service)||disabled;const b=glyph?this.glyphButton(cmd.label,glyph,run,blocked,primary,showLabel):this.button(cmd.label,run,blocked,primary);b.dataset.focus=cmd.service.replace(/turn_(on|off)$/,'power');return b;}
  private disclosure(card:HTMLElement,label:string,fill:(panel:HTMLElement)=>void){const section=el('div',undefined,'disclosure');const toggle=this.button('',()=>{this.expanded=!this.expanded;this.requestRender();});toggle.className='disclosure-toggle';toggle.dataset.focus='disclosure';toggle.setAttribute('aria-expanded',String(this.expanded));toggle.setAttribute('aria-controls','advanced-controls');toggle.append(this.uiIcon('settings'),el('span',label),this.uiIcon(this.expanded?'down':'chevron'));section.append(toggle);{const panel=el('div',undefined,'advanced');panel.id='advanced-controls';fill(panel);section.append(panel);}card.append(section);}
  private temperatureUnit(){const config=(this.state as Hass & {config?:{unit_system?:{temperature?:string}}}|undefined)?.config;return config?.unit_system?.temperature??'°';}
  private rangeControl(r:RangeControl,entity:string,stepper=false){
    const wrap=el('div',undefined,stepper?'stepper-field':'range-field');const label=el('label',r.label);const output=el('output');const input=el('input');input.type=stepper?'number':'range';input.min=String(r.min);input.max=String(r.max);input.step=String(r.step);const draft=this.drafts.get(r.field);input.value=String(draft!==undefined?Number(draft):r.value);input.defaultValue=input.value;input.setAttribute('aria-label',r.label);input.dataset.focus=r.field;input.disabled=this.blocked(entity,r.service);
    const display=()=>r.field==='brightness'?`${Math.round(Number(input.value)/255*100)}%`:r.field==='volume_level'?`${Math.round(Number(input.value)*100)}%`:input.value+(r.field.includes('temperature')||r.field.startsWith('target_temp')?'°':r.field==='color_temp_kelvin'?' K':r.field==='percentage'||r.field==='position'||r.field==='tilt_position'?'%':'');
    const update=()=>{output.value=display();input.style.setProperty('--fill',`${(Number(input.value)-r.min)/(r.max-r.min)*100}%`);};update();
    const commit=()=>{this.drafts.delete(r.field);const e=this.state?.states[entity],latest=e?controlsFor(this.kind,e,this.config).ranges.find(x=>x.field===r.field):undefined;const value=Number(input.value);if(latest&&input.value!==''&&Number.isFinite(value)&&value>=latest.min&&value<=latest.max&&Math.abs((value-latest.min)/latest.step-Math.round((value-latest.min)/latest.step))<.0001)void this.invoke(r.label,latest.service,entity,{...latest.data,[r.field]:value},this.kind==='cover');else this.failure('数值不符合设备当前范围或步长，请重新选择。');};
    input.addEventListener('input',()=>{this.drafts.set(r.field,input.value);update();});input.addEventListener('keydown',ev=>{if(ev.key==='Escape'){this.drafts.delete(r.field);this.requestRender();}});input.addEventListener('change',commit);
    if(stepper){label.className='control-caption';wrap.append(label);const row=el('div',undefined,'stepper');const step=(direction:number)=>{input.value=String(Number(Math.min(r.max,Math.max(r.min,Number(input.value)+direction*r.step)).toFixed(6)));update();commit();};const valueWrap=el('div',undefined,'stepper-value');valueWrap.append(input);if(r.field==='temperature'||r.field.startsWith('target_temp')){valueWrap.append(el('span',this.temperatureUnit(),'temperature-unit'));}row.append(this.glyphButton(`降低${r.label}`,'minus',()=>step(-1),input.disabled||r.value<=r.min),valueWrap,this.glyphButton(`提高${r.label}`,'plus',()=>step(1),input.disabled||r.value>=r.max));label.htmlFor=`field-${r.field}`;input.id=`field-${r.field}`;wrap.append(row);}else{label.append(output);wrap.append(label,input);}return wrap;
  }
  private choiceControl(choice:ChoiceControl,entity:string){const label=el('label',choice.label,'choice-field');const select=el('select');select.setAttribute('aria-label',choice.label);select.dataset.focus=choice.field;select.disabled=this.blocked(entity,choice.service);if(!choice.options.includes(choice.value)){const unknown=el('option','请选择');unknown.value='';unknown.disabled=true;select.append(unknown);}for(const value of choice.options){const option=el('option',this.friendly(value));option.value=value;select.append(option);}select.value=choice.value;select.addEventListener('change',()=>{const e=this.state?.states[entity],latest=e?controlsFor(this.kind,e,this.config).choices.find(c=>c.field===choice.field):undefined;if(latest?.options.includes(select.value))void this.invoke(choice.label,latest.service,entity,{[choice.field]:select.value});else this.failure('设备选项已变化，请重新选择。');});label.append(select);return label;}
  private colorControl(entity:string,color:string){const current=this.state?.states[entity]?.attributes.rgb_color;const label=el('label',Array.isArray(current)?'灯光颜色':'设置灯光颜色（当前颜色未知）','choice-field'),input=el('input');input.type='color';input.value=color;input.setAttribute('aria-label','灯光颜色');input.dataset.focus='rgb_color';input.disabled=this.blocked(entity,'light.turn_on');input.addEventListener('change',()=>{const e=this.state?.states[entity];if(e&&controlsFor(this.kind,e).color&&/^#[0-9a-f]{6}$/i.test(input.value))void this.invoke('设置灯光颜色','light.turn_on',entity,{rgb_color:[1,3,5].map(i=>parseInt(input.value.slice(i,i+2),16))});});label.append(input);return label;}
  private renderControls(card:HTMLElement,entity:string){
    const e=this.state!.states[entity]!,kind=this.kind,c=this.config!,controls=controlsFor(kind,e,c);const used=new Set<string>();const body=el('div',undefined,'control-body');const addRange=(field:string,stepper=false)=>{const r=controls.ranges.find(x=>x.field===field);if(r){body.append(this.rangeControl(r,entity,stepper));used.add(field);}};const cmd=(suffix:string)=>controls.commands.find(x=>x.service.endsWith('.'+suffix));const addCmd=(suffix:string,primary=false,glyph?:string,showLabel=false,parent:HTMLElement=body,disabled=false)=>{const x=cmd(suffix);if(x){parent.append(this.commandButton(x,entity,primary,glyph,showLabel,disabled));used.add(x.service);}};
    if(['light','fan','entity'].includes(kind))for(const x of controls.commands.filter(x=>/turn_(on|off)$/.test(x.service)))used.add(x.service);
    if(kind==='light')addRange('brightness');
    if(kind==='fan')addRange('percentage');
    if(kind==='number')addRange('value',true);
    if(kind==='select'){for(const choice of controls.choices){body.append(this.choiceControl(choice,entity));used.add(choice.field);}if(!controls.choices.length)body.append(el('p','当前没有可选项','meta'));}
    if(kind==='climate'){for(const r of controls.ranges.filter(x=>['temperature','target_temp_low','target_temp_high'].includes(x.field)))addRange(r.field,true);const actual=e.attributes.current_temperature;if(typeof actual==='number')body.append(el('p',`室内 ${actual}${this.temperatureUnit()}`,'current-temperature'));}
    if(kind==='cover'){addRange('position');const row=el('div',undefined,'direction-controls');const assumed=!!e.attributes.assumed_state;addCmd('open_cover',false,'up',true,row,!assumed&&(e.state==='opening'||e.attributes.current_position===100));addCmd('stop_cover',['opening','closing'].includes(e.state),'stop',true,row);addCmd('close_cover',false,'down',true,row,!assumed&&(e.state==='closing'||e.attributes.current_position===0));body.append(row);}
    if(kind==='media'){
      const off=e.state==='off';if(off)addCmd('turn_on',true,'power',true);
      else{const row=el('div',undefined,'transport');addCmd('media_previous_track',false,'previous',false,row);const main=e.state==='playing'?(cmd('media_pause')?'media_pause':cmd('media_stop')?'media_stop':undefined):cmd('media_play')?'media_play':undefined;if(main)addCmd(main,true,main==='media_pause'?'pause':main==='media_stop'?'stop':'play',false,row);addCmd('media_next_track',false,'next',false,row);if(row.childElementCount)body.append(row);const volume=el('div',undefined,'volume');addCmd('volume_mute',false,'volume',false,volume);const r=controls.ranges.find(x=>x.field==='volume_level');if(r){volume.append(this.rangeControl(r,entity));used.add(r.field);}else{addCmd('volume_down',false,'minus',false,volume);addCmd('volume_up',false,'plus',false,volume);}if(volume.childElementCount)body.append(volume);}
    }
    if(kind==='vacuum'){
      const battery=e.attributes.battery_level;if(typeof battery==='number')body.append(el('p',`电量 ${battery}%`,'task-context'));const row=el('div',undefined,'task-actions');if(e.state==='cleaning')addCmd('pause',true,'pause',true,row);else if(!['returning','error'].includes(e.state))addCmd('start',true,'play',true,row);if(!['docked','returning'].includes(e.state))addCmd('return_to_base',false,undefined,false,row);if(['cleaning','returning','paused'].includes(e.state))addCmd('stop',false,'stop',true,row);body.append(row);
    }
    if(kind==='scene'){const action=controls.commands[0];if(action){body.append(this.commandButton(action,entity,true,'play',true));used.add(action.service);}if(e.last_changed)body.append(el('p',`上次记录 ${e.last_changed}`,'meta'));}
    if(body.childElementCount)card.append(body);
    const advancedCommands=controls.commands.filter(x=>!used.has(x.service)),advancedRanges=controls.ranges.filter(x=>!used.has(x.field)),advancedChoices=controls.choices.filter(x=>!used.has(x.field));
    const hasAdvanced=advancedCommands.length+advancedRanges.length+advancedChoices.length+(controls.color?1:0)>0;
    if(hasAdvanced||['light','fan','climate','cover','media','vacuum'].includes(kind))this.disclosure(card,({light:'光色与设置',fan:'风向与设置',climate:'模式与设置',cover:'叶片与设置',media:'播放设置',vacuum:'清扫设置'} as Record<string,string>)[kind]??'更多设置',panel=>{
      // A single color slot, not parallel full-width parameter rails.
      const temperature=advancedRanges.find(x=>x.field==='color_temp_kelvin');if(kind==='light'&&temperature&&controls.color){const tabs=el('div',undefined,'segments');for(const [key,label]of [['temperature','色温'],['color','颜色']]){const b=this.button(label,()=>{this.lightMode=key;this.requestRender();});b.setAttribute('aria-pressed',String(this.lightMode===key));tabs.append(b);}panel.append(tabs);if(this.lightMode==='temperature')panel.append(this.rangeControl(temperature,entity));else panel.append(this.colorControl(entity,controls.color));}
      else{if(temperature)panel.append(this.rangeControl(temperature,entity));if(controls.color)panel.append(this.colorControl(entity,controls.color));}
      for(const r of advancedRanges.filter(x=>x!==temperature))panel.append(this.rangeControl(r,entity));for(const choice of advancedChoices)panel.append(this.choiceControl(choice,entity));const row=el('div',undefined,'row');for(const x of advancedCommands){const invalid=kind==='vacuum'&&((x.service.endsWith('.pause')&&e.state!=='cleaning')||(x.service.endsWith('.return_to_base')&&['docked','returning'].includes(e.state))||(x.service.endsWith('.locate')&&e.state==='returning'));row.append(this.commandButton(x,entity,false,undefined,false,invalid));}if(row.childElementCount)panel.append(row);panel.append(this.button('实体详情',()=>this.moreInfo(entity)));});
    if([...controls.commands,...controls.ranges,...controls.choices].some(x=>!serviceAvailable(this.state,x.service)))card.append(el('p','部分服务未提供，相关操作已禁用。','meta'));
  }
  private reading(item:Item,emphasis=false){const row=el('div',undefined,`reading${emphasis?' emphasized':''} ${item.severity??''}`);row.append(el('dt',this.itemName(item)),el('dd',this.itemValue(item)));const schema=compositeSchemas[this.kind],e=this.state?.states[item.entity],raw=item.attribute?e?.attributes[item.attribute]:e?.state;if(item.role&&schema?.roles[item.role]?.progress&&available(e)&&raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw))){const min=item.min??0,max=item.max??100,value=Number(raw);if(value>=min&&value<=max){const meter=el('meter');meter.min=min;meter.max=max;meter.value=value;meter.setAttribute('aria-label',this.itemName(item));row.append(meter);}}return row;}
  private detailLabel(){return ({laundry:'运行详情',printer:'任务详情',fridge:'温度与门状态',water:'滤芯与读数',feeder:'投喂记录与余粮',meal:'查看记录',consumable:'维护详情',health:'诊断详情'} as Record<string,string>)[this.kind]??'查看详情';}
  private renderComposite(card:HTMLElement){
    const kind=this.kind,c=this.config!,items=c.entities??[],family=familyForKind[kind];const byRole=(role:string)=>items.find(x=>x.role===role);const used=new Set<Item>();const body=el('div',undefined,`composite-body ${family}-body`);
    const status=byRole('status');if(status){body.append(el('p',kind==='laundry'?this.friendly(this.itemValue(status)):this.itemValue(status),'task-state'));used.add(status);}
    if(family==='task'){
      const remaining=byRole('remaining');if(remaining){if(kind!=='laundry'||(available(this.state?.states[remaining.entity])&&!['completed','done'].includes(status?this.state?.states[status.entity]?.state??'':'')))body.append(el('p',`还需 ${this.itemValue(remaining)}`,'task-remaining'));used.add(remaining);}const progress=byRole('progress');if(progress){const dl=el('dl',undefined,'progress-reading');dl.append(this.reading(progress));body.append(dl);used.add(progress);}
    }else if(kind==='feeder'){
      const last=byRole('last_feed'),portion=byRole('portion');if(last){body.append(el('p',`上次投喂 ${this.itemValue(last)}`,'meta'));used.add(last);}if(portion){body.append(el('p',`本次 ${this.itemValue(portion)}`,'portion'));used.add(portion);}
    }else if(kind==='meal'){
      for(const role of ['record','note','recorded_at']){const item=byRole(role);if(item){body.append(el('p',this.itemValue(item),role==='record'?'record-title':role==='note'?'record-note':'meta'));used.add(item);}}
    }
    const readings=items.filter(x=>!used.has(x));if(readings.length){const dl=el('dl',undefined,kind==='fridge'?'metric-pair':'readings');for(const item of readings)dl.append(this.reading(item,kind==='fridge'&&['temperature','freezer'].includes(item.role??'')||['water','consumable'].includes(kind)&&['filter','life','remaining'].includes(item.role??'')));body.append(dl);}card.append(body);
    const statusEntity=status?this.state?.states[status.entity]:undefined;const phase=available(statusEntity)?statusEntity.state:undefined;const actions=(c.actions??[]).filter(a=>!a.when_states||phase!==undefined&&a.when_states.includes(phase));if(actions.length){const primary=actions.filter(a=>a.role==='primary'),secondary=actions.filter(a=>a.role!=='primary');const add=(parent:HTMLElement,group:typeof actions)=>{for(const a of group){const b=this.button(a.label,()=>this.confirm(a.label,()=>{const latest=status?this.state?.states[status.entity]:undefined;if(a.when_states&&(!available(latest)||!a.when_states.includes(latest.state))){this.failure('任务状态已变化，请重新选择操作。');return;}void this.invoke(a.label,a.service,a.entity,a.data,false);}),this.blocked(a.entity,a.service),a.role==='primary');if(a.role==='danger')b.classList.add('danger');parent.append(b);}};if(primary.length){const row=el('div',undefined,'task-actions');add(row,primary);card.append(row);}if(secondary.length)this.disclosure(card,'其他操作',panel=>{const row=el('div',undefined,'row');add(row,secondary);panel.append(row);});if(kind==='feeder')card.append(el('p','投喂前需要确认','mode-note'));}
    if(this.infoExpanded){const details=el('div',undefined,'reading-details');details.append(el('h3',this.detailLabel()));for(const item of items)details.append(this.button(this.itemName(item),()=>this.moreInfo(item.entity),!this.state?.states[item.entity]));const description=compositeSchemas[kind]?.description;if(description)details.append(el('p',description,'meta'));card.append(details);}
  }
  private renderSummary(card:HTMLElement){
    const items=[...new Map((this.config!.entities??[]).map(i=>[i.entity,i])).values()];const nav=el('nav',undefined,'destinations');nav.setAttribute('aria-label','分区导航');for(const item of items){const content=el('span',undefined,'destination-copy');content.append(el('strong',this.itemName(item)),el('span',this.itemValue(item)));let entry:HTMLAnchorElement|HTMLButtonElement;if(item.path){entry=el('a');entry.href=item.path;entry.addEventListener('click',ev=>{if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey)return;ev.preventDefault();history.pushState(null,'',item.path);window.dispatchEvent(new CustomEvent('location-changed',{detail:{replace:false}}));});}else entry=this.button('',()=>this.moreInfo(item.entity),!this.state?.states[item.entity]);entry.className=`destination ${item.severity??''}`;entry.append(content,this.uiIcon('chevron'));nav.append(entry);}card.append(nav);
  }
  private renderPicture(card:HTMLElement){const c=this.config!,url=safeImage(c.image!,location.origin,c.allowed_image_origins);if(!url){card.append(el('p','图片来源未允许，请使用同源路径或显式允许的 HTTPS 来源。','message error'));return;}if(this.failedImage===url){card.append(el('p','图片加载失败，请检查地址和访问权限。','message error'),this.button('重新加载',()=>{this.failedImage='';this.requestRender();}));return;}const img=el('img');img.alt=c.alt!;img.loading='lazy';img.referrerPolicy='no-referrer';img.width=640;img.height=360;img.addEventListener('error',()=>{this.failedImage=url;this.requestRender();});img.src=url;card.append(img);}
}
const registry=window as Window & {customCards?:{type:string;name:string;description:string;preview:boolean}[]};registry.customCards??=[];
for(const kind of kinds){const tag=`island-${kind}-card`;if(!customElements.get(tag)){class Card extends IslandCard {static override kind=kind;}customElements.define(tag,Card);if(['climate','cover','media','summary','chips','spacer','picture'].includes(kind))registry.customCards.push({type:tag,name:`Island ${names[kind]}`,description:`${familyNames[familyForKind[kind]]}家族 · 兼容配置入口`,preview:true});}}
for(const [type,profiles] of Object.entries(canonicalProfiles)){const tag=type.slice(7);if(!customElements.get(tag)){class FamilyCard extends IslandCard {static override kind=profiles[0];static override getStubConfig(){return {...super.getStubConfig(),type,profile:profiles[0]};}}customElements.define(tag,FamilyCard);registry.customCards.push({type:tag,name:`Island ${familyNames[familyForKind[profiles[0]]]}`,description:'可复用家族 · profile 选择设备语义',preview:true});}}
