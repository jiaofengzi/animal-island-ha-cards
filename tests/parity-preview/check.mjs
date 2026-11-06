import {strict as assert} from 'node:assert';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium,expect} from '@playwright/test';
import {states,cards,chips,badge} from '../../scripts/ha-parity/fixtures.mjs';
const fixtures=JSON.parse(await readFile('demo/parity/fixtures.json'));
assert.equal(fixtures.cases.length,30);
assert.equal(fixtures.cases.filter(r=>r.kind==='card').length,18);
assert.equal(fixtures.cases.filter(r=>r.kind==='chip').length,11);
assert.equal(fixtures.cases.filter(r=>r.kind==='badge').length,1);
assert.ok(!fixtures.cases.some(r=>r.name==='legacy-template'));
for(const row of fixtures.cases){assert.equal(row.original_config.type.replace('mushroom-','island-'),row.island_config.type);if(row.kind==='chip'){assert.equal(row.original_config.type,'custom:mushroom-chips-card');assert.equal(row.original_config.chips[0].type,row.name);}}
assert.deepEqual(fixtures.states,states);
for(const row of fixtures.cases){const config=row.kind==='chip'?{type:'custom:mushroom-chips-card',chips:[chips.find(c=>c.type===row.name)]}:row.kind==='badge'?{type:row.type,...badge.config}:{type:row.type,...cards.find(c=>c.name===row.name).config};assert.deepEqual(row.original_config,config);}
const css=await readFile('_parity-preview/style.css','utf8');assert.ok(!/@font-face|\.woff2?|url\(["']?https?:\/\//.test(css));
if(process.env.PARITY_STATIC_ONLY==='1'){console.log('PASS: exact 18+11+1, chip nesting, type mapping, no remote fonts. Browser checks not run.');process.exit(0);}
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(req.url.split('?')[0]);const file=await readFile(`_parity-preview${path==='/'?'/index.html':path}`);res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.png')?'image/png':path.endsWith('.json')?'application/json':'text/html');res.end(file);}catch{res.statusCode=404;res.end('Missing');}});
await new Promise(resolve=>server.listen(4189,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.env.ISLAND_CHROMIUM_PATH?{executablePath:process.env.ISLAND_CHROMIUM_PATH}:{})});
try{
 const evidence=JSON.parse(await readFile('_parity-preview/runtime-evidence.json'));
 const sources=JSON.parse(await readFile('demo/reference/image-sources.json'));
 const expectedImages=fixtures.cases.reduce((sum,row)=>{const ev=evidence.cases[row.id];const blank=side=>Boolean(['card:empty','chip:spacer'].includes(row.id)&&ev?.status==='expected-blank'&&ev.dimensions&&side in ev.dimensions&&(!ev.dimensions[side]||ev.dimensions[side].width<1||ev.dimensions[side].height<1));if(ev?.host&&ev?.state&&['original','island'].every(side=>ev[side]||blank(side)))return sum+['original','island'].filter(side=>!blank(side)&&ev[side]).length;const name=`${row.kind==='chip'?'chip-':''}${row.name}-light.png`;return sum+(row.kind!=='badge'&&sources.some(s=>s.name===name)?1:0);},0);
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const out='tests/parity-preview/artifacts';await mkdir(out,{recursive:true});
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:width===1440?1050:844});await page.goto('http://127.0.0.1:4189');
  await expect(page.locator('[data-module]')).toHaveCount(30);await expect(page.locator('img')).toHaveCount(expectedImages);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);
  for(const row of fixtures.cases.filter(r=>['card:empty','chip:spacer'].includes(r.id))){const ev=evidence.cases[row.id];if(ev?.status==='expected-blank'&&ev.host&&ev.state){const section=page.locator(`[data-module="${row.id}"]`);for(const side of ['original','island']){const box=ev.dimensions?.[side];if(ev.dimensions&&side in ev.dimensions&&(!box||box.width<1||box.height<1)){const article=section.locator('article').nth(side==='original'?0:1);await expect(article.locator('.expected-blank')).toBeVisible();await expect(article.locator('img')).toHaveCount(0);await expect(article).not.toContainText('证据：未验证');}}}}
  for(const row of fixtures.cases){const section=page.locator(`[data-module="${row.id}"]`);await section.scrollIntoViewIfNeeded();for(const img of await section.locator('img').all()){await img.scrollIntoViewIfNeeded();await expect(img).toHaveJSProperty('complete',true);assert.ok(await img.evaluate(el=>el.naturalWidth>0));}await section.screenshot({path:`${out}/${width}-${row.id.replace(':','-')}.png`});}
  await page.screenshot({path:`${out}/${width}-full.png`,fullPage:true});
  const category=page.getByRole('combobox',{name:'组件类别',exact:true});
  await category.scrollIntoViewIfNeeded();await category.focus();await category.press('Enter');await expect(category).toHaveAttribute('aria-expanded','true');await category.press('Escape');await expect(category).toHaveAttribute('aria-expanded','false');
  await category.click();await page.getByRole('option',{name:'Chip 子项',exact:true}).click();await expect(category).toHaveAttribute('aria-expanded','false');await expect(page.locator('[data-module]')).toHaveCount(11);
  await page.getByRole('button',{name:'重置筛选'}).click();await expect(page.locator('[data-module]')).toHaveCount(30);
  const sizes=page.getByRole('combobox',{name:'HA 尺寸契约',exact:true});await sizes.click();await page.getByRole('option',{name:'原生 badge 宿主',exact:true}).click();await expect(sizes).toHaveAttribute('aria-expanded','false');await expect(page.locator('[data-module]')).toHaveCount(1);await expect(page.locator('[data-module]')).toHaveAttribute('data-module','badge:template');
  await page.getByRole('button',{name:'重置筛选'}).click();
  const stateFilter=page.getByRole('combobox',{name:'状态覆盖要求',exact:true});await stateFilter.fill('unavailable');await page.getByRole('option',{name:'unavailable',exact:true}).click();await expect(stateFilter).toHaveAttribute('aria-expanded','false');await expect(page.locator('[data-module]')).toHaveCount(fixtures.cases.filter(r=>r.states.includes('unavailable')||r.initial_state==='unavailable').length);
  await page.getByRole('button',{name:'重置筛选'}).click();
  const modules=page.getByRole('combobox',{name:'独立组件',exact:true});await modules.fill('card:light');await page.getByRole('option',{name:'card:light',exact:true}).click();await expect(modules).toHaveAttribute('aria-expanded','false');await expect(page.locator('[data-module]')).toHaveCount(1);
  await page.getByRole('button',{name:'重置筛选'}).click();
 }
 assert.deepEqual(errors,[]);console.log(`PASS: 30 rows at 1440/390/320, ${expectedImages} sourced images, each row captured, no overflow, keyboard close and filters. These are static preview QA screenshots, not HA runtime evidence.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
