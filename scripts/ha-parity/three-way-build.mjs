/** Build immutable historical source using the exact same lockfile dependency install. */
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {PREVIOUS_COMMIT,REDESIGN_COMMIT} from './three-way-fixtures.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root=resolve(import.meta.dirname,'../..');
const stage=resolve(root,'.cache/previous-version');
await mkdir(stage,{recursive:true});
execFileSync('git',['archive',PREVIOUS_COMMIT,'--output',resolve(root,'.cache/previous-version.tar')],{cwd:root});
execFileSync('tar',['-xf',resolve(root,'.cache/previous-version.tar'),'-C',stage]);
const lock=await readFile(resolve(root,'package-lock.json'));
if(!lock.equals(await readFile(resolve(stage,'package-lock.json'))))throw new Error('Historical lockfile differs: install its exact dependencies separately rather than silently reusing current dependencies');
try{await symlink(resolve(root,'node_modules'),resolve(stage,'node_modules'),'dir');}catch(e){if(e.code!=='EEXIST')throw e;}
execFileSync(process.execPath,['scripts/build-parity.mjs'],{cwd:stage,stdio:'inherit'});
const original=await readFile(resolve(stage,'dist/island-ha-cards.js'),'utf8');
const factoryMatches=original.match(/PREFIX_NAME = "island"/g)||[];
if(factoryMatches.length!==1)throw new Error('Historical factory namespace differs');
const isolated=original.replaceAll('island-','previous-island-').replace('PREFIX_NAME = "island"','PREFIX_NAME = "previous-island"');
await mkdir(resolve(root,'_parity'),{recursive:true});
await writeFile(resolve(root,'_parity/island-previous.js'),isolated);
const manifest=JSON.parse(await readFile(resolve(root,'_parity/transform-manifest.json'),'utf8'));
const current=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const artifacts={official:{file:'mushroom-original.js',version:'5.2.3',sourceTree:manifest.upstream.tree,repository:manifest.upstream.repository},previous:{file:'island-previous.js',version:JSON.parse(await readFile(resolve(stage,'package.json'),'utf8')).version,commit:PREVIOUS_COMMIT,originalBundleSha256:sha(original),transform:{kind:'namespace-only',from:'island-',to:'previous-island-',occurrences:original.split('island-').length-1,factoryPrefix:{from:'island',to:'previous-island'}}},redesign:{file:'island-ha-cards.js',version:pkg.version,commit:current,designCommit:REDESIGN_COMMIT}};
for(const a of Object.values(artifacts))a.sha256=sha(await readFile(resolve(root,'_parity',a.file)));
const fonts={};for(const file of ['island-nunito.woff2','island-rounded-500.woff2','island-rounded-700.woff2','island-rounded-900.woff2'])fonts[file]=sha(await readFile(resolve(root,'dist/fonts',file)));
await writeFile(resolve(root,'_parity/three-way-provenance.json'),JSON.stringify({schemaVersion:1,commit:current,lockfileSha256:sha(lock),artifacts,fonts},null,2));
