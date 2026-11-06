import {test,expect,type Page} from '@playwright/test';
import type {Config,Hass} from '../../src/types';
type Editor=HTMLElement&{setConfig:(config:Config)=>void;hass:Hass};
async function mountEditor(page:Page,config:Config){
 await page.goto('/?qa=1');
 await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await page.evaluate(config=>{
  const editor=document.createElement('island-card-editor') as Editor;
  editor.setConfig(config);
  editor.hass={states:{'light.demo_lantern':{entity_id:'light.demo_lantern',state:'on',attributes:{}},'fan.demo_breeze':{entity_id:'fan.demo_breeze',state:'on',attributes:{}}},callService:async()=>undefined};
  editor.addEventListener('config-changed',event=>{editor.dataset.changed=JSON.stringify((event as CustomEvent).detail.config);editor.dataset.count=String(Number(editor.dataset.count??0)+1);});
  document.body.append(editor);
 },config);
 return page.locator('island-card-editor');
}

test('upstream editor components emit validated HA config and preserve the public type',async({page})=>{
 const editor=await mountEditor(page,{type:'custom:island-control-card',profile:'light',entity:'light.demo_lantern'});
 await expect(editor.locator('[class*="animal-card-"]')).not.toHaveCount(0);
 await editor.getByLabel('显示名称',{exact:true}).fill('阅读灯');
 await editor.getByLabel('显示名称',{exact:true}).press('Tab');
 await expect(editor).toHaveAttribute('data-changed',/阅读灯/);
 await editor.getByRole('switch',{name:'只读模式',exact:true}).click();
 await expect(editor).toHaveAttribute('data-changed',/"read_only":true/);
 await editor.getByRole('combobox',{name:'设备配置 profile'}).click();
 await editor.getByRole('option',{name:'fan',exact:true}).click();
 const config=JSON.parse(await editor.getAttribute('data-changed')??'{}');
 expect(config).toMatchObject({type:'custom:island-control-card',profile:'fan',entity:'fan.demo_breeze',name:'阅读灯',read_only:true});
 await expect(editor.getByRole('alert')).toHaveCount(0);
 expect(await editor.locator('datalist option').evaluateAll(options=>options.map(option=>(option as HTMLOptionElement).value))).toEqual(['fan.demo_breeze','light.demo_lantern']);
});

test('action controls support navigation, services, target data, and confirmation',async({page})=>{
 const editor=await mountEditor(page,{type:'custom:island-light-card',entity:'light.demo_lantern'});
 const tap=editor.getByRole('group',{name:'单击动作',exact:true});
 await tap.getByRole('combobox',{name:'动作类型'}).click();
 await tap.getByRole('option',{name:'navigate',exact:true}).click();
 await tap.getByLabel('导航路径').fill('/lovelace/demo');await tap.getByLabel('导航路径').press('Tab');
 await tap.getByRole('switch',{name:'替换导航历史'}).click();
 await expect(editor).toHaveAttribute('data-changed',/"navigation_replace":true/);
 await tap.getByRole('combobox',{name:'动作类型'}).click();await tap.getByRole('option',{name:'perform-action',exact:true}).click();
 await tap.getByLabel('执行服务').fill('light.turn_off');await tap.getByLabel('执行服务').press('Tab');
 await tap.getByLabel('target.area_id（逗号分隔）').fill('kitchen, living');await tap.getByLabel('target.area_id（逗号分隔）').press('Tab');
 await tap.getByLabel('服务参数 JSON').fill('{"transition":2}');await tap.getByLabel('服务参数 JSON').press('Tab');
 await tap.getByRole('switch',{name:'要求确认'}).click();
 await tap.getByLabel('确认说明').fill('是否关闭灯光？');await tap.getByLabel('确认说明').press('Tab');
 const config=JSON.parse(await editor.getAttribute('data-changed')??'{}');
 expect(config.tap_action).toMatchObject({action:'perform-action',perform_action:'light.turn_off',target:{area_id:['kitchen','living']},data:{transition:2},confirmation:{text:'是否关闭灯光？'}});
});

test('invalid text and JSON remain editable without emitting invalid configurations',async({page})=>{
 const editor=await mountEditor(page,{type:'custom:island-light-card',entity:'light.demo_lantern'});
 await editor.getByLabel('实体',{exact:true}).fill('invalid');await editor.getByLabel('实体',{exact:true}).press('Tab');
 await expect(editor.getByRole('alert')).not.toBeEmpty();await expect(editor).not.toHaveAttribute('data-changed');
 await expect(editor.getByLabel('实体',{exact:true})).toHaveValue('invalid');
 await editor.getByLabel('实体',{exact:true}).fill('light.demo_lantern');await editor.getByLabel('实体',{exact:true}).press('Tab');
 await editor.getByRole('button',{name:'高级 JSON 配置',exact:true}).click();
 const json=editor.getByRole('textbox',{name:'高级 JSON 配置',exact:true});
 await json.fill('{broken');await json.press('Tab');await expect(editor.getByRole('alert')).not.toBeEmpty();
 await json.fill(JSON.stringify({type:'custom:island-light-card',entity:'light.demo_lantern',name:'<img src=x onerror=alert(1)>'}));await json.press('Tab');
 await expect(editor).toHaveAttribute('data-changed',/onerror/);await expect(editor.locator('img')).toHaveCount(0);await expect(editor.getByRole('alert')).toHaveCount(0);
});

test('media switches retain explicitly selected controls and restore capability defaults',async({page})=>{
 const editor=await mountEditor(page,{type:'custom:island-media-card',entity:'media_player.demo_radio'});
 await editor.getByRole('switch',{name:'使用媒体标题与信息'}).click();
 await editor.getByRole('switch',{name:'显示音量百分比'}).click();
 await editor.getByRole('switch',{name:'volume_buttons',exact:true}).click();
 let config=JSON.parse(await editor.getAttribute('data-changed')??'{}');
 expect(config.use_media_info).toBe(true);expect(config.show_volume_level).toBe(true);expect(config.volume_controls).not.toContain('volume_buttons');
 await editor.getByRole('region',{name:'volume_controls',exact:true}).getByRole('button',{name:'恢复按能力显示'}).click();
 config=JSON.parse(await editor.getAttribute('data-changed')??'{}');expect(config.volume_controls).toBeUndefined();
});

test('composite field and confirmed integration action editing preserves all properties',async({page})=>{
 const editor=await mountEditor(page,{type:'custom:island-feeder-card',entities:[{entity:'sensor.demo_value'},{entity:'sensor.demo_status',role:'status'}]});
 const field=editor.getByRole('region',{name:'字段 1',exact:true});
 await field.getByRole('combobox',{name:'字段语义'}).click();await field.getByRole('option',{name:'remaining',exact:true}).click();
 await field.getByLabel('单位覆盖').fill('g');await field.getByLabel('单位覆盖').press('Tab');
 await field.getByLabel('进度最小值').fill('0');await field.getByLabel('进度最小值').press('Tab');
 await field.getByLabel('进度最大值').fill('100');await field.getByLabel('进度最大值').press('Tab');
 await editor.getByRole('button',{name:'添加集成动作'}).click();
 await editor.getByLabel('按钮文字').fill('投喂小份');await editor.getByLabel('按钮文字').press('Tab');
 await editor.getByLabel('显示动作的状态（逗号分隔，可选）').fill('ready, idle');await editor.getByLabel('显示动作的状态（逗号分隔，可选）').press('Tab');
 await expect(editor).toHaveAttribute('data-changed',/"when_states":\["ready","idle"\]/);
 await expect(editor.getByRole('alert')).toHaveCount(0);
 await editor.getByRole('combobox',{name:'动作层级'}).click();await editor.getByRole('option',{name:'danger',exact:true}).click();
 await editor.getByLabel('动作参数 JSON').fill('{"portion":2}');await editor.getByLabel('动作参数 JSON').press('Tab');
 const config=JSON.parse(await editor.getAttribute('data-changed')??'{}');
 expect(config.entities[0]).toMatchObject({role:'remaining',unit:'g',min:0,max:100});
 expect(config.actions[0]).toMatchObject({label:'投喂小份',role:'danger',when_states:['ready','idle'],data:{portion:2}});
});

test('state-filtered integration actions require a status field and reject invalid updates',async({page})=>{
 const editor=await mountEditor(page,{type:'custom:island-feeder-card',entities:[{entity:'sensor.demo_value',role:'remaining'}],actions:[{label:'投喂小份',service:'button.press',entity:'button.demo_action'}]});
 const states=editor.getByLabel('显示动作的状态（逗号分隔，可选）');
 await states.fill('ready, idle');await states.press('Tab');
 await expect(editor.getByRole('alert')).toContainText('when_states 需要 status 字段');
 await expect(editor).not.toHaveAttribute('data-changed');
 await expect(states).toHaveValue('ready, idle');
});

test('editor handles disconnect/reconnect and opens a selectable mobile dropdown without overflow',async({page})=>{
 await page.setViewportSize({width:320,height:850});
 const editor=await mountEditor(page,{type:'custom:island-control-card',profile:'light',entity:'light.demo_lantern'});
 await page.evaluate(()=>{const editor=document.querySelector('island-card-editor')!;editor.remove();document.body.append(editor);});
 await expect(editor.getByLabel('显示名称',{exact:true})).toBeVisible();
 await editor.getByRole('combobox',{name:'设备配置 profile'}).click();
 await expect(editor.getByRole('option',{name:'fan',exact:true})).toBeVisible();
 expect(await editor.evaluate(element=>{const list=element.shadowRoot?.querySelector('[role=listbox]');if(!list)return false;const bounds=list.getBoundingClientRect();return bounds.left>=0&&bounds.right<=innerWidth;})).toBe(true);
 await editor.getByRole('option',{name:'fan',exact:true}).click();await expect(editor).toHaveAttribute('data-changed',/"profile":"fan"/);
});
