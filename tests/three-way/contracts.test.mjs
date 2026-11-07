import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {modules,variants,expectedBlank,threeWayViews,PREVIOUS_COMMIT} from '../../scripts/ha-parity/three-way-fixtures.mjs';
import {validateEvidence} from '../../scripts/ha-parity/three-way-validate.mjs';
test('30 modules and 3 separate real HA views preserve shared configuration',()=>{
 assert.equal(modules.length,30);assert.equal(new Set(modules.map(m=>m.id)).size,30);
 assert.equal(modules.filter(m=>m.id.startsWith('card:')).length,18);assert.equal(modules.filter(m=>m.id.startsWith('chip:')).length,11);
 assert.deepEqual(modules.filter(m=>expectedBlank(m.id)).map(m=>m.id),['card:empty','chip:spacer']);
 const views=threeWayViews();assert.equal(views.length,3);
 for(let i=0;i<3;i++){assert.equal(views[i].cards.length,18);assert.equal(views[i].badges.length,1);assert.equal(views[i].path,`three-way-${variants[i].id}`);}
 const configs=views.map(v=>v.cards.map(({type,...config})=>{assert.ok(type.startsWith('custom:'));return config;}));assert.deepEqual(configs[0],configs[1]);assert.deepEqual(configs[1],configs[2]);
});
test('publication fails closed without real evidence',async()=>{const dir=await mkdtemp(join(tmpdir(),'three-way-empty-'));await assert.rejects(()=>validateEvidence(dir,'a'.repeat(40)),/ENOENT/);});
test('publication rejects partial, stale and spoofed host evidence',async()=>{const dir=await mkdtemp(join(tmpdir(),'three-way-invalid-'));for(const bad of [{schemaVersion:0},{schemaVersion:1,status:'captured',host:'mock browser'},{schemaVersion:1,status:'captured',host:'authenticated Home Assistant',haVersion:'2026.9.0',pageErrors:0,promiseRejections:0,provenance:{commit:'old'}}]){await writeFile(join(dir,'evidence.json'),JSON.stringify(bad));await assert.rejects(()=>validateEvidence(dir,'a'.repeat(40)));}});
test('historical build isolation is mechanically reversible (no skin substitution)',async()=>{
 const built=await readFile('_parity/island-previous.js','utf8');const original=await readFile('.cache/previous-version/dist/island-ha-cards.js','utf8');
 assert.equal(built.replaceAll('previous-island-','island-').replace('PREFIX_NAME = "previous-island"','PREFIX_NAME = "island"'),original);
 const provenance=JSON.parse(await readFile('_parity/three-way-provenance.json','utf8'));assert.equal(provenance.artifacts.previous.commit,PREVIOUS_COMMIT);assert.equal(provenance.artifacts.previous.transform.kind,'namespace-only');
});
test('gallery is screenshots, not a mock HA or iframe masquerading as evidence',async()=>{const html=await readFile('demo/three-way/index.html','utf8');const js=await readFile('demo/three-way/app.js','utf8');assert.ok(html.includes('截图里的按钮不可操作'));assert.ok(html.includes('href="../"'));assert.ok(js.includes("element('img')"));assert.ok(!html.includes('<iframe'));assert.ok(!js.includes('setConfig'));});
test('publication rejects duplicate observations before reading any image',async()=>{
 const {states,HA_VERSION}=await import('../../scripts/ha-parity/fixtures.mjs');const {REDESIGN_COMMIT}=await import('../../scripts/ha-parity/three-way-fixtures.mjs');
 const commit='a'.repeat(40),dir=await mkdtemp(join(tmpdir(),'three-way-duplicate-'));
 const artifacts=Object.fromEntries(variants.map(v=>[v.id,{sha256:'b'.repeat(64),version:'5.2.3',commit:v.id==='previous'?PREVIOUS_COMMIT:commit,designCommit:REDESIGN_COMMIT}]));
 await writeFile(join(dir,'evidence.json'),JSON.stringify({schemaVersion:1,status:'captured',host:'authenticated Home Assistant',haVersion:HA_VERSION,pageErrors:0,promiseRejections:0,provenance:{commit,artifacts},fixtureStates:states,captures:Array(180).fill({module:'card:light',variant:'official',viewport:'desktop'}),scenarios:Array(18).fill({})}));
 await assert.rejects(()=>validateEvidence(dir,commit),/Duplicate capture/);
});
