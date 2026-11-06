/* eslint-disable @typescript-eslint/no-explicit-any -- Actual HA element and WebSocket interfaces are runtime APIs. */
import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {disabledMotionState} from '../../scripts/ha-parity/motion-fixtures.mjs';
let auth:any;
let runtimeErrors=0;
test.beforeEach(()=>{runtimeErrors=0;});
test.afterEach(()=>{expect(runtimeErrors,'No uncaught frontend errors in motion scenarios').toBe(0);});
test.beforeAll(async()=>{auth=JSON.parse(await readFile('.ha-secrets/auth.json','utf8'));});
async function reset(request:APIRequestContext){
 const headers={Authorization:`Bearer ${auth.access_token}`};
 for(const [path,data] of [['/api/services/input_boolean/turn_off',{entity_id:'input_boolean.parity'}],['/api/services/input_number/set_value',{entity_id:'input_number.parity_motion',value:30}],['/api/states/number.motion_disabled',disabledMotionState]] as const){const r=await request.post(path,{headers,data});expect(r.ok()).toBeTruthy();}
}
async function open(page:Page){
 page.on('pageerror',()=>{runtimeErrors++;});
 await page.addInitScript(value=>localStorage.setItem('hassTokens',JSON.stringify(value)),auth);
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
 const touch=await browser.newContext({hasTouch:true,viewport:{width:900,height:760}});const touchPage=await touch.newPage();
 try{await open(touchPage);await touchPage.locator('island-action-chip').tap();await settleOne(touchPage);}finally{await touch.close();}
});

test('motion pointer origin, disabled, reduced-motion and disconnect cleanup',async({page,request})=>{
 await reset(request);await open(page);const surface=chipSurface(page);const box=(await surface.boundingBox())!;
 await page.mouse.move(box.x+8,box.y+10);await page.mouse.down();
 await expect(surface).toHaveAttribute('data-island-pressed','');
 const wave=surface.locator('.island-motion-ripple > span');await expect(wave).toHaveCount(1);
 const center=await wave.evaluate(el=>({x:parseFloat((el as HTMLElement).style.left)+parseFloat((el as HTMLElement).style.width)/2,y:parseFloat((el as HTMLElement).style.top)+parseFloat((el as HTMLElement).style.height)/2}));
 expect(Math.abs(center.x-8)).toBeLessThan(2);expect(Math.abs(center.y-10)).toBeLessThan(2);
 await page.waitForTimeout(170);expect(await surface.evaluate(el=>parseFloat(getComputedStyle(el).scale))).toBeCloseTo(.96,2);
 await page.mouse.up();await expect(surface.locator('.island-motion-ripple')).toHaveCount(0);await expect(surface).not.toHaveAttribute('data-island-pressed','');
 const disabled=page.locator('island-number-card').nth(2).locator('island-input-number button.plus');await expect(disabled).toBeDisabled();await clearEvents(page);
 const db=(await disabled.boundingBox())!;await page.mouse.click(db.x+db.width/2,db.y+db.height/2);await expect(disabled.locator('.island-motion-ripple')).toHaveCount(0);expect(await serviceCount(page)).toBe(0);
 await clearEvents(page);await page.emulateMedia({reducedMotion:'reduce'});await surface.click();await expect(surface.locator('.island-motion-ripple')).toHaveCount(0);expect(await surface.evaluate(el=>el.getAnimations().length)).toBe(0);await settleOne(page);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await surface.hover();await page.mouse.down();await expect(surface).toHaveAttribute('data-island-pressed','');
 const clean=await page.locator('island-action-chip island-chip').evaluate((host:any)=>{const el=host.shadowRoot.querySelector('ha-card');(window as any).__removedMotion={host,parent:host.parentNode,next:host.nextSibling};host.remove();return {ripples:el.querySelectorAll('.island-motion-ripple').length,pressed:el.hasAttribute('data-island-pressed'),animations:el.getAnimations().length};});
 expect(clean).toEqual({ripples:0,pressed:false,animations:0});await page.mouse.up();
 await page.evaluate(()=>{const {host,parent,next}=(window as any).__removedMotion;parent.insertBefore(host,next);});
 await clearEvents(page);await surface.click();await settleOne(page);
});

test('motion slider live label and fill match drag, commits exactly once on release',async({page,request})=>{
 await reset(request);await open(page);const card=page.locator('island-number-card').first();const slider=card.locator('island-slider');const target=slider.locator('#slider');const box=(await target.boundingBox())!;
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
