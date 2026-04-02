# Copy as Markdown

**Select anything on any webpage. Right-click. Get clean Markdown. Done.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-coming%20soon-lightgrey?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-coming%20soon-lightgrey?logo=firefox&logoColor=white)](https://addons.mozilla.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](#)
[![No tracking](https://img.shields.io/badge/Telemetry-none-brightgreen.svg)](#)

---

## The Problem

You find a great article. A table you need. A code snippet. Documentation. You copy it and paste it into Notion, Obsidian, ChatGPT, your notes app — and it looks like garbage.

Broken formatting. Raw HTML. Walls of unstyled text.

You spend 3 minutes manually fixing what should have taken 3 seconds.

**Copy as Markdown fixes this.**

---

## What It Does

Select any content on any webpage. Right-click → **Copy as Markdown** or hit `Ctrl+Shift+M`.

The selected HTML is instantly converted to clean, properly formatted Markdown and placed on your clipboard. No popups. No settings screen. No account. No internet connection required. **It just works.**

![Demo GIF](https://raw.githubusercontent.com/copy-as-markdown/copy-as-markdown/main/assets/demo.gif)

---

## Everything It Converts

| HTML | Markdown |
| --- | --- |
| `<h1>` – `<h6>` | `#` `##` `###` headings |
| `<strong>`, `<b>` | `**bold**` |
| `<em>`, `<i>` | `*italic*` |
| `<del>`, `<s>` | `~~strikethrough~~` |
| `<a href="...">` | `[text](url)` |
| `<img src="...">` | `![alt](src)` |
| `<ul>`, `<ol>` | Nested lists with proper indentation |
| `<table>` | Full GFM pipe table syntax |
| `<pre><code>` | Fenced code blocks with language detection |
| `<blockquote>` | `> blockquote` |
| `<p>` | Clean paragraphs |

---

## Two Ways to Use It

### 1. Right-click menu
Select text → right-click → choose your action:
- **Copy as Markdown** — copies to clipboard instantly
- **Save as Markdown file** — downloads a `.md` file named after the page title

### 2. Keyboard shortcut

| Platform | Shortcut |
| --- | --- |
| Windows / Linux | `Ctrl` + `Shift` + `M` |
| macOS | `Cmd` + `Shift` + `M` |

---

## Privacy First

- **Zero network requests** — nothing leaves your machine
- **No telemetry** — no analytics, no tracking, no logging
- **No account** — no sign-in, no email, no onboarding
- **Open source** — read every line of code yourself

---

## Install from Source

### Chrome, Edge, or Brave

```bash
git clone https://github.com/copy-as-markdown/copy-as-markdown.git
```

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `copy-as-markdown/` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from the `copy-as-markdown/` folder

> Firefox temporary add-ons are removed on browser restart. For a permanent install, the extension needs to be signed by Mozilla.

---

## CLI — For AI Agents and Pipelines

A companion Node.js CLI fetches any URL and outputs clean Markdown to stdout. Designed for piping into AI tools, scripts, and automation workflows.

```bash
# No install required
npx copy-as-markdown https://example.com/article

# Save to file
npx copy-as-markdown https://example.com/article > article.md

# Pipe into an LLM
npx copy-as-markdown https://news.ycombinator.com/item?id=12345 | llm "summarize this"

# Include page title as H1
npx copy-as-markdown https://example.com/post --title
```

### CLI Options

| Flag | Description |
| --- | --- |
| `--title` | Prepend the page title as an H1 heading |
| `--no-readability` | Skip article extraction — convert the full page body |
| `--help` | Show usage |

### Install globally

```bash
npm install -g copy-as-markdown
```

---

## Tech Stack

- **Manifest V3** — works in Chrome, Edge, Brave, and Firefox 109+
- **Vanilla JavaScript** — no frameworks, no build step
- **[Turndown.js](https://github.com/mixmark-io/turndown)** (MIT) — bundled locally, no CDN
- **[@mozilla/readability](https://github.com/mozilla/readability)** — CLI article extraction
- **Zero runtime dependencies** in the extension itself

---

## Project Structure

```
copy-as-markdown/
├── manifest.json        # Extension manifest (MV3)
├── content.js           # Selection → Markdown → clipboard/download
├── background.js        # Service worker: context menu + shortcut routing
├── turndown.js          # Bundled Turndown.js (no CDN)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── cli/
│   ├── index.js         # Node.js CLI
│   └── package.json
└── README.md
```

---

## Customize the Shortcut

In Chrome: go to `chrome://extensions/shortcuts` and remap to anything you prefer.

---

## Contributing

Contributions are welcome. Open an issue before submitting a pull request for significant changes.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-change`
3. Commit with a clear message
4. Push and open a pull request

**Good first issues:**
- Add a Turndown plugin for better `<figure>` / `<figcaption>` handling
- Support `<details>` / `<summary>` conversion
- Firefox permanent install packaging
- Add unit tests for conversion rules

---

## Why This Exists

AI workflows, note-taking, and writing in Markdown are now mainstream. But the web still serves HTML. Every researcher, developer, writer, and analyst who uses tools like Obsidian, Notion, Logseq, ChatGPT, or VS Code hits this friction dozens of times a day. This extension removes it entirely — no friction, no dependencies, no cloud, no cost.

---

## License

MIT — use it, fork it, ship it.

---

<p align="center">
  Made for people who live in Markdown.
</p>
