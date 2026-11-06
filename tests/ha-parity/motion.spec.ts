/* eslint-disable @typescript-eslint/no-explicit-any -- Actual HA element and WebSocket interfaces are runtime APIs. */
import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {disabledMotionState} from '../../scripts/ha-parity/motion-fixtures.mjs';
let auth:any;
let runtimeErrors=0;
test.beforeEach(()=>{runtimeErrors=0;});
test.afterEach(async({page},info)=>{
 if(info.status!==info.expectedStatus&&page.url().startsWith('http://127.0.0.1:8123/lovelace/motion')){
  await mkdir('ha-evidence/motion-failures',{recursive:true});const name=info.title.replace(/[^a-z0-9]+/gi,'-').slice(0,100);
  await page.screenshot({path:`ha-evidence/motion-failures/${name}.png`,fullPage:true});
  const hits=await page.evaluate(()=>({pointer:(window as any).__motionPointerHits||[],visual:(window as any).__motionVisualEvents||[]}));
  await writeFile(`ha-evidence/motion-failures/${name}.json`,JSON.stringify({runtimeErrors,pointerHits:hits},null,2));
 }
 expect(runtimeErrors,'No uncaught frontend errors in motion scenarios').toBe(0);
});
test.beforeAll(async()=>{auth=JSON.parse(await readFile('.ha-secrets/auth.json','utf8'));});
async function reset(request:APIRequestContext){
 const headers={Authorization:`Bearer ${auth.access_token}`};
 for(const [path,data] of [['/api/services/input_boolean/turn_off',{entity_id:'input_boolean.parity'}],['/api/services/input_number/set_value',{entity_id:'input_number.parity_motion',value:30}],['/api/states/number.motion_disabled',disabledMotionState]] as const){const r=await request.post(path,{headers,data});expect(r.ok()).toBeTruthy();}
}
async function open(page:Page){
 page.on('pageerror',()=>{runtimeErrors++;});
 await page.addInitScript(value=>{
  localStorage.setItem('hassTokens',JSON.stringify(value));(window as any).__motionPointerHits=[];(window as any).__motionBlurCount=0;window.addEventListener('blur',()=>{(window as any).__motionBlurCount++;});
  document.addEventListener('pointerdown',event=>{(window as any).__motionPointerHits.push({x:event.clientX,y:event.clientY,primary:event.isPrimary,button:event.button,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,path:event.composedPath().filter(n=>n instanceof Element).map(n=>({tag:(n as Element).localName,disabled:Boolean((n as HTMLButtonElement).disabled),disabledType:typeof (n as HTMLButtonElement).disabled,disabledAttr:(n as Element).hasAttribute('disabled'),ariaDisabled:(n as Element).getAttribute('aria-disabled'),inert:(n as Element).hasAttribute('inert')}))});},{capture:true,passive:true});
 },auth);
 await page.goto('/lovelace/motion');
 await expect(page.locator('island-number-card').first()).toBeVisible();
 await expect(page.locator('island-action-chip')).toBeVisible();
 expect(page.url()).toContain('/lovelace/motion');
 await page.evaluate(async()=>{const hass=(document.querySelector('home-assistant') as any).hass;(window as any).__motionServices=[];(window as any).__motionUnsubscribe=await hass.connection.subscribeEvents((event:any)=>{if(['input_boolean','input_number'].includes(event.data.domain))(window as any).__motionServices.push({domain:event.data.domain,service:event.data.service,data:event.data.service_data});},'call_service');});
}
const serviceCount=(page:Page)=>page.evaluate(()=>(window as any).__motionServices.length);
const numberState=(page:Page)=>page.evaluate(()=>Number((document.querySelector('home-assistant') as any).hass.states['input_number.parity_motion'].state));
async function clearEvents(page:Page){await page.evaluate(()=>(window as any).__motionServices=[]);}
async function settleOne(page:Page){await expect.poll(()=>serviceCount(page)).toBe(1);await page.waitForTimeout(400);expect(await serviceCount(page)).toBe(1);}
const button=(page:Page,prefix='island-')=>page.locator(`${prefix}number-card`).nth(1).locator(`${prefix}input-number button.plus`);
const chipSurface=(page:Page)=>page.locator('island-action-chip island-chip ha-card');

test('motion preserves one service per pointer, keyboard and real touch activation',async({page,browser,request})=>{
 await reset(request);await open(page);
 for(const prefix of ['mushroom-','island-']){
  await clearEvents(page);const chip=page.locator(`${prefix}action-chip`);await chip.click();await settleOne(page);
  await clearEvents(page);const plus=button(page,prefix);const before=await numberState(page);await plus.focus();await expect(plus).toBeFocused();await page.keyboard.press('Enter');await expect.poll(()=>numberState(page)).toBe(before+1);await settleOne(page);
 }
 const edgeEvidence=[];
 for(const prefix of ['mushroom-','island-'])for(const side of ['left','right']){
  const plus=button(page,prefix);await plus.hover();const box=(await plus.boundingBox())!;const x=side==='left'?box.x+.3:box.x+box.width-.3;const y=box.y+box.height/2;
  await clearEvents(page);const before=await numberState(page);await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(170);
  const pressedBox=(await plus.boundingBox())!;expect(pressedBox).toEqual(box);
  if(prefix==='island-'){await expect(plus).toHaveAttribute('data-island-pressed','');expect(await plus.locator('ha-icon').evaluate(el=>parseFloat(getComputedStyle(el).scale))).toBeCloseTo(.96,2);}
  await page.mouse.up();await expect.poll(()=>numberState(page)).toBe(before+1);await settleOne(page);edgeEvidence.push({prefix,side,before,after:await numberState(page),serviceCount:await serviceCount(page),fixedHitBox:true});
 }
 await writeFile('ha-evidence/motion-edge-services.json',JSON.stringify(edgeEvidence,null,2));
 const touch=await browser.newContext({hasTouch:true,viewport:{width:900,height:760}});const touchPage=await touch.newPage();
 try{await open(touchPage);await touchPage.locator('island-action-chip').tap();await settleOne(touchPage);}finally{await touch.close();}
});

test('motion pointer origin, disabled, reduced-motion and disconnect cleanup',async({page,request})=>{
 await reset(request);await open(page);const surface=chipSurface(page);await surface.hover();await expect(surface).toBeInViewport();const box=(await surface.boundingBox())!;
 await surface.evaluate(el=>{
  (window as any).__motionVisualEvents=[];
  new MutationObserver(records=>{for(const r of records)(window as any).__motionVisualEvents.push({type:'pressed-mutation',old:r.oldValue,current:el.getAttribute('data-island-pressed')});}).observe(el,{attributes:true,attributeFilter:['data-island-pressed'],attributeOldValue:true});
  for(const type of ['focusout','blur','pointercancel'])window.addEventListener(type,event=>(window as any).__motionVisualEvents.push({type,target:(event.target as Element)?.localName}),{capture:true});
 });
 await page.mouse.move(box.x+8,box.y+10);await page.mouse.down();
 await expect(surface).toHaveAttribute('data-island-pressed','');
 const wave=surface.locator('.island-motion-ripple > span');await expect(wave).toHaveCount(1);
 const center=await wave.evaluate(el=>({x:parseFloat((el as HTMLElement).style.left)+parseFloat((el as HTMLElement).style.width)/2,y:parseFloat((el as HTMLElement).style.top)+parseFloat((el as HTMLElement).style.height)/2}));
 expect(Math.abs(center.x-8)).toBeLessThan(2);expect(Math.abs(center.y-10)).toBeLessThan(2);
 await page.waitForTimeout(170);expect(await surface.locator('.content').evaluate(el=>parseFloat(getComputedStyle(el).scale))).toBeCloseTo(.96,2);expect(await surface.boundingBox()).toEqual(box);
 await writeFile('ha-evidence/motion-pointer-origin.json',JSON.stringify({contentScale:await surface.locator('.content').evaluate(el=>getComputedStyle(el).scale),surfaceBox:await surface.boundingBox(),rippleOrigin:center,pointerHits:await page.evaluate(()=>(window as any).__motionPointerHits)},null,2));
 await page.mouse.up();await expect(surface.locator('.island-motion-ripple')).toHaveCount(0);await expect(surface).not.toHaveAttribute('data-island-pressed','');await settleOne(page);
 const disabled=page.locator('island-number-card').nth(2).locator('island-input-number button.plus');await expect(disabled).toBeDisabled();await clearEvents(page);
 const db=(await disabled.boundingBox())!;await page.mouse.click(db.x+db.width/2,db.y+db.height/2);await expect(disabled.locator('.island-motion-ripple')).toHaveCount(0);expect(await serviceCount(page)).toBe(0);
 await clearEvents(page);await page.emulateMedia({reducedMotion:'reduce'});await surface.click();await expect(surface.locator('.island-motion-ripple')).toHaveCount(0);expect(await surface.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);await settleOne(page);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await surface.hover();await page.mouse.down();await expect(surface).toHaveAttribute('data-island-pressed','');
 const clean=await page.locator('island-action-chip island-chip').evaluate((host:any)=>{const el=host.shadowRoot.querySelector('ha-card');(window as any).__removedMotion={host,parent:host.parentNode,next:host.nextSibling};host.remove();return {ripples:el.querySelectorAll('.island-motion-ripple').length,pressed:el.hasAttribute('data-island-pressed'),animations:el.getAnimations({subtree:true}).length};});
 expect(clean).toEqual({ripples:0,pressed:false,animations:0});await page.mouse.up();
 await page.evaluate(()=>{const {host,parent,next}=(window as any).__removedMotion;parent.insertBefore(host,next);});
 await clearEvents(page);await surface.click();await settleOne(page);
 const plus=button(page);const minus=page.locator('island-number-card').nth(1).locator('island-input-number button.minus');
 await clearEvents(page);const beforeFocusChange=await numberState(page);await minus.focus();await expect(minus).toBeFocused();await plus.hover();await page.mouse.down();await expect(plus).toHaveAttribute('data-island-pressed','');await page.waitForTimeout(170);await expect(plus).toHaveAttribute('data-island-pressed','');await page.mouse.up();await expect.poll(()=>numberState(page)).toBe(beforeFocusChange+1);await settleOne(page);
 await plus.focus();await page.keyboard.down(' ');await expect(plus).toHaveAttribute('data-island-pressed','');
 // A real focus change between browser tabs dispatches window blur; no synthetic key/click is sent.
 const blurBefore=await page.evaluate(()=>(window as any).__motionBlurCount);const other=await page.context().newPage();await other.goto('about:blank');await other.bringToFront();
 const blurFacts=await page.evaluate(()=>({events:(window as any).__motionBlurCount,hasFocus:document.hasFocus()}));await writeFile('ha-evidence/motion-window-blur.json',JSON.stringify({...blurFacts,eventsBefore:blurBefore},null,2));expect(blurFacts.events,'Browser must produce actual window blur before checking cleanup').toBeGreaterThan(blurBefore);expect(blurFacts.hasFocus).toBe(false);
 await expect(plus).not.toHaveAttribute('data-island-pressed','');expect(await plus.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
 await other.close();await page.bringToFront();await page.keyboard.up(' ');
});

test('motion slider live label and fill match drag, commits exactly once on release',async({page,request})=>{
 await reset(request);await open(page);const card=page.locator('island-number-card').first();const slider=card.locator('island-slider');const target=slider.locator('#slider');await target.hover();await expect(target).toBeInViewport();await expect.poll(()=>slider.evaluate((el:any)=>Boolean(el._mc))).toBe(true);const box=(await target.boundingBox())!;
 await page.mouse.move(box.x+box.width*.3,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height/2,{steps:12});
 await expect.poll(()=>slider.evaluate((el:any)=>el.controlled)).toBe(true);
 // Observe the source component's actual values, not a generated display approximation.
 const value=await slider.evaluate((el:any)=>el.value);const label=await card.evaluate((el:any)=>el.value);
 expect(Math.abs(label-Math.round(value))).toBeLessThanOrEqual(1);expect(label).toBeGreaterThan(50);expect(await numberState(page)).toBe(30);
 const fraction=await target.evaluate(el=>parseFloat((el as HTMLElement).style.getPropertyValue('--value')));expect(Math.abs(fraction-value/100)).toBeLessThan(.01);
 expect(await serviceCount(page)).toBe(0);await page.mouse.up();await expect.poll(()=>numberState(page)).toBe(Math.round(value));await settleOne(page);
 await writeFile('ha-evidence/motion-slider.json',JSON.stringify({observedLabel:label,observedSliderValue:value,observedFillFraction:fraction,committedValue:await numberState(page)},null,2));
});

test('record authenticated real HA motion demonstration',async({browser,request})=>{
 await reset(request);
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:'.ha-motion-video',size:{width:1280,height:720}}});
 const start=Date.now();const page=await context.newPage();let prohibitedNavigation=false;
 page.on('framenavigated',frame=>{if(frame===page.mainFrame()&&frame.url()!=='about:blank'&&!frame.url().startsWith('http://127.0.0.1:8123/lovelace/motion'))prohibitedNavigation=true;});
 try{
  await open(page);await page.locator('island-action-chip').scrollIntoViewIfNeeded();
  const trimStart=Math.ceil((Date.now()-start)/1000)+1;
  await page.waitForTimeout(Math.max(0,trimStart*1000-(Date.now()-start))+750);
  const surface=chipSurface(page);await surface.hover();await page.mouse.down();await page.waitForTimeout(180);await page.mouse.up();await page.waitForTimeout(900);
  await button(page).focus();await page.keyboard.down('Enter');await page.waitForTimeout(170);await page.keyboard.up('Enter');await page.waitForTimeout(2400);
  const slider=page.locator('island-number-card').first().locator('island-slider #slider');const box=(await slider.boundingBox())!;
  await page.mouse.move(box.x+box.width*.31,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.76,box.y+box.height/2,{steps:25});await page.waitForTimeout(200);await page.mouse.up();await page.waitForTimeout(1100);
  await clearEvents(page);await page.emulateMedia({reducedMotion:'reduce'});await surface.click();await page.waitForTimeout(1000);
  expect(prohibitedNavigation,'Recording must remain on authenticated synthetic dashboard').toBe(false);expect(page.url()).toContain('/lovelace/motion');
  const duration=(Date.now()-start)/1000-trimStart;
  const video=page.video()!;await context.close();const input=await video.path();
  const {finalizeMotionVideo}=await import('../../scripts/ha-parity/finalize-motion-video.mjs');await finalizeMotionVideo(input,trimStart,duration);
 }finally{await context.close();}
});
