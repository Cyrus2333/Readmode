const MENU_ID = 'readmode-open';

// Register synchronously from the lifecycle event. A manually reloaded
// unpacked extension is treated as an update, so this callback is the durable
// place to recreate the menu. Use `all` so the action is also visible when
// the user right-clicks selected text, a link, or other page content; clicking
// it still opens the current tab only, never a link target.
function registerContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: '在 Readmode 中打开当前页面',
      contexts: ['all']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('无法注册 Readmode 右键菜单：', chrome.runtime.lastError.message);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(registerContextMenu);
chrome.runtime.onStartup.addListener(registerContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !isSupportedUrl(tab?.url)) return;
  try {
    await openActiveDocument(tab.id);
  } catch {
    // A popup-style error cannot be shown from a context menu. The current
    // page remains untouched and the user can retry from the extension popup.
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === 'open-inline-viewer' && message.content != null) {
    openInlineViewer(message, sender.tab?.id).catch(() => {});
  }
});

export async function openActiveDocument(tabId) {
  if (!tabId) throw new Error('无法读取当前标签页。');
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content-script.js']
  });
}

async function openInlineViewer({ name, content, contentType, source }, tabId) {
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [`readmode:inline:${id}`]: { name, content, contentType, source } });
  const kind = /text\/html|application\/xhtml/i.test(contentType || '') ? 'html' : 'markdown';
  const viewer = chrome.runtime.getURL(`src/viewer.html?inline=${id}&kind=${kind}`);
  if (tabId) await chrome.tabs.update(tabId, { url: viewer });
  else await chrome.tabs.create({ url: viewer });
}

function isSupportedUrl(value) {
  return /^(https?|file):\/\//i.test(value || '');
}
