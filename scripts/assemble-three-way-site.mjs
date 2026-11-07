import { readFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

// Keep the previously published, verified comparison unchanged at the site root.
// New evidence and the current installer live only under /three-way/.
const snapshot = JSON.parse(await readFile('site-snapshots/published-668cb1f.json', 'utf8'));
const archive = path.join('site-snapshots', snapshot.archive);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(await readFile(archive)), snapshot.archiveSha256, 'Published baseline archive changed');
assert.equal(snapshot.sourceCommit, '668cb1fb427786ba02860f5e5682bdfdaee39584');
const evidence = JSON.parse(await readFile('_parity/three-way/evidence.json', 'utf8'));
assert.equal(evidence.provenance.commit, process.env.GITHUB_SHA, 'Three-way evidence must match this exact tested commit');
await rm('_site', { recursive: true, force: true });
await mkdir('_site', { recursive: true });
const unpack = spawnSync('tar', ['-xzf', archive, '-C', '_site'], { stdio: 'inherit' });
assert.equal(unpack.status, 0, 'Published baseline extraction failed');
for (const [file, expected] of Object.entries(snapshot.files)) {
  assert.ok(!path.isAbsolute(file) && !file.split('/').includes('..'));
  assert.equal(sha256(await readFile(path.join('_site', file))), expected, `Previous published file changed: ${file}`);
}
assert.ok(!(await readdir('_site')).includes('three-way'), 'Refuse to overwrite an existing three-way path');
await cp('_parity/three-way', '_site/three-way', { recursive: true });
await cp('_parity-preview/downloads', '_site/three-way/downloads', { recursive: true });
console.log(`Preserved ${Object.keys(snapshot.files).length} published files byte-for-byte; added /three-way/ only.`);
