/**
 * content.js — Copy as Markdown
 *
 * Handles:
 *  - Keyboard shortcut (Ctrl/Cmd+Shift+M)
 *  - Message listener from background.js (context-menu click)
 *  - HTML → Markdown conversion via bundled Turndown.js
 *  - Clipboard write via Async Clipboard API (execCommand fallback)
 *  - Brief toast notification with slide-in animation
 *
 * Loaded after turndown.js via manifest content_scripts.
 */

(function () {
  'use strict';

  // ─── Turndown instance ───────────────────────────────────────────────────

  var td = new TurndownService({
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
   * Gets the full page body HTML, cleaning out nav/footer/sidebar noise.
   * @returns {string}
   */
  function getFullPageHTML() {
    // Clone body to avoid mutating the live DOM
    var clone = document.body.cloneNode(true);

    // Remove common non-content elements
    var noiseTags = ['nav', 'footer', 'header', 'aside', 'script', 'style',
                     'noscript', 'iframe', 'svg', 'form'];
    noiseTags.forEach(function (tag) {
      var els = clone.querySelectorAll(tag);
      for (var i = 0; i < els.length; i++) {
        els[i].remove();
      }
    });

    // Remove elements with common noise class/id patterns
    var noiseSelectors = [
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '[class*="sidebar"]', '[class*="nav-"]', '[class*="footer"]',
      '[class*="header"]', '[class*="menu"]', '[class*="cookie"]',
      '[class*="popup"]', '[class*="modal"]', '[class*="ad-"]',
      '[class*="advertisement"]', '[id*="sidebar"]', '[id*="footer"]',
      '[id*="header"]', '[id*="nav"]', '[id*="cookie"]', '[id*="ad-"]'
    ];
    noiseSelectors.forEach(function (sel) {
      try {
        var els = clone.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) {
          els[i].remove();
        }
      } catch (_e) { /* invalid selector on some pages, skip */ }
    });

    return clone.innerHTML;
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

  // ─── Toast notification ─────────────────────────────────────────────────

  // Inject toast styles once
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    '@keyframes __cam_slide_in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
    '@keyframes __cam_fade_out { from { opacity: 1; } to { opacity: 0; transform: translateY(8px); } }',
    '#__cam_toast__ {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  right: 24px;',
    '  z-index: 2147483647;',
    '  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);',
    '  color: #ffffff;',
    '  font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
    '  padding: 12px 18px;',
    '  border-radius: 10px;',
    '  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(88, 166, 255, 0.15);',
    '  pointer-events: none;',
    '  animation: __cam_slide_in 0.3s cubic-bezier(0.16, 1, 0.3, 1);',
    '  letter-spacing: 0.01em;',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '}',
    '#__cam_toast__.--success { border-left: 3px solid #58a6ff; }',
    '#__cam_toast__.--warning { border-left: 3px solid #d29922; }',
    '#__cam_toast__.--save    { border-left: 3px solid #56d364; }',
    '#__cam_toast__.--fadeout { animation: __cam_fade_out 0.3s ease forwards; }'
  ].join('\n');
  document.documentElement.appendChild(styleEl);

  /**
   * Shows a brief, non-intrusive toast at the bottom-right of the viewport.
   * Slides in and fades out after ~2.5 seconds.
   * @param {string} message
   * @param {'success'|'warning'|'save'} [type='success']
   */
  function showToast(message, type) {
    type = type || 'success';
    var existing = document.getElementById('__cam_toast__');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = '__cam_toast__';
    toast.className = '--' + type;
    toast.textContent = message;

    document.documentElement.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('--fadeout');
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 320);
    }, 2500);
  }

  // ─── Main actions ─────────────────────────────────────────────────────────

  /**
   * Shared helper: get selection HTML → convert → return markdown string.
   * Shows a toast and returns null if nothing is selected or convertible.
   * @param {boolean} [allowFullPage=false]  If true, falls back to full page when nothing selected.
   * @returns {{ markdown: string, isFullPage: boolean } | null}
   */
  function getMarkdown(allowFullPage) {
    var html = getSelectionHTML();
    var isFullPage = false;

    if (!html || !html.trim()) {
      if (allowFullPage) {
        html = getFullPageHTML();
        isFullPage = true;
      } else {
        showToast('\u26A0 Select some text first', 'warning');
        return null;
      }
    }

    var markdown = htmlToMarkdown(html);
    if (!markdown.trim()) {
      showToast('\u26A0 Nothing to convert', 'warning');
      return null;
    }
    return { markdown: markdown, isFullPage: isFullPage };
  }

  /**
   * Copies the selected content (or full page) as Markdown to the clipboard.
   * @param {boolean} [fullPage=false]  Force full page copy.
   */
  async function copyAsMarkdown(fullPage) {
    var result;
    if (fullPage) {
      // Explicitly full page — skip selection check
      var html = getFullPageHTML();
      var markdown = htmlToMarkdown(html);
      if (!markdown.trim()) {
        showToast('\u26A0 Nothing to convert', 'warning');
        return;
      }
      result = { markdown: markdown, isFullPage: true };
    } else {
      result = getMarkdown(true); // allow fallback to full page
    }
    if (!result) return;

    await copyToClipboard(result.markdown);
    var label = result.isFullPage ? '\u2713 Full page copied as Markdown' : '\u2713 Copied as Markdown';
    showToast(label, 'success');
  }

  /**
   * Downloads the selected content as a .md file.
   * The filename is derived from the page title, sanitised for the filesystem.
   * Sends to background script for proper download via chrome.downloads API.
   */
  function saveAsMarkdown() {
    var result = getMarkdown(true); // allow full page fallback
    if (!result) return;

    // Build a safe filename from the page title
    var raw = (document.title || 'selection').trim();
    var filename = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → dash
      .replace(/^-+|-+$/g, '')        // trim leading/trailing dashes
      .slice(0, 60) || 'selection';   // max 60 chars
    filename += '.md';

    // Send to background script for download (avoids Blob URL filename issues)
    chrome.runtime.sendMessage({
      action: 'downloadMarkdown',
      markdown: result.markdown,
      filename: filename
    });

    var label = result.isFullPage ? '\u2193 Full page saved as ' + filename : '\u2193 Saved as ' + filename;
    showToast(label, 'save');
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
      copyAsMarkdown(false);
    }
  }, /* capture */ true);

  // ─── Message listener (background.js → content script) ───────────────────

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (!message) return;

    if (message.action === 'copyAsMarkdown') {
      copyAsMarkdown(false).then(function () {
        sendResponse({ ok: true });
      }).catch(function (err) {
        sendResponse({ ok: false, error: err && err.message });
      });
      return true; // keep channel open for async response
    }

    if (message.action === 'copyFullPageAsMarkdown') {
      copyAsMarkdown(true).then(function () {
        sendResponse({ ok: true });
      }).catch(function (err) {
        sendResponse({ ok: false, error: err && err.message });
      });
      return true;
    }

    if (message.action === 'saveAsMarkdown') {
      saveAsMarkdown();
      sendResponse({ ok: true });
    }
  });

})();
