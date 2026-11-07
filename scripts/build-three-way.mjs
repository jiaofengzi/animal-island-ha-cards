/** Fail closed: never turn missing, stale, partial or fabricated placeholder evidence into a verified page. */
import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {validateEvidence} from './ha-parity/three-way-validate.mjs';
const root=resolve(import.meta.dirname,'..');
const evidenceDir=resolve(root,'ha-evidence/three-way');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const evidence=await validateEvidence(evidenceDir,commit);
assert.deepEqual(evidence.provenance,JSON.parse(await readFile(resolve(root,'_parity/three-way-provenance.json'),'utf8')),'Evidence must match this exact build');
const out=resolve(process.argv[2]||'_parity/three-way');await mkdir(out,{recursive:true});
for(const f of ['index.html','style.css','app.js'])await cp(resolve(root,'demo/three-way',f),resolve(out,f));
await cp(resolve(evidenceDir,'images'),resolve(out,'images'),{recursive:true});
await writeFile(resolve(out,'evidence.json'),JSON.stringify(evidence,null,2));
const html=await readFile(resolve(out,'index.html'),'utf8');
await writeFile(resolve(out,'index.html'),html.replace('<!-- EVIDENCE -->',`<script id="evidence" type="application/json">${JSON.stringify(evidence).replaceAll('<','\\u003c')}</script>`));
console.log(`Validated 180 module observations + 18 state captures. Built ${out}`);
