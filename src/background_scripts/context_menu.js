'use strict';
import {openKissmangaChapter} from './kissmanga';
import {getTitleOrder} from './webtoons';

function defaultCB(tab, info, val){
  chrome.tabs.sendMessage(tab.id, {requestType: info.menuItemId, ...val});
}

const callbacks = {
  openKissmangaYesterday(){
    openKissmangaChapter(1);
  },
  openKissmangaToday(){
    openKissmangaChapter();
  },
  async startPromptDraggable(tab, info){
    defaultCB(tab, info, {titleOrder: await getTitleOrder() })
  },
  openNextChaptersKissmanga(tab, info){
    const chapterMatchingRe = /(?:ch|chapter|episode|ep)\.?\s*([\d\.]+)/i;
    const {url, title} = tab;
    const parentURL = url.slice(0, url.lastIndexOf('/') + 1);
    const currentTabChapter = chapterMatchingRe.exec(title);
    if(currentTabChapter === null){
      return alert('Chapter could not be parsed from the title');
    }
    let greatestChapter = parseFloat(currentTabChapter[1]);
    chrome.tabs.query({url: parentURL + '*'}, tabs => {
      for(let i = 0; i < tabs.length; i++){
        const t = tabs[i];
        const chapter = chapterMatchingRe.exec(t.title);
        if(chapter !== null){
          const chapterFloat = parseFloat(chapter[1]);
          if(chapterFloat >  greatestChapter){
            greatestChapter = chapterFloat;
          } 
        }
      }
      
      defaultCB(tab, info, {
        data: {
          parentURL,
          offset: 5,
          current: greatestChapter
        }
      });
    });
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

