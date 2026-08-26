# Chrome Web Store Developer Dashboard entry sheet — Readmode 0.3.0

Use this document to enter the CWS dashboard fields consistently. It does **not** authorize publishing or payment collection by itself.

## Package

- File: `dist/readmode-0.3.0-store.zip` (private Store build; do not upload the Community ZIP)
- SHA-256: run `shasum -a 256 dist/readmode-0.3.0-store.zip` immediately before upload.
- Version: `0.3.0`
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

- `storage`: Stores reader preferences, preview content used only for the active local browser workflow, and a user-pasted offline license record. It does not create a cloud copy of documents.
- `tabs`: Opens the Readmode viewer after a user action and returns to the source tab if the user selects the original HTML runtime.
- `contextMenus`: Provides the user-initiated “Open in Readmode” context-menu action.
- Host access (`http`, `https`, and user-enabled local file URLs): Reads Markdown/HTML documents that the user opens or explicitly sends to Readmode. The extension does not read ordinary HTML page content merely because a URL ends in `.html`.

### Remote code

Select **No**: all extension JavaScript, CSS, and HTML ship in the ZIP. A document's own scripts can run only after the user explicitly selects “Run original HTML”; that is document behavior, not remotely hosted extension code.

### Data handling

- The extension does not upload document contents to a Readmode service.
- It stores reader preferences, temporary preview content, and an offline license record in the browser.
- It uses the user's existing browser session only when the user chooses to open an authenticated document link.
- It does not use analytics or advertising and does not sell or transfer user data.

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
- Final screenshots and both promo tiles exist and contain no sensitive data.
- The final public website, privacy policy, terms/refund policy, and support channel are reachable.
- A production public license key is configured, backed up securely, and the private key is absent from the project.
