#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFile(path.join(root, name), 'utf8');
const checks = [];
const pass = (label, detail = '') => checks.push({ state: 'PASS', label, detail });
const fail = (label, detail = '') => checks.push({ state: 'FAIL', label, detail });

const manifest = JSON.parse(await read('manifest.json'));
const packageJson = JSON.parse(await read('package.json'));
const config = await read('src/commercial-config.js');
let license = '';
try { license = await read('src/pro/license.js'); }
catch (error) {
  if (error?.code !== 'ENOENT') throw error;
  pass('免费版不包含商业许可证模块');
}

if (manifest.version === packageJson.version) pass('版本一致', manifest.version);
else fail('版本一致', `${manifest.version} != ${packageJson.version}`);

const urlFields = [
  ['paymentUrl', /paymentUrl:\s*['"](https?:\/\/[^'"]+)['"]/],
  ['supportUrl', /supportUrl:\s*['"]((?:https?:\/\/|mailto:)[^'"]+)['"]/],
  ['publicSiteUrl', /publicSiteUrl:\s*['"](https?:\/\/[^'"]+)['"]/]
];
for (const [name, pattern] of urlFields) {
  if (name === 'paymentUrl') {
    if (/paymentUrl:\s*['"]['"]/.test(config)) pass('免费版未配置支付入口');
    else fail('免费版支付入口', '当前开源版本不应配置收费链接');
  } else if (pattern.test(config)) pass(`${name} 已配置`);
  else fail(`${name} 已配置`, '请先写入正式 URL');
}

const devPublicX = 'YeJdSlzZ3RgkGmN96wrXJIgNCkMzsmtJuFq6Y6uGAXE';
if (license) {
  if (license.includes(`x: '${devPublicX}'`)) fail('生产许可证公钥', '当前仍是开发验证公钥');
  else pass('生产许可证公钥');
}

const siteFiles = ['index.html', 'privacy.html', 'pro.html', 'terms.html', 'support.html', 'faq.html'];
for (const file of siteFiles) {
  const content = await read(`site/${file}`);
  if (/预发布|待配置|尚未配置|不应据此向用户收费|当前没有可购买|发布前配置|正式发布前|项目负责人|issue tracker|付款入口|结算页面|购买前|付费授权/i.test(content)) {
    fail(`正式页面 ${file}`, '仍包含预发布占位文案');
  } else pass(`正式页面 ${file}`);
}

const docsDir = path.join(root, 'docs');
const screenshotFiles = (await readdir(docsDir, { recursive: true })).filter((name) => /\.(png|jpe?g|webp)$/i.test(name));
if (screenshotFiles.length >= 3) pass('商店截图', `${screenshotFiles.length} 张`);
else fail('商店截图', '至少准备 3 张最终 Chrome 截图');

const names = await readdir(root, { recursive: true });
const privateNames = names.filter((name) => /(^|[/\\])[^/\\]*(private|secret)[^/\\]*\.(pem|key|json)$/i.test(name));
if (privateNames.length) fail('私钥未进入项目', privateNames.join(', '));
else pass('私钥未进入项目');

const options = await read('src/options.html');
if (/尚未接入真实支付|正式商业化前请不要向用户收费|购买 Pro|激活 Pro/i.test(options)) fail('设置页商业文案', '仍包含付费引导');
else pass('设置页商业文案');

for (const item of checks) console.log(`[${item.state}] ${item.label}${item.detail ? ` — ${item.detail}` : ''}`);
if (checks.some((item) => item.state === 'FAIL')) process.exit(1);
console.log('release-check: 免费开源发布门槛已通过');
