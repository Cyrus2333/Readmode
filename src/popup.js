const nativeView = document.querySelector('#native-view');
const viewerView = document.querySelector('#viewer-view');
const contextLabel = document.querySelector('#context-label');
const viewerState = document.querySelector('#viewer-state');
const viewerActions = document.querySelector('#viewer-actions');
const pageRuleRow = document.querySelector('#page-rule-row');
const pageRule = document.querySelector('#page-rule');
const pageRuleHelp = document.querySelector('#page-rule-help');
const status = document.querySelector('#status');
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const isViewer = Boolean(tab?.url && tab.url.includes('/src/viewer.html'));
const viewerParams = isViewer ? new URL(tab.url).searchParams : null;
const viewerKind = viewerParams?.get('kind') || '';
const viewerHtmlMode = viewerParams?.get('htmlMode') === 'live';
const pageSource = isViewer ? viewerParams?.get('source') : tab?.url;
const pageKey = pageSource && isSupportedPage(pageSource) ? normalizePageKey(pageSource) : '';

if (isViewer) setupViewerMenu();
else setupNativeMenu();
await setupPageRule();

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
    status.textContent = `读取失败：${error.message}`;
  }
});

function setupNativeMenu() {
  contextLabel.textContent = '当前页面';
  document.querySelector('#current').addEventListener('click', async () => {
    if (!tab?.url || !/^(https?|file):\/\//i.test(tab.url)) {
      status.textContent = '当前页面不支持自动读取，请使用右键菜单或导入本地文件。';
      return;
    }
    try {
      if (tab.url.startsWith('file:')) {
        await chrome.tabs.sendMessage(tab.id, { type: 'force-open-file-viewer' });
      } else {
        await chrome.tabs.create({ url: chrome.runtime.getURL(`src/viewer.html?source=${encodeURIComponent(tab.url)}`) });
      }
      window.close();
    } catch (error) {
      status.textContent = `当前页面无法读取：${error.message || '请刷新页面后重试'}`;
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
        await chrome.runtime.sendMessage({ type: 'viewer-action', action, targetTabId: tab.id });
        if (action === 'toggle-html-mode' || action === 'run-original') window.close();
      } catch (error) {
        status.textContent = `操作失败：${error.message || '请重新打开阅读页'}`;
      }
    });
    viewerActions.appendChild(button);
  });
}

async function setupPageRule() {
  if (!pageKey) return;
  pageRuleRow.classList.remove('hidden');
  const settings = await chrome.storage.local.get({ pageModes: {} });
  const currentMode = settings.pageModes?.[pageKey] || 'auto';
  pageRule.value = currentMode;
  updatePageRuleHelp(currentMode);
  pageRule.addEventListener('change', () => changePageRule(pageRule.value));
}

async function changePageRule(nextMode) {
  if (!pageKey) return;
  const settings = await chrome.storage.local.get({ pageModes: {} });
  const pageModes = { ...(settings.pageModes || {}) };
  if (nextMode === 'auto') delete pageModes[pageKey];
  else pageModes[pageKey] = nextMode;
  await chrome.storage.local.set({ pageModes });
  updatePageRuleHelp(nextMode);
  status.textContent = nextMode === 'always'
    ? '已设置为始终使用 Readmode。'
    : nextMode === 'never'
      ? '已设置为保持原页面。'
      : '已恢复按内容自动判断。';

  if (isViewer && pageSource && (nextMode === 'auto' || nextMode === 'never')) {
    await chrome.tabs.update(tab.id, { url: stripReadmodeMarker(pageSource) });
    window.close();
    return;
  }
  if (!isViewer && nextMode === 'always' && tab?.id) {
    await chrome.tabs.reload(tab.id);
    window.close();
  }
}

function updatePageRuleHelp(mode) {
  pageRuleHelp.textContent = mode === 'always'
    ? '此网址会直接进入 Readmode'
    : mode === 'never'
      ? '此网址不会自动进入 Readmode'
      : '默认仅处理 Markdown 或明确显示源码的页面';
}

document.querySelector('#settings').addEventListener('click', openSettings);

async function openSettings() {
  status.textContent = '正在打开设置…';
  try {
    // Open the options page directly. This is more reliable from a popup than
    // relying on openOptionsPage(), which is unavailable or inconsistent in
    // some Chromium-based test environments.
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/options.html') });
    window.close();
  } catch (error) {
    status.textContent = `无法打开设置：${error.message || '请重试'}`;
  }
}

function isSupportedPage(value) {
  return /^(https?|file):\/\//i.test(value || '');
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

function stripReadmodeMarker(value) {
  try {
    const clean = new URL(value);
    clean.hash = clean.hash.replace(/^#/, '').split('&').filter(Boolean).filter((part) => part !== 'readmode-open').join('&');
    return clean.href;
  } catch {
    return value;
  }
}
