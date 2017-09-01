'use strict';
import {openKissmangaChapter} from './kissmanga';
import {getTitleOrder} from './webtoons';

function defaultCB(tab, val){
  chrome.tabs.sendMessage(tab.id, val);
}

const callbacks = {
  openKissmangaYesterday(){
    openKissmangaChapter(1);
  },
  openKissmangaToday(){
    openKissmangaChapter();
  },
  async startPromptDraggable(tab, val){
    defaultCB(tab, {...val, titleOrder: await getTitleOrder() })
  }
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
  },
  {
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
        (callbacks[info.menuItemId] || defaultCB)(tab, {requestType: info.menuItemId});
});

