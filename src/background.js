const MENU_ID = 'readmode-open';
const SELECTION_MENU_ID = 'readmode-preview-selection';

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
    chrome.contextMenus.create({
      id: SELECTION_MENU_ID,
      title: '在 Readmode 中预览选中的源码',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('无法注册 Readmode 选区菜单：', chrome.runtime.lastError.message);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(registerContextMenu);
chrome.runtime.onStartup.addListener(registerContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === SELECTION_MENU_ID) {
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
  if (message?.type === 'open-viewer' && message.source) {
    openViewer(message.source, sender.tab?.id);
    return;
  }
  if (message?.type === 'open-inline-viewer' && message.content != null) {
    openInlineViewer(message, sender.tab?.id);
  }
});


async function openSelectionPreview(info, tab) {
  const context = tab?.id ? await inspectSelection(tab.id, info.frameId) : null;
  let selection = String(context?.text || info.selectionText || '').trim();
  if (!selection) return;

  // Prefer the actual attachment URL when the page exposes one in its open
  // dialog. This preserves relative links and lets the normal remote-source
  // reader fetch the complete attachment with the browser's login state.
  if (context?.source) {
    openViewer(context.source);
    return;
  }

  const kind = guessContentKind(selection, tab?.url || '');
  if (kind === 'html') selection = extractHtmlDocument(selection);
  await openInlineViewer({
    name: '选中源码',
    content: selection,
    contentType: kind === 'html' ? 'text/html' : 'text/markdown',
    source: tab?.url || '',
    kind,
    selection: true
  });
}

async function inspectSelection(tabId, frameId = 0) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'inspect-selection' }, { frameId });
  } catch {
    return null;
  }
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
