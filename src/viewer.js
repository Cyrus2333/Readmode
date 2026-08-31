import { renderMarkdown, sanitizeHtmlDocument, prepareHtmlDocument } from './markdown.js';
import { EDITION } from './edition.js';

// The public Community source does not contain the Pro implementation.
const commercial = EDITION === 'store' ? await import('./pro/store.js') : null;

const params = new URLSearchParams(location.search);
const source = params.get('source');
const localId = params.get('local');
const inlineId = params.get('inline');
const selectionPreview = params.get('selection') === '1';
const reader = document.querySelector('#reader');
const toc = document.querySelector('#toc');
const errorBox = document.querySelector('#error');
const sourceNote = document.querySelector('#source-note');
const rawDialog = document.querySelector('#raw-dialog');
const rawContent = document.querySelector('#raw-content');
const loadingScreen = document.querySelector('#loading-screen');
let rawText = '';
let mode = params.get('kind') === 'html' ? 'html' : 'markdown';
let baseUrl = source || '';
let displayName = source ? compactUrl(source) : '本地文件';
let runOriginalHtml = false;

init();

async function init() {
  try {
    let contentType = '';
    if (inlineId) {
      const result = await chrome.storage.session.get(`readmode:inline:${inlineId}`);
      const file = result[`readmode:inline:${inlineId}`];
      if (!file) throw new Error('本地文件已失效，请重新打开。');
      rawText = file.content;
      displayName = file.selection ? '选中源码预览' : (file.name || '本地文件');
      contentType = file.contentType || '';
      baseUrl = file.source || '';
    } else if (localId) {
      const result = await chrome.storage.session.get(`readmode:file:${localId}`);
      const file = result[`readmode:file:${localId}`];
      if (!file) throw new Error('本地文件已失效，请重新导入。');
      rawText = file.content;
      displayName = file.name || '本地文件';
      contentType = file.type || '';
      baseUrl = '';
    } else if (source) {
      const response = await fetchRemoteSource(source);
      rawText = await response.text();
      contentType = response.headers.get('content-type') || '';
      baseUrl = response.url || source;
    } else {
      throw new Error('没有找到要预览的文件。');
    }

    mode = isHtml(source || displayName, contentType, rawText)
      || (selectionPreview && params.get('kind') === 'html')
      ? 'html'
      : 'markdown';
    runOriginalHtml = mode === 'html' && params.get('htmlMode') === 'live';
    syncModeToUrl();
    await applyReaderPreferences();
    render();
    finishLoading();
  } catch (error) {
    finishLoading();
    showError(`无法读取这个文件。${explainReadError(error)} 可以尝试从插件菜单重新打开。`);
  }
}


async function fetchRemoteSource(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { credentials: 'include', redirect: 'follow', signal: controller.signal });
    if (!response.ok) throw new Error(`请求失败（${response.status}）`);
    return response;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('读取超时，请检查网络或稍后重试。');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function explainReadError(error) {
  const message = String(error?.message || '').trim();
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return '浏览器无法读取该链接，可能是访问权限、登录态或链接类型不支持。';
  }
  return message;
}

async function applyReaderPreferences() {
  const preferences = await chrome.storage.local.get({ theme: 'system', readerWidth: 'wide' });
  if (mode === 'markdown') {
    const theme = preferences.theme === 'system' ? '' : preferences.theme;
    if (theme) document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.readerWidth = preferences.readerWidth || 'wide';
    if (commercial) await commercial.applyReaderPreferences();
  }
}

function finishLoading() {
  document.body.classList.remove('preloading');
  loadingScreen?.remove();
}

function render() {
  errorBox.classList.add('hidden');
  document.title = `${stripExtension(displayName)} · Readmode`;
  document.body.dataset.selectionPreview = String(selectionPreview);
  sourceNote?.classList.toggle('hidden', !selectionPreview);
  document.documentElement.classList.toggle('html-mode', mode === 'html');
  document.body.classList.toggle('html-mode', mode === 'html');

  if (mode === 'html') {
    const frame = document.createElement('iframe');
    frame.className = 'html-frame';
    frame.title = `${displayName} HTML 预览`;
    if (runOriginalHtml) {
      // Execute the source page in a sandboxed document. Scripts and normal
      // page interactions work, but the document does not receive the
      // extension page's origin, cookies, storage, or parent access.
      frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups');
      // Use a manifest sandbox page instead of srcdoc/data URLs. This avoids
      // inheriting the extension page CSP while keeping the source isolated
      // from extension APIs, cookies, storage, and the parent page.
      const liveHtml = prepareLiveHtmlDocument(rawText, baseUrl);
      const sendLiveHtml = () => frame.contentWindow?.postMessage({
        type: 'readmode-render-html',
        html: liveHtml
      }, '*');
      // The sandbox page sends a ready message after live.js is installed.
      // Keeping the load fallback makes this work with older packaged builds
      // while the handshake removes the race where the first postMessage was
      // sent before the sandbox listener existed.
      const handleLiveReady = (event) => {
        if (event.source !== frame.contentWindow || event.data?.type !== 'readmode-live-ready') return;
        sendLiveHtml();
        window.removeEventListener('message', handleLiveReady);
      };
      window.addEventListener('message', handleLiveReady);
      frame.addEventListener('load', sendLiveHtml, { once: true });
      frame.src = chrome.runtime.getURL('src/live.html');
    } else {
      frame.setAttribute('sandbox', 'allow-same-origin');
      frame.addEventListener('load', () => wireSafeHtmlAnchors(frame), { once: true });
      frame.srcdoc = sanitizeHtmlDocument(rawText, baseUrl);
    }
    // Keep HTML completely outside the Markdown layout. The source document
    // owns the viewport; the extension UI only remains available through the
    // browser action popup.
    document.querySelectorAll('.html-frame').forEach((existingFrame) => existingFrame.remove());
    reader.replaceChildren();
    document.body.append(frame);
    toc.innerHTML = '<div class="toc-empty">HTML 文档</div>';
  } else {
    const result = renderMarkdown(rawText, baseUrl);
    reader.innerHTML = result.html || '<p class="muted">这个文件没有可显示的内容。</p>';
    renderToc(result.headings);
    wireCodeButtons();
  }
}

function wireSafeHtmlAnchors(frame) {
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href') || '';
    event.preventDefault();
    if (hash === '#') return;
    let targetId = hash.slice(1);
    try { targetId = decodeURIComponent(targetId); } catch { /* keep the raw fragment */ }
    const target = doc.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
}

function renderToc(headings) {
  if (!headings.length) {
    toc.innerHTML = '<div class="toc-empty">暂无目录</div>';
    return;
  }
  toc.innerHTML = `<div class="toc-title">目录</div><nav>${headings.map((heading) => `<a class="toc-level-${heading.level}" href="#${heading.id}">${escapeText(heading.text)}</a>`).join('')}</nav>`;
}

function wireCodeButtons() {
  reader.querySelectorAll('.copy-code').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.parentElement?.querySelector('code')?.textContent || '';
      await navigator.clipboard.writeText(code);
      const previous = button.textContent;
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = previous; }, 1200);
    });
  });
}

function openRawDialog() {
  if (!rawDialog || rawDialog.open) return;
  rawContent.textContent = rawText;
  rawDialog.showModal();
}

function closeRawDialog() {
  if (rawDialog?.open) rawDialog.close();
}

function toggleTheme() {
  if (mode === 'html') return;
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  chrome.storage.local.set({ theme: dark ? 'light' : 'dark' });
}

function printDocument() {
  if (mode === 'html') document.querySelector('.html-frame')?.contentWindow?.print();
  else window.print();
}

function toggleHtmlExecution() {
  if (mode !== 'html') return;
  runOriginalHtml = !runOriginalHtml;
  syncModeToUrl();
  render();
}

function prepareLiveHtmlDocument(html, baseUrl = '') {
  const doc = prepareHtmlDocument(html, baseUrl, { keepBase: true });
  if (doc.head) {
    const navigationScript = doc.createElement('script');
    navigationScript.textContent = `document.addEventListener('click', function (event) {
      const link = event.target.closest && event.target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', hash);
    }, true);`;
    doc.head.prepend(navigationScript);
  }
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message?.type !== 'viewer-action') return;
  if (message.targetViewerUrl && message.targetViewerUrl !== location.href) return;
  if (!message.targetViewerUrl && message.targetTabId && !(await isTargetViewerTab(message.targetTabId))) return;
  if (message.action === 'raw') openRawDialog();
  if (message.action === 'theme') toggleTheme();
  if (message.action === 'print') printDocument();
  if (message.action === 'toggle-html-mode') toggleHtmlExecution();
  // Backward compatibility for an older popup that still sends this action.
  if (message.action === 'run-original') {
    runOriginalHtml = true;
    syncModeToUrl();
    render();
  }
});

document.querySelector('#raw-close').addEventListener('click', closeRawDialog);
rawDialog.addEventListener('click', (event) => {
  if (event.target === rawDialog) closeRawDialog();
});
rawDialog.addEventListener('cancel', closeRawDialog);
chrome.storage.local.get('theme').then(({ theme }) => {
  if (theme && mode !== 'html') document.documentElement.dataset.theme = theme;
});

async function isTargetViewerTab(targetTabId) {
  const currentTab = await chrome.tabs.getCurrent();
  if (currentTab?.id === targetTabId) return true;
  // Some Chromium builds return null from getCurrent() for extension pages.
  // The active-tab fallback keeps the action scoped to the viewer tab.
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return activeTab?.id === targetTabId;
}

function syncModeToUrl() {
  const next = new URL(location.href);
  next.searchParams.set('kind', mode);
  if (mode === 'html' && runOriginalHtml) next.searchParams.set('htmlMode', 'live');
  else next.searchParams.delete('htmlMode');
  history.replaceState(null, '', next);
}
function isHtml(url, contentType, text) {
  return /text\/html|application\/xhtml/i.test(contentType) || /\.(html?|xhtml)(?:$|[?#])/i.test(url) || /^\s*<!doctype html|^\s*<html[\s>]/i.test(text);
}
function compactUrl(value) {
  try { return new URL(value).hostname + new URL(value).pathname; } catch { return value; }
}
function stripExtension(value) { return value.replace(/\.[a-z\d]+$/i, ''); }
function escapeText(value) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function showError(message) { errorBox.textContent = message; errorBox.classList.remove('hidden'); reader.innerHTML = ''; }
