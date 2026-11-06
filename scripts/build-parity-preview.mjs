import {build} from 'esbuild';
import {readFile,writeFile,mkdir,cp,access} from 'node:fs/promises';
import path from 'node:path';
const out=process.env.PARITY_PREVIEW_OUT||'_parity-preview';
const input=process.env.PARITY_EVIDENCE_INPUT||'demo/parity';
await mkdir(out,{recursive:true});
const data=JSON.parse(await readFile('demo/parity/fixtures.json','utf8'));
const evidence=JSON.parse(await readFile(`${input}/runtime-evidence.json`,'utf8'));
const sources=JSON.parse(await readFile('demo/reference/image-sources.json','utf8'));
const images={};
for(const row of data.cases){const filename=`${row.kind==='chip'?'chip-':''}${row.name}-light.png`;const source=sources.find(s=>s.name===filename);if(row.kind==='badge'||!source)continue;await mkdir(`${out}/reference`,{recursive:true});await cp(`demo/reference/images/${filename}`,`${out}/reference/${filename}`);images[row.id]={path:`reference/${filename}`,source:source.display_url};}
for(const [id,entry] of Object.entries(evidence.cases)){for(const side of ['original','island']){const rel=entry[side];if(!rel)continue;if(typeof rel!=='string'||path.isAbsolute(rel)||rel.includes('..')||/^\w+:/.test(rel))throw new Error(`Invalid evidence path ${id}`);await access(`${input}/${rel}`);await mkdir(path.dirname(`${out}/${rel}`),{recursive:true});await cp(`${input}/${rel}`,`${out}/${rel}`);}}
const result=await build({entryPoints:['src/parity-showcase.tsx'],write:false,bundle:true,format:'iife',minify:true,target:'es2022',loader:{'.svg':'dataurl'},define:{'process.env.NODE_ENV':'"production"',PARITY_DATA:JSON.stringify(data),PARITY_EVIDENCE:JSON.stringify(evidence),PARITY_IMAGES:JSON.stringify(images)},plugins:[{name:'single-local-style',setup(b){b.onResolve({filter:/^animal-island-ui\/style$/},()=>({path:'style',namespace:'skip'}));b.onLoad({filter:/.*/,namespace:'skip'},()=>({contents:'',loader:'js'}));b.onLoad({filter:/node_modules\/animal-island-ui\/.*\.css$/},()=>({contents:'',loader:'js'}));}}]});
let css=await readFile('node_modules/animal-island-ui/dist/index.css','utf8');
css=css.replace(/@import\s+[^;]+;/g,'').replace(/@font-face\s*\{[^}]*\}/g,'');
css+='\n'+await readFile('demo/parity/style.css','utf8');
if(/@font-face|\.woff2?|url\(["']?https?:\/\//.test(css))throw new Error('Remote assets/fonts forbidden');
await writeFile(`${out}/showcase.js`,result.outputFiles[0].text);await writeFile(`${out}/style.css`,css);
await writeFile(`${out}/index.html`,'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mushroom × Animal Island · 30 项全量对照</title><link rel="stylesheet" href="./style.css"></head><body><div id="root"></div><script defer src="./showcase.js"></script></body></html>');
for(const file of ['fixtures.json','runtime-evidence.json'])await cp(`${input}/${file}`,`${out}/${file}`);
if(evidence.validation)await cp(`${input}/validation-summary.json`,`${out}/validation-summary.json`);
await cp('THIRD_PARTY_NOTICES.md',`${out}/THIRD_PARTY_NOTICES.md`);await cp('demo/reference/LICENSE',`${out}/Mushroom-LICENSE`);await cp('LICENSE',`${out}/LICENSE`);await cp('licenses',`${out}/licenses`,{recursive:true});await writeFile(`${out}/.nojekyll`,'');
console.log(`Built ${out}: 30 complete source rows; ${Object.keys(images).length} official reference images; ${Object.keys(evidence.cases).length} runtime evidence entries. No HA runtime simulated.`);
