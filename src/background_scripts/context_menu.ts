'use strict';
import {getTitleOrder} from './webtoons';

function defaultCB(tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData, val: object = {}){
  chrome.tabs.sendMessage(tab.id, {requestType: info.menuItemId, ...val});
}

async function webtoonPrompt(tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData, data = {
  offset: 0
}){
  defaultCB(tab, info, {
    data: {
      titleOrder: await getTitleOrder(tab.id, {
        offset: data.offset
      }),
      ...data
    }
  })
}

const callbacks: context_menus.Callbacks = {
  startPromptDraggable(tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData){
    webtoonPrompt(tab, info).catch(console.error);
  },
  startPromptDraggableYesterday(tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData){
    webtoonPrompt(tab, info, {
      offset: 1
    }).catch(console.error);
  },
  openNextChaptersWebtoons(tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData){
    defaultCB(tab, info, {
      requestType: info.parentMenuItemId,
      data: {
        numOfChapters: parseInt(info.menuItemId.match(/\d+$/))
      }
    });
  }
}
const webtoonFavPattern = [
  "*://*.webtoons.com/en/favorite"
];
const kissmangaAllPattern = [
  "*://kissmanga.com/*"
];

const contextMenuData: chrome.contextMenus.CreateProperties[] = [
  {
    title: "Open next number of chapters",
    id: "openNextChaptersWebtoons",
    documentUrlPatterns: [
      "*://*.webtoons.com/en/*/viewer*"
    ]
  },{
    title: "Open Prompt(Overlay)",
    id: "startPromptDraggable",
    documentUrlPatterns: webtoonFavPattern
  },{
    title: "Open Prompt Yesterday(Overlay)",
    id: "startPromptDraggableYesterday",
    documentUrlPatterns: webtoonFavPattern
  },{
    title: "Select all comics",
    id: "fillWebtoonOverlayInputs",
    documentUrlPatterns: webtoonFavPattern
  },
  {
    title: "Unselect all comics",
    id: "clearWebtoonOverlayInputs",
    documentUrlPatterns: webtoonFavPattern
  },{
    title: "Open Today's Comics",
    id: "openKissmangaToday",
    documentUrlPatterns: kissmangaAllPattern
  },{
    title: "Open Yesterday's Comics",
    id: "openKissmangaYesterday",
    documentUrlPatterns: kissmangaAllPattern
  },{
    title: "Open next 5 chapters",
    id: "openNextChaptersKissmanga",
    documentUrlPatterns: [
      "*://kissmanga.com/*?id=*"
    ],
    contexts: [
      'all'
    ]
  },{
    title: "Open next chapter",
    id: "getTseirpNextChapter",
    documentUrlPatterns: [
      "*://tseirptranslations.com/*/is-*.html"
    ]
  }
];

for(let i = 1; i < 4; i++){
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


chrome.runtime.onInstalled.addListener(function() {
  for (var i = 0; i < contextMenuData.length; i++) {
    const item = contextMenuData[i];
    chrome.contextMenus.create(item);
  }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  (callbacks[info.parentMenuItemId] || callbacks[info.menuItemId] || defaultCB)(tab, info);
});

