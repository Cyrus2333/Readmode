#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => readFile(path.join(root, name), 'utf8').then(JSON.parse);
const manifest = await readJson('manifest.json');
const packageJson = await readJson('package.json');
const checks = [];
const pass = (label, detail = '') => checks.push({ state: 'PASS', label, detail });
const warn = (label, detail = '') => checks.push({ state: 'WAIT', label, detail });
const fail = (label, detail = '') => checks.push({ state: 'FAIL', label, detail });

if (manifest.version === packageJson.version) pass('版本一致', manifest.version);
else fail('版本一致', `${manifest.version} != ${packageJson.version}`);
if (manifest.manifest_version === 3) pass('Manifest V3');
else fail('Manifest V3');

for (const size of [16, 32, 48, 128]) {
  const file = path.join(root, `icons/icon-${size}.png`);
  try {
    const info = await stat(file);
    if (info.size > 50) pass(`图标 ${size}px`, `${info.size} bytes`);
    else fail(`图标 ${size}px`, '文件过小');
  } catch { fail(`图标 ${size}px`, '文件不存在'); }
}

for (const doc of ['docs/acceptance-matrix.md', 'docs/cws-submission-worksheet.md', 'docs/commercial-owner-inputs.md']) {
  try { await stat(path.join(root, doc)); pass(`发布文档 ${path.basename(doc)}`); }
  catch { fail(`发布文档 ${path.basename(doc)}`, '文件不存在'); }
}

for (const page of ['index.html', 'privacy.html', 'pro.html', 'terms.html', 'support.html', 'faq.html']) {
  try { await stat(path.join(root, 'site', page)); pass(`静态页面 ${page}`); }
  catch { fail(`静态页面 ${page}`, '文件不存在'); }
}

const config = await readFile(path.join(root, 'src/commercial-config.js'), 'utf8');
if (/paymentUrl:\s*['"]['"]/.test(config)) pass('免费版未配置支付入口');
else fail('免费版支付入口', '当前开源版本不应配置收费链接');
if (/supportUrl:\s*['"]['"]/.test(config)) warn('支持入口', '尚未配置 supportUrl');
else pass('支持入口');
if (/publicSiteUrl:\s*['"]['"]/.test(config)) warn('官网入口', '尚未配置 publicSiteUrl');
else pass('官网入口');

const commercialLicensePath = path.join(root, 'src/pro/license.js');
try {
  const source = await readFile(commercialLicensePath, 'utf8');
  if (source.includes('PUBLIC_KEY_JWK')) pass('Store 构建许可证模块仅包含公钥');
  else fail('Store 构建许可证模块仅包含公钥');
} catch (error) {
  if (error?.code === 'ENOENT') pass('免费版不包含商业许可证模块');
  else throw error;
}
const privateNames = (await readdir(root, { recursive: true })).filter((name) => /private.*\.(pem|key)$/i.test(name));
if (privateNames.length) fail('私钥未进入项目', privateNames.join(', '));
else pass('私钥未进入项目');

const screenshotFiles = (await readdir(path.join(root, 'docs'), { recursive: true })).filter((name) => /\.(png|jpe?g|webp)$/i.test(name));
if (screenshotFiles.length >= 3) pass('商店截图', `${screenshotFiles.length} 张已准备`);
else warn('商店截图', '仍需从最终 Chrome 版本实际截取 3–5 张截图');

const failed = checks.filter((item) => item.state === 'FAIL');
for (const item of checks) console.log(`[${item.state}] ${item.label}${item.detail ? ` — ${item.detail}` : ''}`);
if (failed.length) process.exit(1);
console.log(`preflight: ${checks.length} checks completed; ${checks.filter((item) => item.state === 'WAIT').length} owner inputs remain`);
