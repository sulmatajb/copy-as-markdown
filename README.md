# Copy as Markdown

**The web is full of content your AI can't cleanly read. This fixes that.**

[![Install in Chrome](https://img.shields.io/badge/Chrome-Install%20Now-4285F4?logo=googlechrome&logoColor=white)](#install-the-extension)
[![Install in Firefox](https://img.shields.io/badge/Firefox-Install%20Now-FF7139?logo=firefox&logoColor=white)](#install-the-extension)
[![Install in Edge](https://img.shields.io/badge/Edge-Install%20Now-0078D7?logo=microsoftedge&logoColor=white)](#install-the-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![No tracking](https://img.shields.io/badge/Telemetry-none-brightgreen.svg)](#)

---

## Why This Exists

When you paste raw web content into ChatGPT, Claude, or any AI agent, you're not just pasting text. You're pasting HTML noise — tags, attributes, scripts, navigation, footers, ads — all of it consuming tokens and costing money without adding any signal.

Markdown is the format AI models actually understand. Clean structure, no noise, maximum signal per token.

**Copy as Markdown converts any selected web content to clean Markdown in one keystroke.** Built for people who use AI daily and want to feed it better context at lower cost.

---

## What It Does

Select any content on any webpage. Right-click → **Copy as Markdown** or hit `Ctrl+Shift+M`.

Clean, structured Markdown lands on your clipboard instantly. Paste it directly into ChatGPT, Claude, Copilot, your AI agent pipeline, or any tool that reads Markdown. No popups. No settings. No account. No internet connection required.

<!-- Add a demo GIF: record selecting text and hitting the shortcut, upload as assets/demo.gif -->

---

## Install the Extension

No app store required. Takes 30 seconds.

### Chrome, Edge, or Brave

1. [Download the repo as a ZIP](https://github.com/sulmatajb/copy-as-markdown/archive/refs/heads/main.zip) and unzip it — or clone it:
   ```bash
   git clone https://github.com/sulmatajb/copy-as-markdown.git
   ```
2. Open `chrome://extensions` in your browser
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked**
5. Select the `copy-as-markdown/` folder

Done. The extension is live.

### Firefox

1. Clone or download the repo (see above)
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…**
4. Select `manifest.json` from the `copy-as-markdown/` folder

> Firefox temporary add-ons are removed on browser restart. For a permanent install the extension needs to be signed by Mozilla.

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

To remap: `chrome://extensions/shortcuts`

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

## Privacy First

- **Zero network requests** — nothing leaves your machine
- **No telemetry** — no analytics, no tracking, no logging
- **No account** — no sign-in, no email, no onboarding
- **Open source** — read every line of code yourself

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

## The Token Problem

When you paste raw HTML into an AI model, you're wasting tokens on noise that adds zero value:

- Navigation menus, headers, footers
- Inline styles and class attributes
- Script tags and tracking pixels
- Duplicate whitespace and line breaks

Markdown strips all of that. What's left is pure content — the signal your AI actually needs. Fewer tokens means lower API costs, faster responses, and better output quality because the model isn't distracted by junk.

**This matters most for:**
- Feeding research and documentation into ChatGPT, Claude, or Copilot
- Building AI agent pipelines that process web content
- Populating RAG systems and vector databases with clean source material
- Saving context window space when working with long documents

---

## License

MIT — use it, fork it, ship it.

---

<p align="center">
  Made for people who live in Markdown.
</p>
