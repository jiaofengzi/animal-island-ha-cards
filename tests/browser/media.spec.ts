import {chooseOption} from './helpers';
import {test,expect} from '@playwright/test';
import type {Config,Hass} from '../../src/types';
type Card=HTMLElement&{hass:Hass;setConfig:(c:Config)=>void};
test.beforeEach(async({page})=>{await page.goto('/?qa=1');});
test('media controls send exact shuffle repeat and volume-step services without card gestures',async({page})=>{
 const card=page.locator('island-media-card');
 await page.evaluate(()=>{const c=document.querySelector('island-media-card') as Card;c.setConfig({type:'custom:island-media-card',entity:'media_player.demo_radio',tap_action:{action:'more-info'}});});
 await card.getByRole('button',{name:'播放设置'}).click();await card.getByRole('button',{name:'开启随机播放'}).click();await expect(page.locator('#calls')).toContainText('media_player.shuffle_set {"shuffle":true,"entity_id":"media_player.demo_radio"}');
 await chooseOption(card.getByRole('combobox',{name:'循环模式'}),'one');await expect(page.locator('#calls')).toContainText('media_player.repeat_set {"repeat":"one"');
 const up=card.getByRole('button',{name:'提高音量'});await up.focus();await up.press('Enter');await expect(up).toBeFocused();await expect(page.locator('#calls')).toContainText('media_player.volume_up');
 await card.getByRole('button',{name:'降低音量'}).click();await expect(page.locator('#calls')).toContainText('4 次 mock 服务调用：media_player.volume_down');
 await page.evaluate(()=>{const c=document.querySelector('island-media-card') as Card,id='media_player.demo_radio',e=c.hass.states[id]!;c.hass={...c.hass,states:{...c.hass.states,[id]:{...e,attributes:{...e.attributes,shuffle:true,repeat:'all'}}}};});
 await expect(card.getByRole('button',{name:'关闭随机播放'})).toBeVisible();await expect(card.getByRole('combobox',{name:'循环模式'})).toContainText('全部循环');
});
test('media capability, config, service and access restrictions are effective',async({page})=>{
 const card=page.locator('island-media-card');
 await page.evaluate(()=>{const c=document.querySelector('island-media-card') as Card,id='media_player.demo_radio',e=c.hass.states[id]!;c.hass={...c.hass,states:{...c.hass.states,[id]:{...e,attributes:{supported_features:1024}}}};});
 await expect(card.getByRole('button',{name:'提高音量'})).toBeEnabled();await expect(card.getByRole('slider')).toHaveCount(0);await expect(card.getByRole('combobox')).toHaveCount(0);
 await page.evaluate(()=>{const c=document.querySelector('island-media-card') as Card;c.hass={...c.hass,services:{}};});await expect(card.getByRole('button',{name:'提高音量'})).toBeDisabled();
 await page.evaluate(()=>{const c=document.querySelector('island-media-card') as Card;c.setConfig({type:'custom:island-media-card',entity:'media_player.demo_radio',media_controls:[],volume_controls:[]});});await expect(card.getByRole('button',{name:'提高音量'})).toHaveCount(0);
 for(const mode of ['readonly','unknown','unavailable','missing']){await page.selectOption('#mode',mode);await expect(card.locator('button:not(:disabled)').filter({hasText:'提高音量'})).toHaveCount(0);}
 await page.selectOption('#mode','denied');await card.getByRole('button',{name:'播放设置'}).click();await card.getByRole('button',{name:'提高音量'}).click();await expect(card.getByRole('alert')).toContainText('无操作权限');
 await page.selectOption('#mode','error');const settings=card.getByRole('button',{name:'播放设置'});if(await settings.getAttribute('aria-expanded')!=='true')await settings.click();await expect(settings).toHaveAttribute('aria-expanded','true');await chooseOption(card.getByRole('combobox',{name:'循环模式'}),'all');await expect(card.getByRole('alert')).toContainText('操作失败');
});
test('media metadata is text only, updates with hass and falls back when inactive',async({page})=>{
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));const card=page.locator('island-media-card');
 await expect(card.getByRole('heading')).toHaveText('海风来信');await expect(card.locator('.state')).toContainText('播放中');
 await page.evaluate(()=>{const c=document.querySelector('island-media-card') as Card,id='media_player.demo_radio',e=c.hass.states[id]!;c.hass={...c.hass,states:{...c.hass.states,[id]:{...e,attributes:{...e.attributes,media_title:'<img src=x onerror=alert(1)>',media_artist:'更新演出者',entity_picture:'https://invalid.example/cover',entity_picture_local:'/private-cover'}}}};});
 await expect(card.getByRole('heading')).toHaveText('<img src=x onerror=alert(1)>');await expect(card).toContainText('更新演出者');await expect(card.locator('img')).toHaveCount(0);expect(requests.some(x=>x.includes('cover')||x.includes('invalid.example'))).toBe(false);
 await page.selectOption('#mode','unavailable');await expect(card.getByRole('heading')).toHaveText('岛屿电台');await expect(card.locator('.state')).toHaveText('不可用');await expect(card).not.toContainText('小岛乐队');
});
test('media native editor emits controls and metadata choices',async({page})=>{
 await page.evaluate(()=>{const editor=document.createElement('island-card-editor') as Card;editor.setConfig({type:'custom:island-media-card',entity:'media_player.demo_radio'});editor.addEventListener('config-changed',e=>{document.body.dataset.config=JSON.stringify((e as CustomEvent).detail.config);});document.body.append(editor);});
 const editor=page.locator('island-card-editor');await editor.getByRole('switch',{name:'使用媒体标题与信息'}).click();
 await editor.getByRole('switch',{name:'显示音量百分比'}).click();await editor.getByRole('switch',{name:'volume_buttons',exact:true}).click();
 const config=JSON.parse(await page.locator('body').getAttribute('data-config')??'{}');expect(config.use_media_info).toBe(true);expect(config.show_volume_level).toBe(true);expect(config.volume_controls).toEqual(['volume_mute','volume_set']);
});
