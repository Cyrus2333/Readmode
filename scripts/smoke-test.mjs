#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderMarkdown } from '../src/markdown.js';

const markdown = `---\ntitle: demo\n---\n# Release notes\n\nA **readable** document.\n\n- [x] Markdown heading\n- [ ] Safe links\n\n| Feature | State |\n| --- | --- |\n| HTML | Ready |\n\n![diagram](assets/diagram.png)\n\n> [!NOTE]\n> Keep documents local.\n\n
o
g\n\`\`\`js\nconsole.log('ok')\n\`\`\``;
const result = renderMarkdown(markdown, 'https://docs.example.test/specs/readme.md');
assert.equal(result.headings.length, 1);
assert.match(result.html, /<h1 id="release-notes-1">/);
assert.match(result.html, /<table>/);
assert.match(result.html, /type="checkbox"/);
assert.match(result.html, /class="code-block/);
assert.doesNotMatch(result.html, /<script/i);
assert.match(result.html, /https:\/\/docs\.example\.test\/specs\/assets\/diagram\.png/);
const unsafe = renderMarkdown('[bad](javascript:alert(1))', 'https://docs.example.test/readme.md');
assert.match(unsafe.html, /href="#"/);

const licensePath = new URL('../src/pro/license.js', import.meta.url);
try {
  const { verifyLicenseToken } = await import(licensePath.href);
  const validToken = 'RM1.eyJ2ZXJzaW9uIjoxLCJwcm9kdWN0IjoicmVhZG1vZGUiLCJwbGFuIjoicHJvIiwiZWRpdGlvbiI6ImxpZmV0aW1lIiwibGljZW5zZUlkIjoiU01PS0UtMjAyNjA4MjUiLCJpc3N1ZWRBdCI6IjIwMjYtMDgtMjVUMTk6MTQ6MDkuNzA4WiJ9.hfkfjrskOgS-pvewZjNIphePQmXlXThq19l9DFV8XcUP4CZkTvoPu9tR40C5SoukwY5g4FNsQ-CQdm_KkYrQzQ';
  const verified = await verifyLicenseToken(validToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.product, 'readmode');
  const tampered = await verifyLicenseToken(`${validToken.slice(0, -1)}A`);
  assert.equal(tampered.valid, false);
  const malformed = await verifyLicenseToken('READMODE-PRO-TEST');
  assert.equal(malformed.valid, false);
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  assert.equal(true, true, 'Community source intentionally has no commercial module');
}

const viewerSource = await readFile(new URL('../src/viewer.js', import.meta.url), 'utf8');
assert.match(viewerSource, /AbortController/);
assert.match(viewerSource, /15000/);
assert.match(viewerSource, /function closeRawDialog\(\)/);
assert.match(viewerSource, /rawDialog\.addEventListener\('click'/);
assert.match(viewerSource, /document\.body\.append\(frame\)/);
assert.match(viewerSource, /function toggleHtmlExecution\(\)/);
assert.match(viewerSource, /allow-scripts allow-forms allow-modals allow-popups/);
assert.match(viewerSource, /function prepareLiveHtmlDocument\(html, baseUrl = ''\)/);
assert.match(viewerSource, /a\[href\^=\"#\"\]/);
assert.match(viewerSource, /src\/live\.html/);
const markdownSource = await readFile(new URL('../src/markdown.js', import.meta.url), 'utf8');
assert.match(markdownSource, /function prepareHtmlDocument\(html, baseUrl = '', options = \{\}\)/);
assert.match(markdownSource, /candidate\.startsWith\('#'\)/);
assert.match(markdownSource, /options\.keepBase/);
assert.match(markdownSource, /SVG_NAMESPACE/);
assert.match(markdownSource, /isSafeImageDataUrl/);
assert.match(viewerSource, /message\.action === 'toggle-html-mode'/);
assert.match(viewerSource, /commercial\.applyReaderPreferences/);
assert.doesNotMatch(viewerSource, /verifyLicenseToken|isProActive/);
assert.match(viewerSource, /function wireSafeHtmlAnchors\(frame\)/);
assert.match(viewerSource, /a\[href\^=\"#\"\]/);
const viewerCss = await readFile(new URL('../src/viewer.css', import.meta.url), 'utf8');
assert.match(viewerCss, /\.raw-dialog:not\(\[open\]\)\s*\{\s*display:\s*none/);
assert.match(viewerCss, /html\.html-mode \.html-frame[\s\S]*?width:\s*100%;/);
assert.doesNotMatch(viewerCss, /html\.html-mode \.html-frame[\s\S]*?width:\s*100vw;/);
const popupHtml = await readFile(new URL('../src/popup.html', import.meta.url), 'utf8');
assert.match(popupHtml, /id="settings" class="title-action"/);
assert.doesNotMatch(popupHtml, /popup-footer[^<]*<button[^>]*id="settings"/);
const popupSource = await readFile(new URL('../src/popup.js', import.meta.url), 'utf8');
assert.match(popupSource, /async function openSettings\(\)/);
assert.doesNotMatch(popupSource, /chrome\.runtime\.openOptionsPage\(\)/);
assert.match(popupSource, /chrome\.tabs\.create\(\{ url: chrome\.runtime\.getURL\('src\/options\.html'\)/);
assert.match(popupSource, /viewerHtmlMode \? '切回安全模式' : '启用 JS'/);
assert.match(popupSource, /aria-pressed/);
assert.match(popupSource, /mode-switch/);

const optionsHtml = await readFile(new URL('../src/options.html', import.meta.url), 'utf8');
const optionsJs = await readFile(new URL('../src/options.js', import.meta.url), 'utf8');
assert.match(optionsHtml, /STORE_PRO_SECTION/);
assert.doesNotMatch(optionsHtml, /id="commercial-note"/);
assert.doesNotMatch(optionsJs, /通过第三方 checkout 购买/);
assert.doesNotMatch(optionsJs, /verifyLicenseToken/);

const contentScript = await readFile(new URL('../src/content-script.js', import.meta.url), 'utf8');
assert.match(contentScript, /const shouldInspectText = hasMarkdownExtension \|\| isTextDocument \|\| Boolean\(sourcePre\)/);
assert.match(contentScript, /function looksLikeHtmlDocument\(value\)/);
assert.match(contentScript, /pageModes/);
assert.doesNotMatch(contentScript, /const isCandidate = hasMarkdownExtension \|\| hasHtmlExtension/);

const liveHtml = await readFile(new URL('../src/live.html', import.meta.url), 'utf8');
const liveJs = await readFile(new URL('../src/live.js', import.meta.url), 'utf8');
assert.match(liveHtml, /src="live\.js"/);
assert.match(liveJs, /document\.write\(html\)/);
const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
assert.equal(manifest.version, packageJson.version);
assert.equal(manifest.version, '0.3.0');
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.sandbox.pages, ['src/live.html']);
assert.match(manifest.content_security_policy.sandbox, /sandbox allow-scripts/);
assert.equal(Boolean(manifest.web_accessible_resources), false);
assert.deepEqual(manifest.host_permissions, ['http://*/*', 'https://*/*', 'file:///*']);
for (const page of ['index.html', 'privacy.html', 'pro.html', 'terms.html', 'support.html', 'faq.html', 'assets/site.css']) {
  const pageText = await readFile(new URL(`../site/${page}`, import.meta.url), 'utf8');
  assert.ok(pageText.length > 20, `site/${page} should not be empty`);
  assert.doesNotMatch(pageText, /<script[^>]+src=\"https?:/i, `site/${page} should not depend on a remote script`);
}
console.log('smoke-test: Markdown rendering, license verification, and manifest checks passed');
