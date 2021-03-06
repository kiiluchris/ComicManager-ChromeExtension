import axios from 'axios';
import { browser, Runtime } from 'webextension-polyfill-ts'

browser.runtime.onMessage.addListener( (request, sender) => {
  if(!sender.tab) return;
  const { windowId, url, index } = sender.tab as {
    windowId: number; url: string; index: number;
  }
  switch (request.requestType) {
    case "novelUpdatesOpenPage":
    return novelUpdatesOpenPage(request.data, {
      tab: {
        windowId,
        url,
        index,
      }
    });
    case "novelUpdatesOpenPageWayback":
    return novelUpdatesOpenPageWayback(request.data, {
      tab: {
        windowId,
        url,
        index,
      }
    });
    case "novelUpdatesOpenPageNext":
    return novelUpdatesOpenPageNext(request.data, sender);
    case "novelUpdatesBGNext":
    return novelUpdatesBGNext({ ...request.data, current: sender.tab });
    case "novelUpdatesRemoveFromStore":
    return novelUpdatesRemoveFromStore({ ...request.data, current: sender.tab });
    case "replaceMonitorNovelUpdatesUrl":
    return replaceMonitorNovelUpdatesUrl({ ...request.data, current: sender.tab });
    case "novelUpdatesOpenParent":
    return novelUpdatesOpenParent(request.data, sender);
    case "novelUpdatesSaveUrl":
    return novelUpdatesSaveUrl(request.data, sender);
    default:
    return;
  }
});

function getTabIndex(selectFunc: FnN<number>, clampFunc: Fn1<number>) {
  return async (tab: { url: string; index: number }, offset = 1) => {
    let index = tab.index + offset;
    const novels = await getNovels();
    const parentURL = tab.url.match(/.*\//)!![0] + "*";
    if (novels.hasOwnProperty(parentURL)) {
      const tabs = await browser.tabs.query({})
      const urls = novels[parentURL].map(({ url }) => url);
      for (const tab of tabs) {
        if (tab.url && urls.includes(tab.url)) {
          index = selectFunc(index, tab.index + offset);
        }
      }
      index = clampFunc(index);
    }

    return index;
  }
}

const getMaxTabIndex = getTabIndex(Math.max, x => x);
const getMinTabIndex = getTabIndex(Math.min, Math.max.bind(null, 0));
const novelUrlMatch = (ch: string, tab: string) =>
new RegExp(ch.replace(/\?/g, "\\?") + '/?$').test(tab);

async function novelUpdatesSaveUrl({ url, parent, wayback }: {
  url: string; parent: novelupdates.Parent; wayback: boolean;
}, _sender: Runtime.MessageSender) {
  return await saveCurrentNovelTab(parent, { url }, wayback)
}

async function novelUpdatesOpenParent({ page }: { page: string }, sender: Runtime.MessageSender) {
  const index = await getMinTabIndex({
    url: page,
    index: 1000
  }, 0);
  return await browser.tabs.create({
    url: page,
    windowId: sender.tab?.windowId,
    active: false,
    index
  });
}

async function replaceMonitorNovelUpdatesUrl({ current, parent, url, wayback }: {
  current: novelupdates.Parent;
  parent: novelupdates.UrlObj;
  url: string;
  wayback: boolean;
}) {
  const { url: u } = await fetch(url, { method: 'HEAD' });
  await deleteCurrentNovelTab(parent, current);
  await saveCurrentNovelTab(parent, { url: u }, wayback);
  return await browser.tabs.update(current.id, { url: u })
}

async function novelUpdatesOpenPageNext(options: novelupdates.PageOpenOpts & {
  parent: {
    url: string;
    index: number;
  };
}, sender: Runtime.MessageSender) {
  const openFunc = options.wayback ? novelUpdatesOpenPageWayback : novelUpdatesOpenPage;
  return sender.tab?.windowId
    ? openFunc(options, {
        tab: {
          windowId: sender.tab.windowId,
          ...options.parent
        },
      })
    : Promise.resolve();
}

async function novelUpdatesOpenPage(options: novelupdates.PageOpenOpts, sender: {
  tab: {
    windowId: number;
    url: string;
    index: number;
  };
}) {
  const newTabData: { index?: number } = {};
  const { url } = await fetch(options.url, { method: 'HEAD' });
  if (options.save) {
    newTabData.index = await getMaxTabIndex(sender.tab);
    await saveCurrentNovelTab(sender.tab, { url }, options.wayback);
  }

  return await browser.tabs.create({
    url,
    active: false,
    windowId: sender.tab.windowId,
    ...newTabData
  });
}

async function novelUpdatesOpenPageWayback(options: novelupdates.PageOpenOpts, sender: {
  tab: {
    windowId: number;
    url: string;
    index: number;
  };
}) {
  const actualUrl = await fetch(options.url, {
    method: 'HEAD'
  }).then(res => res.url)
  return axios
    .get(`http://archive.org/wayback/available?url=${actualUrl}`)
    .then(({ data }: WaybackResponse) => {
      const closestUrl: string | undefined = ['archived_snapshots', 'closest', 'url']
      .reduce((acc: any, key: string) => acc && acc[key], data);
      if (closestUrl) {
        return novelUpdatesOpenPage({ ...options, url: closestUrl }, sender);
      } else {
        throw new Error('Url not available on wayback machine');
      }
    }, (e: Error & { response: { data: object } }) => {
      console.error(e);
      if (e.response) {
        console.error(e.response.data);
      }
    });
}

function novelUpdatesBGNext(options: {
  parent: novelupdates.Parent;
  current: novelupdates.Parent;
  wayback: boolean;
  tabId: number;
  save: boolean;
}) {
  return options.parent.id
    ? browser.tabs.sendMessage(options.parent.id, {
      requestType: "novelUpdatesUINext",
      data: {
        wayback: options.wayback,
        tabId: options.tabId,
        save: options.save
      }
    }).then(() => {
      return novelUpdatesRemoveFromStore(options);
    })
  : Promise.resolve();
}

function novelUpdatesRemoveFromStore(options: {
  current: novelupdates.Parent;
  parent: novelupdates.Parent;
}) {
  return options.current.id
    ? browser.tabs
      .remove(options.current.id)
      .then(() => deleteCurrentNovelTab(options.parent, options.current))
    : Promise.resolve()
}

async function saveCurrentNovelTab(parent: novelupdates.UrlObj, current: novelupdates.UrlObj, wayback: boolean) {
  const data = await browser.storage.local.get("novels")
  const novels = data.novels || {};
  const key = parent.url.match(/.*\//)!![0] + "*";
  const val = {
    url: current.url,
    time: Date.now(),
    wayback: !!wayback,
    page: parent.url
  };
  if (novels[key]) {
    novels[key].push(val);
  } else {
    novels[key] = [val];
  }
  return await browser.storage.local.set({ novels });
}

async function deleteCurrentNovelTab(parent: novelupdates.UrlObj, current: novelupdates.UrlObj) {
  const data = await browser.storage.local.get("novels")
  const novels: novelupdates.Novels = data.novels || {};
  const key = parent.url.match(/.*\//)!![0] + "*";
  if (novels[key]) {
    novels[key] = novels[key].filter(n => !novelUrlMatch(n.url, current.url));
    if (novels[key].length === 0) {
      delete novels[key];
    }
  }
  return await browser.storage.local.set({ novels });
}

function getNovels(): Promise<novelupdates.Novels> {
  return browser.storage.local.get("novels")
  .then(({ novels = {} } = {}) => {
    return novels;
  })
}

function filterOutWeekOldNovels(novels: novelupdates.StorageEntry[] = [], data: novelupdates.StorageEntry[] = []): novelupdates.StorageEntry[] {
  if (novels.length === 0) return data;
  const novel = novels.shift()!!;
  if (Date.now() - novel.time < 259200000) {
    // 3 days not passed since item was added to the monitor
    data.push(novel);
  }

  return filterOutWeekOldNovels(novels, data);
}

function cleanNovels(novels: novelupdates.Novels = {}, data: novelupdates.Novels = {}): novelupdates.Novels {
  const novelKeys = Object.keys(novels);
  if (novelKeys.length === 0) return Object.freeze(data);
  const key = novelKeys[0];
  if (novels.hasOwnProperty(key)) {
    const novelChapters = filterOutWeekOldNovels(novels[key])
    .filter(n => n.url);
    delete novels[key];
    if (novelChapters.length !== 0) {
      data[key] = novelChapters;
    }
  }

  return cleanNovels(novels, data);
}

browser.tabs.onUpdated.addListener((tabId, { status }, tab) => {
  if (!status) return;
  getNovels().then(async (novels) => {
    if (Object.keys(novels).length === 0) {
      return;
    }
    const cleanedNovels = cleanNovels(novels);
    await browser.storage.local.set({ novels: cleanedNovels });
    const tabs = await browser.tabs.query({ url: 'https://www.novelupdates.com/series/*' })
    // eslint-disable-next-line guard-for-in
    for (const key in cleanedNovels) {
      const novel = cleanedNovels[key].find(ch => novelUrlMatch(ch.url, tab.url || ''));
      if (novel) {
        const parent = tabs.find(t => new RegExp(key.replace('*', '.*')).test(t.url || ''));
        const { name } = browser.runtime.getManifest();
        if (status === "complete") {
          await browser.tabs.sendMessage(tabId, {
            requestType: "monitorNovelUpdates",
            data: {
              parent: parent || { url: novel.page },
              tabId: tab.id,
              ...novel
            },
            extensionName: name
          });
        } else if (status === "loading") {
          await browser.tabs.executeScript(tab.id, {
            code: `window.postMessage({
              extension: "${name}",
              status: "loading" 
            }, window.location.href);`
          });
        }
        return;
      }
    }
  }).catch(console.error);
});

function tabUrlMatchesSavedPage(novelUrl: string,nuUrl: string,tabUrl: string): boolean {
  return novelUrlMatch(novelUrl, tabUrl) || novelUrlMatch(nuUrl, tabUrl);
}

browser.runtime.onInstalled.addListener((_details) => {
  browser.storage.local.get("novels")
  .then(async ({novels}: { novels?: novelupdates.Novels }) => {
    if (!novels) return
    const tabs = await browser.tabs.query({ })
    tabs.forEach(tab => {
      Object.values(novels).forEach(novel => {
        if (novel.find(({url, page}) => tabUrlMatchesSavedPage(url, page, tab.url || ''))) {
          browser.tabs.reload(tab.id).catch(console.error);
        }
      });
    });
  }).catch(console.error);
});