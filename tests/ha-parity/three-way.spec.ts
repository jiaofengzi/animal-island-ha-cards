/* eslint-disable @typescript-eslint/no-explicit-any -- Real HA exposes custom element APIs. */
import {test,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {states,HA_VERSION} from '../../scripts/ha-parity/fixtures.mjs';
import {modules,variants,expectedBlank} from '../../scripts/ha-parity/three-way-fixtures.mjs';
const sha=(value:any)=>createHash('sha256').update(value).digest('hex');
test('three-way authenticated HA evidence: 30 modules, 3 versions, 2 viewports',async({page,request})=>{
 test.setTimeout(300000);
 const auth=JSON.parse(await readFile('.ha-secrets/auth.json','utf8'));
 const provenance=JSON.parse(await readFile('_parity/three-way-provenance.json','utf8'));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.name));
 await page.addInitScript(value=>{localStorage.setItem('hassTokens',JSON.stringify(value));(window as any).__threeWayRejections=0;window.addEventListener('unhandledrejection',()=>{(window as any).__threeWayRejections++;});},auth);
 await mkdir('ha-evidence/three-way/images',{recursive:true});
 const context:{stage:string;module:string|null;variant:string|null;viewport:string|null;scenario:string|null}={stage:'verify served bundles',module:null,variant:null,viewport:null,scenario:null};
 const captures:any[]=[];const scenarios:any[]=[];
 try {
 for(const a of Object.values(provenance.artifacts) as any[]){const r=await request.get('/local/'+a.file);expect(r.ok()).toBeTruthy();expect(sha(await r.body())).toBe(a.sha256);}
 context.stage='verify served fonts';
 for(const [file,hash] of Object.entries(provenance.fonts)){const r=await request.get('/local/fonts/'+file);expect(r.ok()).toBeTruthy();expect(sha(await r.body())).toBe(hash);}
 for(const viewport of [{id:'desktop',width:1440,height:1000},{id:'mobile',width:390,height:844}]){
  context.viewport=viewport.id;
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  for(const variant of variants){
   Object.assign(context,{stage:'seed live fixture',variant:variant.id,module:null,scenario:null});
   for(const [id,state] of Object.entries(states)){const r=await request.post(`/api/states/${id}`,{headers:{Authorization:`Bearer ${auth.access_token}`},data:state});expect(r.ok()).toBeTruthy();}
   context.stage='load HA view';
   await page.goto(`/lovelace/three-way-${variant.id}`);
   await expect(page.locator(variant.prefix+'light-card').first()).toBeVisible();
   await expect.poll(()=>page.evaluate(()=>(document.querySelector('home-assistant') as any).hass.connected)).toBe(true);
   for(const [id,state] of Object.entries(states))await expect.poll(()=>page.evaluate(id=>{const s=(document.querySelector('home-assistant') as any).hass.states[id];return s?{state:s.state,attributes:s.attributes}:null;},id)).toMatchObject(state);
   const haVersion=await page.evaluate(()=>(document.querySelector('home-assistant') as any).hass.config.version);expect(haVersion).toBe(HA_VERSION);
   context.stage='wait for live templates';
   for(const suffix of ['template-badge','template-card','template-chip']){
    context.module=suffix;
    await expect(page.locator(variant.prefix+suffix).first()).toContainText('21');
   }
   Object.assign(context,{stage:'wait for fonts',module:null});
   await expect.poll(()=>page.evaluate(()=>Array.from(document.fonts).filter(f=>f.family.includes('Island Rounded')).length)).toBe(3);
   await page.evaluate(async()=>{await document.fonts.ready;for(const weight of [500,700,900])await document.fonts.load(`${weight} 16px "Island Rounded"`,'小岛');await document.fonts.load('700 16px "Island Nunito"','Island 21');});
   const fonts=await page.evaluate(()=>({status:document.fonts.status,faces:Array.from(document.fonts).map(f=>({family:f.family,status:f.status,weight:f.weight}))}));
   expect(fonts.status).toBe('loaded');expect(fonts.faces.filter(f=>f.family.includes('Island Rounded')&&f.status==='loaded')).toHaveLength(3);expect(fonts.faces.some(f=>f.family.includes('Island Nunito')&&f.status==='loaded')).toBe(true);
   for(const module of modules){
    Object.assign(context,{stage:'capture module',module:module.id});
    let el=page.locator(variant.prefix+module.tag).first();
    if(module.id.startsWith('chip:'))el=page.locator(variant.prefix+'chips-card').first().locator('.chip-container > '+variant.prefix+module.tag).first();
    await expect(el).toBeAttached();
    if(module.id==='chip:conditional')el=el.locator(variant.prefix+'entity-chip').first();
    if(!expectedBlank(module.id))await expect(el).toBeVisible();
    const box=await el.boundingBox();
    const container=module.id.startsWith('chip:')?page.locator(variant.prefix+'chips-card').first():el;
    const containerWidth=await container.evaluate((e:any)=>{let p=e.parentElement||(e.getRootNode() as ShadowRoot).host;while(p){const width=p.getBoundingClientRect().width;if(width>0)return width;p=p.parentElement||(p.getRootNode() as ShadowRoot).host;}return 0;});
    expect(containerWidth).toBeGreaterThan(0);
    const runtime=await el.evaluate((e:any)=>({hasHass:!!(e.hass||e._hass),font:getComputedStyle(e).fontFamily,config:e._config||e.config||null}));
    let image=null,imageSha256=null;
    if(!expectedBlank(module.id)){expect(box!.width).toBeGreaterThan(0);expect(box!.height).toBeGreaterThan(0);image=`images/${module.id.replace(':','-')}-${variant.id}-${viewport.id}.png`;await el.screenshot({path:`ha-evidence/three-way/${image}`,animations:'disabled'});imageSha256=sha(await readFile(`ha-evidence/three-way/${image}`));}
    captures.push({module:module.id,variant:variant.id,viewport:viewport.id,status:expectedBlank(module.id)?'expected-blank':'captured',image,imageSha256,box,containerWidth,runtime,fixture:module.config,fixtureStatesSha256:sha(JSON.stringify(states)),fonts,haVersion});
   }
   // Live backend scenarios are captured independently; identical states for all three implementations.
   for(const state of ['off','on','unavailable']){
    Object.assign(context,{stage:'capture light scenario',module:'card:light',scenario:state});
    const r=await request.post('/api/states/light.parity',{headers:{Authorization:`Bearer ${auth.access_token}`},data:{...states['light.parity'],state}});expect(r.ok()).toBeTruthy();
    const el=page.locator(variant.prefix+'light-card').first();await expect.poll(()=>el.evaluate((e:any)=>e.hass.states['light.parity'].state)).toBe(state);
    const image=`images/scenario-light-${state}-${variant.id}-${viewport.id}.png`;await el.screenshot({path:`ha-evidence/three-way/${image}`,animations:'disabled'});
    scenarios.push({entity:'light.parity',state,variant:variant.id,viewport:viewport.id,image,imageSha256:sha(await readFile(`ha-evidence/three-way/${image}`))});
   }
   context.stage='check frontend health';
   await expect(page.locator('hui-error-card')).toHaveCount(0);
   expect(await page.evaluate(()=>(window as any).__threeWayRejections)).toBe(0);expect(errors).toEqual([]);
  }
 }
 Object.assign(context,{stage:'compare layout widths',scenario:null});
 for(const module of modules.filter(m=>m.id.startsWith('card:')))for(const viewport of ['desktop','mobile']){
  context.module=module.id;context.viewport=viewport;context.variant='all';
  const rows=captures.filter(r=>r.module===module.id&&r.viewport===viewport);
  expect(Math.max(...rows.map(r=>r.containerWidth))-Math.min(...rows.map(r=>r.containerWidth)),`${module.id} equal container widths`).toBeLessThanOrEqual(1);
  if(!expectedBlank(module.id))expect(Math.max(...rows.map(r=>r.box.width))-Math.min(...rows.map(r=>r.box.width)),`${module.id} equal card widths`).toBeLessThanOrEqual(1);
 }
 expect(captures).toHaveLength(180);expect(scenarios).toHaveLength(18);
 context.stage='write evidence';
 await writeFile('ha-evidence/three-way/evidence.json',JSON.stringify({schemaVersion:1,status:'captured',host:'authenticated Home Assistant',haVersion:HA_VERSION,generatedAt:new Date().toISOString(),provenance,fixtureStates:states,captures,scenarios,pageErrors:0,promiseRejections:0},null,2));
 } catch(error) {
  // Emit only allowlisted structural diagnostics: no tokens, HA config, HTML, text or state attributes.
  const renderer=await page.evaluate(()=>{
   const ha:any=document.querySelector('home-assistant');const elements:any[]=[];
   const walk=(root:Document|ShadowRoot|Element)=>{
    for(const el of root.children){
     if(/^(?:mushroom-|previous-island-|island-).*(?:card|chip|badge)$/.test(el.localName)||el.localName==='hui-error-card'){
      const b=el.getBoundingClientRect();const node:any=el;
      elements.push({tag:el.localName,connected:el.isConnected,shadowRoot:!!el.shadowRoot,shadowChildren:el.shadowRoot?.childElementCount||0,width:b.width,height:b.height,hasHass:!!(node.hass||node._hass)});
     }
     if(el.shadowRoot)walk(el.shadowRoot);walk(el);
    }
   };walk(document);
   return {connected:!!ha?.hass?.connected,viewport:{width:innerWidth,height:innerHeight},rejections:Number((window as any).__threeWayRejections||0),fontStatus:document.fonts.status,elements};
  }).catch(()=>({unavailable:true}));
  await writeFile('ha-evidence/three-way/failure.json',JSON.stringify({context,capturedModules:captures.length,capturedScenarios:scenarios.length,frontendErrorCount:errors.length,renderer},null,2));
  throw error;
 }
});
