const MENU_ID = 'readmode-open';

// Keep the original page + link behavior, while also recreating the menu when
// Chrome starts the service worker after an unpacked extension reload.
function registerContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: '在 Readmode 中打开',
      contexts: ['page', 'link']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('无法注册 Readmode 右键菜单：', chrome.runtime.lastError.message);
      }
    });
  });
}


chrome.runtime.onInstalled.addListener(registerContextMenu);
chrome.runtime.onStartup.addListener(registerContextMenu);

const selectionStateByTab = new Map();
let activeTabId = null;

chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId;
  updateContextMenuMode(tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  selectionStateByTab.delete(tabId);
  if (activeTabId === tabId) activeTabId = null;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'loading') return;
  selectionStateByTab.delete(tabId);
  if (activeTabId === tabId) updateContextMenuMode(tabId);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;

  // Chrome's onClicked payload does not include the context list. Use the
  // click payload and the last per-tab selection state instead; otherwise a
  // selection click is mistaken for a page click and opens the Confluence URL.
  const hasSelection = hasSourceSelection(tab?.id)
    || looksLikeSourceSelection(String(info.selectionText || '').trim());
  if (hasSelection) {
    await openSelectionPreview(info, tab);
    return;
  }

  const source = info.linkUrl || tab?.url;
  if (!source || !/^(https?|file):\/\//i.test(source)) return;
  if (source.startsWith('file:')) {
    openFileWithMarker(source);
    return;
  }
  openViewer(source);
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.url || !/^(https?|file):\/\//i.test(tab.url)) return;
  if (tab.url.startsWith('file:')) openFileWithMarker(tab.url, tab.id);
  else openViewer(tab.url, tab.id);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'selection-state' && sender.tab?.id != null) {
    const tabId = sender.tab.id;
    const frameId = sender.frameId || 0;
    const states = selectionStateByTab.get(tabId) || new Map();
    // A selection belongs to one frame at a time. Clear previous frame state
    // so an old iframe selection cannot keep the source menu active.
    states.clear();
    states.set(frameId, message.sourceLike === true);
    selectionStateByTab.set(tabId, states);
    if (activeTabId == null) activeTabId = tabId;
    if (activeTabId === tabId) updateContextMenuMode(tabId);
    return;
  }
  if (message?.type === 'open-viewer' && message.source) {
    openViewer(message.source, sender.tab?.id);
    return;
  }
  if (message?.type === 'open-inline-viewer' && message.content != null) {
    openInlineViewer(message, sender.tab?.id);
  }
});


async function openSelectionPreview(info, tab) {
  const frameContext = tab?.id ? await inspectSelection(tab.id, info.frameId) : null;
  const context = frameContext || (tab?.id && info.frameId ? await inspectSelection(tab.id, 0) : null);
  const selection = String(frameContext?.text || context?.text || info.selectionText || '').trim();

  // The selected source is the most precise payload. Confluence may expose a
  // preview/page URL alongside the editor, and opening that URL can send the
  // viewer back to the Confluence page instead of showing the selected code.
  if (selection && looksLikeSourceSelection(selection)) {
    const kind = guessContentKind(selection, tab?.url || '');
    await openInlineViewer({
      name: '选中源码',
      content: kind === 'html' ? extractHtmlDocument(selection) : selection,
      contentType: kind === 'html' ? 'text/html' : 'text/markdown',
      source: tab?.url || '',
      kind,
      selection: true
    });
    return;
  }

  // Only fall back to a complete attachment when the discovered URL is a
  // direct attachment/binary endpoint, never a Confluence page or preview URL.
  if (isDirectAttachmentSource(context?.source)) {
    openViewer(context.source);
    return;
  }

}

async function inspectSelection(tabId, frameId = 0) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'inspect-selection' }, { frameId });
  } catch {
    return null;
  }
}

function hasSourceSelection(tabId) {
  return [...(selectionStateByTab.get(tabId)?.values() || [])].some(Boolean);
}

function updateContextMenuMode(tabId) {
  const sourceLike = hasSourceSelection(tabId);
  chrome.contextMenus.update(MENU_ID, {
    title: sourceLike ? '在 Readmode 中预览选中的源码' : '在 Readmode 中打开',
    contexts: sourceLike ? ['selection'] : ['page', 'link']
  }, () => {
    if (!chrome.runtime.lastError) return;
    // The service worker can receive a selection message before the menu has
    // finished being recreated after extension reload. Re-register once.
    registerContextMenu();
  });
}

function isDirectAttachmentSource(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (!['http:', 'https:', 'file:'].includes(url.protocol)) return false;
    const path = url.pathname.toLowerCase();
    if (/\/wiki\/(?:pages?|spaces?|dashboard|login)(?:\/|$)/.test(path)) return false;
    return url.hostname === 'media-cdn.atlassian.com'
      || /\/file\/[^/]+\/binary(?:$|\/)/.test(path)
      || /\/download\/attachments?\//.test(path)
      || /\/(?:attachments?|download)\//.test(path) && /(?:filename|attachment|download)/i.test(url.search);
  } catch {
    return false;
  }
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

function guessContentKind(content, source = '') {
  if (/\.(?:html?|xhtml)(?:$|[?#])/i.test(source)) return 'html';
  if (/(?:<!doctype\s+html\b|<html(?:\s|>))/i.test(content)) return 'html';
  if (/<(?:head|body)\b[\s>]/i.test(content) && /<\/(?:html|body)>/i.test(content)) return 'html';
  return 'markdown';
}

function extractHtmlDocument(content) {
  const doctypeStart = content.search(/<!doctype\s+html\b/i);
  const htmlStart = content.search(/<html(?:\s|>)/i);
  const starts = [doctypeStart, htmlStart].filter((index) => index >= 0);
  if (!starts.length) return content;

  const start = Math.min(...starts);
  const htmlEnd = content.toLowerCase().lastIndexOf('</html>');
  if (htmlEnd >= start) return content.slice(start, htmlEnd + '</html>'.length).trim();
  return content.slice(start).trim();
}

async function openViewer(source, tabId) {
  const viewer = chrome.runtime.getURL(`src/viewer.html?source=${encodeURIComponent(source)}`);
  if (tabId) await chrome.tabs.update(tabId, { url: viewer });
  else await chrome.tabs.create({ url: viewer });
}

async function openFileWithMarker(source, tabId) {
  const url = new URL(source);
  const hashParts = url.hash.replace(/^#/, '').split('&').filter(Boolean).filter((part) => part !== 'readmode-open');
  hashParts.push('readmode-open');
  url.hash = hashParts.join('&');
  if (tabId) await chrome.tabs.update(tabId, { url: url.href });
  else await chrome.tabs.create({ url: url.href });
}

async function openInlineViewer({ name, content, contentType, source, kind, selection = false }, tabId) {
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [`readmode:inline:${id}`]: { name, content, contentType, source, selection } });
  const resolvedKind = kind || (/text\/html|application\/xhtml/i.test(contentType || '') ? 'html' : 'markdown');
  const viewerUrl = new URL(chrome.runtime.getURL('src/viewer.html'));
  viewerUrl.searchParams.set('inline', id);
  viewerUrl.searchParams.set('kind', resolvedKind);
  if (source) viewerUrl.searchParams.set('source', source);
  if (selection) viewerUrl.searchParams.set('selection', '1');
  const viewer = viewerUrl.href;
  if (tabId) await chrome.tabs.update(tabId, { url: viewer });
  else await chrome.tabs.create({ url: viewer });
}
