import {test,expect} from '@playwright/test';

test('paper summary interactive rows retain rounded corners',async({page})=>{
 await page.goto('/?profile=summary&qa=1');
 const rows=page.locator('island-summary-card .destination');
 expect(await rows.count()).toBeGreaterThan(0);
 for(const row of await rows.all()){const geometry=await row.evaluate(e=>({tag:e.tagName,radius:parseFloat(getComputedStyle(e).borderRadius)}));expect(geometry.radius).toBe(geometry.tag==='BUTTON'?50:18);}
});

test('collapsed paper disclosure keeps keyboard focus inside its clipped surface',async({page})=>{
 await page.goto('/?profile=light&qa=1');
 const toggle=page.locator('island-light-card').getByRole('button',{name:'光色与设置',exact:true});
 await toggle.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(toggle).toBeFocused();await expect(toggle).toHaveCSS('outline-style','solid');
 expect(await toggle.evaluate(e=>parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(2);
 expect(await toggle.evaluate(e=>parseFloat(getComputedStyle(e).outlineOffset))).toBeLessThanOrEqual(-2);
});

test('paper permission error is visually distinct from ordinary status feedback',async({page})=>{
 await page.goto('/?profile=light&state=denied&qa=1');
 const card=page.locator('island-light-card');await card.getByRole('switch',{name:'关闭',exact:true}).click();
 const alert=card.getByRole('alert');await expect(alert).toContainText('无操作权限');
 await expect(alert).toHaveCSS('background-color','rgb(240, 232, 216)');
 await expect(alert).toHaveCSS('color','rgb(224, 90, 90)');
 await expect(page.locator('#calls')).toContainText('0 次');
});
