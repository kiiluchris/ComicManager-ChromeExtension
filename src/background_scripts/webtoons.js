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

async function openWebtoonsReading({urls, numOfChapters}) {
  return await new Promise(resolve => {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT },function(tabs) {
      const tabUrls = tabs.map(t => t.url);
      const pages = urls.filter(u => !tabUrls.includes(u))
        .slice(0, numOfChapters);
      openPages(pages);
      resolve();
    });
  })
}

async function openWebtoonsDraggable({todayComics, offset}) {
  saveTitleOrder({order:todayComics, offset});
  const tabIds = [];
  for (var i = 0; i < todayComics.length; i++) {
    const tab = await new Promise(res => {
      chrome.tabs.create({
        active: false,
        url: todayComics[i].link
      }, res);
    })
    tabIds.push({
      tab: tab.id,
      val: 0
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
    let res;
    switch (request.requestType) {
      case "openWebtoonsReading":
      res = openWebtoonsReading(request.data);
      break;
      case "hasWebtoonDraggable":
      res = openWebtoonsDraggable(request.data);
      break;
    }
    res.then(sendResponse);

    return true;
  }
);