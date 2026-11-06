import {chooseOption} from './helpers';
import {test,expect} from '@playwright/test';
const testBaseURL=`http://127.0.0.1:${process.env.ISLAND_TEST_PORT??4173}`;
import type {Config,Hass,DashboardAction} from '../../src/types';
type Card=HTMLElement&{hass:Hass;setConfig:(c:Config)=>void};
test.beforeEach(async({page})=>{await page.goto('/?qa=1');});
test('tap, double tap and released hold each trigger exactly one distinct action',async({page})=>{
 await page.evaluate(()=>{const card=document.querySelector('island-light-card') as Card;card.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',tap_action:{action:'perform-action',perform_action:'light.turn_on',data:{brightness:50}},double_tap_action:{action:'perform-action',perform_action:'light.turn_on',data:{brightness:200}},hold_action:{action:'more-info'}});});
 const title=page.locator('island-light-card h2');await title.click();await expect(page.locator('#calls')).toContainText('1 次');await expect(page.locator('#calls')).toContainText('"brightness":50');
 await title.dblclick();await expect(page.locator('#calls')).toContainText('2 次');await expect(page.locator('#calls')).toContainText('"brightness":200');
 await title.click({delay:650});await expect(page.locator('#calls')).toContainText('mock 实体详情');
 // Hold must not leave a deferred single-tap service behind.
 await page.waitForTimeout(350);await expect(page.locator('#calls')).toContainText('mock 实体详情');
});
test('sliders selects and child buttons never trigger configured card action',async({page})=>{
 await page.evaluate(()=>{const card=document.querySelector('island-climate-card') as Card;card.setConfig({type:'custom:island-climate-card',entity:'climate.demo_room',tap_action:{action:'perform-action',perform_action:'light.turn_on',target:{entity_id:'light.demo_lantern'}},hold_action:{action:'navigate',navigation_path:'/unexpected'}});});
 const card=page.locator('island-climate-card');await card.getByRole('button',{name:'提高目标温度'}).click();await expect(page.locator('#calls')).toContainText('climate.set_temperature');await card.getByRole('button',{name:'模式与设置'}).click();await chooseOption(card.getByRole('combobox',{name:'运行模式'}),'heat');await expect(page.locator('#calls')).toContainText('2 次');await card.getByRole('button',{name:'实体详情'}).first().click();await expect(page.locator('#calls')).toContainText('mock 实体详情');await expect(page).toHaveURL(`${testBaseURL}/?qa=1`);
});
test('multi-target and data use HA target argument, confirmation cannot be disabled',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',tap_action:{action:'perform-action',perform_action:'light.turn_on',target:{area_id:['demo_kitchen','demo_study'],device_id:'demo_device'},data:{brightness:100},confirmation:false}});});
 await page.locator('island-light-card h2').click();await expect(page.locator('#calls')).toContainText('0 次');await page.locator('island-light-card').getByRole('button',{name:'确认执行'}).click();await expect(page.locator('#calls')).toContainText('"area_id":["demo_kitchen","demo_study"]');await expect(page.locator('#calls')).toContainText('"brightness":100');
});
test('confirmation customization and keyboard alternatives',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',hold_action:{action:'navigate',navigation_path:'/held',confirmation:{text:'进入房间？',confirm_text:'进入',dismiss_text:'留下'}},double_tap_action:{action:'navigate',navigation_path:'/double'}});});
 const action=page.locator('island-light-card .island-card');await action.focus();await action.press('Shift+Enter');await expect(page.locator('island-light-card')).toContainText('进入房间？');await page.locator('island-light-card').getByRole('button',{name:'留下'}).click();await expect(action).toBeFocused();await action.press('Alt+Enter');await expect(page).toHaveURL(/\/double$/);
});
test('first scene and first feed execute from unknown only after confirmation',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-scene-card') as Card;const id='scene.demo_evening';c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id]!,state:'unknown'}}};});
 const scene=page.locator('island-scene-card');await expect(scene.getByRole('switch')).toHaveCount(0);await expect(scene.getByRole('button',{name:'执行场景',exact:true})).toBeEnabled();await scene.getByRole('button',{name:'执行场景'}).click();await expect(page.locator('#calls')).toContainText('0 次');await scene.getByRole('button',{name:'确认执行'}).click();await expect(page.locator('#calls')).toContainText('scene.turn_on');
 const feeder=page.locator('island-feeder-card');await feeder.getByRole('button',{name:'投喂 2 份'}).click();await expect(page.locator('#calls')).toContainText('1 次');await feeder.getByRole('button',{name:'确认执行'}).click();await expect(page.locator('#calls')).toContainText('2 次');await expect(page.locator('#calls')).toContainText('button.press');
});
test('RGB and Kelvin controls send exact valid values and obey capability changes',async({page})=>{
 const light=page.locator('island-light-card');await light.getByRole('button',{name:'光色与设置'}).click();await light.getByRole('button',{name:'颜色',exact:true}).click();await light.getByLabel('灯光颜色').evaluate((input:HTMLInputElement)=>{input.value='#ff0020';input.dispatchEvent(new Event('change',{bubbles:true}));});await expect(page.locator('#calls')).toContainText('"rgb_color":[255,0,32]');
 await light.getByRole('button',{name:'色温',exact:true}).click();await light.getByRole('slider',{name:'色温 K'}).focus();await light.getByRole('slider',{name:'色温 K'}).press('ArrowRight');await expect(page.locator('#calls')).toContainText('"color_temp_kelvin":3001');
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;const id='light.demo_lantern';c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id]!,attributes:{supported_color_modes:['onoff']}}}};});await expect(light.getByRole('slider')).toHaveCount(0);await expect(light.getByLabel('灯光颜色')).toHaveCount(0);
});
test('climate advanced controls preserve both bounds and use declared enums',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-climate-card') as Card;const id='climate.demo_room';c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id]!,state:'heat_cool',attributes:{supported_features:574,hvac_modes:['heat_cool'],target_temp_low:20,target_temp_high:26,min_temp:16,max_temp:32,target_temp_step:.5,humidity:50,min_humidity:30,max_humidity:80,fan_modes:['auto','high'],fan_mode:'auto',swing_modes:['off','on'],swing_mode:'off',swing_horizontal_modes:['off','on'],swing_horizontal_mode:'off'}}}};});
 const c=page.locator('island-climate-card');await c.getByRole('button',{name:'提高温度下限'}).click();await expect(page.locator('#calls')).toContainText('"target_temp_low":20.5');await expect(page.locator('#calls')).toContainText('"target_temp_high":26');
 await c.getByRole('button',{name:'模式与设置'}).click();await chooseOption(c.getByRole('combobox',{name:'风量模式'}),'high');await expect(page.locator('#calls')).toContainText('climate.set_fan_mode');await chooseOption(c.getByRole('combobox',{name:'水平摆风'}),'on');await expect(page.locator('#calls')).toContainText('climate.set_swing_horizontal_mode');
});
test('native editor emits usable config from form fields without JSON',async({page})=>{
 await page.evaluate(()=>{const e=document.createElement('island-card-editor') as Card;e.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern'});e.hass=(document.querySelector('island-light-card') as Card).hass;e.addEventListener('config-changed',event=>{e.dataset.changed=JSON.stringify((event as CustomEvent).detail.config);});document.body.append(e);});
 const e=page.locator('island-card-editor');await e.getByLabel('显示名称',{exact:true}).fill('新的阅读灯');await e.getByLabel('显示名称',{exact:true}).press('Tab');await expect(e).toHaveAttribute('data-changed',/新的阅读灯/);await e.getByRole('switch',{name:'只读模式',exact:true}).click();await expect(e).toHaveAttribute('data-changed',/"read_only":true/);
 const tap=e.getByRole('group',{name:'单击动作',exact:true});await chooseOption(tap.getByLabel('动作类型'),'navigate');await tap.getByLabel('导航路径').fill('/lovelace/demo');await tap.getByLabel('导航路径').press('Tab');await expect(e).toHaveAttribute('data-changed',/\/lovelace\/demo/);
 await page.setViewportSize({width:390,height:844});expect(await e.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
});
test('pending action is cancelled on config change and target is rechecked at confirm',async({page})=>{
 const a:DashboardAction={action:'perform-action',perform_action:'button.press',target:{entity_id:'button.demo_feed'}};
 await page.evaluate(a=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',tap_action:a});},a);await page.locator('island-light-card h2').click();
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;const id='button.demo_feed';c.hass={...c.hass,states:{...c.hass.states,[id]:{...c.hass.states[id]!,state:'unavailable'}}};});
 await page.locator('island-light-card').getByRole('button',{name:'确认执行'}).click();await expect(page.locator('#calls')).toContainText('0 次');await expect(page.locator('island-light-card [role=alert]')).toContainText('不可用');
});
test('gesture writes obey read-only unavailable denied and service-error states',async({page})=>{
 for(const mode of ['readonly','unavailable','denied','error']){
   await page.locator('#mode').selectOption(mode);await page.evaluate(mode=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',read_only:mode==='readonly',tap_action:{action:'perform-action',perform_action:'light.turn_on'}});},mode);
   await page.locator('island-light-card h2').click();await expect(page.locator('island-light-card [role=alert]')).toBeVisible();await expect(page.locator('#calls')).toContainText('0 次');
 }
});
test('gesture timers are cancelled on detach and config replacement',async({page})=>{
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',tap_action:{action:'toggle'},double_tap_action:{action:'more-info'}});});
 await page.locator('island-light-card h2').click();await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',tap_action:{action:'none'}});});await page.waitForTimeout(350);await expect(page.locator('#calls')).toContainText('0 次');
 await page.evaluate(()=>{const c=document.querySelector('island-light-card') as Card;c.setConfig({type:'custom:island-light-card',entity:'light.demo_lantern',tap_action:{action:'toggle'},double_tap_action:{action:'more-info'}});});await page.locator('island-light-card h2').click();await page.evaluate(()=>document.querySelector('island-light-card')!.remove());await page.waitForTimeout(350);await expect(page.locator('#calls')).toContainText('0 次');
});
test('camera gesture still confirms and image URL rejection never requests external data',async({page})=>{
 const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith(testBaseURL+'/'))external.push(r.url());});
 await page.evaluate(()=>{const c=document.querySelector('island-camera-card') as Card;c.setConfig({type:'custom:island-camera-card',entity:'camera.demo_view',tap_action:{action:'more-info'}});});await page.locator('island-camera-card h2').click();await expect(page.locator('island-camera-card .confirmation')).toBeVisible();await expect(page.locator('island-camera-card img')).toHaveCount(0);await expect(page.locator('#calls')).toContainText('0 次');
 await page.evaluate(()=>{const c=document.querySelector('island-picture-card') as Card;c.setConfig({type:'custom:island-picture-card',image:'https://unapproved.example/image.png',alt:'演示'});});await expect(page.locator('island-picture-card')).toContainText('图片来源未允许');expect(external).toEqual([]);
});
test('demo native editor updates the live card and fits 320px',async({page})=>{
 await page.getByRole('button',{name:'编辑灯光卡片'}).click();const editor=page.locator('island-card-editor');await editor.getByLabel('显示名称',{exact:true}).fill('书架暖灯');await editor.getByLabel('显示名称',{exact:true}).press('Tab');await expect(page.locator('island-light-card h2')).toHaveText('书架暖灯');
 await page.setViewportSize({width:320,height:850});await expect(editor).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await editor.screenshot({path:'test-results/editor-mobile.jpg',type:'jpeg',quality:70});
});
