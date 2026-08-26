# Contributing to Readmode Community Edition

Thank you for helping improve Readmode Community Edition.

## Scope

This repository contains the open-source local-first core: Markdown reading, HTML safe preview, and related browser UX. Proprietary Readmode Pro implementation, production signing material, payment credentials, and customer data are not part of this repository.

## Before opening a pull request

1. Keep document processing local unless a change explicitly documents a new privacy boundary.
2. Run `npm run check`.
3. Run `npm run package:community` and confirm the generated archive does not contain `src/pro/`.
4. Do not include real private URLs, user names, documents, license keys, payment information, or secrets in code, tests, screenshots, or issue reports.

## Pull requests

Describe the user problem, the behavior that changed, and how you tested it. Small, focused pull requests are easier to review. UI changes should include a sanitized screenshot when useful.

## Commercial edition

The official Chrome Web Store edition may contain proprietary optional Pro functionality. Community contributions should not depend on private Pro modules or private release infrastructure.
