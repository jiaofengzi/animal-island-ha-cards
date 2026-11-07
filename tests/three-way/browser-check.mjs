import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,sep} from 'node:path';
import {chromium,expect} from '@playwright/test';
const root=resolve(process.argv[2]||'_site');
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+sep))throw new Error('Invalid path');const bytes=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.json')?'application/json':file.endsWith('.zip')?'application/zip':'text/html');res.end(bytes);}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const results=[];
try{
 browser=await chromium.launch({headless:true,...(process.env.ISLAND_CHROMIUM_PATH?{executablePath:process.env.ISLAND_CHROMIUM_PATH}:{})});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/three-way/`;
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});await page.goto(url);await expect(page.locator('#modules .module')).toHaveCount(30);
  for(const viewport of ['desktop','mobile']){
   await page.selectOption('#viewport',viewport);await expect(page.locator('#modules .capture')).toHaveCount(90);await expect(page.locator('#modules .blank')).toHaveCount(6);
   await expect(page.locator('#modules img')).toHaveCount(84);await expect(page.locator('#scenarios img')).toHaveCount(9);
   const images=await page.locator('img').evaluateAll(async images=>{for(const image of images){image.loading='eager';await image.decode();}return images.map(image=>({src:image.getAttribute('src'),ok:image.complete&&image.naturalWidth>0}));});
   assert.ok(images.every(i=>i.ok&&i.src.endsWith(`-${viewport}.png`)),'All images decode and selected viewport applies');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal overflow ${width}/${viewport}`);
   const columns=await page.locator('#modules .triptych').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);assert.equal(columns,width>760?3:1);
   results.push({width,viewport,modules:30,images:images.length,overflow:false,columns});
  }
  await page.selectOption('#category','chip');await expect(page.locator('#modules .module')).toHaveCount(11);
  await page.selectOption('#category','badge');await expect(page.locator('#modules .module')).toHaveCount(1);
  await page.selectOption('#category','card');await expect(page.locator('#modules .module')).toHaveCount(18);
  await page.selectOption('#category','all');await page.fill('#search','template');await expect(page.locator('#modules .module')).toHaveCount(3);
  await page.fill('#search','not-a-module');await expect(page.locator('#modules .module')).toHaveCount(0);
  await page.fill('#search','');await expect(page.locator('#modules .module')).toHaveCount(30);
  await page.locator('summary').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Provenance expansion does not overflow');
 }
 const installer=await page.request.get(url+'downloads/animal-island-ha-cards.zip');assert.ok(installer.ok());assert.equal((await installer.body()).subarray(0,2).toString(),'PK');
 assert.deepEqual(errors,[]);await mkdir('ha-evidence/three-way',{recursive:true});await writeFile('ha-evidence/three-way/gallery-browser-check.json',JSON.stringify({status:'passed',results,frontendErrors:errors},null,2));console.log('Gallery browser checks passed: rows, filters, search, both capture modes, image decoding, 3 widths, blanks, installer and no overflow.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
