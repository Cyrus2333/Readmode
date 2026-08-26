# Readmode Release Checklist

## Product

- [ ] Local Markdown opens and renders.
- [ ] Online Markdown link with authentication opens and renders.
- [ ] Local HTML keeps its styles in safe preview.
- [ ] HTML prototype can be opened in original runtime mode.
- [x] HTML has no Readmode layout shell around the page.
- [x] Markdown uses a full-screen left TOC + fluid content layout.
- [x] Original source dialog has a sticky title row and closes by button, Escape, and backdrop click.
- [x] No dead menu actions remain.
- [ ] Popup status matches native page vs Readmode viewer.
- [x] Remote document fetch has a finite timeout and user-readable network errors.
- [x] Settings page saves preferences.
- [x] Pro typography settings are gated and applied only after local license verification.
- [ ] Extension can be refreshed and reloaded from an unpacked folder.

## Security and privacy

- [x] Safe HTML preview removes scripts, forms, iframes, event handlers, and dangerous URL schemes.
- [x] “Run original HTML” is explicit and clearly labeled.
- [x] No document content is sent to a Readmode backend.
- [x] Content script avoids reading arbitrary normal web-page text.
- [x] Privacy policy matches current permissions and behavior in source and static page.
- [ ] Host permissions are reviewed and justified before store submission.
- [ ] Test untrusted HTML and online links in a clean Chrome profile.

## Store listing

- [x] Icons at 16, 32, 48, and 128 px.
- [x] English and Simplified Chinese metadata added.
- [x] Store title and summary drafted in `store-listing.md`.
- [ ] Screenshots show real Markdown and HTML use cases.
- [x] No unsupported integrations or collaboration claims.
- [ ] Support URL and privacy URL are live and final.
- [x] Version in manifest, package script, and release notes is `0.3.0`.
- [ ] Chrome Web Store developer account and listing are configured.
- [x] Release package emits a SHA-256 checksum alongside the ZIP.
- [x] Static website links are checked automatically.

## Commercial readiness

- [x] Free / Pro boundary documented.
- [x] At least one real Pro feature implemented and gated.
- [x] Offline signed license verifier and issuance tooling prepared.
- [ ] Production license key pair generated and securely backed up.
- [ ] Choose a payment provider and supported currency/region.
- [ ] Confirm tax, refund, and customer-support handling.
- [ ] Configure payment URL and paid-feature wording.
- [ ] Test activation and post-refund handling on a clean Chrome profile.
- [ ] Do not accept real payment until the production key and public policy pages are final.
