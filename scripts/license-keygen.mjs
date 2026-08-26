#!/usr/bin/env node
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = process.argv[2];
const applyPublicKey = process.argv.includes('--apply');
if (!outputDirectory) {
  console.error('Usage: node scripts/license-keygen.mjs /secure/path/readmode-keys [--apply]');
  process.exit(1);
}

const directory = path.resolve(outputDirectory);
await mkdir(directory, { recursive: true, mode: 0o700 });
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const privatePath = path.join(directory, 'readmode-license-private.pem');
const publicPath = path.join(directory, 'readmode-license-public.jwk.json');
const publicJwk = publicKey.export({ format: 'jwk' });
await writeFile(privatePath, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 });
await writeFile(publicPath, `${JSON.stringify(publicJwk, null, 2)}\n`, { mode: 0o600 });
console.log(`Private key: ${privatePath}`);
console.log(`Public JWK:  ${publicPath}`);

if (applyPublicKey) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const licensePath = path.join(root, 'src/pro/license.js');
  const source = await readFile(licensePath, 'utf8');
  const replacement = `const PUBLIC_KEY_JWK = ${JSON.stringify(publicJwk, null, 2)};`;
  const updated = source.replace(/const PUBLIC_KEY_JWK = \{[\s\S]*?\n\};/, replacement);
  if (updated === source) throw new Error('Could not locate PUBLIC_KEY_JWK in src/pro/license.js');
  await writeFile(licensePath, updated);
  console.log(`Applied public key to: ${licensePath}`);
} else {
  console.log('Copy the public JWK into src/pro/license.js, or rerun with --apply before using this key for production.');
}
