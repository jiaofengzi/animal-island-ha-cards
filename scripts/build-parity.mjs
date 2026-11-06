/**
 * Deterministic Mushroom 5.2.3 fork. Upstream bytes are never edited.
 * Fork modifications: namespace, skin, identifying metadata, theme attributes and passive presentation motion.
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
    // 实体图标换成小岛插画图标；认不出的图标在 island-state-icon 内部仍交给 ha-state-icon。
    const iconCount = (output.match(/ha-state-icon/g) || []).length;
    if (iconCount) {
      output = output.replaceAll('ha-state-icon', 'island-state-icon');
      transforms.push({ kind: 'island-illustrated-icons', occurrences: iconCount });
    }
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
    const motionTarget = {
      'src/shared/button.ts': { name: 'Button', kind: 'button' },
      'src/shared/chip.ts': { name: 'Chip', kind: 'chip' },
      'src/shared/input-number.ts': { name: 'InputNumber', kind: 'input-number' },
    }[file.path];
    if (motionTarget) {
      const classes = source.statements.filter(node => ts.isClassDeclaration(node) && node.name?.text === motionTarget.name);
      if (classes.length !== 1) throw new Error('Unexpected motion host class: ' + file.path);
      const declaration = classes[0];
      if (declaration.members.some(member => member.name?.getText(source) === '_islandMotion')) throw new Error('Motion field collision');
      const start = declaration.members.pos;
      edits.push({ start, end: start, value: '\n  // Island presentation controller; lifecycle cleanup is owned by Lit.\n  private readonly _islandMotion = installIslandMotion(this, ' + JSON.stringify(motionTarget.kind) + ');\n' });
      transforms.push({ kind: 'install-presentation-motion-controller', class: motionTarget.name, surface: motionTarget.kind, lifecycle: 'Lit ReactiveController', inputHandlersChanged: false });
    }

    // Change only human-facing metadata inside these registration calls.
    let pickerLabels = 0;
    const identifyPicker = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
          ['registerCustomCard', 'registerCustomBadge'].includes(node.expression.text)) {
        const metadata = node.arguments[0];
        if (!metadata || !ts.isObjectLiteralExpression(metadata)) throw new Error('Unexpected registration metadata: ' + file.path);
        for (const property of metadata.properties) {
          if (!ts.isPropertyAssignment(property) ||
              !['name', 'description'].includes(property.name.getText(source).replaceAll('"', '').replaceAll("'", ''))) continue;
          if (!ts.isStringLiteral(property.initializer)) throw new Error('Unexpected picker display expression: ' + file.path);
          const from = property.initializer.text;
          const to = from.replaceAll('Mushroom', 'Animal Island');
          if (from !== to) {
            edits.push({ start: property.initializer.getStart(source), end: property.initializer.end, value: JSON.stringify(to) });
            pickerLabels++;
          }
        }
      }
      ts.forEachChild(node, identifyPicker);
    };
    identifyPicker(source);
    if (pickerLabels) transforms.push({ kind: 'identify-fork-picker-metadata', strings: pickerLabels, from: 'Mushroom', to: 'Animal Island' });

    const themeLifecycle = {
      'src/cards/template-card/template-card.ts': 'willUpdate',
      'src/badges/template/template-badge.ts': 'willUpdate',
    }[file.path];
    if (themeLifecycle) {
      let hook = false;
      const findHook = (node) => {
        if (ts.isMethodDeclaration(node) && node.name?.getText(source) === themeLifecycle && node.body) {
          const start = node.body.getStart(source) + 1;
          edits.push({ start, end: start, value: '\n    // Island presentation only: mirror HA dark mode for scoped skin tokens.\n    if (this.hass?.themes?.darkMode) this.setAttribute("data-island-theme", "dark");\n    else this.setAttribute("data-island-theme", "light");\n' });
          hook = true;
        }
        ts.forEachChild(node, findHook);
      };
      findHook(source);
      if (!hook) throw new Error('Missing expected theme lifecycle hook: ' + file.path);
      transforms.push({ kind: 'reflect-ha-dark-mode-presentation', attribute: 'data-island-theme', lifecycle: themeLifecycle, values: ['dark', 'light'] });
    }
    for (const edit of edits.sort((a,b) => b.start-a.start)) output = output.slice(0,edit.start)+edit.value+output.slice(edit.end);
    if (motionTarget) output = 'import { installIslandMotion } from "@island/motion";\n' + output;
    if (styleAppends) {
      output = 'import { islandSkin } from "@island/skin";\n' + output;
      transforms.push({ kind: 'append-static-styles', expressions: styleAppends });
    }
    if (file.path === 'src/mushroom.ts') {
      output = 'import "@island/extras";\n' + output;
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
const motionFiles = manifest.transforms.filter(f => f.operations.some(o => o.kind === 'install-presentation-motion-controller'));
if (motionFiles.length !== 3) throw new Error('Expected only shared Button, Chip and InputNumber motion hosts');
const pickerMetadataFiles = manifest.transforms.filter(f => f.operations.some(o => o.kind === 'identify-fork-picker-metadata'));
if (pickerMetadataFiles.length !== 19) throw new Error('Expected 18 current card picker labels plus one badge');
await fs.mkdir('_parity', { recursive: true });
await fs.mkdir('dist', { recursive: true });
const common = { bundle: true, format: 'esm', target: 'es2020', minify: false, sourcemap: false, legalComments: 'eof', tsconfig: 'tsconfig.parity.json', logLevel: 'warning', metafile: true };
const original = await build({ ...common, entryPoints: [vendor + '/src/mushroom.ts'], outfile: '_parity/mushroom-original.js', banner: { js: '/*! Mushroom 5.2.3, unmodified source build. Apache-2.0. See vendor/mushroom-v5.2.3/LICENSE. */' } });
const fork = await build({ ...common, entryPoints: [stage + '/src/mushroom.ts'], outfile: 'dist/island-ha-cards.js', alias: { '@island/skin': path.join(root, 'src/skin/styles.ts'), '@island/motion': path.join(root, 'src/skin/motion.ts'), '@island/extras': path.join(root, 'src/island/index.ts') }, banner: { js: '/*! Animal Island Mushroom fork. Modified namespace, visual styles and passive presentation motion. Mushroom sources Apache-2.0; see THIRD_PARTY_NOTICES.md. */' } });
await fs.copyFile('dist/island-ha-cards.js', '_parity/island-ha-cards.js');
// 随包字体：和 JS 放在同一目录的 fonts/ 下。
await fs.mkdir('dist/fonts', { recursive: true });
for (const f of await fs.readdir('src/fonts')) await fs.copyFile('src/fonts/' + f, 'dist/fonts/' + f);
manifest.audit = { allVendoredGitBlobsMatch: true, upstreamSourceFiles: manifest.files.filter(x => x.path.startsWith('src/')).length, forkNamespaceIsolated: true, forkPickerMetadataFiles: pickerMetadataFiles.length, presentationMotionHosts: motionFiles.length, currentCards: 18, legacyCards: 1, badges: 1, chips: 11, duplicateDefineGuardsAdded: false, behaviorRewrites: false, upstreamActionHandlersChanged: false, presentationEventObserversAdded: motionFiles.length, skinAppends: manifest.transforms.reduce((n,f)=>n+f.operations.filter(o=>o.kind==='append-static-styles').reduce((a,o)=>a+o.expressions,0),0) };
manifest.outputs = {};
for (const f of ['_parity/mushroom-original.js', 'dist/island-ha-cards.js', '_parity/island-ha-cards.js']) {
 const b = await fs.readFile(f); manifest.outputs[f] = { bytes: b.length, sha256: sha(b) };
}
manifest.dependencies = { original: Object.keys(original.metafile.inputs).filter(x => x.includes('node_modules/')).sort(), fork: Object.keys(fork.metafile.inputs).filter(x => x.includes('node_modules/')).sort() };
manifest.buildInputs = {};
for (const file of ['scripts/build-parity.mjs', 'tsconfig.parity.json', 'package-lock.json', 'src/skin/styles.ts', 'src/skin/motion.ts']) {
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
