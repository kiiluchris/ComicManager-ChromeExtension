import {openPages} from './index';
import {webtoonDateWithOffset} from '../shared';
import { webtoons } from '../../typings/webtoons';

function getWebtoonDay(date: webtoons.DateF, offset = 0){
  return webtoonDateWithOffset(date, offset).day();
}

async function getDate(tabId: number) : Promise<string> {
  return new Promise(res => {
    chrome.tabs.sendMessage(tabId, {
      requestType: "getDateWebtoon"
    }, res)
  })
}

export async function getTitleOrder(tabId: number, {offset = 0} = {}) {
  const date = await getDate(tabId);
  return new Promise((res, rej) => {
    chrome.storage.local.get('webtoonOrder', function(data) {
      let order = data.webtoonOrder;
      res(order && order[getWebtoonDay(date, offset)] || []);
    })
  })
}

async function saveTitleOrder(tabId: number, {order = [], offset = 0}: {
  order: webtoons.StorageEntry[];
  offset: number;
}) {
  const date = await getDate(tabId);
  return new Promise((res) => {
    chrome.storage.local.get('webtoonOrder', function(data) {
      let oldOrder = data.webtoonOrder || {};
      oldOrder[getWebtoonDay(date, offset)] = order;
      chrome.storage.local.set({ webtoonOrder: oldOrder });
      res(oldOrder)
    });
  })
}

async function openWebtoonsReading({urls, numOfChapters}: {
  urls: string[],
  numOfChapters: number
}) {
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

async function openWebtoonsDraggable({todayComics, offset}: {
  todayComics: webtoons.StorageEntryFromClient[],
  offset: number
}, {windowId, id}: chrome.tabs.Tab) {
  await saveTitleOrder(id, {order:todayComics, offset});
  chrome.tabs.onUpdated.addListener(
    await setupUpdateListener(todayComics, windowId)
  );
}

async function setupUpdateListener(webtoonPages: webtoons.StorageEntryFromClient[] = [], windowId = 0) {
  if(!webtoonPages.length || !Array.isArray(webtoonPages)) return;
  const tab: chrome.tabs.Tab = await new Promise(res => {
    chrome.tabs.create({
      active: false,
      url: webtoonPages[0].link,
      windowId
    }, res);
  });
  const {id} = tab
  const updateListener = async (tabId: number, {status}: {status: string}, tab: chrome.tabs.Tab) => {
    try {
      if(status !== "loading" || id !== tabId) return;
      if (!webtoonPages[0].hasOpenedChapter) {
        chrome.tabs.executeScript(tabId, { code: 'document.querySelector(".detail_body .detail_lst a").click();' });
        webtoonPages[0].hasOpenedChapter = true;
      } else {
        chrome.tabs.executeScript(tabId, { 
          code: `;(${(() => {
            const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('.viewer_lst .viewer_img img');
            images.forEach(img => {
                img.src = img.dataset['url'];
              });
            window.scroll(0, 0);
          }).toString()})();
          `
         });
        webtoonPages.shift();
        chrome.tabs.onUpdated.removeListener(updateListener);
        chrome.tabs.onUpdated.addListener(
          await setupUpdateListener(webtoonPages, windowId)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return updateListener;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    let res: Promise<any>;
    switch (request.requestType) {
      case "openWebtoonsReading":
        res = openWebtoonsReading(request.data);
        break;
      case "hasWebtoonDraggable":
        res = openWebtoonsDraggable(request.data, sender.tab);
        break;
      default:
        return;
    }
    res.then(sendResponse);

    return true;
  }
);