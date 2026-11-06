import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {chooseOption} from './helpers';

const mapping=JSON.parse(readFileSync(new URL('../../demo/acceptance-mapping.json',import.meta.url),'utf8')) as Array<{profile:string;official_image:string|null;source_url:string|null}>;
const sourceManifest=JSON.parse(readFileSync(new URL('../../demo/reference/image-sources.json',import.meta.url),'utf8')) as Array<{name:string;display_url:string}>;
const diagnostics=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{
 const errors:string[]=[];diagnostics.set(page,errors);
 page.on('pageerror',error=>errors.push(error.stack??error.message));
});
test.afterEach(async({page},testInfo)=>{
 if(testInfo.status!==testInfo.expectedStatus){
  const errors=diagnostics.get(page)??[];
  await testInfo.attach('acceptance-page-errors',{body:JSON.stringify({url:page.url(),pageErrors:errors},null,2),contentType:'application/json'});
  console.error('Acceptance failure diagnostics:',JSON.stringify({url:page.url(),pageErrors:errors}));
 }
});
function observe(page:Page){
 const pageErrors:string[]=[],external:string[]=[],fonts:string[]=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('request',request=>{
  const url=new URL(request.url());
  if(['http:','https:'].includes(url.protocol)&&!['localhost','127.0.0.1'].includes(url.hostname))external.push(request.url());
  if(request.resourceType()==='font'||/\.(woff2?|ttf|otf)(?:[?#]|$)/i.test(url.pathname))fonts.push(request.url());
 });
 return ()=>{expect(pageErrors,'uncaught browser errors').toEqual([]);expect(external,'external resource requests').toEqual([]);expect(fonts,'font requests').toEqual([]);};
}
async function openAcceptance(page:Page){
 await page.goto('/_acceptance/');
 await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await expect(page.locator('.comparison')).toHaveCount(23);
 await expect(page.locator('island-light-card').getByRole('switch',{name:'关闭',exact:true})).toBeVisible();
}
async function decodedImages(page:Page){
 // Full-page capture should include lazy picture content, not an unloaded placeholder.
 const images=page.locator('.comparison img');
 for(let i=0;i<await images.count();i++){
  const image=images.nth(i);await image.scrollIntoViewIfNeeded();
  await expect.poll(()=>image.evaluate((node:HTMLImageElement)=>node.complete&&node.naturalWidth>0)).toBe(true);
 }
}

test('acceptance: actual 23 pairs, sources and desktop screenshots',async({page},testInfo)=>{
 test.setTimeout(120_000);const verify=observe(page);
 await page.setViewportSize({width:1440,height:1000});await openAcceptance(page);
 expect(new Set(mapping.map(row=>row.profile)).size).toBe(23);
 await expect(page.locator('.comparison .pair')).toHaveCount(23);
 await expect(page.locator('.comparison .baseline h3')).toHaveText(Array(23).fill('原版 Mushroom · 静态参考'));
 await expect(page.locator('.comparison .candidate h3')).toHaveText(Array(23).fill('Animal Island · 交互模块'));
 await expect(page.locator('.controls')).toContainText('实体名称、数值与右侧不相同');
 await expect(page.locator('.controls')).toContainText('不是 Legacy Template');
 for(const row of mapping){
  const section=page.locator(`#module-${row.profile}`),card=section.locator(`island-${row.profile}-card`);
  await expect(card).toHaveCount(1);
  await expect.poll(()=>card.evaluate(node=>!!node.shadowRoot?.querySelector('.island-mount')?.childElementCount)).toBe(true);
  const columns=await section.locator('.pair > article').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
  expect(Math.abs(columns[0]-columns[1])).toBeLessThan(1);
  await expect(section.locator('.source-links a').first()).toHaveAttribute('href',/github\.com\/piitaya\/lovelace-mushroom\/blob\/v5\.2\.3\/docs\/cards\//);
  if(row.profile==='picture'||row.profile==='spacer')await expect(section.locator('.baseline img')).toHaveCount(0);
  else{
   const original=sourceManifest.find(source=>source.name===row.official_image?.split('/').pop());expect(original).toBeDefined();
   await expect(section.getByRole('link',{name:'查看原始截图来源'})).toHaveAttribute('href',original!.display_url);
   await expect(section.locator('.baseline img')).toHaveAttribute('src',/^data:image\/png;base64,/);
  }
 }
 await expect(page.locator('#module-picture .baseline')).toContainText('没有直接等价');
 await expect(page.locator('#module-spacer .baseline')).toContainText('此说明不是卡片渲染');
 await expect(page.locator('#module-laundry figcaption')).toContainText('非完整组合或专用卡');
 await expect(page.locator('#module-summary figcaption')).toContainText('新 Template，非 Legacy');
 await decodedImages(page);await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:testInfo.outputPath('acceptance-desktop-all-23.png'),fullPage:true,animations:'disabled'});
 for(const [index,row] of mapping.entries())await page.locator(`#module-${row.profile}`).screenshot({path:testInfo.outputPath(`acceptance-${String(index+1).padStart(2,'0')}-${row.profile}.png`),animations:'disabled'});
 verify();
});

test('acceptance: mobile 390 and narrow 320 capture real layout without overflow',async({page},testInfo)=>{
 test.setTimeout(120_000);const verify=observe(page);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await openAcceptance(page);await decodedImages(page);
  const overflow=await page.evaluate(limit=>{const nodes:Element[]=[];const visit=(root:Document|ShadowRoot)=>{for(const e of root.querySelectorAll('*')){nodes.push(e);if(e.shadowRoot)visit(e.shadowRoot);}};visit(document);return {inner:innerWidth,outer:outerWidth,visual:visualViewport?.width,scrollX,html:document.documentElement.getBoundingClientRect().toJSON(),body:document.body.getBoundingClientRect().toJSON(),entries:nodes.filter(e=>e.getBoundingClientRect().right>limit+1||e.getBoundingClientRect().left< -1||e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,class:e.className,text:e.textContent?.slice(0,80),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,client:e.clientWidth,scroll:e.scrollWidth,host:(e.getRootNode() as ShadowRoot).host?.tagName}))};},width);
  console.log('MOBILE_LAYOUT',JSON.stringify(overflow));
  await page.screenshot({path:testInfo.outputPath(`diagnostic-mobile-${width}.png`),fullPage:true,animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth),JSON.stringify(overflow)).toBeLessThanOrEqual(width);
  for(const row of mapping){
   const section=page.locator(`#module-${row.profile}`);
   const boxes=await section.locator('.pair > article').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
   expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom);
   for(const box of boxes){expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);}
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  const family=page.getByRole('combobox',{name:'模块家族'});await family.focus();await family.press('Enter');
  const popup=page.getByRole('listbox',{name:'模块家族'});await expect(popup).toBeVisible();
  const popupBox=await popup.boundingBox();expect(popupBox!.x).toBeGreaterThanOrEqual(0);expect(popupBox!.x+popupBox!.width).toBeLessThanOrEqual(width);
  await family.press('Escape');await expect(popup).toHaveCount(0);await expect(family).toBeFocused();
  await page.screenshot({path:testInfo.outputPath(`acceptance-mobile-${width}-all-23.png`),fullPage:true,animations:'disabled'});
 }
 verify();
});

test('acceptance: filters, shared states, switch, failures, pending release and reset',async({page})=>{
 const verify=observe(page);await openAcceptance(page);
 const family=page.getByRole('combobox',{name:'模块家族'}),module=page.getByRole('combobox',{name:'独立模块'}),state=page.getByRole('combobox',{name:'右侧模拟状态'});
 await chooseOption(family,'温控');await expect(page.locator('.comparison')).toHaveCount(1);await expect(page.locator('#module-climate')).toBeVisible();
 await chooseOption(family,'全部家族');await chooseOption(module,'3. 门廊的小灯 · light');await expect(page.locator('.comparison')).toHaveCount(1);
 const light=page.locator('island-light-card');
 await light.getByRole('switch',{name:'关闭',exact:true}).click();await expect(light.getByRole('switch',{name:'开启',exact:true})).toHaveAttribute('aria-checked','false');
 await page.getByText('查看模拟调用记录（1）',{exact:true}).click();await expect(page.locator('.controls details')).toContainText('light.turn_off');await expect(page.locator('.controls details')).toContainText('light.demo_lantern');
 await chooseOption(module,'全部 23 个模块');await expect(page.locator('.comparison')).toHaveCount(23);
 await expect(page.locator('island-chips-card')).toContainText('已关闭');
 await chooseOption(state,'关闭 / 完成');await expect(light.getByRole('switch',{name:'开启',exact:true})).toHaveAttribute('aria-checked','false');
 await chooseOption(state,'暂停');await expect(page.locator('island-media-card')).toContainText('已暂停');await expect(page.locator('island-printer-card')).toContainText('已暂停');
 await chooseOption(state,'不可用');await expect(light).toContainText('不可用');await expect(light.getByRole('switch')).toHaveCount(0);
 await chooseOption(state,'只读');await expect(light.getByRole('switch')).toBeDisabled();
 await chooseOption(state,'操作失败');await light.getByRole('switch',{name:'关闭',exact:true}).click();await expect(light).toContainText('操作失败，请检查连接与设备后重试。');
 await chooseOption(state,'等待响应');await light.getByRole('switch',{name:'关闭',exact:true}).click();
 const release=page.getByRole('button',{name:'释放待响应操作（1）',exact:true});await expect(release).toBeEnabled();await release.click();
 await expect(light.getByRole('switch',{name:'开启',exact:true})).toHaveAttribute('aria-checked','false');
 await page.getByRole('button',{name:'重置模拟',exact:true}).click();
 await expect(state).toContainText('默认 / 运行');await expect(page.locator('.controls details summary')).toHaveText('查看模拟调用记录（0）');await expect(light.getByRole('switch',{name:'关闭',exact:true})).toHaveAttribute('aria-checked','true');
 verify();
});

test('acceptance: laundry pause and resume require confirmation and completed hides actions',async({page})=>{
 const verify=observe(page);await openAcceptance(page);
 await chooseOption(page.getByRole('combobox',{name:'独立模块'}),'13. 洗衣房的小日常 · laundry');
 const laundry=page.locator('island-laundry-card');
 await laundry.getByRole('button',{name:'暂停洗衣',exact:true}).click();
 await expect(laundry.getByRole('region',{name:'操作确认',exact:true})).toContainText('确认暂停洗衣？');
 await expect(page.locator('.controls details summary')).toHaveText('查看模拟调用记录（0）');
 await laundry.getByRole('button',{name:'确认执行',exact:true}).click();
 await expect(laundry.getByRole('button',{name:'继续洗衣',exact:true})).toBeVisible();
 await expect(laundry.getByRole('button',{name:'暂停洗衣',exact:true})).toHaveCount(0);
 await page.locator('.controls details summary').click();
 await expect(page.locator('.controls details')).toContainText('button.demo_laundry_pause');
 await laundry.getByRole('button',{name:'继续洗衣',exact:true}).click();
 await expect(laundry.getByRole('region',{name:'操作确认',exact:true})).toContainText('确认继续洗衣？');
 await expect(page.locator('.controls details summary')).toHaveText('查看模拟调用记录（1）');
 await laundry.getByRole('button',{name:'确认执行',exact:true}).click();
 await expect(laundry.getByRole('button',{name:'暂停洗衣',exact:true})).toBeVisible();
 await expect(page.locator('.controls details')).toContainText('button.demo_laundry_resume');
 await chooseOption(page.getByRole('combobox',{name:'右侧模拟状态'}),'关闭 / 完成');
 await expect(laundry).toContainText('已完成');
 await expect(laundry.getByRole('button',{name:'暂停洗衣',exact:true})).toHaveCount(0);
 await expect(laundry.getByRole('button',{name:'继续洗衣',exact:true})).toHaveCount(0);
 verify();
});
