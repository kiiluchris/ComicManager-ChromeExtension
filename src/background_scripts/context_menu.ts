'use strict';
import { getTitleOrder } from './webtoons';
import { browser, Menus, Tabs } from 'webextension-polyfill-ts'
import { range } from '../shared';

function defaultCB(tab: Tabs.Tab, info: Menus.OnClickData, val: object = {}) {
  return tab.id
    ? browser.tabs.sendMessage(tab.id, { requestType: info.menuItemId, ...val })
    : Promise.resolve()
}

async function webtoonPrompt(tab: Tabs.Tab, info: Menus.OnClickData, data = {
  offset: 0
}) {
  const titleOrder = tab.id
    ? await getTitleOrder(tab.id, {
        offset: data.offset
      })
    : []
  return await defaultCB(tab, info, {
    data: {
      titleOrder,
      ...data
    }
  })
}

const callbacks: context_menus.Callbacks = {
  startPromptDraggable(tab: Tabs.Tab, info: Menus.OnClickData) {
    return webtoonPrompt(tab, info).catch(console.error);
  },
  startPromptDraggableYesterday(tab: Tabs.Tab, info: Menus.OnClickData) {
    return webtoonPrompt(tab, info, {
      offset: 1
    }).catch(console.error);
  },
  async startPromptDraggableNOffset(tab: Tabs.Tab, info: Menus.OnClickData) {
    const offset = tab.id
      ? await browser.tabs.sendMessage(tab.id, {
          requestType: 'startPromptDraggableNOffset'
        }).catch(() => 0)
      : 0
    const moddedInfo = {
      ...info,
      menuItemId: "startPromptDraggable"
    }
    return await webtoonPrompt(tab, moddedInfo, {
      offset,
    }).catch(console.error);
  },
  openNextChaptersWebtoons(tab: Tabs.Tab, info: Menus.OnClickData) {
    const menuId = info.menuItemId as string
    const numOfChapters = menuId.match(/\d+$/)!!
    return defaultCB(tab, info, {
      requestType: info.parentMenuItemId,
      data: {
        numOfChapters: parseInt(numOfChapters[0], 10)
      }
    }).catch(console.error);
  }
}
const webtoonFavPattern = [
  "*://*.webtoons.com/en/favorite"
];

const contextMenuData: Menus.CreateCreatePropertiesType[] = [
  {
    title: "Open next number of chapters",
    id: "openNextChaptersWebtoons",
    documentUrlPatterns: [
      "*://*.webtoons.com/en/*/viewer*"
    ],
    contexts: ['all']
  }, {
    title: "Open Prompt(Overlay)",
    id: "startPromptDraggable",
    documentUrlPatterns: webtoonFavPattern,
    contexts: ['all']
  }, {
    title: "Open Prompt Yesterday(Overlay)",
    id: "startPromptDraggableYesterday",
    documentUrlPatterns: webtoonFavPattern,
    contexts: ['all']
  }, {
    title: "Open Prompt N Offset",
    id: "startPromptDraggableNOffset",
    documentUrlPatterns: webtoonFavPattern,
    contexts: ['all']
  }, {
    title: "Select all comics",
    id: "fillWebtoonOverlayInputs",
    documentUrlPatterns: webtoonFavPattern,
    contexts: ['all']
  },
  {
    title: "Unselect all comics",
    id: "clearWebtoonOverlayInputs",
    documentUrlPatterns: webtoonFavPattern,
    contexts: ['all']
  }, {
    title: "Open next chapter",
    id: "getTseirpNextChapter",
    documentUrlPatterns: [
      "*://tseirptranslations.com/*/is-*.html"
    ]
  }
];

for (const i of range(1, 4)) {
  const num = i * 5;
  contextMenuData.push({
    title: `${num} chapters`,
    id: `openNextChaptersWebtoons${num}`,
    parentId: "openNextChaptersWebtoons",
    documentUrlPatterns: [
      "*://*.webtoons.com/en/*/viewer*"
    ],
    contexts: ['all']
  });
}

function initMenu() {
  for (const item of contextMenuData) {
    browser.contextMenus.create(item);
  }
}

navigator.userAgent.toLowerCase().includes("firefox")
  ? initMenu()
  : browser.runtime.onInstalled.addListener(function () {
    initMenu()
  });

browser.contextMenus.onClicked.addListener(function (info, tab) {
  if(!tab) return;
  const cb = (callbacks[info.parentMenuItemId || ''] || callbacks[info.menuItemId] || defaultCB) as (t: Tabs.Tab, i: Menus.OnClickData, ...args: any) => Promise<any>
  cb(tab, info).catch(console.error);
});

