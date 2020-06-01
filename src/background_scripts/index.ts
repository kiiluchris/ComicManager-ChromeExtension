'use strict';

import './context_menu';
import './novelupdates';
import './webtoons';
import { browser } from 'webextension-polyfill-ts'

browser.runtime.onMessage.addListener(
  function (request, sender) {
    if(!sender.tab) return;
    let res;
    switch (request.requestType) {
      case "openPages":
        res = openPages(request.pages, request.tabId, sender.tab.windowId)
        break
    }
    return res
  }
);

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

