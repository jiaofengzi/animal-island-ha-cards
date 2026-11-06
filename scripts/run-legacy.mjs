// Isolate the superseded React proof of concept so it cannot overwrite parity bundles.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, '.cache/legacy-project');
await fs.mkdir(destination, { recursive: true });
for (const entry of ['src','demo','tests','scripts','licenses','LICENSE','THIRD_PARTY_NOTICES.md','tsconfig.json','eslint.config.js','playwright.config.ts']) {
 try { await fs.cp(path.join(root,entry),path.join(destination,entry),{recursive:true,force:true}); }
 catch (error) { if (error.code !== 'ENOENT') throw error; }
}
try { await fs.symlink(path.join(root,'node_modules'),path.join(destination,'node_modules'),'dir'); } catch(e) { if(e.code!=='EEXIST') throw e; }
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
pkg.scripts.build='node scripts/build.mjs';
pkg.scripts['build:showcase']='npm run build && node scripts/build-showcase.mjs';
pkg.scripts['build:acceptance']='npm run build && node scripts/build-acceptance.mjs';
pkg.scripts.check='npm run lint && npm run typecheck && npm run test && npm run build:showcase && npm run build:acceptance && npm run test:browser && npm run licenses';
await fs.writeFile(path.join(destination,'package.json'),JSON.stringify(pkg,null,2)+'\n');
const action = process.argv[2] || 'build';
if (!['build','build:showcase','build:acceptance','check'].includes(action)) throw new Error('Unknown legacy action');
const result=spawnSync('npm',['run',action],{cwd:destination,stdio:'inherit'});
console.log('Legacy output is isolated under .cache/legacy-project; it is not the parity release.');
process.exitCode=result.status ?? 1;
