'use strict';

import './context_menu';
import './novelupdates';
import './webtoons';

chrome.runtime.onMessage.addListener(
  function(request,sender,sendResponse){
    switch(request.requestType){
      case "extensionTab":
        extensionTab();
        break;
      case "openPages":
        openPages(request.pages, request.tabId, sender.tab.windowId)
        sendResponse();
        break;
    }
  }
);

function extensionTab(){
  chrome.tabs.create({
      url: "chrome://extensions",
      active: true
  })
}


export function openPages(urls, tabId, windowId) {
  urls.forEach((url) => {
      chrome.tabs.create({
          windowId,
          active: false,
          url: url
      });
  });
  if (tabId) {
      chrome.tabs.remove(tabId);
  }
}