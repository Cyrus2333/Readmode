# Chrome Web Store listing assets — Readmode 0.3.2

This directory is the final handoff location for the visual assets uploaded to the Chrome Web Store Developer Dashboard.

## Captured from the release candidate

- `screenshot-01-markdown.png` — 1280×800, Markdown reading view with table of contents, alert, table, checklist, and code block.
- `screenshot-02-html-preview.png` — 1280×800, HTML prototype rendered in Readmode safe preview.
- `screenshot-03-original-runtime.png` — 1280×800, sanitized HTML prototype running in its original page mode.

## Still needed before submission

- `screenshot-04-online-document.png` — 1280×800, sanitized online-document example, if this capability is included in the listing.
- `screenshot-05-local-first.png` — 1280×800, settings/privacy behavior.
- `small-tile-440x280.png` — 440×280, branded PNG/JPEG.
- `marquee-1400x560.png` — 1400×560, branded PNG/JPEG.
- `promo-video.txt` — one public promo-video URL, if used.

## Guardrails

- Capture only from the release candidate loaded in Chrome.
- Do not show private URLs, customer content, user names, credentials, order data, or source-code secrets.
- Keep the extension name, UI language, and store copy consistent with the submitted 0.3.2 ZIP.
- Do not upload placeholder graphics. Before submission, add the remaining required listing assets and run `npm run release:check`.
