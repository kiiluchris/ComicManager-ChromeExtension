'use strict';

import {createTab, kissmangaMatchChapter, kissmangaChapterDifference} from '../shared';

export function openKissmangaChapter(offset = 0) {
  chrome.tabs.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
      url: '*://kissmanga.com/Manga/*'
  }, async function(tabs) {
      const filteredTabs = tabs.filter((t) => 
        t.url && /.*kissmanga.com\/Manga\/[^\/]+$/.test(t.url)
      );
      let numOfChapters = 0;
      for (let i = 0; i < filteredTabs.length; i++) {
        let {id} = filteredTabs[i];
        let {comicsAreExcess, len} = await new Promise((res) => {
          chrome.tabs.sendMessage(id, {
            requestType: "kissmangaOpenDay", 
            data: {offset,id,onlyTab:(filteredTabs.length == 1), numOfChapters}
          }, res);
        });
        numOfChapters += len;
        if(comicsAreExcess)
          return;
      }
  });
}

function getNextChapterDetailsKissmanga(tab){
  return new Promise((res, rej) => {
    const {url, title} = tab;
    const parentURL = url.slice(0, url.lastIndexOf('/') + 1);
    chrome.tabs.query({url: parentURL + '**'}, tabs => {
      const greatestTab = tabs
        .reduce((a, b) => 
          kissmangaChapterDifference(a,b) > 0 ? a : b
        );
      const {chapter, volume} = kissmangaMatchChapter(greatestTab);
      res({
        greatestChapter: chapter, 
        greatestTabIndex: greatestTab.index, 
        volume,
        parentURL, 
      });
    });
  }).catch(console.error);
}

export function openNextChaptersKissmanga(tab, {offset = 5}){
  return getNextChapterDetailsKissmanga(tab)
    .then(({greatestChapter, greatestTabIndex, parentURL, volume}) => {      
      chrome.tabs.sendMessage(tab.id, {
        requestType: "openNextChaptersKissmanga",
        data: {
          current: greatestChapter,
          index: greatestTabIndex,
          parentURL,
          offset,
          volume
        }
      });
    });
}

function getLastChapterKissmanga(tab, sendResponse){
  return getNextChapterDetailsKissmanga(tab)
    .then(({greatestChapter, greatestTabIndex, volume}) => {
      sendResponse({
        last: greatestChapter,
        index: greatestTabIndex,
        volume
      });
    });
}

async function kissmangaOpenPages(tab, {urls, willClose, index}){
  for (let i = 0; i < urls.length; i++) {
    await createTab({
      url: urls[i],
      index: index + i + 1,
    });
  }
  if(willClose){
    chrome.tabs.remove(tab.id);
  }
}

chrome.runtime.onMessage.addListener(
  function(request,sender,sendResponse){
    switch(request.requestType){
      case "kissmangaOpenPages":
        kissmangaOpenPages(sender.tab, request.data).catch(console.error);
        break;
      case "kissmangaOpenNext":
        openNextChaptersKissmanga(sender.tab, {
          offset: 1
        });
        break;
      case "getLastChapterKissmanga":
        getLastChapterKissmanga(sender.tab, sendResponse);
        return true;
    }
  }
);