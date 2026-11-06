import {test,expect} from '@playwright/test';
test('upstream-reference candidate keeps light power and brightness interactive',async({page})=>{
 await page.goto('/?candidate=1&profile=light&qa=1');const card=page.locator('island-light-card');
 await expect(card.getByRole('slider',{name:'亮度'})).toBeVisible();
 await card.getByRole('switch',{name:'关闭',exact:true}).click();await expect(card.locator('.island-card')).toHaveClass(/is-off/);
 await card.getByRole('switch',{name:'开启',exact:true}).click();await expect(card.locator('.island-card')).not.toHaveClass(/is-off/);
 await expect(page.locator('#calls')).toContainText('2 次 mock 服务调用');
});
test('candidate climate keeps current separate from adjustable target',async({page})=>{
 await page.goto('/?candidate=1&profile=climate&scenario=climate-heat');const card=page.locator('island-climate-card');
 await expect(card).toContainText('室内 19');await expect(card).toContainText('正在制热');
 await card.getByRole('button',{name:'提高目标温度'}).click();await expect(card.getByRole('spinbutton',{name:'目标温度'})).toHaveValue('22.5');await expect(card).toContainText('室内 19');
});
test('candidate laundry remains confirmed configured action, completed removes pause',async({page})=>{
 await page.goto('/?candidate=1&profile=laundry&qa=1');const card=page.locator('island-laundry-card');
 await card.getByRole('button',{name:'暂停洗衣',exact:true}).click();await expect(page.locator('#calls')).toContainText('0 次');
 await card.getByRole('button',{name:'确认执行'}).click();await expect(card).toContainText('已暂停');await expect(card.getByRole('button',{name:'继续洗衣'})).toBeVisible();
 await page.locator('#scenario').selectOption('laundry-done');await expect(card.getByRole('button',{name:'暂停洗衣',exact:true})).toHaveCount(0);await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
});

test('reference cards use exact flat Card proportions and original icon art',async({page})=>{
 await page.goto('/?candidate=1');
 const colors:Record<string,string>={light:'rgb(247, 205, 103)',climate:'rgb(136, 157, 240)',laundry:'rgb(138, 198, 138)'};
 for(const name of ['light','climate','laundry']){const card=page.locator(`island-${name}-card .island-card`);await expect(card).toHaveAttribute('data-component','Card');await expect(card.locator('.card-header')).toHaveCSS('background-color',colors[name]!);await expect(card).toHaveCSS('background-color','rgb(247, 243, 223)');await expect(card).toHaveCSS('border-radius','20px');await expect(card).toHaveCSS('box-shadow','none');await expect(card).toHaveCSS('padding','16px 24px');await expect(card.locator('.device-icon svg')).toHaveAttribute('viewBox','0 0 48 48');}
});
