import {chooseOption} from './helpers';
import {test,expect} from '@playwright/test';
import type {Config,Hass} from '../../src/types';
type Card=HTMLElement&{hass:Hass;setConfig:(c:Config)=>void};
const cases=[
 {kind:'laundry',role:'progress',name:'完成进度',value:'68',meter:true},
 {kind:'fridge',role:'temperature',name:'冷藏温度',value:'4',unit:'°C'},
 {kind:'water',role:'tds',name:'出水 TDS',value:'9',unit:'ppm'},
 {kind:'feeder',role:'remaining',name:'余粮',value:'300',unit:'g'},
 {kind:'meal',role:'record',name:'最近餐盘记录',value:'演示午餐'},
 {kind:'printer',role:'progress',name:'完成进度',value:'41',meter:true},
 {kind:'consumable',role:'life',name:'剩余寿命',value:'82',meter:true},
 {kind:'health',role:'cpu',name:'CPU 使用率',value:'16',meter:true}
];
for(const item of cases)test(`${item.kind}: semantic field, update and unavailable handling`,async({page})=>{
 await page.goto('/?qa=1');await page.evaluate(item=>{const c=document.querySelector(`island-${item.kind}-card`) as Card;c.setConfig({type:`custom:island-${item.kind}-card`,entities:[{entity:'sensor.demo_value',role:item.role,unit:item.unit,attribute:'reading'}]});c.hass={...c.hass,states:{...c.hass.states,'sensor.demo_value':{entity_id:'sensor.demo_value',state:'ok',attributes:{reading:item.value}}}};},item);
 const card=page.locator(`island-${item.kind}-card`);if(item.kind!=='meal')await expect(card.locator('dt')).toHaveText(item.name);await expect(card).toContainText(item.value);await expect(card.getByRole('progressbar')).toHaveCount(item.meter?1:0);
 if(item.kind==='meal'){await expect(card.locator('img')).toHaveCount(0);await expect(card.locator('.task-actions')).toHaveCount(0);await card.getByRole('button',{name:'查看记录'}).click();await expect(card).toContainText('不写入记录');}
 await page.evaluate(kind=>{const c=document.querySelector(`island-${kind}-card`) as Card;c.hass={...c.hass,states:{...c.hass.states,'sensor.demo_value':{entity_id:'sensor.demo_value',state:'unavailable',attributes:{reading:'stale'}}}};},item.kind);await expect(card).toContainText('不可用');await expect(card).not.toContainText('stale');await expect(card.getByRole('progressbar')).toHaveCount(0);
});
test('template editor configures semantic fields and explicit confirmed service',async({page})=>{
 await page.goto('/?qa=1');await page.evaluate(()=>{const e=document.createElement('island-card-editor') as Card;e.setConfig({type:'custom:island-feeder-card',entities:[{entity:'sensor.demo_value'}]});e.addEventListener('config-changed',ev=>{e.dataset.config=JSON.stringify((ev as CustomEvent).detail.config);});document.body.append(e);});
 const e=page.locator('island-card-editor');await chooseOption(e.getByLabel('字段语义'),'remaining');await e.getByLabel('单位覆盖').fill('g');await e.getByLabel('单位覆盖').press('Tab');await expect(e).toHaveAttribute('data-config',/"role":"remaining"/);await expect(e).toHaveAttribute('data-config',/"unit":"g"/);await e.getByRole('button',{name:'添加集成动作'}).click();await e.getByLabel('按钮文字').fill('投喂小份');await e.getByLabel('按钮文字').press('Tab');await expect(e).toHaveAttribute('data-config',/投喂小份/);
});
