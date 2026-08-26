# Readmode

Readmode is a local-first Chrome extension for reading Markdown files and previewing HTML documents and prototypes.

## Product promise

- Read Markdown files and attachment links directly in Chrome.
- Preview HTML prototypes without losing their original layout and styles.
- Use a safe HTML preview by default, and run original HTML only after an explicit choice.
- Keep document processing in the browser instead of uploading documents to a Readmode backend.

## Current capabilities

- Local `.md`, `.markdown`, `.mkd`, `.mdx`, `.html`, and `.htm` files.
- Online Markdown / HTML links, including authenticated document links that the browser can already access.
- Full-screen Markdown layout with a permanent left table of contents and a fluid document area.
- Tables, task lists, blockquotes, GitHub-style alerts, images, links, code blocks, dark mode, source view, and Markdown printing.
- Full-screen safe HTML preview that preserves document styles.
- Explicit “Run original HTML” action for interactive prototypes.
- Settings page with auto-render preference, per-page processing rules from the extension menu, Markdown theme, and reader width.
- The official Store Edition additionally includes Pro-gated local typography controls: font family, text scale, and line height.


## Open-source and commercial editions

This repository contains **Readmode Community Edition**, the open-source local-first core. It is licensed under the MIT License.

The official Chrome Web Store package is built separately and contains the Community core plus proprietary, optional Readmode Pro functionality. The Pro implementation is not included in this public repository. `npm run package:community` creates the public package; `npm run package:store` is intended for the private release environment where `src/pro/license.js` is available.

See `COMMUNITY.md` for contribution and trademark boundaries.

## Local development

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click “Load unpacked”.
4. Select this project directory.
5. Enable “Allow access to file URLs” in the extension details when testing local files.

Run checks and build the public Community package:

```bash
npm run check
npm run preflight
npm run package
```

The public package is written to `dist/readmode-0.3.0-community.zip`. The private Chrome Web Store build must be created in the commercial release environment with `npm run check:store && npm run package:store`; it writes `dist/readmode-0.3.0-store.zip` and its SHA-256 checksum.

## Product and release preparation

- `store-listing.md` — Chrome Web Store copy and keyword strategy.
- `privacy-policy.md` — local-first privacy policy source.
- `docs/store-submission.md` — store metadata, permissions, screenshots, and manual acceptance.
- `docs/release-checklist.md` — product, security, store, and commercial release checklist.
- `docs/acceptance-matrix.md` — final Chrome manual acceptance matrix.
- `docs/licensing.md` — offline license key generation and issuance process.
- `docs/commercial-launch.md` — payment-provider-neutral launch plan.
- `docs/commercial-owner-inputs.md` — owner decisions needed before public sales.
- `site/` — static product website, privacy page, terms draft, Pro page, and support page.

## Commercial boundary

The extension runtime is intentionally front-end only. The current build does not connect to a payment provider or license server. Pro activation uses an offline ECDSA signature; the extension contains only a public key. Before accepting real payments, generate a production key pair, replace the public key, configure a third-party checkout, and configure a real support/privacy URL. Use `npm run commercial:configure -- --help` to update the three public URLs without editing the source manually.

The static website can be deployed independently to GitHub Pages, Cloudflare Pages, or another static host. The extension itself must continue to work if that website is unavailable.
