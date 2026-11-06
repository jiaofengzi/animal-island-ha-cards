/* eslint-disable @typescript-eslint/no-explicit-any -- HA custom elements expose dynamic runtime APIs without installed frontend typings. */
import {collectStyles} from './visual-diagnostics';
import {test,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {cards,chips,states,badge,cardConfig} from '../../scripts/ha-parity/fixtures.mjs';
let auth:any;
function redact(text:string):string {for(const key of ['access_token','refresh_token'])if(auth?.[key])text=text.split(auth[key]).join('[REDACTED]');return text;}
const sanitize=(value:unknown)=>redact(JSON.stringify(value,null,2));
const pageErrors=new WeakMap<object,string[]>();
test.beforeAll(async()=>{auth=JSON.parse(await readFile('.ha-secrets/auth.json','utf8'));});
test.afterEach(async({page},info)=>{
 const errors=pageErrors.get(page)||[];
 const rawDiagnostics=await page.evaluate(()=>({rejections:(window as any).__parityRejections||[],connected:Boolean((document.querySelector('home-assistant') as any)?.hass?.connected)})).catch(()=>({rejections:[],connected:false}));
 const diagnostics=JSON.parse(sanitize(rawDiagnostics));
 if(info.status!==info.expectedStatus||errors.length||diagnostics.rejections.length){
  await mkdir('ha-evidence/failures',{recursive:true});const name=info.title.replace(/[^a-z0-9]+/gi,'-').slice(0,100);
  await writeFile(`ha-evidence/failures/${name}.json`,sanitize({errors,...diagnostics}));
  if(page.url().startsWith('http://127.0.0.1:8123/lovelace/')&&await page.locator('mushroom-entity-card').count())await page.screenshot({path:`ha-evidence/failures/${name}.png`,fullPage:true});
 }
 expect(errors.length,'Uncaught frontend errors (see sanitized diagnostics)').toBe(0);
 expect(diagnostics.rejections.length,'Unhandled frontend promise rejections (see sanitized diagnostics)').toBe(0);
});
test.beforeEach(async({page,request})=>{
 for(const [id,state] of Object.entries(states)){const response=await request.post(`/api/states/${id}`,{headers:{Authorization:`Bearer ${auth.access_token}`},data:state});expect(response.ok()).toBeTruthy();}
 pageErrors.set(page,[]);page.on('pageerror',error=>pageErrors.get(page)!.push(redact(error.message)));
 await page.addInitScript(value=>{
  localStorage.setItem('hassTokens',JSON.stringify(value));
  (window as any).__parityRejections=[];
  window.addEventListener('unhandledrejection',event=>{
   const safe=(text:string|undefined)=>{if(!text)return text;for(const token of [value.access_token,value.refresh_token])if(token)text=text.split(token).join('[REDACTED]');return text;};
   const r=event.reason;(window as any).__parityRejections.push({code:safe(typeof r?.code==='string'?r.code:undefined),message:safe(typeof r?.message==='string'?r.message:typeof r==='string'?r:undefined),name:safe(typeof r?.name==='string'?r.name:undefined)});
  });
 },auth);
 await page.goto('/lovelace/sections');
 await expect(page.locator('home-assistant')).toBeVisible();
 await expect(page.locator('mushroom-template-card').first()).toBeVisible();
 await expect(page.locator('island-template-card').first()).toBeVisible();
});
for(const view of ['sections','masonry'])test(`${view}: all 30 modules in real host`,async({page})=>{
 await page.goto(`/lovelace/${view}`);
 for(const prefix of ['mushroom-','island-']){
  for(const card of cards){const el=page.locator(`${prefix}${card.name}-card`).first();await expect(el).toBeAttached();await expect.poll(()=>el.evaluate((e:any)=>Boolean(e.shadowRoot)),`${prefix}${card.name} shadow DOM`).toBe(true);if(card.name!=='empty')await expect.poll(()=>el.evaluate((e:any)=>Boolean(e.hass||e._hass)),`${prefix}${card.name} HA context`).toBe(true);if(card.name!=='empty'){await expect(el).toBeVisible();await expect.poll(()=>el.evaluate((e:any)=>e.shadowRoot.childElementCount)).toBeGreaterThan(0);await expect(el.locator('ha-card')).toBeAttached();}}
  await expect(page.locator(`${prefix}template-badge`).first()).toBeVisible();
  for(const chip of chips)await expect(page.locator(`${prefix}${chip.type}-chip`).first()).toBeAttached();
 }
 await expect(page.locator('hui-error-card')).toHaveCount(0);
 await page.screenshot({path:`ha-evidence/${view}-desktop.png`,fullPage:true});
});
test('server render_template subscription updates cards, badges and chips',async({page,request})=>{
 for(const value of ['37','21']){
  const r=await request.post('/api/states/sensor.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{state:value,attributes:{friendly_name:'Island temperature',unit_of_measurement:'°C'}}});expect(r.ok()).toBeTruthy();
  for(const prefix of ['mushroom-','island-'])for(const suffix of ['template-card','template-badge','template-chip'])await expect(page.locator(prefix+suffix).first()).toContainText(value);
 }
});
test('live HA config/default, sizing contract, lifecycle and editor parity',async({page})=>{
 const results=await page.evaluate(async fixtures=>{
  const ha:any=document.querySelector('home-assistant');const hass=ha.hass;const results=[];
  for(const fixture of fixtures){
   const pair:any[]=[];
   for(const prefix of ['mushroom-','island-']){
    const el:any=document.createElement(`${prefix}${fixture.name}-card`);el.hass=hass;el.setConfig({type:`custom:${prefix}${fixture.name}-card`,...fixture.config});
    const holder=document.createElement('div');holder.style.width='264px';holder.append(el);document.body.append(holder);await el.updateComplete;
    const sizes={card:await el.getCardSize?.(),grid:el.getGridOptions?.(),layout:el.getLayoutOptions?.()};
    const editor:any=await el.constructor.getConfigElement?.();if(editor){editor.hass=hass;editor.setConfig({type:`custom:${prefix}${fixture.name}-card`,...fixture.config});holder.append(editor);await editor.updateComplete;}
    el.remove();holder.append(el);await el.updateComplete;
    pair.push({sizes,editor:Boolean(editor),connected:el.isConnected});holder.remove();
   }
   results.push({name:fixture.name,pair});
  }return results;
 },cards.map(c=>({...c,config:c.name==='template'?{primary:'Default template'}:('entity' in c.config?{entity:c.config.entity}:c.config)})));
 for(const {name,pair} of results){expect(pair[1],name).toEqual(pair[0]);expect(pair[1].connected,name).toBe(true);}
});
test('same service action reaches real HA through native host action handler',async({page,request})=>{
 for(const prefix of ['mushroom-','island-']){
  await request.post('/api/services/input_boolean/turn_off',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{entity_id:'input_boolean.parity'}});
  await page.locator(`${prefix}entity-card`).first().evaluate((el:any)=>el.setConfig({type:el.localName,entity:'input_boolean.parity',tap_action:{action:'perform-action',perform_action:'input_boolean.turn_on',target:{entity_id:'input_boolean.parity'}}}));
  await page.locator(`${prefix}entity-card`).first().click();
  await expect.poll(async()=>{const r=await request.get('/api/states/input_boolean.parity',{headers:{Authorization:`Bearer ${auth.access_token}`}});return (await r.json()).state;}).toBe('on');
 }
});
test('native more-info event opens real HA dialog',async({page})=>{
 for(const prefix of ['mushroom-','island-']){
  await page.locator(`${prefix}entity-card`).first().click();
  await expect(page.locator('ha-more-info-dialog ha-dialog dialog')).toBeVisible();
  const modalTheme={light:await page.locator('island-light-card').first().evaluate(collectStyles),template:await page.locator('island-template-card').first().evaluate(collectStyles)};
  await writeFile(`ha-evidence/modal-theme-${prefix}.json`,JSON.stringify(modalTheme,null,2));
  await page.screenshot({path:`ha-evidence/more-info-${prefix}.png`,fullPage:true});
  await page.keyboard.press('Escape');
 }
});
for(const width of [220,320,480])test(`live HA standalone containers ${width}px: all 18 cards`,async({page})=>{
 const measurements=await page.evaluate(async({fixtures,width})=>{
  const hass=(document.querySelector('home-assistant') as any).hass;const results=[];
  for(const fixture of fixtures)for(const prefix of ['mushroom-','island-']){
   const holder=document.createElement('div');holder.style.cssText=`display:block;width:${width}px;min-width:0;position:relative`;
   const el:any=document.createElement(`${prefix}${fixture.name}-card`);el.hass=hass;el.setConfig({type:`custom:${prefix}${fixture.name}-card`,...fixture.config});holder.append(el);document.body.append(holder);await el.updateComplete;
   const nodes:Element[]=[];const walk=(node:Element)=>{nodes.push(node);for(const c of node.children)walk(c);if(node.shadowRoot)for(const c of node.shadowRoot.children)walk(c);};walk(el);
   const surfaces=nodes.filter(n=>n.localName==='ha-card');
   const surfaceMetrics=surfaces.map(n=>({width:n.getBoundingClientRect().width,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth}));
   results.push({name:fixture.name,prefix,width,holderWidth:holder.getBoundingClientRect().width,surfaces:surfaceMetrics});holder.remove();
  }return results;
 },{fixtures:cards,width});
 await writeFile(`ha-evidence/container-${width}.json`,JSON.stringify(measurements,null,2));
 for(const row of measurements){expect(row.holderWidth).toBe(width);for(const surface of row.surfaces){expect(surface.width,`${row.prefix}${row.name} surface`).toBeLessThanOrEqual(width+1);expect(surface.scrollWidth,`${row.prefix}${row.name} overflow`).toBeLessThanOrEqual(surface.clientWidth+1);}}
});
test('mobile host renders both forks',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('island-light-card').first()).toBeVisible();
 await page.screenshot({path:'ha-evidence/mobile.png',fullPage:true});
});

test('capture paired real-host module evidence',async({page})=>{
 await mkdir('ha-evidence/runtime',{recursive:true});
 const cases:any={};
 const modules=[...cards.map(c=>({id:`card:${c.name}`,tag:`${c.name}-card`})),{id:'badge:template',tag:'template-badge'},...chips.map(c=>({id:`chip:${c.type}`,tag:`${c.type}-chip`}))];
 for(const module of modules){
  const row:any={host:'Home Assistant',haVersion:'2026.9.0',status:'captured',state:'synthetic fixture',original:null,island:null,config:{},dimensions:{},computedStyles:{},entityStates:{}};
  for(const [variant,prefix] of [['original','mushroom-'],['island','island-']]){
   let el=page.locator(prefix+module.tag).first();
   if(module.id==='chip:conditional')el=el.locator(`${prefix}entity-chip`).first();
   const box=await el.boundingBox();
   row.dimensions[variant]=box;
   row.computedStyles[variant]=await el.evaluate(collectStyles);
   row.entityStates[variant]=await el.evaluate((e:any)=>{const id=e._config?.entity||e.config?.entity;const state=id?e.hass?.states?.[id]:null;return state?{entity_id:id,state:state.state,attributes:state.attributes}:null;});
   row.config[variant]=module.id.startsWith('card:')?cardConfig(cards.find(c=>`card:${c.name}`===module.id)!,prefix):module.id==='badge:template'?{type:`custom:${prefix}template-badge`,...badge.config}:chips.find(c=>`chip:${c.type}`===module.id);
   if(['card:empty','chip:spacer'].includes(module.id)){row.status='expected-blank';continue;}
   if(!box || box.width<1 || box.height<1){row.status=['card:empty','chip:spacer'].includes(module.id)?'expected-blank':'zero-size-no-image';continue;}
   const file=`runtime/${module.id.replace(':','-')}-${variant}.png`;
   await el.screenshot({path:'ha-evidence/'+file});row[variant]=file;
  }row.state=row.entityStates.island?.state??row.entityStates.original?.state??null;cases[module.id]=row;
 }
 await writeFile('ha-evidence/runtime-evidence.json',JSON.stringify({host:'Home Assistant',haVersion:'2026.9.0',generatedAt:new Date().toISOString(),commit:process.env.GITHUB_SHA||null,fixtureStates:states,cases},null,2));
});

test('128 sizing formula cases: source oracle and real-host fork comparison',async({page,request})=>{
 const {traditionalSizing,templateSizing}=await import('../../scripts/ha-parity/sizing-oracle.mjs');
 const {cases}=JSON.parse(await readFile('tests/ha-parity/sizing-fixtures.json','utf8'));
 expect(cases).toHaveLength(128);
 for(const c of cases){const i=c.input;expect(c.kind==='traditional'?traditionalSizing(i.config,i.hasControls,i.active):templateSizing(i.config,i.supportsInlineFeaturesBelow)).toEqual(c.expected);}
 let checked=0;
 for(const active of [false,true]){
  const state=active?'on':'off';
  const r=await request.post('/api/states/light.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{state,attributes:{friendly_name:'Island light',brightness:160,supported_color_modes:['brightness'],color_mode:'brightness',supported_features:0}}});expect(r.ok()).toBeTruthy();
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('home-assistant') as any).hass.states['light.parity'].state)).toBe(state);
  const group=cases.filter((c:any)=>c.kind==='traditional'?c.input.active===active:!active);
  const results=await page.evaluate(async cases=>{
   const hass=(document.querySelector('home-assistant') as any).hass;const results=[];
   for(const c of cases){const pair=[];for(const prefix of ['mushroom-','island-']){
    const name=c.kind==='traditional'?'light':'template';const el:any=document.createElement(`${prefix}${name}-card`);el.hass=hass;
    el.setConfig({type:`custom:${prefix}${name}-card`,entity:'light.parity',...c.input.config,...(c.kind==='traditional'?{show_brightness_control:c.input.hasControls}:{})});document.body.append(el);await el.updateComplete;
    const sizes:any={cardSize:await el.getCardSize(),grid:el.getGridOptions()};if(c.kind==='traditional')sizes.legacy=el.getLayoutOptions();pair.push(sizes);el.remove();
   }results.push(pair);}return results;
  },group);
  for(let i=0;i<group.length;i++){
   const c=group[i];expect(results[i][1]).toEqual(results[i][0]);
   const expected=c.kind==='traditional'?c.expected:templateSizing(c.input.config,true);
   expect(results[i][0]).toEqual(expected);checked++;
  }
 }
 expect(checked).toBe(128);
 await writeFile('ha-evidence/sizing.json',JSON.stringify({caseCount:128,sourceOracle:'passed',originalVsFork:'passed',runtimeOracle:'passed',versionBranch:'HA >= 2026.9. Pre-2026.9 oracle fixtures validated statically; runtime uses true branch.'},null,2));
});

test('direct Sections placements obey 6/12 columns and 1/2/auto rows',async({page})=>{
 await page.goto('/lovelace/grid-sizing');
 const metrics=[];
 for(const prefix of ['mushroom-','island-']){
  const els=page.locator(`${prefix}entity-card`);await expect(els).toHaveCount(3);
  const boxes=[];for(let i=0;i<3;i++){await expect(els.nth(i)).toBeVisible();boxes.push(await els.nth(i).boundingBox());}
  expect(boxes[1]!.height).toBeGreaterThan(boxes[0]!.height);
  expect(boxes[2]!.width).toBeGreaterThan(boxes[0]!.width*1.5);
  expect(boxes[2]!.height).toBeGreaterThan(0);
  metrics.push(boxes.map(b=>({width:b!.width,height:b!.height})));
 }
 for(let i=0;i<3;i++){expect(Math.abs(metrics[0][i].width-metrics[1][i].width)).toBeLessThanOrEqual(1);if(i<2)expect(Math.abs(metrics[0][i].height-metrics[1][i].height)).toBeLessThanOrEqual(1);}
 await page.screenshot({path:'ha-evidence/direct-sections-grid.png',fullPage:true});
});
test('native hold and double-tap open more-info',async({page})=>{
 for(const prefix of ['mushroom-','island-'])for(const action of ['hold','double']){
  const card=page.locator(`${prefix}entity-card`).first();
  await card.evaluate((el:any)=>el.setConfig({type:`custom:${el.localName}`,entity:'sensor.parity',tap_action:{action:'none'},hold_action:{action:'more-info'},double_tap_action:{action:'more-info'}}));
  if(action==='double')await card.dblclick();else{await card.hover();await page.mouse.down();await page.waitForTimeout(700);await page.mouse.up();}
  await expect(page.locator('ha-more-info-dialog ha-dialog dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('ha-more-info-dialog ha-dialog dialog')).not.toBeVisible();
 }
});
test('unavailable light remains rendered without frontend exceptions',async({page,request})=>{
 // Reset in finally even if the state assertion fails.
 try{
  const r=await request.post('/api/states/light.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{...states['light.parity'],state:'unavailable'}});expect(r.ok()).toBeTruthy();
  const labels=[];for(const prefix of ['mushroom-','island-']){const card=page.locator(`${prefix}light-card`).first();await expect.poll(()=>card.evaluate((el:any)=>el.hass.states['light.parity'].state)).toBe('unavailable');await expect(card).toBeVisible();const label=await card.locator(`${prefix}state-info .secondary`).textContent();expect(label?.trim().length).toBeGreaterThan(0);labels.push(label?.trim());}expect(labels[1]).toEqual(labels[0]);
  await expect(page.locator('hui-error-card')).toHaveCount(0);
 }finally{await request.post('/api/states/light.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:states['light.parity']});}
});

test('native dark theme propagates to modern Template and Badge',async({page})=>{
 const observations:any={};
 for(const colorScheme of ['dark','light'] as const){
  await page.emulateMedia({colorScheme});
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('home-assistant') as any).hass.themes.darkMode)).toBe(colorScheme==='dark');
  observations[colorScheme]={};
  for(const suffix of ['template-card','template-badge']){
   const el=page.locator('island-'+suffix).first();
   await expect(el).toHaveAttribute('data-island-theme',colorScheme);
   observations[colorScheme][suffix]=await el.evaluate(collectStyles);
  }
 }
 await writeFile('ha-evidence/theme-diagnostics.json',JSON.stringify(observations,null,2));
});

test('Template Badge and all 11 chip editors accept their actual fixture configs',async({page})=>{
 const rows=await page.evaluate(async({chips,badge})=>{
  const hass=(document.querySelector('home-assistant') as any).hass;const rows=[];
  for(const prefix of ['mushroom-','island-'])for(const item of [{tag:'template-badge',config:{type:`custom:${prefix}template-badge`,...badge.config}},...chips.map(c=>({tag:`${c.type}-chip`,config:c}))]){
   const ctor:any=customElements.get(prefix+item.tag);const editor=await ctor.getConfigElement();editor.hass=hass;editor.setConfig(item.config);document.body.append(editor);await editor.updateComplete;
   rows.push({tag:prefix+item.tag,editorTag:editor.localName,rendered:Boolean(editor.shadowRoot?.childElementCount)});editor.remove();
  }return rows;
 },{chips,badge});
 expect(rows).toHaveLength(24);for(const row of rows)expect(row.rendered,row.tag).toBe(true);
 await writeFile('ha-evidence/badge-chip-editors.json',JSON.stringify(rows,null,2));
});
test('conditional chips respond to actual backend state visibility changes',async({page,request})=>{
 for(const value of ['22','21']){
  const r=await request.post('/api/states/sensor.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{...states['sensor.parity'],state:value}});expect(r.ok()).toBeTruthy();
  for(const prefix of ['mushroom-','island-']){
   const inner=page.locator(`${prefix}conditional-chip ${prefix}entity-chip`).first();
   if(value==='21')await expect(inner).toBeVisible();else await expect(inner).not.toBeVisible();
  }
 }
});
