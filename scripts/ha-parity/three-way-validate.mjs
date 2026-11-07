import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {modules,variants,expectedBlank,PREVIOUS_COMMIT,REDESIGN_COMMIT} from './three-way-fixtures.mjs';
import {states,HA_VERSION} from './fixtures.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function validateEvidence(dir,expectedCommit){
 const e=JSON.parse(await readFile(resolve(dir,'evidence.json'),'utf8'));
 assert.equal(e.schemaVersion,1);assert.equal(e.status,'captured');assert.equal(e.host,'authenticated Home Assistant');assert.equal(e.haVersion,HA_VERSION);
 assert.equal(e.pageErrors,0);assert.equal(e.promiseRejections,0);assert.equal(e.provenance.commit,expectedCommit);assert.match(expectedCommit,/^[a-f0-9]{40}$/);
 assert.equal(e.provenance.artifacts.previous.commit,PREVIOUS_COMMIT);assert.equal(e.provenance.artifacts.redesign.designCommit,REDESIGN_COMMIT);assert.equal(e.provenance.artifacts.redesign.commit,expectedCommit);assert.equal(e.provenance.artifacts.official.version,'5.2.3');
 for(const v of variants){const a=e.provenance.artifacts[v.id];assert.match(a.sha256,/^[a-f0-9]{64}$/);assert.ok(a.version);}
 assert.deepEqual(e.fixtureStates,states);assert.equal(modules.length,30);assert.equal(e.captures.length,180);assert.equal(e.scenarios.length,18);
 const keys=e.captures.map(r=>[r.module,r.variant,r.viewport].join('/'));
 assert.equal(new Set(keys).size,180,'Duplicate capture');
 const seen=new Set();const files=new Set();
 async function image(row){assert.match(row.image,/^images\/[a-z0-9-]+\.png$/);assert.ok(!files.has(row.image),'Duplicate image');files.add(row.image);const bytes=await readFile(resolve(dir,row.image));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(bytes.length>100);assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0);assert.equal(sha(bytes),row.imageSha256);}
 for(const row of e.captures){
  const module=modules.find(m=>m.id===row.module);assert.ok(module);assert.ok(variants.some(v=>v.id===row.variant));assert.ok(['desktop','mobile'].includes(row.viewport));
  const key=[row.module,row.variant,row.viewport].join('/');assert.ok(!seen.has(key),'Duplicate capture');seen.add(key);
  assert.ok(row.containerWidth>0);assert.deepEqual(row.fixture,module.config);assert.equal(row.fixtureStatesSha256,sha(JSON.stringify(states)));assert.equal(row.haVersion,HA_VERSION);assert.equal(row.fonts.status,'loaded');
  assert.equal(row.fonts.faces.filter(f=>f.family.includes('Island Rounded')&&f.status==='loaded').length,3);assert.ok(row.fonts.faces.some(f=>f.family.includes('Island Nunito')&&f.status==='loaded'));
  if(expectedBlank(row.module)){assert.equal(row.status,'expected-blank');assert.equal(row.image,null);}else{assert.equal(row.status,'captured');assert.ok(row.box.width>0&&row.box.height>0);await image(row);}
 }
 for(const m of modules)for(const v of variants)for(const viewport of ['desktop','mobile'])assert.ok(seen.has([m.id,v.id,viewport].join('/')));
 for(const module of modules.filter(m=>m.id.startsWith('card:')))for(const viewport of ['desktop','mobile']){
  const rows=e.captures.filter(r=>r.module===module.id&&r.viewport===viewport);
  assert.ok(Math.max(...rows.map(r=>r.containerWidth))-Math.min(...rows.map(r=>r.containerWidth))<=1,'Unequal card containers');
  if(!expectedBlank(module.id))assert.ok(Math.max(...rows.map(r=>r.box.width))-Math.min(...rows.map(r=>r.box.width))<=1,'Unequal card widths');
 }
 const scenarios=new Set();for(const row of e.scenarios){assert.equal(row.entity,'light.parity');assert.ok(['on','off','unavailable'].includes(row.state));assert.ok(variants.some(v=>v.id===row.variant));assert.ok(['desktop','mobile'].includes(row.viewport));const key=[row.state,row.variant,row.viewport].join('/');assert.ok(!scenarios.has(key));scenarios.add(key);await image(row);}
 return e;
}
