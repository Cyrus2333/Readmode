(async () => {
  const isTopFrame = window.top === window;
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
  let cachedSelectionText = '';

  // Cache the selection before the browser context menu opens. CodeMirror can
  // clear the live DOM Selection on right-click, while contextMenus still
  // provides a flattened selectionText to the background worker.
  let selectionStateTimer = 0;
  function reportSelectionState() {
    const text = getSelectedText();
    if (text) cachedSelectionText = text;
    const sourceLike = looksLikeSourceSelection(text) || Boolean(findAttachmentSource()?.source);
    chrome.runtime.sendMessage({ type: 'selection-state', sourceLike }).catch(() => {});
  }

  document.addEventListener('selectionchange', reportSelectionState, true);

  // Confluence can render an attachment source inside a dialog/iframe whose
  // document does not receive this content script. The top document still
  // exposes the dialog and attachment URL, so advertise source mode while
  // that preview is open; the click-time check remains the final guard.
  if (isTopFrame) {
    const attachmentObserver = new MutationObserver(() => {
      clearTimeout(selectionStateTimer);
      selectionStateTimer = setTimeout(reportSelectionState, 50);
    });
    if (document.documentElement) {
      attachmentObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'src', 'open', 'aria-hidden']
      });
    }
    reportSelectionState();
  }

  // Selection can happen inside the attachment preview iframe. Keep a small
  // message bridge in every frame, while only the top frame runs auto-open.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'inspect-selection') {
      const text = getSelectedText() || cachedSelectionText || getActiveCodeMirrorText();
      const attachment = findAttachmentSource();
      sendResponse({
        text,
        sourceLike: looksLikeSourceSelection(text) || Boolean(attachment?.source),
        ...(attachment || {})
      });
    }
    if (message?.type === 'force-open-file-viewer' && isTopFrame) sendFileToViewer();
  });
  if (!isTopFrame) return;

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



  function looksLikeSourceSelection(value) {
    const text = String(value || '').replace(/\r\n?/g, '\n').trim();
    if (!text) return false;

    const htmlTag = /(?:<!doctype\s+html\b|<!--(?:[\s\S]*?)-->|<\/?[a-z][a-z0-9-]*(?:\s+[^<>]{0,160})?\s*\/?>)/i;
    const markdownPatterns = [
      /(^|\n)\s{0,3}#{1,6}\s+\S/m,
      /(^|\n)\s*(?:[-*+]\s+|\d+[.)]\s+)\S/m,
      /```|~~~(?=\s|$)/,
      /!?(?:\[[^\]\n]{1,200}\])\([^\)\n]*\)/,
      /(^|\n)\s*>\s+\S/m,
      /(^|\n)\s*[-*_](?:\s*[-*_]){2,}\s*(?:\n|$)/m,
      /(?:^|\s)(?:\*\*|__)[^*\n]+(?:\*\*|__)(?=\s|$)/
    ];

    return htmlTag.test(text) || markdownPatterns.some((pattern) => pattern.test(text));
  }

  function getSelectedText() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';

    // Confluence's attachment viewer uses CodeMirror. Its visible source is
    // split into one `.cm-line` element per logical line, while Chromium's
    // context-menu selectionText can flatten those elements into one line.
    const codeMirrorText = getCodeMirrorSelectionText(selection);
    if (codeMirrorText) return normalizeSelectedText(codeMirrorText);

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    return normalizeSelectedText(readFragmentText(fragment));
  }

  function getCodeMirrorSelectionText(selection) {
    const range = selection.getRangeAt(0);
    const endpointNodes = [selection.anchorNode, selection.focusNode, range.startContainer, range.endContainer];
    const roots = endpointNodes
      .map((node) => closestElement(node, '.cm-content'))
      .filter(Boolean);
    const root = roots[0];
    if (!root) return '';

    const lines = [...root.querySelectorAll('.cm-line')];
    if (!lines.length) return '';
    const startLine = closestElement(range.startContainer, '.cm-line');
    const endLine = closestElement(range.endContainer, '.cm-line');
    const startIndex = startLine ? lines.indexOf(startLine) : -1;
    const endIndex = endLine ? lines.indexOf(endLine) : -1;

    // Ctrl+A may begin in the page chrome and finish inside the editor. In
    // that case, use the editor's logical lines and exclude page header/footer.
    if (startIndex < 0 || endIndex < 0) return lines.map((line) => line.textContent || '').join('\n');

    const first = Math.min(startIndex, endIndex);
    const last = Math.max(startIndex, endIndex);
    if (first === last) return range.toString();

    return lines.slice(first, last + 1).map((line, index) => {
      const lineText = line.textContent || '';
      if (index === 0 && startIndex === first) {
        return lineText.slice(textOffsetWithin(line, range.startContainer, range.startOffset));
      }
      if (index === last - first && endIndex === last) {
        return lineText.slice(0, textOffsetWithin(line, range.endContainer, range.endOffset));
      }
      return lineText;
    }).join('\n');
  }

  function closestElement(node, selector) {
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    return element?.closest?.(selector) || null;
  }

  function textOffsetWithin(root, node, offset) {
    const prefix = document.createRange();
    prefix.selectNodeContents(root);
    prefix.setEnd(node, offset);
    return prefix.toString().length;
  }

  function readFragmentText(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return '';
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') return '\n';

    let text = '';
    for (const child of node.childNodes) text += readFragmentText(child);
    if (node.nodeType === Node.ELEMENT_NODE && isLineBoundary(node)) text += '\n';
    return text;
  }

  function isLineBoundary(element) {
    return /^(?:ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DIV|DL|DT|DD|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/.test(element.tagName);
  }

  function normalizeSelectedText(value) {
    return value
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .trim();
  }

  function getActiveCodeMirrorText() {
    const roots = [...document.querySelectorAll('.atlaskit-portal-container .cm-content, [role=\"dialog\"] .cm-content, .cm-content')]
      .filter((root) => root.querySelector('.cm-line'));
    const root = roots.find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) || roots[0];
    if (!root) return '';
    return [...root.querySelectorAll('.cm-line')].map((line) => line.textContent || '').join('\n');
  }

  function findSniffedAttachmentSource() {
    // Resource Timing keeps old requests around. Only use the sniffed URL when
    // the attachment editor is visibly open, so a stale previous attachment
    // cannot win a later unrelated text selection.
    if (isTopFrame && !document.querySelector('.atlaskit-portal-container .cm-content, [role=\"dialog\"] .cm-content')) return null;

    const pageId = location.pathname.match(/\/pages\/(\d+)(?:\/|$)/)?.[1] || '';
    const entries = performance.getEntriesByType?.('resource') || [];
    const candidates = entries.map((entry) => {
      const source = entry.name;
      let url;
      try { url = new URL(source); } catch { return null; }
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      const path = url.pathname.toLowerCase();
      const search = url.searchParams;
      let score = 0;
      if (url.hostname === 'media-cdn.atlassian.com') score += 20;
      if (/\/file\/[^/]+\/binary$/.test(path)) score += 20;
      if (search.get('dl') === 'true') score += 4;
      if (search.has('token') && search.has('Policy') && search.has('Signature')) score += 6;
      if (pageId && search.get('collection') === `contentId-${pageId}`) score += 12;
      if (score < 40) return null;
      return { source, score, startTime: Number(entry.startTime) || 0 };
    }).filter(Boolean);
    candidates.sort((a, b) => b.score - a.score || b.startTime - a.startTime);
    return candidates[0]?.source || null;
  }

  function findAttachmentSource() {
    const sniffedSource = findSniffedAttachmentSource();
    if (sniffedSource) return { source: sniffedSource };

    if (!isTopFrame) {
      const frameSource = normalizeAttachmentUrl(location.href, { allowCurrentPage: true });
      if (frameSource && isLikelyAttachmentUrl(frameSource)) return { source: frameSource };
    }

    const roots = [];
    const selection = window.getSelection();
    const selectedElement = selection?.rangeCount
      ? selection.getRangeAt(0).commonAncestorContainer?.parentElement
      : null;
    const dialog = selectedElement?.closest?.('dialog, [role="dialog"], .aui-dialog2, [data-testid*="dialog"]');
    if (dialog) roots.push(dialog);
    document.querySelectorAll('dialog[open], [role="dialog"], .aui-dialog2[aria-hidden="false"], [data-testid*="dialog"]').forEach((element) => {
      if (!roots.includes(element)) roots.push(element);
    });

    const candidates = [];
    for (const root of roots) {
      root.querySelectorAll('iframe[src], a[href], [data-download-url], [data-url], [data-href]').forEach((element) => {
        const value = element.getAttribute('src') || element.getAttribute('href')
          || element.getAttribute('data-download-url') || element.getAttribute('data-url')
          || element.getAttribute('data-href');
        const source = normalizeAttachmentUrl(value);
        if (!source) return;
        const score = attachmentUrlScore(source) + (element.matches('iframe') ? 2 : 0);
        candidates.push({ source, score });
      });
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.score >= 5 ? { source: candidates[0].source } : null;
  }

  function normalizeAttachmentUrl(value, { allowCurrentPage = false } = {}) {
    if (!value || /^(?:#|javascript:|mailto:|data:|blob:)/i.test(value)) return null;
    try {
      const candidate = new URL(value, location.href);
      if (!['http:', 'https:', 'file:'].includes(candidate.protocol)) return null;
      if (!allowCurrentPage && normalizePageKey(candidate.href) === pageKey) return null;
      return candidate.href;
    } catch {
      return null;
    }
  }

  function attachmentUrlScore(value) {
    const candidate = new URL(value);
    const path = candidate.pathname.toLowerCase();
    const query = candidate.search.toLowerCase();
    let score = 0;
    if (/\/download\/attachments?\//.test(path)) score += 10;
    if (/\/(?:attachments?|download)\//.test(path)) score += 6;
    if (/\.(?:md|markdown|mkd|mdx|html?|xhtml|txt)(?:$|[?#])/.test(path)) score += 5;
    if (/filename|attachment/.test(query)) score += 3;
    return score;
  }

  function isLikelyAttachmentUrl(value) {
    return attachmentUrlScore(value) >= 5;
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
