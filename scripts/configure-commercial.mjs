#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'src/commercial-config.js');
const allowed = new Map([
  ['payment-url', { key: 'paymentUrl', schemes: ['http:', 'https:'] }],
  ['support-url', { key: 'supportUrl', schemes: ['http:', 'https:', 'mailto:'] }],
  ['site-url', { key: 'publicSiteUrl', schemes: ['http:', 'https:'] }]
]);

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage:\n  npm run commercial:configure -- --payment-url <https://...> --support-url <https://...|mailto:...> --site-url <https://...>\n  npm run commercial:configure -- --show\n\nValues are written only to src/commercial-config.js. Never put payment secrets, webhook secrets, or private keys here.`);
  process.exit(0);
}

const source = await readFile(configPath, 'utf8');
if (args.includes('--show')) {
  console.log(source.match(/export const COMMERCIAL_CONFIG = Object\.freeze\(([\s\S]*?)\);/)?.[1]?.trim() || source);
  process.exit(0);
}

const updates = new Map();
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  const flagName = flag.replace(/^--/, '');
  if (!allowed.has(flagName)) continue;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} 需要一个 URL 值。`);
  const rule = allowed.get(flagName);
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${flag} 不是有效 URL：${value}`); }
  if (!rule.schemes.includes(parsed.protocol)) throw new Error(`${flag} 只支持：${rule.schemes.join(', ')}`);
  updates.set(rule.key, value);
  index += 1;
}

if (!updates.size) {
  console.error('没有要写入的配置。使用 --help 查看用法。');
  process.exit(1);
}

let updated = source;
for (const [key, value] of updates) {
  const pattern = new RegExp(`(${key}:\\s*)['"](?:[^'"\\n]*)['"]`);
  if (!pattern.test(updated)) throw new Error(`未找到配置字段：${key}`);
  updated = updated.replace(pattern, (_, prefix) => `${prefix}${JSON.stringify(value)}`);
}
await writeFile(configPath, updated);
console.log(`已更新：${[...updates.keys()].join(', ')}`);
console.log('下一步运行：npm run check && npm run preflight');
