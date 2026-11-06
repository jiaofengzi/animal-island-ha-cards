import {test,expect} from '@playwright/test';
import type {Config,Hass} from '../../src/types';
type Card=HTMLElement&{hass:Hass;setConfig:(c:Config)=>void};
test.beforeEach(async({page})=>{await page.goto('/?qa=1');});
test('focused but clean number and select use new hass values',async({page})=>{
 const slider=page.locator('island-number-card input');await slider.focus();
 await page.evaluate(()=>{const card=document.querySelector('island-number-card') as Card;const id='number.demo_portion';card.hass={...card.hass,states:{...card.hass.states,[id]:{...card.hass.states[id]!,state:'4'}}};});
 await expect(slider).toHaveValue('4');await expect(slider).toBeFocused();
 const select=page.locator('island-select-card').getByRole('combobox');await select.focus();
 await page.evaluate(()=>{const card=document.querySelector('island-select-card') as Card;const id='select.demo_program';card.hass={...card.hass,states:{...card.hass.states,[id]:{...card.hass.states[id]!,state:'normal'}}};});
 await expect(select).toContainText('标准');await expect(select).toBeFocused();
});
test('delayed service returns keyboard focus and prevents duplicate calls',async({page})=>{
 await page.evaluate(()=>{const card=document.querySelector('island-number-card') as Card;card.hass={...card.hass,callService:()=>{document.body.dataset.calls=String(Number(document.body.dataset.calls??0)+1);return new Promise(resolve=>{(window as unknown as {finish:()=>void}).finish=()=>resolve({});});}};});
 const slider=page.locator('island-number-card input'),trigger=page.locator('island-number-card').getByRole('button',{name:'提高数值'});await trigger.focus();await trigger.press('Enter');await expect(slider).toBeDisabled();
 await slider.dispatchEvent('change');
 await expect(page.locator('body')).toHaveAttribute('data-calls','1');
 await page.evaluate(()=>(window as unknown as {finish:()=>void}).finish());await expect(slider).toBeEnabled();await expect(trigger).toBeFocused();
});
test('cancel confirmation restores the triggering control',async({page})=>{const trigger=page.locator('island-cover-card').getByRole('button',{name:'关闭',exact:true});await trigger.focus();await trigger.press('Enter');await page.locator('island-cover-card').getByRole('button',{name:'取消',exact:true}).click();await expect(trigger).toBeFocused();});
test('chips restore camera cancellation and delayed whole-row service focus',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-chips-card') as Card;c.setConfig({type:'custom:island-chips-card',entities:[{entity:'camera.demo_view',name:'影像'}],tap_action:{action:'perform-action',perform_action:'light.turn_on',target:{entity_id:'light.demo_lantern'}}});c.hass={...c.hass,callService:()=>new Promise(resolve=>{(window as unknown as {finish:()=>void}).finish=()=>resolve({});})};});
 const card=page.locator('island-chips-card'),button=card.getByRole('button',{name:/影像/});await button.focus();await button.press('Enter');await card.getByRole('button',{name:'取消',exact:true}).click();await expect(button).toBeFocused();
 const row=card.getByRole('group');await row.focus();await row.press('Enter');await expect(card).toContainText('正在发送');await page.evaluate(()=>(window as unknown as {finish:()=>void}).finish());await expect(row).toBeFocused();await expect(card).toContainText('请求已发送');
});
test('a power label change during a pending operation preserves its stable focus target',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;c.hass={...c.hass,callService:()=>new Promise(resolve=>{(window as unknown as {finish:()=>void}).finish=()=>resolve({});})};});
 const card=page.locator('island-light-card');await card.getByRole('switch',{name:'关闭',exact:true}).focus();await card.getByRole('switch',{name:'关闭',exact:true}).press('Enter');
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;const id='light.demo_lantern';c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id]!,state:'off'}}};});
 await page.evaluate(()=>(window as unknown as {finish:()=>void}).finish());await expect(card.getByRole('switch',{name:'开启',exact:true})).toBeFocused();
});

test('pointer activation of an upstream chip never triggers the configured whole-row service',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-chips-card') as Card;document.body.dataset.serviceCount='0';document.body.dataset.infoCount='0';c.addEventListener('hass-more-info',()=>{document.body.dataset.infoCount=String(Number(document.body.dataset.infoCount)+1);});c.setConfig({type:'custom:island-chips-card',entities:[{entity:'light.demo_lantern',name:'灯光详情'}],tap_action:{action:'perform-action',perform_action:'light.turn_on',target:{entity_id:'light.demo_lantern'}}});c.hass={...c.hass,callService:async()=>{document.body.dataset.serviceCount=String(Number(document.body.dataset.serviceCount)+1);}};});
 await page.locator('island-chips-card').getByRole('button',{name:/灯光详情/}).click();
 await expect(page.locator('body')).toHaveAttribute('data-info-count','1');await expect(page.locator('body')).toHaveAttribute('data-service-count','0');
 const row=page.locator('island-chips-card').getByRole('group');await row.focus();await row.press('Enter');await expect(page.locator('body')).toHaveAttribute('data-service-count','1');
 await page.evaluate(()=>{const c=document.querySelector('island-chips-card') as Card;c.setConfig({type:'custom:island-chips-card',entities:[{entity:'light.missing',name:'不可用条目'}],tap_action:{action:'perform-action',perform_action:'light.turn_on',target:{entity_id:'light.demo_lantern'}}});});
 const disabled=page.locator('island-chips-card').getByText('不可用条目',{exact:true});await disabled.scrollIntoViewIfNeeded();const bounds=await disabled.boundingBox();expect(bounds).not.toBeNull();await page.mouse.click(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2);await expect(page.locator('body')).toHaveAttribute('data-service-count','1');
});
