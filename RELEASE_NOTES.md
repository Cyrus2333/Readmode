# Readmode 0.3.9

## Confluence 资源嗅探预览

- 优先从页面已加载的 Atlassian CDN 资源中识别真实附件地址。
- 识别到 `media-cdn.atlassian.com/.../file/.../binary` 后直接读取完整附件，绕过选区文本和页头页脚干扰。
- 资源未能识别时，继续使用 CodeMirror 逐行提取和选区缓存作为回退。

# Readmode 0.3.8

## 右键选区缓存修复

- 缓存右键菜单打开前的源码选区，避免 CodeMirror 在右键后清空 DOM Selection。
- 优先使用缓存的逐行 Markdown 内容，避免回退到 Chromium 已扁平化的 `selectionText`。

# Readmode 0.3.7

## Confluence Markdown 选区换行修复

- 针对 Confluence 附件预览使用的 CodeMirror 源码容器，按 `.cm-line` 恢复逻辑换行。
- 全选时优先提取源码编辑器内容，排除页头、页脚和行号区域。
- 保留 Markdown 源码缩进、空行和行尾结构，避免多行内容被拼接成首行标题。

# Readmode 0.3.6

## 选区源码识别与换行修复

- 优先从选区 DOM 恢复源码换行，改善 Confluence 中 Markdown 预览被拼成单行的问题。
- 全选 HTML 源码时，自动裁剪混入的页头、页脚和其他外围文本。
- 保留完整附件 URL 优先打开与选中文本回退预览逻辑。

# Readmode 0.3.5

## 选中源码预览

- 新增“在 Readmode 中预览选中的源码”右键菜单。
- 在 Confluence 附件弹窗中选中源码后，可在新标签页预览。
- 优先识别弹窗中的完整附件地址，识别不到时回退到选中文本预览。
- 保留原 Confluence 页面，不替换当前标签页。

# Readmode 0.3.4

- 恢复 0.3.0 的完整网页/链接右键打开能力：右键当前页面或选定链接都可在 Readmode 中打开。
- 恢复全站文档识别与自动渲染设置；该权限范围与产品需要一致，但可能触发 Chrome Web Store 的深入审核提示。
- 保留免费、开源、local-first 定位，不包含支付、账号或远程文档存储。

## Productized pre-release

- Cleaned the Markdown full-screen layout and removed stale TOC collapse styles.
- Kept HTML preview as a true full-viewport page without a Readmode shell.
- Preserved safe HTML preview and explicit original HTML runtime behavior.
- Reduced content-script text inspection on ordinary web pages.
- Fixed original URL hash handling so existing anchors are preserved.
- Added Pro-gated local typography controls: font family, font scale, and line height.
- Replaced the local honor-system license shape with offline ECDSA signature verification.
- Added offline key generation and license issuance scripts.
- Added product site pages for Pro, privacy, terms draft, support, and robots.txt.
- Removed unnecessary `web_accessible_resources` exposure.
- Made packaging version-aware and bundled the static Settings fallback pages.
- Added a Node smoke test for Markdown rendering, license verification, and manifest invariants.
- Added a release preflight command that reports missing owner inputs without hiding them.

## Commercial scope note

Payment checkout, tax/refund handling, automatic license delivery, and a production license key are intentionally not configured. They require product-owner decisions and a third-party payment provider before public paid sales.

## Release readiness follow-up

- Added a FAQ page and Chrome Web Store submission worksheet for local Markdown / HTML reader use cases.
- Added a final Chrome acceptance matrix covering document types, permissions, errors, HTML runtime, source dialog, settings, and licensing.
- Reduced content-script inspection so ordinary `.html` pages are not read before the user explicitly opens Readmode.
- Added a finite timeout and user-readable error mapping for remote document fetches.
- Added a strict `npm run release:check` gate and SHA-256 checksum output for release packages.
- Added `npm run commercial:configure` for validated public URL configuration and a static site link checker in the automated test path. The configuration flow was exercised with temporary values and restored to the safe empty pre-release state.
