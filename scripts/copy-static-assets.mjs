import { cp, copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');

// The portal uses classic, non-module scripts and separate HTML pages.
// Vite's HTML build alone is not sufficient to guarantee every legacy
// route and root-level asset is present in the Cloudflare output directory.
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'assets'), resolve(dist, 'assets'), { recursive: true });

const entries = await readdir(root, { withFileTypes: true });
const htmlFiles = entries.filter(entry => entry.isFile() && entry.name.endsWith('.html'));
for (const file of htmlFiles) {
  await copyFile(resolve(root, file.name), resolve(dist, file.name));
}

console.log(`Copied assets and ${htmlFiles.length} portal pages into dist/.`);
