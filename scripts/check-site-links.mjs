#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(root, 'site');
const files = (await readdir(siteRoot)).filter((name) => name.endsWith('.html'));
const failures = [];
for (const file of files) {
  const html = await readFile(path.join(siteRoot, file), 'utf8');
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
    const href = match[1];
    if (!href || href.startsWith('#') || /^(https?:|mailto:|javascript:)/i.test(href)) continue;
    const pathname = href.split('#')[0].split('?')[0];
    if (!pathname) continue;
    const target = path.resolve(siteRoot, pathname);
    if ((target !== siteRoot && !target.startsWith(`${siteRoot}${path.sep}`)) || !(await exists(target))) {
      failures.push(`${file} -> ${href}`);
    }
  }
}
if (failures.length) {
  console.error('Broken site links:');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`site-links: ${files.length} HTML pages checked`);

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}
