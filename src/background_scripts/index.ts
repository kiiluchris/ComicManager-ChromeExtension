'use strict';

import './context_menu';
import './novelupdates';
import './webtoons';
import { browser } from 'webextension-polyfill-ts'

browser.runtime.onMessage.addListener(
  function (request, sender) {
    let res;
    switch (request.requestType) {
      case "extensionTab":
        res = extensionTab();
        break;
      case "openPages":
        res = openPages(request.pages, request.tabId, sender.tab.windowId)
        break
    }
    return res
  }
);

function extensionTab() {
  return browser.tabs.create({
    url: "chrome://extensions",
    active: true
  })
}


export async function openPages(urls: string[], tabId?: number, windowId?: number) {
  const tabs = urls.map((url) => {
    return browser.tabs.create({
      windowId,
      active: false,
      url
    });
  });
  await Promise.all(tabs)
  if (tabId) {
    await browser.tabs.remove(tabId);
  }
}

