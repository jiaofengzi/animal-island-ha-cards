// 打包本地预览页（preview/），卡片本体仍由 build-parity.mjs 产出到 dist/。
import path from 'node:path';
import { build } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
await build({
  entryPoints: [path.join(root, 'preview/main.js')],
  outfile: path.join(root, 'preview/main.bundle.js'),
  bundle: true, format: 'esm', target: 'es2020', minify: true, logLevel: 'warning',
});
console.log('preview/main.bundle.js built');
