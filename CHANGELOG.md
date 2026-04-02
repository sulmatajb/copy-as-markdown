# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-02

### Added
- **Copy Full Page as Markdown** — when nothing is selected, the keyboard shortcut copies the entire page content as clean Markdown (strips nav, footer, sidebar, ads automatically)
- New right-click menu item: **Copy Full Page as Markdown** (available on any page, even without selection)
- **Save as Markdown file** now available from right-click on any page (previously required text selection)
- Improved toast notifications with slide-in animation, color-coded states (blue = copy, green = save, yellow = warning), and modern styling
- New extension icon with improved visibility at all sizes
- Hero image and Open Graph social card for GitHub

### Changed
- Keyboard shortcut now intelligently falls back to full page copy when nothing is selected
- Cleaner noise removal for full page copy (strips navs, footers, sidebars, cookie banners, ads)
- Updated extension description to emphasize AI context management
- README completely rewritten with context management narrative
- CLI package.json prepared for npm publish with proper metadata

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
