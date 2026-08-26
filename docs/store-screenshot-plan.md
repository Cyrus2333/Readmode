# Chrome Web Store Screenshot Plan

Capture these from the final unpacked extension build at 1280×800. The current Store Listing dashboard also expects a 440×280 small promo tile and a 1400×560 marquee promo tile; keep those as separate, branded assets rather than reusing a screenshot. Use real documents and keep each image focused on one benefit.

1. **Markdown reading** — local PRD with left navigation, headings, table, alert, and code block. Caption: “Read Markdown files comfortably”.
2. **Online attachment** — authenticated attachment link rendered as a readable document. Caption: “Turn document links into readable pages”. Do not expose private URLs or user data.
3. **HTML prototype** — full-screen HTML prototype in safe preview. Caption: “Preview HTML prototypes without losing their styles”.
4. **Original runtime** — the same prototype after explicitly choosing “Run original HTML”. Caption: “Run interactive HTML prototypes when you choose”.
5. **Privacy / local-first** — extension settings or popup showing local-first behavior. Caption: “Your documents stay in the browser”.

Do not use placeholder screenshots in the store listing. Capture final UI after the last release candidate is loaded in Chrome.


## Asset handoff

Recommended filenames under `docs/store-assets/`:

- `screenshot-01-markdown.png` through `screenshot-05-local-first.png`;
- `small-tile-440x280.png`;
- `marquee-1400x560.png`;
- `promo-video.txt` containing the final public video URL, if used.
