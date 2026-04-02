# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-02

### Added
- Right-click context menu: **Copy as Markdown** (copies to clipboard)
- Right-click context menu: **Save as Markdown file** (downloads `.md` file named after page title)
- Keyboard shortcut `Ctrl+Shift+M` / `Cmd+Shift+M`
- Full HTML → Markdown conversion: headings, bold, italic, strikethrough, links, images, ordered/unordered lists (nested), tables (GFM), fenced code blocks with language detection, blockquotes, paragraphs
- Brief toast notification on copy/save
- Bundled Turndown.js locally — no CDN, no network dependency
- Manifest V3 — compatible with Chrome, Edge, Brave, Firefox 109+
- Node.js CLI (`npx copy-as-markdown <url>`) with `--title` and `--no-readability` flags
- Zero telemetry, zero network requests from extension
