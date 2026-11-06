import {test,expect} from '@playwright/test';
test('actual upstream components render all profiles and capture baseline',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1100});await page.goto('/?view=all&qa=1');await expect(page.locator('#cards>*')).toHaveCount(23);
 await expect(page.locator('island-light-card .island-card')).toBeVisible();await page.screenshot({path:testInfo.outputPath('all-desktop.png'),fullPage:true});
 expect(errors).toEqual([]);
 for(const profile of ['light','climate','cover','fan','media','vacuum','entity','scene','number','select','laundry','fridge','water','feeder','meal','printer','consumable','camera','health','summary','chips','picture']){
  await page.goto('/?profile='+profile);const card=page.locator(`[data-profile="${profile}"]`);await expect(card).toBeVisible();await card.screenshot({path:testInfo.outputPath(profile+'.png')});
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/?view=all');await page.screenshot({path:testInfo.outputPath('all-mobile.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('actual controls send exact services',async({page})=>{
 await page.goto('/?qa=1');const light=page.locator('island-light-card');await light.getByRole('switch',{name:'关闭',exact:true}).click();await expect(page.locator('#calls')).toContainText('light.turn_off');
 await page.locator('island-climate-card').getByRole('button',{name:'提高目标温度'}).click();await expect(page.locator('#calls')).toContainText('set_temperature');
 const cover=page.locator('island-cover-card');await cover.getByRole('button',{name:'关闭',exact:true}).click();await cover.getByRole('button',{name:'取消',exact:true}).click();
 await page.locator('island-select-card').getByRole('combobox').click();await page.locator('island-select-card').getByRole('option',{name:'标准',exact:true}).click();await expect(page.locator('#calls')).toContainText('select_option');
});
