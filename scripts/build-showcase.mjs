import { readFile, mkdir, copyFile, rm, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';

// Build the regression fixture only; the public Pages site uses _acceptance/.
const files = [
  'demo/index.html', 'demo/style.css', 'demo/mock.js', 'demo/assets/local-landscape.svg',
  'dist/island-ha-cards.js', 'dist/THIRD_PARTY_NOTICES.md',
  'dist/licenses/animal-island-ui-MIT.txt', 'dist/licenses/naive-icons-MIT.txt',
  'dist/licenses/notosanssc-OFL.txt', 'dist/licenses/nunito-OFL.txt', 'LICENSE'
];
await rm('_site', { recursive: true, force: true });
for (const file of files) {
  const destination = path.join('_site', file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(file, destination);
}
const source = await readFile('demo/index.html', 'utf8');
const root = source.replace('href="./style.css"', 'href="./demo/style.css"')
  .replace('src="./mock.js"', 'src="./demo/mock.js"').replace('<body>', '<body data-showcase>');
await writeFile('_site/index.html', root);
await writeFile('_site/.nojekyll', '');
await cp('dist/licenses','_site/dist/licenses',{recursive:true});
console.log('Built _site: static showcase, compiled cards, local illustration and licenses only.');
