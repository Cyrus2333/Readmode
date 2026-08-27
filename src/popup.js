const nativeView = document.querySelector('#native-view');
const viewerView = document.querySelector('#viewer-view');
const contextLabel = document.querySelector('#context-label');
const viewerState = document.querySelector('#viewer-state');
const viewerActions = document.querySelector('#viewer-actions');
const status = document.querySelector('#status');
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const isViewer = Boolean(tab?.url && tab.url.includes('/src/viewer.html'));
const viewerParams = isViewer ? new URL(tab.url).searchParams : null;
const viewerKind = viewerParams?.get('kind') || '';
const viewerHtmlMode = viewerParams?.get('htmlMode') === 'live';

if (isViewer) setupViewerMenu();
else setupNativeMenu();

document.querySelector('#file-input').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  status.textContent = '正在准备文件…';
  try {
    const content = await file.text();
    const id = crypto.randomUUID();
    const kind = /\.html?$/i.test(file.name) || /text\/html/i.test(file.type) ? 'html' : 'markdown';
    await chrome.storage.session.set({ [`readmode:file:${id}`]: { name: file.name, content, type: file.type } });
    await chrome.tabs.create({ url: chrome.runtime.getURL(`src/viewer.html?local=${id}&kind=${kind}`) });
    window.close();
  } catch (error) {
    status.textContent = `读取失败：${error.message || '请重试'}`;
  }
});

function setupNativeMenu() {
  contextLabel.textContent = '手动预览当前文档';
  document.querySelector('#current').addEventListener('click', async () => {
    if (!tab?.id || !isSupportedPage(tab.url)) {
      status.textContent = '请在 HTTP、HTTPS 或本地文件页面中使用 Readmode。';
      return;
    }
    status.textContent = '正在读取当前文档…';
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content-script.js']
      });
      window.close();
    } catch (error) {
      status.textContent = tab.url.startsWith('file:')
        ? '无法读取本地文件。请先在扩展详情中开启“允许访问文件网址”。'
        : `当前页面无法读取：${error.message || '请重试'}`;
    }
  });
}

function setupViewerMenu() {
  nativeView.classList.add('hidden');
  viewerView.classList.remove('hidden');
  contextLabel.textContent = viewerKind === 'html' ? 'HTML 原样预览' : 'Markdown 阅读模式';
  viewerState.textContent = viewerKind === 'html'
    ? (viewerHtmlMode ? '当前页面运行原始 HTML · JS 已启用' : '当前页面已由 Readmode 渲染 · 安全模式')
    : '当前页面已由 Readmode 优化阅读';
  const actions = [
    { action: 'raw', label: '查看原文' },
    ...(viewerKind === 'markdown'
      ? [{ action: 'theme', label: '切换深色模式' }]
      : [{
          action: 'toggle-html-mode',
          label: viewerHtmlMode ? '切回安全模式' : '启用 JS',
          toggle: true,
          enabled: viewerHtmlMode
        }]),
    ...(viewerKind === 'markdown' ? [{ action: 'print', label: '打印当前页面' }] : [])
  ];
  actions.forEach(({ action, label, toggle, enabled }) => {
    const button = document.createElement('button');
    button.className = `menu-button${toggle ? ' mode-toggle' : ''}`;
    if (toggle) {
      button.setAttribute('aria-pressed', String(enabled));
      button.innerHTML = `<span>${label}</span><span class="mode-switch ${enabled ? 'is-on' : ''}" aria-hidden="true"><span></span></span>`;
    } else {
      button.textContent = label;
    }
    button.addEventListener('click', async () => {
      try {
        if (action === 'toggle-html-mode') {
          await navigateViewerHtmlMode();
          return;
        }
        await chrome.runtime.sendMessage({
          type: 'viewer-action',
          action,
          targetTabId: tab.id,
          targetViewerUrl: tab.url
        });
      } catch (error) {
        status.textContent = `操作失败：${error.message || '请重新打开阅读页'}`;
      }
    });
    viewerActions.appendChild(button);
  });
}

async function navigateViewerHtmlMode() {
  if (!tab?.id || !tab.url) throw new Error('当前阅读页不可用');
  const next = new URL(tab.url);
  if (next.searchParams.get('htmlMode') === 'live') next.searchParams.delete('htmlMode');
  else next.searchParams.set('htmlMode', 'live');
  await chrome.tabs.update(tab.id, { url: next.href });
  window.close();
}

document.querySelector('#settings').addEventListener('click', openSettings);

async function openSettings() {
  status.textContent = '正在打开设置…';
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
    window.close();
  } catch (error) {
    status.textContent = `无法打开设置：${error.message || '请重试'}`;
  }
}

function isSupportedPage(value) {
  return /^(https?|file):\/\//i.test(value || '');
}
