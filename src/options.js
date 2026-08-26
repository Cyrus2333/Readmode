import { EDITION } from './edition.js';
import { COMMERCIAL_CONFIG } from './commercial-config.js';

// The public Community source contains only the free settings surface. The
// private Store module is injected into the Store package and loaded only in
// that edition.
const commercial = EDITION === 'store' ? await import('./pro/store.js') : null;

const defaults = {
  autoRender: true,
  theme: 'system',
  readerWidth: 'wide',
  fontFamily: 'system',
  fontScale: '1',
  lineHeight: '1.8'
};
const $ = (id) => document.querySelector(`#${id}`);
$('#version').textContent = `v${chrome.runtime.getManifest().version}`;

const settings = await chrome.storage.local.get(defaults);
$('auto-render').checked = settings.autoRender !== false;
$('theme').value = settings.theme || defaults.theme;
$('reader-width').value = settings.readerWidth || defaults.readerWidth;
if (commercial) await commercial.init({ settings, showStatus });

$('save-settings').addEventListener('click', async () => {
  const proResult = commercial ? await commercial.getSettingsToSave({ defaults }) : { ok: true, values: {} };
  if (!proResult.ok) {
    showStatus($('settings-status'), proResult.message, true);
    return;
  }
  await chrome.storage.local.set({
    autoRender: $('auto-render').checked,
    theme: $('theme').value,
    readerWidth: $('reader-width').value,
    ...proResult.values
  });
  showStatus($('settings-status'), '设置已保存。');
});

function setupSiteLinks() {
  const pages = { home: 'index.html', privacy: 'privacy.html', terms: 'terms.html', faq: 'faq.html', support: 'support.html' };
  const configured = { home: COMMERCIAL_CONFIG.publicSiteUrl, support: COMMERCIAL_CONFIG.supportUrl };
  for (const link of document.querySelectorAll('[data-site-link]')) {
    const page = pages[link.dataset.siteLink];
    link.href = configured[link.dataset.siteLink] || (page ? chrome.runtime.getURL(`site/${page}`) : '#');
  }
}

function showStatus(node, text, error = false) {
  node.textContent = text;
  node.classList.toggle('error', error);
  setTimeout(() => { node.textContent = ''; node.classList.remove('error'); }, 3200);
}

setupSiteLinks();
