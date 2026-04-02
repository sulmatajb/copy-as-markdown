#!/usr/bin/env node
/**
 * copy-as-markdown CLI
 * --------------------
 * Fetch a URL, extract its main article content with @mozilla/readability,
 * and output clean Markdown to stdout.
 *
 * Usage:
 *   npx copy-as-markdown https://example.com/article
 *   copy-as-markdown https://example.com/article > output.md
 *
 * Requires Node.js >= 18.
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

// ─── Argument parsing ────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));

const url = args[0];

if (!url || flags.includes('--help') || flags.includes('-h')) {
  console.error(`
copy-as-markdown — Fetch a URL and output clean Markdown to stdout.

Usage:
  copy-as-markdown <url> [options]

Options:
  --no-readability   Skip Readability extraction; convert the full page HTML
  --title            Prepend the page title as an H1 heading
  --help, -h         Show this help message

Examples:
  copy-as-markdown https://en.wikipedia.org/wiki/Markdown
  copy-as-markdown https://news.ycombinator.com --no-readability
  copy-as-markdown https://example.com/article --title > article.md
  `.trim());
  process.exit(url ? 0 : 1);
}

const useReadability = !flags.includes('--no-readability');
const prependTitle   = flags.includes('--title');

// ─── Turndown config ─────────────────────────────────────────────────────────

const td = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined'
});

// Strikethrough support
td.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: content => `~~${content}~~`
});

// Remove non-content elements
td.remove(['script', 'style', 'noscript', 'nav', 'footer', 'aside', 'head',
           'form', 'button', 'input', 'select', 'textarea', 'iframe',
           'figure > figcaption:empty']);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    console.error(`Error: "${url}" is not a valid URL.\nMake sure to include the protocol, e.g. https://example.com`);
    process.exit(1);
  }

  // Fetch
  let html;
  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; copy-as-markdown/1.0; +https://github.com/copy-as-markdown/copy-as-markdown)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow',
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    html = await response.text();
  } catch (err) {
    console.error(`Error fetching URL: ${err.message}`);
    process.exit(1);
  }

  // Parse with JSDOM
  const dom = new JSDOM(html, { url: parsedUrl.href });
  const document = dom.window.document;

  let contentHtml;
  let title = document.title || '';

  if (useReadability) {
    // Readability extracts the main article content
    const reader = new Readability(document);
    const article = reader.parse();

    if (article) {
      contentHtml = article.content;
      title = article.title || title;
    } else {
      // Readability found nothing meaningful — fall back to <body>
      process.stderr.write('Warning: Readability could not extract article content. Using full page body.\n');
      contentHtml = document.body ? document.body.innerHTML : html;
    }
  } else {
    contentHtml = document.body ? document.body.innerHTML : html;
  }

  // Convert to Markdown
  let markdown = td.turndown(contentHtml);

  // Prepend title if requested
  if (prependTitle && title) {
    markdown = `# ${title.trim()}\n\n${markdown}`;
  }

  // Clean up excessive blank lines (more than 2 in a row → 2)
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Output to stdout
  process.stdout.write(markdown + '\n');
}

run().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
