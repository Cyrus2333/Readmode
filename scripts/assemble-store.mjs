#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [stage, edition = 'store'] = process.argv.slice(2);
if (!stage || !['community', 'store'].includes(edition)) {
  console.error('Usage: node scripts/assemble-store.mjs <staging-dir> <community|store>');
  process.exit(1);
}
const optionsPath = path.join(stage, 'src', 'options.html');
const options = await readFile(optionsPath, 'utf8');
const marker = '    <!-- STORE_PRO_SECTION -->';
const count = options.split(marker).length - 1;
if (count !== 1) throw new Error(`Expected exactly one ${marker} marker in staged options.html, found ${count}`);
const section = edition === 'store'
  ? await readFile(new URL('../src/pro/options-section.html', import.meta.url), 'utf8')
  : '';
await writeFile(optionsPath, options.replace(marker, section));
