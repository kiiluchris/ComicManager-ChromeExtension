import { openPages } from './index';
import { webtoonDateWithOffset } from '../shared';
import { webtoons } from '../../typings/webtoons';
import { browser, Tabs } from 'webextension-polyfill-ts'

function getWebtoonDay(date: webtoons.DateF, offset = 0) {
  return webtoonDateWithOffset(date, offset).day();
}

function getDate(tabId: number): Promise<string> {
  return browser.tabs.sendMessage(tabId, {
    requestType: "getDateWebtoon"
  })
}

export async function getTitleOrder(tabId: number, { offset = 0 } = {}) {
  const date = await getDate(tabId);
  const data = await browser.storage.sync.get('webtoonOrder') as {
    webtoonOrder?: webtoons.StorageEntry[];
  }
  const order = data.webtoonOrder;
  return order ? order[getWebtoonDay(date, offset)] : [];
}

interface SaveTitleUpdateEntry {
  order: webtoons.StorageEntry[];
  offset: number;
}

async function saveTitleOrder(tabId: number, updates: SaveTitleUpdateEntry[] = []) {
  const date = await getDate(tabId);
  const data = await browser.storage.sync.get('webtoonOrder')
  const webtoonOrder = data.webtoonOrder || {};
  const updatedOrder = updates.reduce((currentOrder, { order = [], offset = 0 }) => {
    currentOrder[getWebtoonDay(date, offset)] = order;
    return currentOrder
  }, webtoonOrder)
  await browser.storage.sync.set({ webtoonOrder: updatedOrder });
  return updatedOrder
}

type ReplaceTitleUpdateEntry = {
  [key: string]: webtoons.StorageEntry[];
}

export async function updateTitleOrderAtKeys(tabId: number, updates: ReplaceTitleUpdateEntry) {
  const data = await browser.storage.sync.get('webtoonOrder')
  const webtoonOrder = data.webtoonOrder || {};
  const updatedOrder = Object.entries(updates)
    .reduce((currentOrder, [key, order]) => {
      currentOrder[key] = order;
      return currentOrder
    }, webtoonOrder)
  await browser.storage.sync.set({ webtoonOrder: updatedOrder });
  return updatedOrder
}

async function openWebtoonsReading({ urls, numOfChapters }: {
  urls: string[];
  numOfChapters: number;
}) {
  const tabs = await browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT })
  const tabUrls = tabs.map(t => t.url);
  const pages = urls.filter(u => !tabUrls.includes(u))
    .slice(0, numOfChapters);
  return await openPages(pages);
}

async function openWebtoonsDraggable({ todayComics, offset }: {
  todayComics: webtoons.StorageEntryFromClient[];
  offset: number;
}, { windowId, id }: Tabs.Tab) {
  if(typeof id !== 'number') return false;
  const webtoonOrder = await saveTitleOrder(id, [{ order: todayComics, offset }]);
  const isOrderSaved = await webtoonsNativeMessage(
    'store_webtoons',  webtoonOrder
  , () => true, () => false)
  const listener = await setupUpdateListener(todayComics, windowId)
  listener && browser.tabs.onUpdated.addListener(
    listener
  );
  return isOrderSaved
}

type NativeMessageKeys = 'store_webtoons' | 'fetch_webtoons' | 'fetch_webtoons_at_day'

export function webtoonsNativeMessage<D, T, U, E extends Error>(key: NativeMessageKeys, data: D, fn?: (res: T) => U, err?: (e: E) => U) {
  const promise = browser.runtime.sendNativeMessage(
    'scurrae.webtoons_messaging', {
      type: key,
      value: data,
  })
  const logError = (e: E) => {
    console.error('NativeMessage: ' + key + ': ' + e.message);
  } 
  return fn 
    ? promise.then(fn, (e) => {
        logError(e);
        return err?.call(null, e);
      }) 
    : promise.catch(logError)
}

async function setupUpdateListener(webtoonPages: webtoons.StorageEntryFromClient[] = [], windowId = 0) {
  if (!webtoonPages.length || !Array.isArray(webtoonPages)) return;
  const tab = await browser.tabs.create({
    active: false,
    url: webtoonPages[0].link,
    windowId
  })
  const { id } = tab
  const updateListener = (tabId: number, { status }: Tabs.OnUpdatedChangeInfoType, _tab: Tabs.Tab) => {
    if (status !== "loading" || id !== tabId || webtoonPages.length < 1) return;
    let promise: Promise<any> = Promise.resolve()
    if (!webtoonPages[0].hasOpenedChapter) {
      promise = browser.tabs.executeScript(tabId, {
        code: 'document.querySelector(".detail_body .detail_lst a").click();'
      }).then(() => {
        webtoonPages[0].hasOpenedChapter = true;
      });
    } else {
      promise = browser.tabs.executeScript(tabId, {
        code: `;(${(() => {
          const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('.viewer_lst .viewer_img img');
          images.forEach(img => {
            img.src = img.dataset.url!!;
          });
          window.scroll(0, 0);
        }).toString()})();
          `
      }).then(async () => {
        webtoonPages.shift();
        browser.tabs.onUpdated.removeListener(updateListener);
        const listener = await setupUpdateListener(webtoonPages, windowId)
        listener && browser.tabs.onUpdated.addListener(
          listener
        );
      })
    }
    promise.catch(console.error);
  };

  return updateListener;
}

browser.runtime.onMessage.addListener(
  function (request, sender) {
    switch (request.requestType) {
      case "openWebtoonsReading":
        return openWebtoonsReading(request.data);
      case "hasWebtoonDraggable":
        return sender.tab && openWebtoonsDraggable(request.data, sender.tab);
      default:
        return;
    }
  }
);


browser.runtime.onInstalled.addListener(() => {
  webtoonsNativeMessage(
    'fetch_webtoons', null
  , (x) => x, () => ({}))
});

