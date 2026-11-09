/**
 * 构建 HA 卡片安装包 dist/。
 * 卡片源码在 src/mushroom/（由 Mushroom 5.2.3 派生、本项目自行维护），
 * 皮肤与动效在 src/skin/，小岛扩展（插画图标、字体、开屏、底部导航）在 src/island/。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);

// 简单的清单检查：防止误删或误加卡片注册。
const cardsDir = 'src/mushroom/cards';
const cards = [];
for (const name of (await fs.readdir(cardsDir)).sort()) {
  try { await fs.access(`${cardsDir}/${name}/${name}.ts`); cards.push(name); } catch { /* 不是卡片目录 */ }
}
const chips = (await fs.readdir(`${cardsDir}/chips-card/chips`)).filter(f => /-chip\.ts$/.test(f));
const currentCards = cards.filter(c => c !== 'legacy-template-card');
if (currentCards.length !== 18 || chips.length !== 11) {
  throw new Error(`Unexpected card inventory: ${currentCards.length} cards, ${chips.length} chips`);
}

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/fonts', { recursive: true });
await fs.mkdir('dist/licenses', { recursive: true });

const result = await build({
  entryPoints: ['src/mushroom/mushroom.ts'],
  outfile: 'dist/island-ha-cards.js',
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: false,
  sourcemap: false,
  legalComments: 'eof',
  tsconfig: 'tsconfig.cards.json',
  logLevel: 'warning',
  metafile: true,
  banner: { js: '/*! Animal Island HA Cards. Derived from Mushroom 5.2.3 (Apache-2.0); see THIRD_PARTY_NOTICES.md and licenses/. */' },
});

// 随包字体：和 JS 放在同一目录的 fonts/ 下。
for (const f of await fs.readdir('src/fonts')) await fs.copyFile(`src/fonts/${f}`, `dist/fonts/${f}`);

// 许可：本项目、Mushroom 上游，以及打进包里的每个 npm 依赖。
await fs.copyFile('LICENSE', 'dist/LICENSE');
await fs.copyFile('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
await fs.copyFile('src/mushroom/LICENSE', 'dist/licenses/Mushroom-Apache-2.0.txt');
const packageNames = [...new Set(Object.keys(result.metafile.inputs)
  .filter(file => file.includes('node_modules/'))
  .map(file => {
    const parts = file.split('node_modules/').at(-1).split('/');
    return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  }))].sort();
const bundled = [];
for (const name of packageNames) {
  const dir = `node_modules/${name}`;
  const pkg = JSON.parse(await fs.readFile(`${dir}/package.json`, 'utf8'));
  const files = [];
  for (const file of await fs.readdir(dir)) {
    if (!/^(licen[cs]e|copying|notice)(\.|$)/i.test(file)) continue;
    if (!(await fs.stat(`${dir}/${file}`)).isFile()) continue;
    const dest = `${name.replaceAll('/', '__')}-${file}`;
    await fs.copyFile(`${dir}/${file}`, `dist/licenses/${dest}`);
    files.push(dest);
  }
  bundled.push({ name, version: pkg.version, license: pkg.license, files });
}
await fs.writeFile('dist/licenses/bundled-dependencies.json', JSON.stringify(bundled, null, 2) + '\n');

const size = (await fs.stat('dist/island-ha-cards.js')).size;
console.log(`dist/island-ha-cards.js ${(size / 1024).toFixed(0)} KiB · ${currentCards.length} cards, ${chips.length} chips · ${bundled.length} bundled packages`);
