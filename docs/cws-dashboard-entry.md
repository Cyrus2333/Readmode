# Chrome Web Store Developer Dashboard entry sheet — Readmode 0.3.4

Use this document to enter the CWS dashboard fields consistently. It does **not** authorize publishing or payment collection by itself.

## Package

- File: `dist/readmode-0.3.4-community.zip` (current free open-source release)
- SHA-256: run `shasum -a 256 dist/readmode-0.3.4-community.zip` immediately before upload.
- Version: `0.3.4`
- Submission mode: choose **deferred publishing** if the dashboard offers it, so review approval does not automatically make the extension public.

## Store Listing

- Name: `Readmode — Markdown & HTML Reader`
- Summary: `Read Markdown files and preview HTML prototypes directly in Chrome.`
- Category: select the closest current dashboard category for a developer/productivity document reader; do not guess if the dashboard's taxonomy differs.
- Language: English as the primary listing language. Add Simplified Chinese only after the English listing has been entered.
- Detailed description: copy the English "Full description" from `store-listing.md`.
- Chinese name: `Readmode｜Markdown 阅读与 HTML 预览`
- Chinese description: copy the "中文简介" and the Chinese detailed copy from `store-listing.md`.
- Homepage URL: `https://cyrus2333.github.io/Readmode/`
- Support URL: `https://github.com/Cyrus2333/Readmode/issues`
- Privacy policy URL: `https://cyrus2333.github.io/Readmode/privacy.html`
- Icon: `icons/icon-128.png`
- Screenshots: `docs/store-assets/screenshot-01-markdown.png` through `screenshot-03-html-preview.png` at minimum.
- Small promo tile: `docs/store-assets/small-tile-440x280.png`
- Marquee promo tile: `docs/store-assets/marquee-1400x560.png`

## Privacy practices and permissions

### Single purpose

> Read Markdown files and preview HTML documents and prototypes in a readable Chrome view, while processing document content locally in the browser.

### Permission reasons

- `storage`: Stores reader preferences and temporary preview content used only for the active local browser workflow. It does not create a cloud copy of documents.
- `tabs`: Opens or updates the Readmode viewer for the current page or a selected link after a user action.
- `contextMenus`: Provides the user-initiated “Open in Readmode” action on the current page or a selected link.
- Host permissions (`http`, `https`, and `file`): Let Readmode recognize and read Markdown/HTML documents on pages the user opens or explicitly sends to Readmode, including the target of a selected link. The content script leaves ordinary HTML pages unchanged unless they are candidates or the user has configured an always-open rule.

### Remote code

Select **Yes** and paste this justification: “Readmode does not download or execute remote extension code; all extension JavaScript, CSS, and HTML ship in the ZIP. Only when the user explicitly selects Run original HTML may the selected document’s own scripts and external resources run inside an isolated Manifest V3 sandbox. This is necessary to preview an interactive HTML prototype selected by the user.”

### Data handling

- The extension does not upload document contents to a Readmode service.
- It stores reader preferences and temporary preview content in the browser.
- It uses the user's existing browser session only when the user chooses to open an authenticated document link.
- It does not use analytics or advertising and does not sell or transfer user data.

## Current release model

- Free and open source under the MIT License.
- No account, subscription, payment, or license activation is required.
- `src/pro/` is not part of the public repository or Community package.

## Final public URLs

- Homepage: `https://cyrus2333.github.io/Readmode/`
- Privacy policy: `https://cyrus2333.github.io/Readmode/privacy.html`
- Terms: `https://cyrus2333.github.io/Readmode/terms.html`
- Support: `https://github.com/Cyrus2333/Readmode/issues`

## Pre-submission gate

Do not upload until all are true:

- `npm run check` passes.
- `npm run preflight` reports no owner-input waits.
- `npm run release:check` passes.
- The ZIP checksum is regenerated and matches the handoff record.
- Final screenshots exist and contain no sensitive data; promotional tiles are optional for the current free release.
- The final public website, privacy policy, terms, and support channel are reachable.
- The current free release does not include a payment or license activation flow.
