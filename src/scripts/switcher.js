import { contrastColor, findMatchingEntry } from './utils.js';

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') applyThemeForActiveTab();
});
browser.tabs.onActivated.addListener(applyThemeForActiveTab);
browser.windows.onFocusChanged.addListener(applyThemeForActiveTab);
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.colorMappings) applyThemeForActiveTab();
});

async function applyThemeForActiveTab() {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true }).catch(() => []);
  const tab = tabs[0];
  if (!tab) return;

  let url;
  try { url = new URL(tab.url); }
  catch { browser.theme.reset(); return; }

  const { colorMappings = [] } = await browser.storage.local.get('colorMappings');

  const match = findMatchingEntry(url.host, colorMappings)
    ?? (url.port ? findMatchingEntry(url.hostname, colorMappings) : null);

  if (match) {
    browser.theme.update({
      colors: {
        frame: match.color,
        tab_background_text: contrastColor(match.color),
        toolbar_top_separator: 'rgba(0,0,0,0)',
        toolbar_bottom_separator: 'rgba(0,0,0,0)',
        tab_line: 'rgba(0,0,0,0)',
      }
    });
  } else {
    browser.theme.reset();
  }
}
