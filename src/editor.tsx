import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {Button,Card,Collapse,Input,Select,Switch} from 'animal-island-ui';
import type {Config,DashboardAction,Hass,Item} from './types';
import {compositeKinds,kinds,names,validate,mediaControlOptions,volumeControlOptions} from './core';
import type {Kind} from './core';
import {compositeSchemas} from './composites';
import {canonicalProfiles,resolveKind} from './families';
import {animalStyle} from './animal-style';

function configKind(c:Config):Kind {
 const legacy=kinds.find(k=>c.type===`custom:island-${k}-card`);
 return resolveKind(c,legacy??'entity');
}

// Only app layout and the multiline JSON fallback live here. Component colors,
// radii, shadows, and artwork come unchanged from animal-island-ui/style.
const editorStyle=`
:host{display:block;min-width:0;color:var(--animal-text-color);font-family:var(--animal-font-family);font-size:var(--animal-font-size-base);font-weight:500;line-height:var(--animal-line-height-base)}
.editor{display:grid;gap:var(--animal-spacing-lg);min-width:0}
.editor-section{min-width:0}
.editor-section-body,.editor-group{display:grid;gap:var(--animal-spacing-lg);min-width:0}
.editor h2,.editor h3{margin:0;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.editor h2{font-size:var(--animal-font-size-lg)}
.editor h3{font-size:var(--animal-font-size-base)}
.editor p{margin:0;overflow-wrap:anywhere}
.editor-note{color:var(--animal-text-color-secondary)}
.editor-field{display:grid;gap:var(--animal-spacing-sm);min-width:0}
.editor-field-label{font-weight:700;overflow-wrap:anywhere}
.editor-toggle{display:flex;align-items:center;justify-content:space-between;gap:var(--animal-spacing-lg);min-height:var(--animal-height-lg)}
.editor-toggle>span{min-width:0;overflow-wrap:anywhere}
.editor-select{min-width:0}
.editor-select>div{width:100%;min-width:0}
.editor-actions{display:flex;flex-wrap:wrap;gap:var(--animal-spacing-sm)}
.editor-json{display:block;box-sizing:border-box;width:100%;min-width:0;resize:vertical;border:var(--animal-border-width) solid var(--animal-border-color);border-radius:var(--animal-border-radius-sm);background:var(--animal-bg-color);color:var(--animal-text-color);padding:var(--animal-spacing-md);font:inherit;line-height:1.6;tab-size:2}
.editor-json:focus-visible{outline:var(--animal-border-width) solid var(--animal-warning-color);outline-offset:var(--animal-spacing-xs)}
.editor-error{color:var(--animal-error-color);overflow-wrap:anywhere}
.editor-error:empty{display:none}
.editor-select [role=listbox]{left:0!important;right:auto!important;top:100%!important;bottom:auto!important;margin:var(--animal-spacing-sm) 0 0!important;transform:none!important;max-width:100%;max-height:280px;overflow:auto}
@media(prefers-reduced-motion:reduce){.editor *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
`;

type Update=(change:(config:Config)=>void)=>void;
interface FieldProps {label:string;value:unknown;onCommit:(value:string)=>void;type?:'text'|'number';entity?:boolean}
function TextField({label,value,onCommit,type='text',entity=false}:FieldProps){
 const id=useId();const normalized=value===undefined?'':String(value);
 const [draft,setDraft]=useState(normalized);const dirty=useRef(false);
 useEffect(()=>{setDraft(normalized);dirty.current=false;},[normalized]);
 return <div className="editor-field">
  <label className="editor-field-label" htmlFor={id}>{label}</label>
  <Input id={id} type={type} value={draft} list={entity?'island-editor-entities':undefined}
   onChange={event=>{setDraft(event.target.value);dirty.current=true;}}
   onBlur={()=>{if(dirty.current){dirty.current=false;onCommit(draft);}}}
   onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}} />
 </div>;
}
function SelectField({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(value:string)=>void}){
 const id=useId();const empty='__island_unspecified__';
 return <div className="editor-field">
  <span id={id} className="editor-field-label">{label}</span>
  {/* The upstream click-outside listener sees the shadow host as event.target.
      Keep its own control/option presses inside the shadow tree. */}
  <div className="editor-select" onMouseDown={event=>event.stopPropagation()}>
   <Select aria-labelledby={id} value={value||empty}
    options={options.map(option=>({key:option||empty,label:option||'未指定'}))}
    onChange={key=>onChange(key===empty?'':key)} />
  </div>
 </div>;
}
function ToggleField({label,value,onChange}:{label:string;value:boolean;onChange:(value:boolean)=>void}){
 const id=useId();
 return <div className="editor-toggle"><span id={id} className="editor-field-label">{label}</span><Switch checked={value} onChange={onChange} aria-labelledby={id}/></div>;
}
function JsonField({label,ariaLabel=label,value,rows=3,onCommit,onError}:{label:string;ariaLabel?:string;value:unknown;rows?:number;onCommit:(value:Record<string,unknown>)=>void;onError:(message:string)=>void}){
 const id=useId();const serialized=JSON.stringify(value??{},null,2);const [draft,setDraft]=useState(serialized);const dirty=useRef(false);
 useEffect(()=>{setDraft(serialized);dirty.current=false;},[serialized]);
 return <div className="editor-field">
  <label className="editor-field-label" htmlFor={id}>{label}</label>
  <textarea id={id} className="editor-json" aria-label={ariaLabel} rows={rows} value={draft}
   spellCheck={false} onChange={event=>{setDraft(event.target.value);dirty.current=true;}} onBlur={()=>{
    if(!dirty.current)return;dirty.current=false;
    try{const parsed:unknown=JSON.parse(draft);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('请输入 JSON 对象');onCommit(parsed as Record<string,unknown>);}
    catch(error){onError(error instanceof Error?error.message:'JSON 无效');}
   }}/>
 </div>;
}
function Section({label,children}:{label:string;children:ReactNode}){
 const id=useId();
 return <Card className="editor-section" role="group" aria-labelledby={id} style={{padding:'var(--animal-spacing-lg)'}}>
  <div className="editor-section-body"><h2 id={id}>{label}</h2>{children}</div>
 </Card>;
}
function Group({label,children}:{label:string;children:ReactNode}){
 const id=useId();return <section className="editor-group" aria-labelledby={id}><h3 id={id}>{label}</h3>{children}</section>;
}

function ActionForm({config:c,actionKey:key,label,update,onError}:{config:Config;actionKey:'tap_action'|'hold_action'|'double_tap_action';label:string;update:Update;onError:(message:string)=>void}){
 const a=c[key];
 const set=(change:(action:DashboardAction)=>void)=>update(next=>{next[key]??={action:'none'};change(next[key]!);});
 const confirmation=typeof a?.confirmation==='object'?a.confirmation:{};
 return <Section label={label}>
  <SelectField label="动作类型" value={a?.action??''} options={['','none','more-info','toggle','navigate','url','perform-action','call-service']} onChange={value=>update(next=>{
   if(!value){delete next[key];return;}
   const action={action:value} as DashboardAction;
   if(value==='navigate')action.navigation_path='/lovelace/0';
   if(value==='url')action.url_path='https://www.home-assistant.io';
   if(value==='perform-action'||value==='call-service'){action.perform_action='light.turn_on';action.target={entity_id:c.entity??'light.demo_lantern'};}
   next[key]=action;
  })}/>
  {a&&a.action!=='none'&&<>
   {['more-info','toggle'].includes(a.action)&&<TextField label="动作实体（空白使用卡片实体）" value={a.entity} entity onCommit={value=>set(action=>{action.entity=value||undefined;})}/>}
   {a.action==='navigate'&&<>
    <TextField label="导航路径" value={a.navigation_path} onCommit={value=>set(action=>{action.navigation_path=value;})}/>
    <ToggleField label="替换导航历史" value={!!a.navigation_replace} onChange={value=>set(action=>{action.navigation_replace=value;})}/>
   </>}
   {a.action==='url'&&<TextField label="HTTPS 链接" value={a.url_path} onCommit={value=>set(action=>{action.url_path=value;})}/>}
   {['perform-action','call-service'].includes(a.action)&&<>
    <TextField label="执行服务" value={a.perform_action??a.service} onCommit={value=>set(action=>{action.perform_action=value;delete action.service;})}/>
    {(['entity_id','device_id','area_id','floor_id','label_id'] as const).map(target=><TextField key={target} label={`target.${target}（逗号分隔）`}
     value={Array.isArray(a.target?.[target])?(a.target![target] as string[]).join(', '):a.target?.[target]}
     onCommit={value=>set(action=>{
      action.target??={};const values=value.split(',').map(s=>s.trim()).filter(Boolean);
      if(values.length)action.target[target]=values.length===1?values[0]:values;else delete action.target[target];
      if(!Object.keys(action.target).length)delete action.target;
     })}/>)}
    <JsonField label="服务参数 JSON" value={a.data??a.service_data} onError={onError} onCommit={value=>set(action=>{action.data=value;delete action.service_data;})}/>
   </>}
   <ToggleField label="要求确认" value={!!a.confirmation} onChange={value=>set(action=>{action.confirmation=value;})}/>
   {!!a.confirmation&&([['text','确认说明'],['title','确认标题'],['confirm_text','确认按钮文字'],['dismiss_text','取消按钮文字']] as const).map(([property,text])=>
    <TextField key={property} label={text} value={confirmation[property]} onCommit={value=>set(action=>{if(typeof action.confirmation!=='object')action.confirmation={};action.confirmation[property]=value||undefined;})}/>)}
  </>}
 </Section>;
}

function EditorView({config:c,hass,kind,update,replace,onError,error}:{config:Config;hass?:Hass;kind:Kind;update:Update;replace:(value:Config)=>void;onError:(message:string)=>void;error:string}){
 const entityIds=Object.keys(hass?.states??{}).sort();const schema=compositeSchemas[kind];
 return <div className="editor">
  <Section label="基本设置">
   <p>{names[kind]??'卡片'}</p>
   {canonicalProfiles[c.type]&&<>
    <p className="editor-note">切换配置会重置不兼容的设备字段与动作；已填显示名称与兼容字段保留。</p>
    <SelectField label="设备配置 profile" value={c.profile??''} options={['',...canonicalProfiles[c.type]]} onChange={value=>update(next=>{
     const previous=configKind(next);next.profile=value||undefined;if(!value||value===previous)return;
     const profile=value as Kind;delete next.actions;
     if(compositeKinds.includes(profile)){
      delete next.entity;next.entities=next.entities?.length?next.entities:[{entity:entityIds.find(id=>id.startsWith('sensor.'))??'sensor.demo_value'}];
      const roles=compositeSchemas[profile]?.roles??{};
      for(const item of next.entities)if(item.role&&!roles[item.role])delete item.role;
     }else{
      delete next.entities;
      const allowed:Partial<Record<Kind,string[]>>={light:['light'],fan:['fan'],number:['number','input_number'],select:['select','input_select'],vacuum:['vacuum'],scene:['scene','script'],camera:['camera']};
      const domains=allowed[profile];
      if(!next.entity||domains&&!domains.includes(next.entity.split('.')[0]))next.entity=entityIds.find(id=>!domains||domains.includes(id.split('.')[0]))??`${domains?.[0]??'sensor'}.demo_example`;
     }
    })}/>
   </>}
   <TextField label="效果或用途说明" value={c.description} onCommit={value=>update(next=>{next.description=value||undefined;})}/>
   <TextField label="显示名称" value={c.name} onCommit={value=>update(next=>{next.name=value||undefined;})}/>
   <ToggleField label="只读模式" value={!!c.read_only} onChange={value=>update(next=>{next.read_only=value;})}/>
   {!['summary','chips','spacer','picture',...compositeKinds].includes(kind)&&<TextField label="实体" value={c.entity} entity onCommit={value=>update(next=>{next.entity=value;})}/>}
   {kind==='spacer'&&<TextField label="间距高度 px" value={c.height??24} type="number" onCommit={value=>update(next=>{next.height=Number(value);})}/>}
   {kind==='picture'&&<>
    <TextField label="图片地址" value={c.image} onCommit={value=>update(next=>{next.image=value;})}/>
    <TextField label="替代文字" value={c.alt} onCommit={value=>update(next=>{next.alt=value;})}/>
    <TextField label="允许的 HTTPS 来源（逗号分隔）" value={c.allowed_image_origins?.join(', ')} onCommit={value=>update(next=>{next.allowed_image_origins=value.split(',').map(s=>s.trim()).filter(Boolean);})}/>
   </>}
  </Section>
  {kind==='media'&&<Section label="影音显示与控件">
   <ToggleField label="使用媒体标题与信息" value={!!c.use_media_info} onChange={value=>update(next=>{next.use_media_info=value;})}/>
   <ToggleField label="显示音量百分比" value={!!c.show_volume_level} onChange={value=>update(next=>{next.show_volume_level=value;})}/>
   <p className="editor-note">媒体信息仅显示文字，不自动请求封面。未指定控件列表时按设备能力显示全部。</p>
   {([['media_controls',mediaControlOptions],['volume_controls',volumeControlOptions]] as const).map(([key,options])=><Group key={key} label={key}>
    {options.map(option=><ToggleField key={option} label={option} value={c[key]===undefined||(c[key] as readonly string[]).includes(option)} onChange={value=>update(next=>{
     const values=new Set<string>(next[key]??options);if(value)values.add(option);else values.delete(option);
     Object.assign(next,{[key]:options.filter(item=>values.has(item))});
    })}/>)}
    <div className="editor-actions"><Button htmlType="button" onClick={()=>update(next=>{delete next[key];})}>恢复按能力显示</Button></div>
   </Group>)}
  </Section>}
  {['summary','chips',...compositeKinds].includes(kind)&&<Section label="显示字段">
   {schema&&<p className="editor-note">{schema.description}</p>}
   {(c.entities??[]).map((item,index)=>{
    const set=(key:keyof Item,value:unknown)=>update(next=>{Object.assign(next.entities![index],{[key]:value});});
    return <Group key={index} label={`字段 ${index+1}`}>
     <SelectField label="状态强调（由配置明确指定）" value={item.severity??'normal'} options={['normal','warning','error']} onChange={value=>set('severity',value)}/>
     <TextField label="字段实体" value={item.entity} entity onCommit={value=>set('entity',value)}/>
     <TextField label="字段名称" value={item.name} onCommit={value=>set('name',value||undefined)}/>
     <TextField label="属性（空白显示状态）" value={item.attribute} onCommit={value=>set('attribute',value||undefined)}/>
     {schema&&<>
      <SelectField label="字段语义" value={item.role??''} options={['',...Object.keys(schema.roles)]} onChange={value=>set('role',value||undefined)}/>
      <TextField label="单位覆盖" value={item.unit} onCommit={value=>set('unit',value||undefined)}/>
      <TextField label="进度最小值" value={item.min} type="number" onCommit={value=>set('min',value===''?undefined:Number(value))}/>
      <TextField label="进度最大值" value={item.max} type="number" onCommit={value=>set('max',value===''?undefined:Number(value))}/>
     </>}
     {kind==='summary'&&<TextField label="站内导航路径" value={item.path} onCommit={value=>set('path',value||undefined)}/>}
     <div className="editor-actions"><Button htmlType="button" danger onClick={()=>update(next=>{next.entities!.splice(index,1);})}>移除此字段</Button></div>
    </Group>;
   })}
   <div className="editor-actions"><Button htmlType="button" type="primary" onClick={()=>update(next=>{next.entities??=[];next.entities.push({entity:entityIds[0]??'sensor.demo_value'});})}>添加字段</Button></div>
  </Section>}
  {compositeKinds.includes(kind)&&<Section label="需确认的集成动作">
   {(c.actions??[]).map((action,index)=><Group key={index} label={`动作 ${index+1}`}>
    <TextField label="显示动作的状态（逗号分隔，可选）" value={action.when_states?.join(', ')} onCommit={value=>update(next=>{next.actions![index].when_states=value.trim()?value.split(',').map(s=>s.trim()).filter(Boolean):undefined;})}/>
    <SelectField label="动作层级" value={action.role??'secondary'} options={['primary','secondary','danger']} onChange={value=>update(next=>{next.actions![index].role=value as 'primary'|'secondary'|'danger';})}/>
    <TextField label="按钮文字" value={action.label} onCommit={value=>update(next=>{next.actions![index].label=value;})}/>
    <TextField label="服务 domain.service" value={action.service} onCommit={value=>update(next=>{next.actions![index].service=value;})}/>
    <TextField label="目标实体" value={action.entity} entity onCommit={value=>update(next=>{next.actions![index].entity=value;})}/>
    <JsonField label="动作参数 JSON" value={action.data} onError={onError} onCommit={value=>update(next=>{next.actions![index].data=value;})}/>
    <div className="editor-actions"><Button htmlType="button" danger onClick={()=>update(next=>{next.actions!.splice(index,1);})}>移除此动作</Button></div>
   </Group>)}
   <div className="editor-actions"><Button htmlType="button" type="primary" onClick={()=>update(next=>{next.actions??=[];next.actions.push({label:'执行动作',service:'button.press',entity:'button.demo_action'});})}>添加集成动作</Button></div>
  </Section>}
  {kind!=='spacer'&&([['tap_action','单击动作'],['hold_action','长按动作'],['double_tap_action','双击动作']] as const).map(([key,label])=>
   <ActionForm key={key} config={c} actionKey={key} label={label} update={update} onError={onError}/>)}
  <Collapse question="高级 JSON 配置" answer={<JsonField label="完整配置 JSON" ariaLabel="高级 JSON 配置" value={c} rows={12} onError={onError} onCommit={value=>replace(value as unknown as Config)}/>}/>
  <p role="alert" className="editor-error">{error}</p>
  <datalist id="island-editor-entities">{entityIds.map(id=><option key={id} value={id}/>)}</datalist>
 </div>;
}

class IslandEditor extends HTMLElement {
 private config?:Config;
 private state?:Hass;
 private root=this.attachShadow({mode:'open'});
 private mount=document.createElement('div');
 private reactRoot?:Root;
 private error='';
 constructor(){
  super();
  const style=document.createElement('style');style.textContent=`${animalStyle}\n${editorStyle}`;
  this.root.append(style,this.mount);
 }
 connectedCallback(){this.render();}
 disconnectedCallback(){this.reactRoot?.unmount();this.reactRoot=undefined;}
 setConfig(config:Config){
  if(JSON.stringify(config)===JSON.stringify(this.config))return;
  this.config=structuredClone(config);this.error='';this.render();
 }
 set hass(hass:Hass){this.state=hass;this.render();}
 private showError=(message:string)=>{this.error=message;this.render();};
 private replace=(next:Config)=>{
  try{
   validate(next,configKind(next));this.config=structuredClone(next);this.error='';
   this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:structuredClone(next)},bubbles:true,composed:true}));
   this.render();
  }catch(error){this.showError(error instanceof Error?error.message:'配置无效');}
 };
 private update:Update=change=>{
  if(!this.config)return;
  try{const next=structuredClone(this.config);change(next);this.replace(next);}
  catch(error){this.showError(error instanceof Error?error.message:'配置无效');}
 };
 private render(){
  const config=this.config;if(!config)return;
  let kind:Kind;try{kind=configKind(config);}catch{kind=canonicalProfiles[config.type]?.[0]??'entity';}
  this.reactRoot??=createRoot(this.mount);
  this.reactRoot.render(<EditorView config={config} hass={this.state} kind={kind} update={this.update} replace={this.replace} onError={this.showError} error={this.error}/>);
 }
}
if(!customElements.get('island-card-editor'))customElements.define('island-card-editor',IslandEditor);
