import { openPages } from './index';
import { webtoonDateWithOffset } from '../shared';
import { webtoons } from '../../typings/webtoons';
import { browser, Tabs } from 'webextension-polyfill-ts'

function getWebtoonDay(date: webtoons.DateF, offset = 0) {
  return webtoonDateWithOffset(date, offset).day();
}

async function getDate(tabId: number): Promise<string> {
  return await browser.tabs.sendMessage(tabId, {
    requestType: "getDateWebtoon"
  })
}

export async function getTitleOrder(tabId: number, { offset = 0 } = {}) {
  const date = await getDate(tabId);
  const data = await browser.storage.local.get('webtoonOrder')
  let order = data.webtoonOrder;
  return order && order[getWebtoonDay(date, offset)] || [];
}

async function saveTitleOrder(tabId: number, { order = [], offset = 0 }: {
  order: webtoons.StorageEntry[];
  offset: number;
}) {
  const date = await getDate(tabId);
  const data = await browser.storage.local.get('webtoonOrder')
  let oldOrder = data.webtoonOrder || {};
  oldOrder[getWebtoonDay(date, offset)] = order;
  await browser.storage.local.set({ webtoonOrder: oldOrder });
  return oldOrder
}

async function openWebtoonsReading({ urls, numOfChapters }: {
  urls: string[],
  numOfChapters: number
}) {
  const tabs = await browser.tabs.query({ windowId: browser.windows.WINDOW_ID_CURRENT })
  const tabUrls = tabs.map(t => t.url);
  const pages = urls.filter(u => !tabUrls.includes(u))
    .slice(0, numOfChapters);
  return await openPages(pages);
}

async function openWebtoonsDraggable({ todayComics, offset }: {
  todayComics: webtoons.StorageEntryFromClient[],
  offset: number
}, { windowId, id }: Tabs.Tab) {
  await saveTitleOrder(id, { order: todayComics, offset });
  browser.tabs.onUpdated.addListener(
    await setupUpdateListener(todayComics, windowId)
  );
}

async function setupUpdateListener(webtoonPages: webtoons.StorageEntryFromClient[] = [], windowId = 0) {
  if (!webtoonPages.length || !Array.isArray(webtoonPages)) return;
  const tab = await browser.tabs.create({
    active: false,
    url: webtoonPages[0].link,
    windowId
  })
  const { id } = tab
  const updateListener = async (tabId: number, { status }: { status: string }, tab: Tabs.Tab) => {
    try {
      if (status !== "loading" || id !== tabId) return;
      if (!webtoonPages[0].hasOpenedChapter) {
        await browser.tabs.executeScript(tabId, { code: 'document.querySelector(".detail_body .detail_lst a").click();' });
        webtoonPages[0].hasOpenedChapter = true;
      } else {
        await browser.tabs.executeScript(tabId, {
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
        browser.tabs.onUpdated.removeListener(updateListener);
        browser.tabs.onUpdated.addListener(
          await setupUpdateListener(webtoonPages, windowId)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return updateListener;
}

browser.runtime.onMessage.addListener(
  function (request, sender) {
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
    return res
  }
);