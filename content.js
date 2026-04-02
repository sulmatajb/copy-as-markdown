/**
 * content.js — Copy as Markdown
 *
 * Handles:
 *  - Keyboard shortcut (Ctrl/Cmd+Shift+M)
 *  - Message listener from background.js (context-menu click)
 *  - HTML → Markdown conversion via bundled Turndown.js
 *  - Clipboard write via Async Clipboard API (execCommand fallback)
 *  - Brief toast notification
 *
 * Loaded after turndown.js via manifest content_scripts.
 */

(function () {
  'use strict';

  // ─── Turndown instance ───────────────────────────────────────────────────

  const td = new TurndownService({
    headingStyle: 'atx',        // # ## ###  (not setext underlines)
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
  });

  // ─── Extra rules ─────────────────────────────────────────────────────────

  // Strikethrough: <del>, <s>, <strike>
  td.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: function (content) {
      return '~~' + content + '~~';
    }
  });

  // ── GFM Tables ────────────────────────────────────────────────────────────
  //
  // Turndown has no built-in table support; these three rules produce
  // proper GitHub Flavored Markdown table syntax including:
  //   - Pipe-delimited cells with leading/trailing spaces
  //   - Separator row after the header
  //   - Right/center/left alignment markers from <th align="…">
  //   - Pipe characters inside cell content are escaped (\|)

  td.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: function (content) {
      // Collapse newlines inside a cell to a space; escape literal pipes.
      return ' ' + content.replace(/\r?\n/g, ' ').trim().replace(/\|/g, '\\|') + ' |';
    }
  });

  td.addRule('tableRow', {
    filter: 'tr',
    replacement: function (content, node) {
      var row = '|' + content + '\n';

      // If this is the header row, append a separator line
      if (isHeadingRow(node)) {
        var sep = '|' + Array.from(node.cells).map(function (cell) {
          var align = (cell.getAttribute('align') || '').toLowerCase();
          if (align === 'right')  return ' ---: |';
          if (align === 'center') return ' :---: |';
          if (align === 'left')   return ' :--- |';
          return ' --- |';
        }).join('');
        row += sep + '\n';
      }
      return row;
    }
  });

  td.addRule('table', {
    filter: function (node) {
      return node.nodeName === 'TABLE';
    },
    replacement: function (content) {
      var lines = content.trim().split('\n').filter(function (l) { return l.trim(); });

      // Safety net: if no separator row was produced (table had no <thead>
      // and no <th> elements), inject a generic one after the first row.
      var hasSep = lines.some(function (l) {
        return /^\|[\s\-:|]+\|/.test(l) && l.indexOf('---') !== -1;
      });
      if (!hasSep && lines.length > 0) {
        var pipes = (lines[0].match(/\|/g) || []);
        var cols = Math.max(pipes.length - 1, 1);
        var sep = '|' + Array(cols).fill(' --- |').join('');
        lines.splice(1, 0, sep);
      }
      return '\n\n' + lines.join('\n') + '\n\n';
    }
  });

  /**
   * Returns true if <tr> is the table's heading row.
   * Covers both <thead><tr> and a bare first <tr> containing <th>.
   * @param {HTMLTableRowElement} tr
   * @returns {boolean}
   */
  function isHeadingRow(tr) {
    var parent = tr.parentNode;
    return (
      parent.nodeName === 'THEAD' ||
      (parent.nodeName === 'TABLE' && parent.rows[0] === tr)
    );
  }

  // Remove noisy non-content elements
  td.remove(['script', 'style', 'noscript', 'head']);

  // ─── Core conversion function ─────────────────────────────────────────────

  /**
   * Converts an HTML string to clean Markdown.
   * @param {string} html
   * @returns {string}
   */
  function htmlToMarkdown(html) {
    try {
      return td.turndown(html);
    } catch (e) {
      console.warn('[Copy as Markdown] Conversion error:', e);
      // Graceful fallback: strip tags and return plain text
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || '';
    }
  }

  /**
   * Gets the HTML of the current selection.
   * Returns null when nothing is selected.
   * @returns {string|null}
   */
  function getSelectionHTML() {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return null;
    }
    var range = selection.getRangeAt(0);
    var fragment = range.cloneContents();
    var div = document.createElement('div');
    div.appendChild(fragment);
    return div.innerHTML;
  }

  /**
   * Writes text to the clipboard.
   * Prefers the Async Clipboard API; falls back to execCommand for
   * environments where the async API is unavailable or blocked.
   * @param {string} text
   * @returns {Promise<void>}
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_e) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch (_e2) { /* nothing we can do */ }
      document.body.removeChild(ta);
    }
  }

  /**
   * Shows a brief, non-intrusive toast at the bottom-right of the viewport.
   * Fades out and self-destructs after ~2 seconds.
   * @param {string} message
   */
  function showToast(message) {
    var existing = document.getElementById('__cam_toast__');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = '__cam_toast__';
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:2147483647',
      'background:#1a1a1a',
      'color:#ffffff',
      'font:500 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'padding:10px 16px',
      'border-radius:6px',
      'box-shadow:0 4px 20px rgba(0,0,0,.4)',
      'pointer-events:none',
      'transition:opacity .25s ease',
      'opacity:1',
      'letter-spacing:.01em'
    ].join(';');

    document.documentElement.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 260);
    }, 1800);
  }

  // ─── Main actions ─────────────────────────────────────────────────────────

  /**
   * Shared helper: get selection HTML → convert → return markdown string.
   * Shows a toast and returns null if nothing is selected or convertible.
   * @returns {string|null}
   */
  function getSelectionMarkdown() {
    var html = getSelectionHTML();
    if (!html || !html.trim()) {
      showToast('\u26A0 Select some text first');
      return null;
    }
    var markdown = htmlToMarkdown(html);
    if (!markdown.trim()) {
      showToast('\u26A0 Nothing to convert');
      return null;
    }
    return markdown;
  }

  /**
   * Copies the selected content as Markdown to the clipboard.
   */
  async function copySelectionAsMarkdown() {
    var markdown = getSelectionMarkdown();
    if (!markdown) return;
    await copyToClipboard(markdown);
    showToast('\u2713 Copied as Markdown');
  }

  /**
   * Downloads the selected content as a .md file.
   * The filename is derived from the page title, sanitised for the filesystem.
   */
  function saveSelectionAsMarkdown() {
    var markdown = getSelectionMarkdown();
    if (!markdown) return;

    // Build a safe filename from the page title
    var raw = (document.title || 'selection').trim();
    var filename = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → dash
      .replace(/^-+|-+$/g, '')        // trim leading/trailing dashes
      .slice(0, 60) || 'selection';   // max 60 chars
    filename += '.md';

    // Create a Blob and trigger a download via a temporary <a> element
    var blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.cssText = 'display:none';
    document.body.appendChild(a);
    a.click();
    // Clean up after the browser has had time to start the download
    setTimeout(function () {
      URL.revokeObjectURL(url);
      if (a.parentNode) a.remove();
    }, 1000);

    showToast('\u2193 Saved as ' + filename);
  }

  // ─── Keyboard shortcut listener ──────────────────────────────────────────
  //
  // Ctrl+Shift+M  (Windows / Linux)
  // Cmd+Shift+M   (macOS)
  //
  // The shortcut is also declared in manifest.json "commands" so that Chrome
  // can route it even when the page is not focused. This listener provides a
  // direct in-page fallback and fires first for most use-cases.

  document.addEventListener('keydown', function (e) {
    var isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    var modifierHeld = isMac ? e.metaKey : e.ctrlKey;
    if (modifierHeld && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
      e.preventDefault();
      e.stopPropagation();
      copySelectionAsMarkdown();
    }
  }, /* capture */ true);

  // ─── Message listener (background.js → content script) ───────────────────

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (!message) return;

    if (message.action === 'copyAsMarkdown') {
      copySelectionAsMarkdown().then(function () {
        sendResponse({ ok: true });
      }).catch(function (err) {
        sendResponse({ ok: false, error: err && err.message });
      });
      return true; // keep channel open for async response
    }

    if (message.action === 'saveAsMarkdown') {
      saveSelectionAsMarkdown();
      sendResponse({ ok: true });
    }
  });

})();
