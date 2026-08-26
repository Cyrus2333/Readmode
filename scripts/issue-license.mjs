#!/usr/bin/env node
import { createPrivateKey, sign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

function argument(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}
function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

const privateKeyPath = argument('private-key');
if (!privateKeyPath) {
  console.error('Usage: node scripts/issue-license.mjs --private-key /secure/path/readmode-license-private.pem [--id ORDER-123] [--expires 2027-01-01]');
  process.exit(1);
}

const privateKey = createPrivateKey(await readFile(privateKeyPath));
const payload = {
  version: 1,
  product: 'readmode',
  plan: 'pro',
  edition: argument('edition', 'lifetime'),
  licenseId: argument('id', `RM-${Date.now()}`),
  issuedAt: new Date().toISOString()
};
const expires = argument('expires');
if (expires) payload.expiresAt = new Date(`${expires}T23:59:59.000Z`).toISOString();
const payloadPart = base64Url(JSON.stringify(payload));
const signingInput = `RM1.${payloadPart}`;
const signature = sign('sha256', Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
console.log(`${signingInput}.${signature}`);
