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
