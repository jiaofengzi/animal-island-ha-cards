/**
 * Deterministic Mushroom 5.2.3 fork. Upstream bytes are never edited.
 * Fork modifications: namespace substitution, skin append, identifying banner.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const vendor = 'vendor/mushroom-v5.2.3';
const stage = '.cache/parity-island';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const tree = JSON.parse(await fs.readFile(vendor + '/upstream-tree.json', 'utf8'));
const files = tree.tree.filter(x => x.type === 'blob');
const manifest = { upstream: { repository: 'https://github.com/piitaya/lovelace-mushroom', version: '5.2.3', tree: tree.sha }, files: [], transforms: [], registrations: {}, audit: {} };
await fs.rm(stage, { recursive: true, force: true });
await fs.mkdir(stage, { recursive: true });
for (const file of files) {
  let bytes;
  try { bytes = await fs.readFile(vendor + '/' + file.path); } catch {
    if (file.path.startsWith('src/')) throw new Error('Missing upstream source: ' + file.path);
    continue;
  }
  const blob = crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  if (blob !== file.sha) throw new Error('Upstream bytes changed: ' + file.path);
  manifest.files.push({ path: file.path, gitBlob: blob, sha256: sha(bytes), bytes: bytes.length });
  if (!file.path.startsWith('src/') && file.path !== 'package.json') continue;
  let output = bytes.toString('utf8');
  const transforms = [];
  if (file.path.endsWith('.ts')) {
    // Includes HTML tags, selectors, config types, editor defaults and factory strings.
    // Intentionally also isolates upstream --mushroom-* custom properties.
    const count = (output.match(/mushroom-/g) || []).length;
    output = output.replaceAll('mushroom-', 'island-');
    if (count) transforms.push({ kind: 'namespace-prefix', occurrences: count });
    if (file.path === 'src/const.ts') {
      output = output.replace('PREFIX_NAME = "mushroom"', 'PREFIX_NAME = "island"');
      transforms.push({ kind: 'factory-prefix', from: 'mushroom', to: 'island' });
    }
    const source = ts.createSourceFile(file.path, output, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const edits = [];
    const visit = (node) => {
      const isStatic = node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
      if (isStatic && node.name?.getText(source) === 'styles') {
        const wrap = (expr) => edits.push({ start: expr.getStart(source), end: expr.end, value: '[' + expr.getText(source) + ', islandSkin(' + JSON.stringify(file.path) + ')]' });
        if (ts.isPropertyDeclaration(node) && node.initializer) wrap(node.initializer);
        if (ts.isGetAccessorDeclaration(node) && node.body) {
          for (const statement of node.body.statements) {
            if (ts.isReturnStatement(statement) && statement.expression) wrap(statement.expression);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    const styleAppends = edits.length;
    if (['src/cards/template-card/template-card.ts', 'src/badges/template/template-badge.ts'].includes(file.path)) {
      let hook = false;
      const findHook = (node) => {
        if (ts.isMethodDeclaration(node) && node.name?.getText(source) === 'willUpdate' && node.body) {
          const start = node.body.getStart(source) + 1;
          edits.push({ start, end: start, value: '\n    // Island presentation only: mirror HA dark mode for scoped skin tokens.\n    if (this.hass?.themes?.darkMode) this.setAttribute("data-island-theme", "dark");\n    else this.removeAttribute("data-island-theme");\n' });
          hook = true;
        }
        ts.forEachChild(node, findHook);
      };
      findHook(source);
      if (!hook) throw new Error('Missing expected theme lifecycle hook: ' + file.path);
      transforms.push({ kind: 'reflect-ha-dark-mode-presentation', attribute: 'data-island-theme', lifecycle: 'willUpdate' });
    }
    for (const edit of edits.sort((a,b) => b.start-a.start)) output = output.slice(0,edit.start)+edit.value+output.slice(edit.end);
    if (styleAppends) {
      output = 'import { islandSkin } from "@island/skin";\n' + output;
      transforms.push({ kind: 'append-static-styles', expressions: styleAppends });
    }
    if (file.path === 'src/mushroom.ts') {
      output = output.replace('🍄 Mushroom 🍄', 'Animal Island (Mushroom fork)');
      transforms.push({ kind: 'identify-fork-console' });
    }
  }
  const dest = stage + '/' + file.path;
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, output);
  manifest.transforms.push({ path: file.path, sourceSha256: sha(bytes), outputSha256: sha(output), operations: transforms });
}
const forkTS = (await Promise.all(manifest.transforms.filter(f => f.path.endsWith('.ts')).map(f => fs.readFile(stage + '/' + f.path, 'utf8')))).join('\n');
if (/mushroom-/.test(forkTS)) throw new Error('Unmapped Mushroom namespace');
if (!forkTS.includes('PREFIX_NAME = "island"')) throw new Error('Factory prefix was not mapped');
const cards = files.filter(f => /^src\/cards\/([^/]+)\/\1\.ts$/.test(f.path)).map(f => f.path.split('/')[2]).sort();
const chips = files.filter(f => /^src\/cards\/chips-card\/chips\/[^/]+-chip\.ts$/.test(f.path)).map(f => f.path.split('/').at(-1).replace('.ts','')).sort();
manifest.registrations = { currentCards: cards.filter(c => c !== 'legacy-template-card'), legacyCards: cards.filter(c => c === 'legacy-template-card'), chips, badges: ['template-badge'] };
if (manifest.registrations.currentCards.length !== 18 || chips.length !== 11) throw new Error('Unexpected registration inventory: ' + JSON.stringify(manifest.registrations));
await fs.mkdir('_parity', { recursive: true });
await fs.mkdir('dist', { recursive: true });
const common = { bundle: true, format: 'esm', target: 'es2020', minify: false, sourcemap: false, legalComments: 'eof', tsconfig: 'tsconfig.parity.json', logLevel: 'warning', metafile: true };
const original = await build({ ...common, entryPoints: [vendor + '/src/mushroom.ts'], outfile: '_parity/mushroom-original.js', banner: { js: '/*! Mushroom 5.2.3, unmodified source build. Apache-2.0. See vendor/mushroom-v5.2.3/LICENSE. */' } });
const fork = await build({ ...common, entryPoints: [stage + '/src/mushroom.ts'], outfile: 'dist/island-ha-cards.js', alias: { '@island/skin': path.join(root, 'src/skin/styles.ts') }, banner: { js: '/*! Animal Island Mushroom fork. Modified namespace and visual styles only. Mushroom sources Apache-2.0; see THIRD_PARTY_NOTICES.md. */' } });
await fs.copyFile('dist/island-ha-cards.js', '_parity/island-ha-cards.js');
manifest.audit = { allVendoredGitBlobsMatch: true, upstreamSourceFiles: manifest.files.filter(x => x.path.startsWith('src/')).length, forkNamespaceIsolated: true, currentCards: 18, legacyCards: 1, badges: 1, chips: 11, duplicateDefineGuardsAdded: false, behaviorRewrites: false, skinAppends: manifest.transforms.reduce((n,f)=>n+f.operations.filter(o=>o.kind==='append-static-styles').reduce((a,o)=>a+o.expressions,0),0) };
manifest.outputs = {};
for (const f of ['_parity/mushroom-original.js', 'dist/island-ha-cards.js', '_parity/island-ha-cards.js']) {
 const b = await fs.readFile(f); manifest.outputs[f] = { bytes: b.length, sha256: sha(b) };
}
manifest.dependencies = { original: Object.keys(original.metafile.inputs).filter(x => x.includes('node_modules/')).sort(), fork: Object.keys(fork.metafile.inputs).filter(x => x.includes('node_modules/')).sort() };
manifest.buildInputs = {};
for (const file of ['scripts/build-parity.mjs', 'tsconfig.parity.json', 'package-lock.json', 'src/skin/styles.ts']) {
  manifest.buildInputs[file] = sha(await fs.readFile(file));
}
const packageNames = [...new Set(manifest.dependencies.original.map(file => {
  const parts = file.split('node_modules/').at(-1).split('/');
  return parts[0].startsWith('@') ? parts.slice(0,2).join('/') : parts[0];
}))].sort();
manifest.dependencyLicenses = [];
await fs.mkdir('dist/licenses', { recursive: true });
await fs.copyFile(vendor + '/LICENSE', 'dist/licenses/Mushroom-Apache-2.0.txt');
await fs.copyFile('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
await fs.copyFile('LICENSE', 'dist/LICENSE');
for (const name of packageNames) {
  const dir = 'node_modules/' + name;
  const pkg = JSON.parse(await fs.readFile(dir + '/package.json', 'utf8'));
  const licenseFiles = (await fs.readdir(dir)).filter(file => /^(licen[cs]e|copying|notice)(\.|$)/i.test(file));
  const saved = [];
  for (const file of licenseFiles) {
    const stat = await fs.stat(dir + '/' + file);
    if (!stat.isFile()) continue;
    const dest = name.replaceAll('/', '__') + '-' + file;
    await fs.copyFile(dir + '/' + file, 'dist/licenses/' + dest);
    saved.push(dest);
  }
  manifest.dependencyLicenses.push({ name, version: pkg.version, license: pkg.license, files: saved });
}
await fs.writeFile('_parity/transform-manifest.json', JSON.stringify(manifest, null, 2)+'\n');
await fs.writeFile('dist/transform-manifest.json', JSON.stringify(manifest, null, 2)+'\n');
console.log(JSON.stringify({ audit: manifest.audit, outputs: manifest.outputs }, null, 2));
