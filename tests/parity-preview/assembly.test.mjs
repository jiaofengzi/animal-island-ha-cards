import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {validateEvidence} from '../../scripts/assemble-parity-preview.mjs';
const sha='a'.repeat(40);
test('release rejects missing exact tested commit',async()=>{await assert.rejects(validateEvidence('/nonexistent',null),/GITHUB_SHA/);});
for(const [name,summary] of [
 ['bootstrap blocked',{runtimeStatus:'not_run_or_bootstrap_blocked',tests:[]}],
 ['empty results',{runtimeStatus:'executed',tests:[]}],
 ['failed test',{runtimeStatus:'executed',tests:[{status:'unexpected',results:[{status:'failed',duration:1}]}]}],
 ['flaky test',{runtimeStatus:'executed',tests:[{status:'flaky',results:[{status:'failed',duration:1},{status:'passed',duration:1}]}]}],
 ['failed retry hidden behind expected',{runtimeStatus:'executed',tests:[{status:'expected',results:[{status:'failed',duration:1},{status:'passed',duration:1}]}]}],
 ['skipped test',{runtimeStatus:'executed',tests:[{status:'skipped',results:[{status:'skipped',duration:0}]}]}],
 ['missing expected tests',{runtimeStatus:'executed',tests:[{title:'invented test',status:'expected',results:[{status:'passed',duration:1}]}]}]
])test(`release rejects ${name}`,async()=>{const dir=await mkdtemp(path.join(tmpdir(),'parity-negative-test-'));try{await writeFile(path.join(dir,'summary.json'),JSON.stringify(summary));await assert.rejects(validateEvidence(dir,sha));}finally{await rm(dir,{recursive:true,force:true});}});
