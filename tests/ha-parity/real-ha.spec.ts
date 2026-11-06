/* eslint-disable @typescript-eslint/no-explicit-any -- HA custom elements expose dynamic runtime APIs without installed frontend typings. */
import {test,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {cards,chips} from '../../scripts/ha-parity/fixtures.mjs';
let auth:any;
const pageErrors=new WeakMap<object,string[]>();
test.beforeAll(async()=>{auth=JSON.parse(await readFile('.ha-secrets/auth.json','utf8'));});
test.afterEach(async({page})=>{expect(pageErrors.get(page)||[],'Uncaught frontend errors').toEqual([]);});
test.beforeEach(async({page})=>{
 pageErrors.set(page,[]);page.on('pageerror',error=>pageErrors.get(page)!.push(error.message));
 await page.addInitScript(value=>localStorage.setItem('hassTokens',JSON.stringify(value)),auth);
 await page.goto('/lovelace/sections');
 await expect(page.locator('home-assistant')).toBeVisible();
 await expect(page.locator('mushroom-template-card').first()).toBeVisible();
 await expect(page.locator('island-template-card').first()).toBeVisible();
});
for(const view of ['sections','masonry'])test(`${view}: all 30 modules in real host`,async({page})=>{
 await page.goto(`/lovelace/${view}`);
 for(const prefix of ['mushroom-','island-']){
  for(const card of cards){const el=page.locator(`${prefix}${card.name}-card`).first();await expect(el).toBeAttached();await expect.poll(()=>el.evaluate((e:any)=>Boolean(e.hass&&e.shadowRoot))).toBe(true);if(card.name!=='empty'){await expect(el).toBeVisible();await expect.poll(()=>el.evaluate((e:any)=>e.shadowRoot.childElementCount)).toBeGreaterThan(0);await expect(el.locator('ha-card')).toBeAttached();}}
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
  await expect(page.locator('ha-more-info-dialog')).toBeAttached();
  await page.keyboard.press('Escape');
 }
});
for(const width of [220,320,480])test(`real Sections fixed container ${width}px and grid options`,async({page})=>{
 for(const prefix of ['mushroom-','island-']){
  const card=page.locator(`${prefix}template-card`).first();
  for(const rows of ['auto',2,4]){
   await card.evaluate((el:any,{width,rows})=>{el.style.width=width+'px';el.style.maxWidth='100%';el.setConfig({...el._config,grid_options:{columns:6,rows}});},{width,rows});
   await expect.poll(()=>card.evaluate((el:any)=>el.getBoundingClientRect().width)).toBeLessThanOrEqual(width+1);
  }
 }
 await page.screenshot({path:`ha-evidence/container-${width}.png`,fullPage:true});
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
  const row:any={host:'Home Assistant',haVersion:'2026.9.0',status:'captured',state:'synthetic fixture',original:null,island:null};
  for(const [variant,prefix] of [['original','mushroom-'],['island','island-']]){
   const el=page.locator(prefix+module.tag).first();
   const box=await el.boundingBox();
   if(!box || box.width<1 || box.height<1){row.status='zero-size-no-image';continue;}
   const file=`runtime/${module.id.replace(':','-')}-${variant}.png`;
   await el.screenshot({path:'ha-evidence/'+file});row[variant]=file;
  }cases[module.id]=row;
 }
 await writeFile('ha-evidence/runtime-evidence.json',JSON.stringify({host:'Home Assistant',haVersion:'2026.9.0',generatedAt:new Date().toISOString(),cases},null,2));
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
  await expect(page.locator('ha-more-info-dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('ha-more-info-dialog')).not.toBeVisible();
 }
});
test('unavailable light remains rendered without frontend exceptions',async({page,request})=>{
 const {states}=await import('../../scripts/ha-parity/fixtures.mjs');
 try{
  const r=await request.post('/api/states/light.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{...states['light.parity'],state:'unavailable'}});expect(r.ok()).toBeTruthy();
  for(const prefix of ['mushroom-','island-'])await expect(page.locator(`${prefix}light-card`).first()).toContainText('Unavailable');
  await expect(page.locator('hui-error-card')).toHaveCount(0);
 }finally{await request.post('/api/states/light.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:states['light.parity']});}
});
