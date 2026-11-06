import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('ha-evidence',{recursive:true});
let data=null;try{data=JSON.parse(await readFile('ha-evidence/playwright.json','utf8'));}catch{}
const tests=[];
function visit(suites=[]){for(const s of suites){for(const spec of s.specs||[])for(const t of spec.tests||[])tests.push({title:spec.title,status:t.status,results:t.results.map(r=>({status:r.status,duration:r.duration}))});visit(s.suites);}}
visit(data?.suites);
await writeFile('ha-evidence/summary.json',JSON.stringify({scope:'Representative live HA parity, not exhaustive acceptance',runtimeStatus:data?'executed':'not_run_or_bootstrap_blocked',tests,acceptance:{total:1131,requiresHA:392,individuallyMappedPassed:0},unverified:['Full 1,131 case-by-case acceptance','All hardware-domain service effects (synthetic states do not implement integrations)','All editor interactions and config-changed events','Full action/touch/keyboard matrix beyond representative hold and double-tap','All error/unavailable/unknown entity combinations','All min/max constraints and feature options','Reconnect and template unsubscribe leak accounting']},null,2));
console.log(`Recorded ${tests.length} representative results. No blanket acceptance claim.`);
