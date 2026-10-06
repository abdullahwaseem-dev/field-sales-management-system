#!/usr/bin/env node
/** Copies self-hosted fonts and the (interim) logo assets from packages/brand into the Flutter app. */
import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const brand = join(root, 'packages', 'brand');
const assets = join(root, 'apps', 'mobile', 'assets');
mkdirSync(join(assets, 'brand'), { recursive: true });
cpSync(join(brand, 'fonts'), join(assets, 'fonts'), { recursive: true });
for (const f of ['zona-wordmark', 'zona-wordmark-reverse', 'zona-wordmark-ar', 'zona-wordmark-ar-reverse', 'zona-lockup', 'zona-lockup-reverse', 'zona-mark', 'zona-mark-reverse']) {
  cpSync(join(brand, 'interim', `${f}.png`), join(assets, 'brand', `${f}.png`));
}
console.log('✔ mobile assets synced (fonts + interim logo)');
