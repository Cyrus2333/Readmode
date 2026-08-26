# Chrome Web Store listing assets — Readmode 0.3.0

This directory is the final handoff location for the visual assets uploaded to the Chrome Web Store Developer Dashboard.

## Required before submission

- `screenshot-01-markdown.png` — 1280×800 (or the dashboard's accepted screenshot dimensions), final extension UI, no private data.
- `screenshot-02-online-document.png` — 1280×800, sanitized online-document example.
- `screenshot-03-html-preview.png` — 1280×800, safe HTML preview.
- `small-tile-440x280.png` — 440×280, branded PNG/JPEG.
- `marquee-1400x560.png` — 1400×560, branded PNG/JPEG.

Optional:

- `screenshot-04-original-runtime.png` — 1280×800, explicit original-runtime behavior.
- `screenshot-05-local-first.png` — 1280×800, settings/privacy behavior.
- `promo-video.txt` — one public promo-video URL.

## Guardrails

- Capture only from the release candidate loaded in Chrome.
- Do not show private URLs, customer content, user names, credentials, order data, or source-code secrets.
- Keep the extension name, UI language, and store copy consistent with the submitted 0.3.0 ZIP.
- Do not upload placeholder graphics. Replace this README's required list with real files, then run `npm run release:check`.
