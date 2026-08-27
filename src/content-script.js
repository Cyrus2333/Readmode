(async () => {
  if (window.top !== window) return;
  if (!['http:', 'https:', 'file:'].includes(location.protocol)) return;

  const source = location.href;
  const url = new URL(source);
  const path = url.pathname.toLowerCase();
  const contentType = document.contentType || '';
  const hasMarkdownExtension = /\.(md|markdown|mkd|mdx)$/i.test(path);
  const hasHtmlExtension = /\.(html?|xhtml)$/i.test(path);
  const isManualOpen = url.hash.replace(/^#/, '').split('&').includes('readmode-open');
  const isOriginalPage = url.hash.replace(/^#/, '').split('&').includes('readmode-original');
  const isSupportedLocalFile = url.protocol === 'file:' && (hasMarkdownExtension || hasHtmlExtension);
  const pageKey = normalizePageKey(source);

  // Only inspect text when the browser is already presenting a text document,
  // or when an .html URL is visibly rendered as a source-only <pre>. A normal
  // HTML page can therefore keep its own layout even when its URL ends in
  // .html.
  const isTextDocument = /text\/(plain|markdown)/i.test(contentType);
  const sourcePre = getSourcePre();
  const shouldInspectText = hasMarkdownExtension || isTextDocument || Boolean(sourcePre);
  const text = shouldInspectText
    ? (sourcePre?.textContent || getVisibleText())
    : '';
  const looksLikeMarkdown = /(^|\n)#{1,6}\s+\S|```|(^|\n)\s*[-*+]\s+\S|\[[^\]]+\]\([^)]*\)/m.test(text);
  const looksLikeHtmlSource = looksLikeHtmlDocument(text);
  const isPlainDocument = isTextDocument && text.trim().length > 0;
  const isCandidate = hasMarkdownExtension || (isPlainDocument && (looksLikeMarkdown || looksLikeHtmlSource));

  const preferences = await chrome.storage.local.get({ autoRender: true, pageModes: {} });
  const pageMode = preferences.pageModes?.[pageKey] || 'auto';
  const shouldAutoOpen = preferences.autoRender !== false && pageMode !== 'never' && isCandidate;
  const shouldOpen = isManualOpen || pageMode === 'always' || shouldAutoOpen;

  // Local HTML files are often rendered normally by Chrome. Keep the message
  // bridge alive for an explicit popup/menu action without auto-opening them.
  if (url.protocol === 'file:' && (isSupportedLocalFile || pageMode === 'always' || isManualOpen)) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'force-open-file-viewer') sendFileToViewer();
    });
  }

  if (source.includes('chrome-extension://') || isOriginalPage) {
    if (isOriginalPage) clearOriginalPageMarker(url);
    return;
  }
  if (!shouldOpen) return;
  await openCandidate();

  async function openCandidate() {
    if (url.protocol === 'file:') {
      await sendFileToViewer();
      return;
    }
    chrome.runtime.sendMessage({ type: 'open-viewer', source }).catch(() => {
      const banner = document.createElement('button');
      banner.textContent = '在 Readmode 中打开';
      banner.style.cssText = 'position:fixed;z-index:2147483647;right:16px;top:16px;padding:10px 14px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;font:600 14px system-ui;cursor:pointer;box-shadow:0 4px 16px #0003';
      banner.onclick = () => chrome.runtime.sendMessage({ type: 'open-viewer', source });
      document.documentElement.appendChild(banner);
    });
  }

  async function sendFileToViewer() {
    const isHtml = hasHtmlExtension || /text\/html/i.test(contentType) || /^\s*<!doctype html|^\s*<html[\s>]/i.test(text);
    const content = isHtml ? document.documentElement?.outerHTML || '' : await readLocalText();
    chrome.runtime.sendMessage({
      type: 'open-inline-viewer',
      name: decodeURIComponent(url.pathname.split('/').pop() || '本地文件'),
      content,
      contentType: isHtml ? 'text/html' : 'text/markdown',
      source
    }).catch(() => {});
  }

  function getSourcePre() {
    const pre = document.body?.children?.length === 1 ? document.body.firstElementChild : null;
    return pre?.tagName === 'PRE' && pre.textContent?.trim() ? pre : null;
  }

  function getVisibleText() {
    const values = [
      document.querySelector('pre')?.textContent || '',
      document.body?.innerText || '',
      document.body?.textContent || '',
      document.documentElement?.innerText || '',
      document.documentElement?.textContent || ''
    ];
    return values.sort((a, b) => b.trim().length - a.trim().length)[0] || '';
  }

  function looksLikeHtmlDocument(value) {
    const sample = value.trim();
    if (!sample) return false;
    const startsWithHtml = /^(?:<!--[\s\S]*?-->\s*)*(?:<!doctype\s+html\b|<html(?:\s|>))/i.test(sample);
    return startsWithHtml && /<\/(?:html|body)\s*>/i.test(sample);
  }

  async function readLocalText() {
    // Read the file bytes first. Another extension may have replaced the local
    // document DOM with a reader shell, and falling back to body text first
    // would copy that shell's footer/navigation into the Markdown source.
    try {
      const response = await fetch(source);
      if (response.ok) return await response.text();
    } catch {}
    return sourcePre?.textContent || document.querySelector('pre')?.textContent || document.body?.textContent || '';
  }

  function normalizePageKey(value) {
    try {
      const normalized = new URL(value);
      normalized.hash = '';
      return normalized.href;
    } catch {
      return value;
    }
  }

  function clearOriginalPageMarker(currentUrl) {
    const hashParts = currentUrl.hash.replace(/^#/, '').split('&').filter(Boolean)
      .filter((part) => part !== 'readmode-original');
    currentUrl.hash = hashParts.join('&');
    history.replaceState(null, '', currentUrl.href);
  }
})();
