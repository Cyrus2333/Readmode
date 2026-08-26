# Security policy

## Supported version

Security fixes are prioritized for the latest released Community Edition and the current official Store Edition.

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability. Use the repository's private security reporting channel when it is enabled. If it is not enabled, contact the maintainer through the support address published on the official Readmode website.

Do not include document contents, credentials, license keys, payment records, or other private data in a report. A minimal sanitized reproduction is preferred.

## Security boundaries

Readmode is local-first and does not upload document contents to a Readmode backend. Safe HTML preview removes active content by default. The explicit original-runtime mode is intended only for HTML sources the user trusts.
