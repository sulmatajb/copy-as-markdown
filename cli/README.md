# Copy as Markdown

**Turn any webpage into clean Markdown. Built for AI agents, pipelines, and anyone who needs structured content.**

[![npm](https://img.shields.io/npm/v/copy-as-markdown)](https://www.npmjs.com/package/copy-as-markdown)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/sulmatajb/copy-as-markdown/blob/main/LICENSE)

---

## Why

When you feed web content to ChatGPT, Claude, Copilot, or any AI tool, raw HTML wastes tokens on noise — tags, styles, scripts, navigation. Markdown is what your AI actually reads.

**Copy as Markdown fetches any URL and outputs clean, structured Markdown to stdout.**

---

## Usage

```bash
# No install required
npx copy-as-markdown https://example.com/article

# Save to file
npx copy-as-markdown https://example.com/article > article.md

# Pipe into an LLM
npx copy-as-markdown https://news.ycombinator.com/item?id=12345 | llm "summarize this"

# Include page title as H1
npx copy-as-markdown https://example.com/post --title

# Skip article extraction — convert the full page
npx copy-as-markdown https://example.com --no-readability
```

## Options

| Flag | Description |
| --- | --- |
| `--title` | Prepend the page title as an H1 heading |
| `--no-readability` | Skip Readability extraction — convert the full page body |
| `--help`, `-h` | Show usage |

## Install globally

```bash
npm install -g copy-as-markdown
```

## How it works

1. Fetches the URL with a browser-like User-Agent
2. Extracts the main article content using [@mozilla/readability](https://github.com/mozilla/readability)
3. Converts the HTML to Markdown using [Turndown.js](https://github.com/mixmark-io/turndown)
4. Outputs clean Markdown to stdout

Requires Node.js >= 18.

## Browser Extension

Copy as Markdown also ships as a **browser extension** that converts selected web content in one keystroke (`Cmd+Shift+M`).

Works in Chrome, Edge, Brave, and Firefox.

👉 [Get the extension on GitHub](https://github.com/sulmatajb/copy-as-markdown)

## Use cases

- Feed research and documentation into ChatGPT, Claude, or Copilot
- Build AI agent pipelines that process web content
- Populate RAG systems and vector databases with clean source material
- Automate content extraction in CI/CD or scripts
- Archive web pages as readable Markdown files

## Privacy

- **Zero telemetry** — no analytics, no tracking
- **Open source** — read every line of code

## License

MIT — [github.com/sulmatajb/copy-as-markdown](https://github.com/sulmatajb/copy-as-markdown)
