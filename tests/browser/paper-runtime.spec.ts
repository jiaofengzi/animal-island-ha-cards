import {test,expect} from '@playwright/test';
import type {Config,Hass} from '../../src/types';
type Card=HTMLElement&{hass:Hass;setConfig:(config:Config)=>void};

test('paper cards use system font fallback without font downloads or registration',async({page})=>{
 const fontRequests:string[]=[];
 page.on('request',request=>{if(request.resourceType()==='font'||/\.(woff2?|ttf|otf)(?:[?#]|$)/i.test(request.url()))fontRequests.push(request.url());});
 await page.goto('/?qa=1');await page.evaluate(()=>document.fonts.ready);
 const light=page.locator('island-light-card');
 await expect(light.getByRole('slider',{name:'亮度'})).toBeVisible();
 await expect(light.locator('.island-card')).toHaveCSS('font-family',/Nunito.*Noto Sans SC.*sans-serif/);
 await expect(page.locator('#island-reference-fonts')).toHaveCount(0);
 expect(await page.evaluate(()=>Array.from(document.querySelectorAll('style')).some(style=>style.textContent?.includes('@font-face')))).toBe(false);
 expect(fontRequests).toEqual([]);
});

test('camera and camera chip never fetch same-origin picture before consent or on cancel',async({page})=>{
 const mediaRequests:string[]=[];
 page.on('request',request=>{if(/\/api\/camera_(proxy|stream)\//.test(new URL(request.url()).pathname))mediaRequests.push(request.url());});
 await page.route('**/api/camera_proxy/**',route=>route.abort());
 await page.goto('/?qa=1');
 await page.evaluate(()=>{
  const camera=document.querySelector('island-camera-card') as Card;
  const id='camera.demo_view';const state=camera.hass.states[id]!;
  const hass={...camera.hass,states:{...camera.hass.states,[id]:{...state,attributes:{...state.attributes,entity_picture:'/api/camera_proxy/demo-no-fetch'}}}};
  camera.hass=hass;
  const chips=document.querySelector('island-chips-card') as Card;
  chips.setConfig({type:'custom:island-chips-card',entities:[{entity:id,name:'隐私入口'}]});chips.hass=hass;
 });
 const camera=page.locator('island-camera-card');await expect(camera.locator('img,video,iframe')).toHaveCount(0);
 await camera.getByRole('button',{name:'查看影像详情',exact:true}).click();
 await camera.getByRole('button',{name:'取消',exact:true}).click();
 const chips=page.locator('island-chips-card');await chips.getByRole('button',{name:/隐私入口/}).click();
 await chips.getByRole('button',{name:'取消',exact:true}).click();
 await expect(chips.locator('img,video,iframe')).toHaveCount(0);
 await expect(page.locator('#calls')).toHaveText('0 次 mock 服务调用');
 expect(mediaRequests).toEqual([]);
});
