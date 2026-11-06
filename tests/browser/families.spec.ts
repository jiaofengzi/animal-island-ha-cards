import {chooseOption} from './helpers';
import {test,expect} from '@playwright/test';
import type {Config,Hass} from '../../src/types';
type Card=HTMLElement&{hass:Hass;kind:string;setConfig:(c:Config)=>void};
type Demo={hass:Hass;calls:unknown[];setMode:(mode:string)=>void;setState:(id:string,state:string,attrs?:Record<string,unknown>)=>void;releasePending:()=>void;pendingCount:number};
declare global {interface Window {islandDemo:Demo}}
test.beforeEach(async({page})=>{await page.goto('/?qa=1');await expect(page.locator('html')).toHaveAttribute('data-ready','true');});
test('canonical elements render their legacy profiles with unchanged public type',async({page})=>{
 const result=await page.evaluate(()=>{
  const samples:Config[]=[{type:'custom:island-control-card',entity:'light.demo_lantern'},{type:'custom:island-task-card',entity:'vacuum.demo_rover'},{type:'custom:island-monitor-card',profile:'fridge',entities:[{entity:'sensor.demo_temperature',role:'temperature'}]},{type:'custom:island-action-card',profile:'feeder',entities:[{entity:'number.demo_portion',role:'portion'}]}];
  return samples.map(config=>{const card=document.createElement(config.type.slice(7)) as Card;card.setConfig(config);card.hass=window.islandDemo.hass;document.body.append(card);return {tag:card.tagName.toLowerCase(),kind:card.kind,type:config.type};});
 });
 expect(result.map(r=>r.kind)).toEqual(['light','vacuum','fridge','feeder']);
 for(const r of result){await expect(page.locator(r.tag+' .island-card')).toBeVisible();expect(r.type).toBe('custom:'+r.tag);}
 expect(await page.evaluate(()=>{try{const card=document.createElement('island-monitor-card') as Card;card.setConfig({type:'custom:island-monitor-card',entities:[{entity:'sensor.demo_temperature'}]});return false;}catch{return true;}})).toBe(true);
});
test('gallery filters expose 8 representative families and truthful single-device states',async({page})=>{
 await page.goto('/?view=overview');await expect(page.locator('#cards > *')).toHaveCount(8);
 expect(new Set(await page.locator('#cards > *').evaluateAll(cards=>cards.map(c=>(c as HTMLElement).dataset.family))).size).toBe(8);
 await page.goto('/?profile=laundry');await expect(page.locator('#cards > *')).toHaveCount(1);await expect(page.locator('island-laundry-card')).toContainText('漂洗');await expect(page.locator('island-laundry-card')).toContainText('24');await expect(page.locator('island-laundry-card [role=progressbar]')).toHaveAttribute('aria-valuenow','62');
});
test('light exposes one everyday range and one optional color slot',async({page})=>{
 const card=page.locator('island-light-card');await expect(card.getByRole('slider')).toHaveCount(1);await expect(card.getByRole('slider',{name:'亮度'})).toBeVisible();await expect(card.getByLabel('灯光颜色')).toHaveCount(0);
 const toggle=card.getByRole('button',{name:'光色与设置'});await expect(toggle).toHaveAttribute('aria-expanded','false');await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(card.getByRole('slider',{name:'色温 K'})).toBeVisible();
 await card.getByRole('button',{name:'颜色',exact:true}).click();await expect(card.getByLabel('灯光颜色')).toBeVisible();await expect(card.getByRole('slider',{name:'色温 K'})).toHaveCount(0);await toggle.click();await expect(toggle).toBeFocused();
});
test('climate distinguishes target current temperature and actual HVAC action',async({page})=>{
 const card=page.locator('island-climate-card');await expect(card.getByRole('spinbutton',{name:'目标温度'})).toHaveValue('24');await expect(card).toContainText('室内 26');await expect(card).toContainText('正在制冷');await expect(card.getByRole('combobox')).toHaveCount(0);
 await card.getByRole('button',{name:'提高目标温度'}).click();await expect(card.getByRole('spinbutton',{name:'目标温度'})).toHaveValue('24.5');await expect(card).toContainText('室内 26');
});
test('media prioritizes pause over power and transitions to play after service response',async({page})=>{
 const card=page.locator('island-media-card');await expect(card.locator('.transport .primary')).toHaveAccessibleName('暂停');await expect(card.getByRole('button',{name:'关闭',exact:true})).toHaveCount(0);await expect(card.getByRole('switch',{name:'关闭',exact:true})).toHaveCount(0);await expect(card.getByRole('slider',{name:'音量'})).toHaveCount(1);
 await card.getByRole('button',{name:'暂停',exact:true}).click();await expect(card.locator('.transport .primary')).toHaveAccessibleName('播放');await expect(card).toContainText('已暂停');await card.getByRole('button',{name:'播放设置'}).click();const power=card.getByRole('switch',{name:'关闭',exact:true});await expect(power).toBeVisible();await expect(power).toBeChecked();await expect(power).not.toHaveClass(/primary/);
});
test('moving cover gives stop priority and disables duplicate direction',async({page})=>{
 await page.goto('/?profile=cover&scenario=cover-moving');const card=page.locator('island-cover-card');await expect(card.locator('.direction-controls .primary')).toHaveAccessibleName('停止');await expect(card.getByRole('button',{name:'关闭',exact:true})).toBeDisabled();await card.getByRole('button',{name:'停止',exact:true}).click();await expect(card).toContainText('已打开');await expect(card.locator('.direction-controls .primary')).toHaveCount(0);await expect(page.locator('#calls')).toContainText('cover.stop_cover');
});
test('printer actions switch only on configured status and danger stays disclosed',async({page})=>{
 const card=page.locator('island-printer-card');await expect(card.getByRole('button',{name:'暂停打印'})).toBeVisible();await expect(card.getByRole('button',{name:'继续打印'})).toHaveCount(0);await expect(card.getByRole('button',{name:'取消打印'})).toHaveCount(0);
 await card.getByRole('button',{name:'暂停打印'}).click();await card.getByRole('button',{name:'确认执行'}).click();await expect(card).toContainText('已暂停');await expect(card.getByRole('button',{name:'继续打印'})).toBeVisible();await expect(card.getByRole('button',{name:'暂停打印'})).toHaveCount(0);
 await card.getByRole('button',{name:'其他操作'}).click();await expect(card.getByRole('button',{name:'取消打印'})).toHaveClass(/danger/);await card.getByRole('button',{name:'取消打印'}).click();await card.getByRole('button',{name:'取消',exact:true}).click();await expect(card.getByRole('button',{name:'取消打印'})).toBeFocused();
});
test('pending feeding prevents duplicate dispatch and preserves explicit confirmation',async({page})=>{
 await page.locator('#mode').selectOption('pending');const card=page.locator('island-feeder-card'),trigger=card.getByRole('button',{name:'投喂 2 份'});await trigger.click();await expect(card.getByRole('button',{name:'取消',exact:true})).toBeFocused();expect(await page.evaluate(()=>window.islandDemo.calls.length)).toBe(0);
 await card.getByRole('button',{name:'确认执行'}).click();await expect(trigger).toBeDisabled();await trigger.dispatchEvent('click');expect(await page.evaluate(()=>window.islandDemo.calls.length)).toBe(1);expect(await page.evaluate(()=>window.islandDemo.pendingCount)).toBe(1);
 await page.getByRole('button',{name:'释放等待响应'}).click();await expect(trigger).toBeEnabled();await expect(card).toContainText('刚刚 · 模拟投喂 2 份');expect(await page.evaluate(()=>window.islandDemo.calls.length)).toBe(1);
});
test('unknown unavailable and missing readings never retain task meters or unsafe actions',async({page})=>{
 for(const mode of ['unknown','unavailable','missing']){await page.locator('#mode').selectOption(mode);await expect(page.locator('island-laundry-card [role=progressbar]')).toHaveCount(0);await expect(page.locator('island-printer-card').getByRole('button',{name:'暂停打印'})).toHaveCount(0);await expect(page.locator('island-light-card input')).toHaveCount(0);}
});
test('canonical editor accepts allowed profiles without rewriting type',async({page})=>{
 await page.evaluate(()=>{const editor=document.createElement('island-card-editor') as Card;editor.setConfig({type:'custom:island-control-card',profile:'light',entity:'light.demo_lantern'});editor.addEventListener('config-changed',e=>{editor.dataset.changed=JSON.stringify((e as CustomEvent).detail.config);});document.body.append(editor);});
 const editor=page.locator('island-card-editor');await editor.getByLabel('显示名称',{exact:true}).fill('家族灯光');await editor.getByLabel('显示名称',{exact:true}).press('Tab');await expect(editor).toHaveAttribute('data-changed',/custom:island-control-card/);await expect(editor).toHaveAttribute('data-changed',/"profile":"light"/);
});
test('safety stop remains reachable during a pending cover command but cannot repeat',async({page})=>{
 await page.locator('#mode').selectOption('pending');const card=page.locator('island-cover-card'),open=card.getByRole('button',{name:'打开',exact:true}),stop=card.getByRole('button',{name:'停止',exact:true});
 await open.click();await card.getByRole('button',{name:'确认执行'}).click();await expect(open).toBeDisabled();await expect(stop).toBeEnabled();expect(await page.evaluate(()=>window.islandDemo.pendingCount)).toBe(1);
 await stop.click();await expect(stop).toBeDisabled();await stop.dispatchEvent('click');expect(await page.evaluate(()=>window.islandDemo.pendingCount)).toBe(2);expect(await page.evaluate(()=>window.islandDemo.calls.length)).toBe(2);
 await page.getByRole('button',{name:'释放等待响应'}).click();await expect(stop).toBeEnabled();await expect(open).toBeEnabled();expect(await page.evaluate(()=>window.islandDemo.pendingCount)).toBe(0);
});
test('vacuum safety stop remains available while pause waits for a response',async({page})=>{
 await page.locator('#mode').selectOption('pending');const card=page.locator('island-vacuum-card'),pause=card.getByRole('button',{name:'暂停',exact:true}),stop=card.getByRole('button',{name:'停止',exact:true});
 await pause.click();await expect(pause).toBeDisabled();await expect(stop).toBeEnabled();await stop.click();await expect(stop).toBeDisabled();expect(await page.evaluate(()=>window.islandDemo.calls.length)).toBe(2);
 await page.getByRole('button',{name:'释放等待响应'}).click();await expect(card.getByRole('button',{name:'开始清扫'})).toBeEnabled();
});
test('task status is rechecked at confirmation, including unavailable status',async({page})=>{
 const card=page.locator('island-printer-card');
 for(const scenario of ['print-paused','print-unavailable']){
  await page.locator('#scenario').selectOption('print-running');await card.getByRole('button',{name:'暂停打印'}).click();await expect(card.getByRole('button',{name:'确认执行'})).toBeVisible();
  await page.locator('#scenario').selectOption(scenario);await card.getByRole('button',{name:'确认执行'}).click();await expect(card.getByRole('alert')).toContainText('任务状态已变化');expect(await page.evaluate(()=>window.islandDemo.calls.length)).toBe(0);
 }
});
test('HA picker exposes only eight families and three primitives, while legacy tags remain registered',async({page})=>{
 const result=await page.evaluate(()=>({picker:(window as Window & {customCards?:{type:string}[]}).customCards?.map(c=>c.type)??[],legacy:['light','fan','entity','number','select','vacuum','laundry','printer','fridge','water','consumable','health','meal','scene','feeder','camera'].every(kind=>!!customElements.get(`island-${kind}-card`))}));
 expect(result.picker).toHaveLength(11);expect(result.legacy).toBe(true);expect([...result.picker].sort()).toEqual(['control','climate','cover','media','task','monitor','action','summary','chips','picture','spacer'].map(kind=>`island-${kind}-card`).sort());
});
test('canonical profile selector switches light to fan transactionally without invalid intermediate config',async({page})=>{
 await page.evaluate(()=>{const editor=document.createElement('island-card-editor') as Card;editor.setConfig({type:'custom:island-control-card',profile:'light',entity:'light.demo_lantern',name:'保留的名称'});editor.hass=window.islandDemo.hass;editor.addEventListener('config-changed',e=>{editor.dataset.changed=JSON.stringify((e as CustomEvent).detail.config);});document.body.append(editor);});
 const editor=page.locator('island-card-editor');await chooseOption(editor.getByLabel('设备配置 profile'),'fan');await expect(editor.locator('[role=alert]')).toHaveCount(1);await expect(editor.locator('[role=alert]')).toBeEmpty();
 const config=JSON.parse(await editor.getAttribute('data-changed')??'{}');expect(config.type).toBe('custom:island-control-card');expect(config.profile).toBe('fan');expect(config.entity).toBe('fan.demo_breeze');expect(config.name).toBe('保留的名称');
});
