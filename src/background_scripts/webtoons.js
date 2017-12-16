import {openPages} from './index';
import {getWebtoonDate} from '../shared';

function getWebtoonDay(offset = 0){
  return getWebtoonDate(offset).day();
}

export function getTitleOrder({offset} = {}) {
  return new Promise((res, rej) => {
    chrome.storage.local.get('webtoonOrder', function(data) {
      let order = data.webtoonOrder;
      res(order && order[getWebtoonDay(offset)] || []);
    })
  })
}

function saveTitleOrder({order, offset} = {}) {
  chrome.storage.local.get('webtoonOrder', function(data) {
    let oldOrder = data.webtoonOrder || {};
    oldOrder[getWebtoonDay(offset)] = order;
    chrome.storage.local.set({ webtoonOrder: oldOrder });
  });
}

function openWebtoonsReading(urls) {
  chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT },function(tabs) {
    var tabUrls = tabs.map(function(t) {
      return t.url;
    });
    urls = urls.filter(function(u) {
      return tabUrls.indexOf(u) === -1;
    }).slice(0, 10);
    openPages(urls);
  });
}

function openWebtoonsDraggable({todayComics, offset}) {
  saveTitleOrder({order:todayComics, offset});
  var tabIds = [];
  for (var i = 0; i < todayComics.length; i++) {
    chrome.tabs.create({
      active: false,
      url: todayComics[i].link
    }, function openFirstComic(tab) {
      tabIds.push({
        tab: tab.id,
        val: 0
      });
    });
  }
  monitorWebtoonTabs(tabIds);
}

function monitorWebtoonTabs(tabIds) {
  chrome.tabs.onUpdated.addListener(
    function updateListener(tabId, changeInfo, tab) {
      if (changeInfo.status === "complete") {
        var tabI = tabIds.findIndex((el) => el.tab === tabId);
        if (tabI !== -1) {
          let t = tabIds[tabI];
          if (t.val === 0) {
            chrome.tabs.executeScript(tabId, { code: 'document.querySelector(".detail_body .detail_lst a").click();' });
            tabIds[tabI].val++;
          } else {
            chrome.tabs.sendMessage(tabId, { requestType: "scrollWebtoon" });
            tabIds.splice(tabI, 1);
          }
        }
        if (tabIds.length === 0) {
          chrome.tabs.onUpdated.removeListener(updateListener);
          return;
        }
      }
    }
  );
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.requestType) {
      case "openWebtoonsReading":
      openWebtoonsReading(request.pages);
      break;
      case "hasWebtoonDraggable":
      openWebtoonsDraggable(request.data);
      break;
    }
  }
);