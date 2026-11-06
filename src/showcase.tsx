import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Title,Card,Select,Button} from 'animal-island-ui';
import 'animal-island-ui/style';
import {configs,profiles,mount,subscribe,model,setMode,reset,releasePending} from '../demo/acceptance-model.js';

declare const ACCEPTANCE_MAPPING: Array<{index:number;id:string;profile:string;family:string;use_case:string;baseline:string;mapping_kind:string;notes:string;documentation:string;official_image:string|null;source_url:string|null}>;
declare const ACCEPTANCE_IMAGES:Record<string,string>;
const mapping=ACCEPTANCE_MAPPING;
const responsiveTitleSize=(): 'small'|'middle'|'large'=>innerWidth<=380?'small':innerWidth<=700?'middle':'large';
function Module({profile}:{profile:string}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{const index=profiles.indexOf(profile);const card=document.createElement(configs[index].type.slice(7));card.dataset.profile=profile;const unmount=mount(card,index);host.current?.append(card);return ()=>{unmount();card.remove();};},[profile]);
 return <div className="module-host" ref={host}/>;
}
const states=[['normal','默认 / 运行'],['off','关闭 / 完成'],['paused','暂停'],['unavailable','不可用'],['readonly','只读'],['error','操作失败'],['pending','等待响应']].map(([key,label])=>({key,label}));
function App(){
 const [titleSize,setTitleSize]=useState(responsiveTitleSize);
 useEffect(()=>{const resize=()=>setTitleSize(responsiveTitleSize());window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 const [family,setFamily]=useState('all');const [profile,setProfile]=useState('all');const [,refresh]=useState(0);
 useEffect(()=>subscribe(()=>refresh(v=>v+1)),[]);
 useEffect(()=>{document.documentElement.dataset.ready='true';const navigate=()=>{const id=location.hash.slice(1);if(!id.startsWith('module-'))return;setFamily('all');setProfile('all');requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}));};window.addEventListener('location-changed',navigate);return()=>window.removeEventListener('location-changed',navigate);},[]);
 const shown=mapping.filter(row=>(family==='all'||row.family===family)&&(profile==='all'||row.profile===profile));
 return <main>
  <header><p className="eyebrow">23 个模块 · 独立原版对照</p><h1><Title size={titleSize} variant="ribbon">小岛模块 · 逐项验收</Title></h1><p>以真实 Animal Island UI 3.0.0 组件重做。每个用例独立对照，先看清差别，再决定采用。</p></header>
  <section className="section controls" aria-label="验收筛选与模拟状态">
   <div className="filter-grid"><label><span>模块家族</span><Select aria-label="模块家族" options={[{key:'all',label:'全部家族'},...[...new Set(mapping.map(r=>r.family))].map(f=>({key:f,label:f}))]} value={family} onChange={setFamily}/></label><label><span>独立模块</span><Select aria-label="独立模块" showSearch options={[{key:'all',label:'全部 23 个模块'},...mapping.map(r=>({key:r.profile,label:`${r.index}. ${r.use_case} · ${r.profile}`}))]} value={profile} onChange={setProfile}/></label><label><span>右侧模拟状态</span><Select aria-label="右侧模拟状态" options={states} value={model.mode} onChange={setMode}/></label></div>
   <div className="actions"><Button type="primary" onClick={reset}>重置模拟</Button><Button disabled={!model.pendingCount} onClick={releasePending}>释放待响应操作（{model.pendingCount}）</Button><a href="./offline.html" download>下载离线验收页</a></div>
   <p>仅使用本地模拟数据，不连接 Home Assistant 或真实设备。关闭与暂停只改变适用的设备；错误与等待状态在操作后出现。只读与不可用状态会禁用可写操作。</p>
   <Card><strong>左侧是官方参考截图，右侧是可交互重做模块。</strong><p>官方截图固定来自 Mushroom v5.2.3 文档，实体名称、数值与右侧不相同，也不会随模拟状态改变。通用组件及组合建议不代表官方专用家电卡；本页没有伪造 Mushroom 运行宿主。</p><p>Template 图片是新版 mushroom-template-card，基于 Home Assistant Tile；不是 Legacy Template。</p></Card>
   <details><summary>查看模拟调用记录（{model.calls.length}）</summary><ol aria-live="polite">{model.calls.slice(-20).map((call,index)=><li key={index}>{call.domain}.{call.service} · {JSON.stringify(call.data)} {call.target?JSON.stringify(call.target):''}</li>)}</ol>{!model.calls.length&&<p>还没有模拟服务调用。试试右侧的操作控件。</p>}</details>
  </section>
  <p className="result-count" role="status">当前显示 {shown.length} / 23 个模块 · 左右容器等宽 · 小屏按原版、新版顺序排列</p>
  {shown.map(row=><section className="section comparison" id={`module-${row.profile}`} key={row.profile} data-profile={row.profile}>
   <div className="row-heading"><h2><span className="index">{String(row.index).padStart(2,'0')}</span> {row.use_case}</h2><p>{row.family} · {row.profile} · {row.mapping_kind}</p></div>
   <div className="pair">
    <article className="baseline"><h3>原版 Mushroom · 静态参考</h3><p className="component-name">{row.baseline}</p>
     {row.profile==='picture'?<Card><strong>没有直接等价的 Mushroom 全图卡</strong><p>Template 的 picture 仅用于图标位，不能替代右侧全图模块。这里不借用错误截图，也未伪造 HA 原生 Picture 基线。</p></Card>:row.profile==='spacer'?<Card><strong>mushroom-empty-card</strong><p>官方空白卡没有可展示的控件截图。此说明不是卡片渲染。</p></Card>:<figure><div className="reference-image"><img src={ACCEPTANCE_IMAGES[row.official_image!]} alt={`官方 ${row.official_image?.split('/').pop()} 样例；不是 ${row.use_case} 的同状态截图`}/></div><figcaption>{row.mapping_kind==='直接对应'?'对应组件的官方样例截图':'通用组件的官方样例截图，非完整组合或专用卡'}{row.official_image?.includes('template-light')?' · 新 Template，非 Legacy':''}</figcaption></figure>}
     <p className="mapping-note">{row.notes}</p><div className="source-links"><a href={row.documentation} target="_blank" rel="noreferrer">查看固定版本组件文档</a>{row.official_image&&row.profile!=='picture'&&<a href={row.source_url!} target="_blank" rel="noreferrer">查看原始截图来源</a>}</div>
    </article>
    <article className="candidate"><h3>Animal Island · 交互模块</h3><p className="component-name">island-{row.profile}-card · 模拟设备</p><Module profile={row.profile}/>{row.profile==='picture'&&location.protocol==='file:'&&<p className="enhancement">离线文件模式：此模块安全策略只允许同源 HTTP(S) 图片，因而显示来源限制。完整图片显示请通过本地 HTTP 服务器打开 index.html；没有放宽卡片安全策略。</p>}{row.mapping_kind!=='直接对应'&&<p className="enhancement">组合与新增展示：右侧布局、图片、进度或操作组织是本项目的模块设计，不是 Mushroom 原生专用卡。</p>}</article>
   </div>
  </section>)}
  {!shown.length&&<Card><p>当前筛选没有匹配项。可将模块或家族切回“全部”。</p></Card>}
  <footer><p>开源预览 · 模拟数据 · 没有真实设备调用</p><p><a href="https://github.com/guokaigdg/animal-island-ui">Animal Island UI 3.0.0 · MIT</a> · <a href="https://github.com/piitaya/lovelace-mushroom/tree/v5.2.3">Mushroom v5.2.3 · Apache-2.0</a> · <a href={location.pathname.endsWith('/offline.html')?'#license-notices':'./THIRD_PARTY_NOTICES.md'}>第三方许可与来源</a></p><p>不含字体文件，不调用字体 CDN。离线使用系统字体回退，字形与官方字体演示可能有差异。</p></footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
