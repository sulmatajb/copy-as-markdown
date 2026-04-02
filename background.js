/**
 * background.js — Copy as Markdown
 * Service worker for MV3.
 * Registers right-click context menu items and routes keyboard shortcut
 * commands to the active tab's content script.
 */

'use strict';

const MENU_COPY = 'copy-as-markdown';
const MENU_SAVE = 'save-as-markdown';

// ─── Context menu ─────────────────────────────────────────────────────────

function createContextMenu() {
  // Remove both items cleanly before recreating
  chrome.contextMenus.removeAll(function () {
    void chrome.runtime.lastError;

    chrome.contextMenus.create({
      id: MENU_COPY,
      title: 'Copy as Markdown',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: MENU_SAVE,
      title: 'Save as Markdown file',
      contexts: ['selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);

// ─── Context menu click handler ───────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (!tab || !tab.id) return;

  if (info.menuItemId === MENU_COPY) {
    sendToContentScript(tab.id, 'copyAsMarkdown');
  } else if (info.menuItemId === MENU_SAVE) {
    sendToContentScript(tab.id, 'saveAsMarkdown');
  }
});

// ─── Keyboard shortcut handler ────────────────────────────────────────────

chrome.commands.onCommand.addListener(function (command) {
  if (command !== 'copy-as-markdown') return;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    if (!tab.id) return;
    sendToContentScript(tab.id, 'copyAsMarkdown');
  });
});

// ─── Helper ──────────────────────────────────────────────────────────────

/**
 * Sends an action to the content script in the given tab.
 * If the content script isn't loaded yet, injects it first then retries.
 * @param {number} tabId
 * @param {string} action  'copyAsMarkdown' | 'saveAsMarkdown'
 */
function sendToContentScript(tabId, action) {
  chrome.tabs.sendMessage(
    tabId,
    { action: action },
    function (response) {
      if (chrome.runtime.lastError) {
        // Content script not ready — inject and retry
        chrome.scripting.executeScript(
          { target: { tabId: tabId }, files: ['turndown.js', 'content.js'] },
          function () {
            if (chrome.runtime.lastError) {
              console.warn('[Copy as Markdown] Injection failed:', chrome.runtime.lastError.message);
              return;
            }
            setTimeout(function () {
              chrome.tabs.sendMessage(
                tabId,
                { action: action },
                function () { void chrome.runtime.lastError; }
              );
            }, 100);
          }
        );
      }
    }
  );
}
