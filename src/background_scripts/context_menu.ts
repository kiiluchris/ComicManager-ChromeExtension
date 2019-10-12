'use strict';
import { getTitleOrder } from './webtoons';
import { browser, Menus, Tabs } from 'webextension-polyfill-ts'

function defaultCB(tab: Tabs.Tab, info: Menus.OnClickData, val: object = {}) {
  return browser.tabs.sendMessage(tab.id, { requestType: info.menuItemId, ...val });
}

async function webtoonPrompt(tab: Tabs.Tab, info: Menus.OnClickData, data = {
  offset: 0
}) {
  const titleOrder = await getTitleOrder(tab.id, {
    offset: data.offset
  })
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
    const offset = await browser.tabs.sendMessage(tab.id, {
      requestType: 'startPromptDraggableNOffset'
    }).catch(_e => 0)
    const moddedInfo = {
      ...info,
      menuItemId: "startPromptDraggable"
    }
    return await webtoonPrompt(tab, moddedInfo, {
      offset,
    }).catch(console.error);
  },
  openNextChaptersWebtoons(tab: Tabs.Tab, info: Menus.OnClickData) {
    const menuId = <string>info.menuItemId
    const numOfChapters = menuId.match(/\d+$/)
    return defaultCB(tab, info, {
      requestType: info.parentMenuItemId,
      data: {
        numOfChapters: parseInt(numOfChapters[0])
      }
    }).catch(console.error);
  }
}
const webtoonFavPattern = [
  "*://*.webtoons.com/en/favorite"
];
const kissmangaAllPattern = [
  "*://kissmanga.com/*"
];

const contextMenuData: Menus.CreateCreatePropertiesType[] = [
  {
    title: "Open next number of chapters",
    id: "openNextChaptersWebtoons",
    documentUrlPatterns: [
      "*://*.webtoons.com/en/*/viewer*"
    ]
  }, {
    title: "Open Prompt(Overlay)",
    id: "startPromptDraggable",
    documentUrlPatterns: webtoonFavPattern
  }, {
    title: "Open Prompt Yesterday(Overlay)",
    id: "startPromptDraggableYesterday",
    documentUrlPatterns: webtoonFavPattern
  }, {
    title: "Open Prompt N Offset",
    id: "startPromptDraggableNOffset",
    documentUrlPatterns: webtoonFavPattern
  }, {
    title: "Select all comics",
    id: "fillWebtoonOverlayInputs",
    documentUrlPatterns: webtoonFavPattern
  },
  {
    title: "Unselect all comics",
    id: "clearWebtoonOverlayInputs",
    documentUrlPatterns: webtoonFavPattern
  }, {
    title: "Open Today's Comics",
    id: "openKissmangaToday",
    documentUrlPatterns: kissmangaAllPattern
  }, {
    title: "Open Yesterday's Comics",
    id: "openKissmangaYesterday",
    documentUrlPatterns: kissmangaAllPattern
  }, {
    title: "Open next 5 chapters",
    id: "openNextChaptersKissmanga",
    documentUrlPatterns: [
      "*://kissmanga.com/*?id=*"
    ],
    contexts: [
      'all'
    ]
  }, {
    title: "Open next chapter",
    id: "getTseirpNextChapter",
    documentUrlPatterns: [
      "*://tseirptranslations.com/*/is-*.html"
    ]
  }
];

for (let i = 1; i < 4; i++) {
  const num = i * 5;
  contextMenuData.push({
    title: `${num} chapters`,
    id: `openNextChaptersWebtoons${num}`,
    parentId: "openNextChaptersWebtoons",
    documentUrlPatterns: [
      "*://*.webtoons.com/en/*/viewer*"
    ]
  });
}


browser.runtime.onInstalled.addListener(function () {
  for (var i = 0; i < contextMenuData.length; i++) {
    const item = contextMenuData[i];
    browser.contextMenus.create(item);
  }
});

browser.contextMenus.onClicked.addListener(async function (info, tab) {
  const cb = <(t: Tabs.Tab, i: Menus.OnClickData, ...args: any) => Promise<any>>(callbacks[info.parentMenuItemId] || callbacks[info.menuItemId] || defaultCB)
  return await cb(tab, info);
});

