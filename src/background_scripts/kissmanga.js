'use strict';

export function openKissmangaChapter(offset = 0) {
  chrome.tabs.query({
      'windowId': chrome.windows.WINDOW_ID_CURRENT
  }, async function(tabs) {
      tabs = tabs.filter((t) => t.url && /.*kissmanga.com\/Manga\/[^\/]+$/.test(t.url));
      for (let i = 0; i < tabs.length; i++) {
        let {id} = tabs[i];
        let comicsAreExcess = await new Promise((res) => {
          chrome.tabs.sendMessage(id, {requestType: "kissmangaOpenDay", data: {offset,id,onlyTab:(tabs.length == 1)}}, res);
        });
        if(comicsAreExcess)
          return;
      }
  });
}