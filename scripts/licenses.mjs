import {readFile,writeFile,mkdir} from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const allowed=new Set(['MIT','Apache-2.0','ISC','BSD-2-Clause','BSD-3-Clause','0BSD','Python-2.0','(MIT OR CC0-1.0)','BlueOak-1.0.0']);
const packages=Object.entries(lock.packages).filter(([p])=>p).map(([path,p])=>({path,version:p.version,license:p.license,resolved:p.resolved}));
const unknown=packages.filter(p=>!allowed.has(p.license));
await mkdir('docs',{recursive:true});await writeFile('docs/dependency-licenses.json',JSON.stringify(packages,null,2)+'\n');
if(unknown.length)throw new Error('Unreviewed licenses: '+JSON.stringify(unknown));
console.log(`Reviewed ${packages.length} locked packages, including locally bundled runtime dependencies.`);
