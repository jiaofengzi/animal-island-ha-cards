/** Render the existing HA action model with the actual upstream components.
 * Source nodes are an internal view model only, never inserted into the document.
 * All visible controls below are public animal-island-ui components. The upstream
 * library has no Slider; its Progress is the visual with an invisible native range
 * providing pointer and keyboard semantics. No upstream component paint is changed.
 */
import React, {useEffect, useState, useRef} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Button,Card,Collapse,Input,Progress,Select,Tag,Switch} from 'animal-island-ui';
import type {CardColor} from 'animal-island-ui';
import {LampIcon,AirConditionerIcon,FanIcon,WindowIcon,MusicIcon,VacuumCleanerIcon,PlugIcon,MoonIcon,SlidersIcon,ListIcon,HomeIcon,WashingMachineIcon,RefrigeratorIcon,WaterCupIcon,PawPrintIcon,SaladIcon,ThreeDPrinterIcon,BatteryIcon,CameraIcon,ShieldIcon,ImageIcon,TagIcon,InfoIcon,PowerIcon,PlusIcon,MinusIcon,MoreVerticalIcon,SettingsIcon,ChevronDownIcon,ChevronRightIcon,ChevronUpIcon,PlayIcon,PauseIcon,StopIcon,SkipBackIcon,SkipForwardIcon,VolumeIcon,LockIcon} from 'naive-icons';
import {animalStyle} from './animal-style';
import {styles} from './styles';

const icons:Record<string,React.ElementType>={light:LampIcon,climate:AirConditionerIcon,fan:FanIcon,cover:WindowIcon,media:MusicIcon,vacuum:VacuumCleanerIcon,entity:PlugIcon,scene:MoonIcon,number:SlidersIcon,select:ListIcon,summary:HomeIcon,laundry:WashingMachineIcon,fridge:RefrigeratorIcon,water:WaterCupIcon,feeder:PawPrintIcon,meal:SaladIcon,printer:ThreeDPrinterIcon,consumable:BatteryIcon,camera:CameraIcon,health:ShieldIcon,picture:ImageIcon,chips:TagIcon,info:InfoIcon,power:PowerIcon,plus:PlusIcon,minus:MinusIcon,more:MoreVerticalIcon,settings:SettingsIcon,down:ChevronDownIcon,chevron:ChevronRightIcon,up:ChevronUpIcon,play:PlayIcon,pause:PauseIcon,stop:StopIcon,previous:SkipBackIcon,next:SkipForwardIcon,volume:VolumeIcon,lock:LockIcon};
export function AnimalIcon({name,size=24}:{name:string;size?:number}){const Icon=icons[name]??InfoIcon;return <Icon size={size} aria-hidden="true"/>;}
const palette:Record<string,CardColor>={light:'app-yellow',climate:'app-blue',fan:'app-teal',cover:'app-teal',media:'purple',vacuum:'app-green',laundry:'app-green',printer:'app-green',scene:'app-pink',feeder:'app-pink',summary:'app-teal'};
function attrs(n:HTMLElement){const out:Record<string,unknown>={};for(const a of [...n.attributes]){if(a.name==='class')out.className=a.value;else if(a.name==='tabindex')out.tabIndex=Number(a.value);else if(a.name==='for')out.htmlFor=a.value;else if(a.name!=='style'&&!a.name.startsWith('on'))out[a.name]=a.value;}return out;}
function fire(n:HTMLElement,type:string){n.dispatchEvent(type==='click'?new MouseEvent(type,{bubbles:true,cancelable:true}):new Event(type,{bubbles:true}));}
function InputAdapter({source,onValue}:{source:HTMLInputElement;onValue?:()=>void}){
 const [value,setValue]=useState(source.value);const host=useRef<HTMLDivElement>(null);useEffect(()=>{source.defaultValue=source.value;setValue(source.value);const input=host.current?.querySelector('input');const change=()=>{if(source.type==='color'&&input){source.value=input.value;source.defaultValue=input.value;setValue(input.value);fire(source,'change');}};input?.addEventListener('change',change);return ()=>input?.removeEventListener('change',change);},[source]);
 const update=(v:string)=>{source.value=v;setValue(v);fire(source,'input');onValue?.();};
 const commit=()=>{if(source.value!==source.defaultValue){source.defaultValue=source.value;fire(source,'change');}};
 const common={'aria-label':source.getAttribute('aria-label')??undefined,'data-focus':source.dataset.focus,disabled:source.disabled,min:source.min,max:source.max,step:source.step};
 if(source.type==='range'){
  const percent=(Number(value)-Number(source.min))/(Number(source.max)-Number(source.min))*100;
  return <div className="range-interaction" data-value={value}><Progress percent={Math.max(0,Math.min(100,percent))} showInfo={false} duration={.15} aria-label={source.getAttribute('aria-label')??'数值'}/><input {...common} type="range" value={value} onInput={e=>update(e.currentTarget.value)} onChange={e=>update(e.currentTarget.value)} onPointerUp={commit} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))commit();}} onKeyDown={e=>{if(e.key==='Escape'){source.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));}}} onBlur={()=>{if(source.value!==source.defaultValue)commit();}}/><span className="range-thumb" style={{left:`calc(${percent}% - ${percent/100*20}px)`}}/></div>;
 }
 return <div ref={host}><Input {...common} id={source.id||undefined} type={source.type} size="large" shadow={false} value={value} onChange={e=>update(e.currentTarget.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')commit();if(e.key==='Escape')source.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));}}/></div>;
}
function RangeFieldAdapter({source}:{source:HTMLElement}){const [,refresh]=useState(0);const input=source.querySelector('input')!,label=source.querySelector('label')!;return <div className="range-field">{convert(label,'label')}<InputAdapter source={input} onValue={()=>refresh(n=>n+1)}/></div>;}
function SelectAdapter({source}:{source:HTMLSelectElement}){return <div className="select-layout" ref={node=>{const trigger=node?.querySelector('[role=combobox]');if(trigger&&source.dataset.focus)trigger.setAttribute('data-focus',source.dataset.focus);}} onMouseDown={e=>e.stopPropagation()}><Select aria-label={source.getAttribute('aria-label')??undefined} value={source.value} options={[...source.options].filter(o=>!o.disabled).map(o=>({key:o.value,label:o.text}))} onChange={value=>{source.value=value;fire(source,'change');}} disabled={source.disabled}/></div>;}
function CollapseAdapter({source}:{source:HTMLElement}){
 const host=useRef<HTMLDivElement>(null);const toggle=source.querySelector('.disclosure-toggle'),panel=source.querySelector('.advanced');
 useEffect(()=>{const wrapper=host.current;if(!wrapper)return;const button=wrapper.querySelector('button[aria-expanded]');const sync=()=>{const content=wrapper.querySelector<HTMLElement>('[role=region]');if(content){const closed=button?.getAttribute('aria-expanded')!=='true';content.inert=closed;content.setAttribute('aria-hidden',String(closed));}button?.setAttribute('data-focus','disclosure');};sync();const observer=new MutationObserver(sync);if(button)observer.observe(button,{attributes:true,attributeFilter:['aria-expanded']});return ()=>observer.disconnect();},[]);
 return <div ref={host}><Collapse className="island-collapse" question={toggle?.querySelector('span:not([data-animal-icon])')?.textContent??toggle?.textContent} answer={<div className="advanced">{panel?children(panel):null}</div>} defaultExpanded={toggle?.getAttribute('aria-expanded')==='true'}/></div>;
}
function children(n:Node):React.ReactNode[]{return [...n.childNodes].map((child,i)=>convert(child,`${i}`));}
function convert(node:Node,key:string):React.ReactNode{
 if(node.nodeType===Node.TEXT_NODE)return node.textContent;
 if(!(node instanceof HTMLElement))return null;
 const n=node,c=n.classList,tag=n.tagName.toLowerCase();
 if(n.dataset.animalIcon)return <AnimalIcon key={key} name={n.dataset.animalIcon} size={c.contains('device-art')?40:24}/>;
 if(tag==='style')return null;
 if(tag==='ha-card'){
  return <Card key={key} pattern="default" className={`island-card ${n.className}`} role="region" aria-label={n.getAttribute('aria-label')??undefined} data-family={n.dataset.family} data-component="Card"><div className="card-content">{children(n)}</div></Card>;
 }
 if(c.contains('card-header')){
  const profile=n.parentElement?.className.match(/profile-([\w]+)/)?.[1]??'';
  return <Card key={key} color={palette[profile]??'default'} className="card-header" data-component="Card" data-card-color={palette[profile]??'default'}>{children(n)}</Card>;
 }
 if(c.contains('disclosure'))return <CollapseAdapter key={key} source={n}/>;
 if(c.contains('confirmation'))return <Card key={key} type="dashed" className="confirmation" role="region" aria-label="操作确认"><div data-no-gesture="true">{children(n)}</div></Card>;
 if(tag==='button'){
  const b=n as HTMLButtonElement,focus=b.dataset.focus,label=b.getAttribute('aria-label')??b.textContent??'';
  if(c.contains('chip'))return <span key={key} className="chip-layout" ref={node=>{if(focus)node?.querySelector('[role=button]')?.setAttribute('data-focus',focus);}}><Tag size="large" color={c.contains('error')?'app-red':c.contains('warning')?'app-yellow':'default'} variant="solid" disabled={b.disabled} onClick={()=>fire(b,'click')} className="chip">{children(b)}</Tag></span>;
  if(focus?.endsWith('.power')&&['开启','关闭'].includes(label))return <div key={key} className="power-control" ref={node=>{node?.querySelector('button')?.setAttribute('data-focus',focus);}}><Switch checked={label.includes('关闭')} disabled={b.disabled} aria-label={label} onChange={()=>fire(b,'click')}/><span className="power-label">{label.includes('关闭')?'已开启':'已关闭'}</span></div>;
  return <Button key={key} {...attrs(b)} type={c.contains('primary')?'primary':c.contains('text-button')||focus==='card-info'?'text':'default'} size="middle" danger={c.contains('danger')} disabled={b.disabled} htmlType="button" onClick={e=>{e.stopPropagation();fire(b,'click');}}>{children(b)}</Button>;
 }
 if(c.contains('range-field'))return <RangeFieldAdapter key={key} source={n}/>;
 if(tag==='input')return <InputAdapter key={key} source={n as HTMLInputElement}/>;
 if(tag==='select')return <SelectAdapter key={key} source={n as HTMLSelectElement}/>;
 if(tag==='meter'){const m=n as HTMLMeterElement;return <Progress key={key} percent={(m.value-m.min)/(m.max-m.min)*100} showInfo={false} aria-label={m.getAttribute('aria-label')??'进度'}/>;}
 if(tag==='a'){return <a key={key} {...attrs(n)} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();fire(n,'click');}}}>{children(n)}</a>;}
 if(tag==='img'){const img=n as HTMLImageElement;return <img key={key} alt={img.alt} src={img.src} width={img.width} height={img.height} loading="lazy" referrerPolicy="no-referrer" onError={()=>fire(img,'error')}/>;}
 if(c.contains('spacer'))return <div key={key} aria-hidden="true" style={{height:n.style.getPropertyValue('--space')}}/>;
 if(c.contains('message')&&!n.textContent)return null;
 return React.createElement(tag,{...attrs(n),key},children(n));
}
const roots=new WeakMap<ShadowRoot,Root>();
export function renderIslandTree(root:ShadowRoot,node:HTMLElement){
 let reactRoot=roots.get(root);if(!reactRoot){const sheet=document.createElement('style');sheet.textContent=animalStyle+styles;const mount=document.createElement('div');mount.className='island-mount';root.replaceChildren(sheet,mount);reactRoot=createRoot(mount);roots.set(root,reactRoot);}
 flushSync(()=>reactRoot!.render(convert(node,'card')));
}
