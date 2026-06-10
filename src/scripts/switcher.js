import { contrastColor, findMatchingEntry } from './utils.js';

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    browser.tabs.get(tabId).then(tab => applyThemeForWindow(tab.windowId));
  }
});
browser.tabs.onActivated.addListener(({ windowId }) => applyThemeForWindow(windowId));
browser.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== browser.windows.WINDOW_ID_NONE) applyThemeForWindow(windowId);
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.colorMappings) {
    browser.windows.getAll().then(windows => windows.forEach(w => applyThemeForWindow(w.id)));
  }
});

async function applyThemeForWindow(windowId) {
  const tabs = await browser.tabs.query({ windowId, active: true }).catch(() => []);
  const tab = tabs[0];
  if (!tab) return;

  let url;
  try { url = new URL(tab.url); }
  catch { browser.theme.reset(windowId); return; }

  const { colorMappings = [] } = await browser.storage.local.get('colorMappings');

  const match = findMatchingEntry(url.host, colorMappings)
    ?? (url.port ? findMatchingEntry(url.hostname, colorMappings) : null);

  if (match) {
    browser.theme.update(windowId, {
      colors: {
        frame: match.color,
        tab_background_text: contrastColor(match.color),
        toolbar_top_separator: 'rgba(0,0,0,0)',
        toolbar_bottom_separator: 'rgba(0,0,0,0)',
        tab_line: 'rgba(0,0,0,0)',
      }
    });
  } else {
    browser.theme.reset(windowId);
  }
}
