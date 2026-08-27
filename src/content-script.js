/**
 * This file is injected only after a user clicks Readmode or chooses its
 * context-menu action. It is not a declarative, always-on content script.
 */
(async () => {
  if (window.top !== window) return;
  if (!['http:', 'https:', 'file:'].includes(location.protocol)) return;

  const source = location.href;
  const url = new URL(source);
  const path = url.pathname.toLowerCase();
  const contentType = document.contentType || '';
  const sourcePre = getSourcePre();
  const visibleText = sourcePre?.textContent || getVisibleText();
  const hasMarkdownExtension = /\.(md|markdown|mkd|mdx)$/i.test(path);
  const hasHtmlExtension = /\.(html?|xhtml)$/i.test(path);
  const looksLikeHtmlSource = looksLikeHtmlDocument(visibleText);
  const isHtml = hasHtmlExtension || /text\/html|application\/xhtml/i.test(contentType) || looksLikeHtmlSource;
  const content = isHtml
    ? (looksLikeHtmlSource ? visibleText : document.documentElement?.outerHTML || '')
    : await readTextDocument(source, visibleText);

  if (!content.trim()) throw new Error('当前页面没有可读取的文档内容。');

  await chrome.runtime.sendMessage({
    type: 'open-inline-viewer',
    name: decodeURIComponent(url.pathname.split('/').pop() || document.title || '当前文档'),
    content,
    contentType: isHtml ? 'text/html' : hasMarkdownExtension ? 'text/markdown' : 'text/plain',
    source
  });

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

  async function readTextDocument(currentUrl, fallback) {
    if (fallback.trim()) return fallback;
    try {
      const response = await fetch(currentUrl);
      if (response.ok) return await response.text();
    } catch {
      // The visible page text is still a useful fallback for browser-rendered
      // text documents when a fetch is unavailable.
    }
    return fallback;
  }
})();
