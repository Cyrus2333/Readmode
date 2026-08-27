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

chrome.contextMenus.onClicked.addListener((info, tab) => {
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

async function openInlineViewer({ name, content, contentType, source }, tabId) {
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [`readmode:inline:${id}`]: { name, content, contentType, source } });
  const kind = /text\/html|application\/xhtml/i.test(contentType || '') ? 'html' : 'markdown';
  const viewerUrl = new URL(chrome.runtime.getURL('src/viewer.html'));
  viewerUrl.searchParams.set('inline', id);
  viewerUrl.searchParams.set('kind', kind);
  if (source) viewerUrl.searchParams.set('source', source);
  const viewer = viewerUrl.href;
  if (tabId) await chrome.tabs.update(tabId, { url: viewer });
  else await chrome.tabs.create({ url: viewer });
}
