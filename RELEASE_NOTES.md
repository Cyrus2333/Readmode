# Readmode 0.3.0

- HTML 自动识别改为保守策略：仅处理 Markdown 或明确展示源码的文档，不再因为普通页面路径带 `.html` 就自动替换页面。
- 插件菜单新增当前网址处理规则，可选择按内容自动判断、始终使用 Readmode 或保持原页面。

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
