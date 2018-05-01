'use strict';
import {kissmangaMatchChapter, kissmangaNextChapterFilterElements, kissmangaChapterDifference} from '../shared';

function openURLsOnDay({id,offset, onlyTab,numOfChapters}, sendResponse){
  var d = new Date();
  d.setDate(d.getDate()-offset);
  var t = (d) => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  var date = t(d);
  var columns = document.querySelectorAll('table.listing tbody tr td:nth-child(2)');
  var urls = [];
  for(var i = 0; i < columns.length; i+=1){
    if(columns[i].innerText===date){
      urls.unshift(columns[i].previousElementSibling.firstElementChild.href);
    }
  }
  const data = {
    len: urls.length,
    comicsAreExcess: false
  };
  if(!urls.length || (!onlyTab && urls.length > 5) || numOfChapters >= 10){
    data.comicsAreExcess = true;
  } else {
    chrome.runtime.sendMessage({ requestType: "openPages", pages: urls, tabId: id });
  }
  sendResponse(data);
}

function openNextChaptersKissmanga({current, index, offset = 5, willClose = false, volume = null}){
  const url = window.location.href;
  const parentURL = url.slice(0, url.lastIndexOf('/') + 1);
  const last = current + offset;
  const $select = $('select.selectChapter').first();
  const $chapters = $('option', $select); 
  const chapterFilter = kissmangaNextChapterFilterElements(current, last, volume);
  const nextChapters = $chapters.filter(chapterFilter)
    .get()
    .sort(kissmangaChapterDifference)
    .slice(0, offset)
    .map(el => parentURL + el.value);

  chrome.runtime.sendMessage({
    requestType: "kissmangaOpenPages",
    data: {
      urls: nextChapters,
      current: last,
      willClose,
      index,
    }
  });
}
;(function setupKissmangaNext(){
  if(/kissmanga.com\/Manga.*\?id=/.test(window.location.href)){
    window.addEventListener('keyup', (e) => {    
      if(e.ctrlKey && e.key == 'ArrowRight'){
        chrome.runtime.sendMessage({
          requestType: 'getLastChapterKissmanga',
        }, ({last, index, volume}) => {
          openNextChaptersKissmanga({
            offset: 1,
            willClose: true,
            current: last,
            index,
            volume
          });
        })
      }
    });
  }
})();
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.requestType) {
      case "kissmangaOpenDay":
        openURLsOnDay(request.data, sendResponse);
        break;
      case "openNextChaptersKissmanga":
        openNextChaptersKissmanga(request.data);
        break;
    }
    return true;
  }
);