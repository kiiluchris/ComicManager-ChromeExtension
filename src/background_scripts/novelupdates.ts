import axios from 'axios';
import { browser, Runtime } from 'webextension-polyfill-ts'

browser.runtime.onMessage.addListener(
  async function (request, sender) {
    const { windowId, url, index } = sender.tab
    let res;
    switch (request.requestType) {
      case "novelUpdatesOpenPage":
        res = novelUpdatesOpenPage(request.data, {
          tab: {
            windowId,
            url,
            index,
          }
        });
        break;
      case "novelUpdatesOpenPageWayback":
        res = novelUpdatesOpenPageWayback(request.data, {
          tab: {
            windowId,
            url,
            index,
          }
        });
        break;
      case "novelUpdatesOpenPageNext":
        res = novelUpdatesOpenPageNext(request.data, sender);
        break;
      case "novelUpdatesBGNext":
        res = novelUpdatesBGNext({ ...request.data, current: sender.tab });
        break;
      case "novelUpdatesRemoveFromStore":
        res = novelUpdatesRemoveFromStore({ ...request.data, current: sender.tab });
        break;
      case "replaceMonitorNovelUpdatesUrl":
        res = replaceMonitorNovelUpdatesUrl({ ...request.data, current: sender.tab });
        break;
      case "novelUpdatesOpenParent":
        res = novelUpdatesOpenParent(request.data, sender);
        break;
      case "novelUpdatesSaveUrl":
        res = novelUpdatesSaveUrl(request.data, sender);
        break;
      default:
        return;
    }
    return res
  }
);

function getTabIndex(selectFunc: FnN<number>, clampFunc: Fn1<number>) {
  return async (tab: { url: string, index: number }, offset = 1) => {
    let index = tab.index + offset;
    const novels = await getNovels();
    const parentURL = tab.url.match(/.*\//)[0] + "*";
    if (novels.hasOwnProperty(parentURL)) {
      const tabs = await browser.tabs.query({})
      const urls = novels[parentURL].map(({ url }) => url);
      for (const tab of tabs) {
        if (urls.includes(tab.url)) {
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
const novelUrlMatch = (ch: string, tab: string) => new RegExp(ch.replace(/\?/g, "\\?") + '/?$').test(tab);

async function novelUpdatesSaveUrl({ url, parent, wayback }: {
  url: string, parent: novelupdates.Parent, wayback: boolean
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
    windowId: sender.tab.windowId,
    active: false,
    index
  });
}

async function replaceMonitorNovelUpdatesUrl({ current, parent, url, wayback }: {
  current: novelupdates.Parent,
  parent: novelupdates.UrlObj,
  url: string,
  wayback: boolean
}) {
  const { url: u } = await fetch(url, { method: 'HEAD' });
  await deleteCurrentNovelTab(parent, current);
  await saveCurrentNovelTab(parent, { url: u }, wayback);
  return await browser.tabs.update(current.id, { url: u })
}

async function novelUpdatesOpenPageNext(options: novelupdates.PageOpenOpts & {
  parent: {
    url: string,
    index: number
  }
}, sender: Runtime.MessageSender) {
  const openFunc = options.wayback ? novelUpdatesOpenPageWayback : novelUpdatesOpenPage;
  return openFunc(options, {
    tab: {
      windowId: sender.tab.windowId,
      ...options.parent
    },
  });
}

async function novelUpdatesOpenPage(options: novelupdates.PageOpenOpts, sender: {
  tab: {
    windowId: number,
    url: string,
    index: number
  }
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
    windowId: number,
    url: string,
    index: number
  }
}) {
  const actualUrl = await fetch(options.url, {
    method: 'HEAD'
  }).then(res => res.url)
  return axios.get(`http://archive.org/wayback/available?url=${actualUrl}`).then(({ data }: {
    data: {
      archived_snapshots: {
        closest: {
          url: string
        }
      }
    }
  }) => {
    const closestUrl: string | undefined = ['archived_snapshots', 'closest', 'url']
      .reduce((acc: any, key: string) => acc && acc[key], data);
    if (closestUrl) {
      return novelUpdatesOpenPage({ ...options, url: closestUrl }, sender);
    } else {
      throw new Error('Url not available on wayback machine');
    }
  }).catch((e: Error & { response: { data: object } }) => {
    console.error(e);
    if (e.response) {
      console.error(e.response.data);
    }
  });
}

function novelUpdatesBGNext(options: {
  parent: novelupdates.Parent,
  current: novelupdates.Parent,
  wayback: boolean,
  tabId: number,
  save: boolean
}) {
  return browser.tabs.sendMessage(options.parent.id, {
    requestType: "novelUpdatesUINext",
    data: {
      wayback: options.wayback,
      tabId: options.tabId,
      save: options.save
    }
  }).then(() => {
    return novelUpdatesRemoveFromStore(options);
  });
}

function novelUpdatesRemoveFromStore(options: {
  current: novelupdates.Parent,
  parent: novelupdates.Parent
}) {
  return browser.tabs.remove(options.current.id)
    .then(_ => deleteCurrentNovelTab(options.parent, options.current))
}

async function saveCurrentNovelTab(parent: novelupdates.UrlObj, current: novelupdates.UrlObj, wayback: boolean) {
  const data = await browser.storage.sync.get("novels")
  let novels = data.novels || {};
  let key = parent.url.match(/.*\//)[0] + "*";
  let val = {
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
  return await browser.storage.sync.set({ novels: novels });
}

async function deleteCurrentNovelTab(parent: novelupdates.UrlObj, current: novelupdates.UrlObj) {
  const data = await browser.storage.sync.get("novels")
  let novels: novelupdates.Novels = data.novels || {};
  let key = parent.url.match(/.*\//)[0] + "*";
  if (novels[key]) {
    novels[key] = novels[key].filter(n => !novelUrlMatch(n.url, current.url));
    if (novels[key].length === 0) {
      delete novels[key];
    }
  }
  return await browser.storage.sync.set({ novels: novels });
}

function getNovels(): Promise<novelupdates.Novels> {
  return browser.storage.sync.get("novels")
    .then(({ novels = {} } = {}) => {
      return novels;
    })
}

function filterOutWeekOldNovels(novels: novelupdates.StorageEntry[] = [], data: novelupdates.StorageEntry[] = []): novelupdates.StorageEntry[] {
  if (novels.length === 0) return data;
  const novel = novels.shift();
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

browser.tabs.onUpdated.addListener(
  async function check(tabId, { status }, tab) {
    if (!status) return
    const novels = await getNovels();
    if (Object.keys(novels).length === 0) {
      return;
    }
    const cleanedNovels = cleanNovels(novels);
    await browser.storage.sync.set({ novels: cleanedNovels });
    const tabs = await browser.tabs.query({ url: 'https://www.novelupdates.com/series/*' })
    for (const key in cleanedNovels) {
      const novel = cleanedNovels[key].find(ch => novelUrlMatch(ch.url, tab.url));
      if (novel) {
        const parent = tabs.find(t => new RegExp(key.replace('*', '.*')).test(t.url));
        const { name } = browser.runtime.getManifest();
        if (status === "complete") {
          await browser.tabs.sendMessage(tab.id, {
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
  }
);

browser.runtime.onInstalled.addListener(
  async function (details) {
    const tabs = await browser.tabs.query({ url: 'https://www.novelupdates.com/series/*' })
    for (let i = 0; i < tabs.length; i++) {
      await browser.tabs.reload(tabs[i].id)
    }


    const { novels } = <{ novels: novelupdates.Novels }>await browser.storage.sync.get("novels")
    const allTabs = await browser.tabs.query({})
    Object.values(novels).forEach(novel => {
      allTabs.forEach(tab => {
        if (novel.find(({ url }) => novelUrlMatch(url, tab.url))) {
          browser.tabs.reload(tab.id);
        }
      })
    })
  })