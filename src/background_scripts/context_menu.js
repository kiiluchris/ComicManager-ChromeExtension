'use strict';
import {openKissmangaChapter, openNextChaptersKissmanga} from './kissmanga';
import {getTitleOrder} from './webtoons';

function defaultCB(tab, info, val){
  chrome.tabs.sendMessage(tab.id, {requestType: info.menuItemId, ...val});
}

async function webtoonPrompt(tab, info, data = {}){
  defaultCB(tab, info, {
    data: {
      titleOrder: await getTitleOrder({
        offset: data.offset
      }),
      ...data
    }
  })
}

const callbacks = {
  openKissmangaYesterday(){
    openKissmangaChapter(1);
  },
  openKissmangaToday(){
    openKissmangaChapter();
  },
  startPromptDraggable(tab, info){
    webtoonPrompt(tab, info).catch(console.error);
  },
  startPromptDraggableYesterday(tab, info){
    webtoonPrompt(tab, info, {
      offset: 1
    }).catch(console.error);
  },
  openNextChaptersKissmanga,
}
const webtoonFavPattern = [
  "*://*.webtoons.com/favorite"
];
const kissmangaAllPattern = [
  "*://kissmanga.com/*"
];
const contextMenuData = [
  {
    title: "Open next 10 chapters",
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
]

chrome.runtime.onInstalled.addListener(function() {
  for (var i = 0; i < contextMenuData.length; i++) {
    let {cb, ...item} = contextMenuData[i];
    chrome.contextMenus.create(item);
  }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  (callbacks[info.menuItemId] || defaultCB)(tab, info);
});

