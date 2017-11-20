'use strict';

function openURLsOnDay({id,offset, onlyTab}, sendResponse){
  var d = new Date();
  d.setDate(d.getDate()-offset);
  var t = (d) => (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear();
  var date = t(d);
  var columns = document.querySelectorAll('table.listing tbody tr td');
  var urls = [];
  for(var i = 1; i < columns.length; i+=2){
    if(columns[i].innerText===date){
      urls.unshift(columns[i-1].firstElementChild.href);
    }
  }
  if(urls.length){
    if(!onlyTab && urls.length > 5){
      return sendResponse(true);
    }
    chrome.runtime.sendMessage({ requestType: "openPages", pages: urls, tabId: id });
    sendResponse(false);
  }
}

function openNextChaptersKissmanga({current, index, offset = 5, willClose = false}){
  const url = window.location.href;
  const parentURL = url.slice(0, url.lastIndexOf('/') + 1);
  const chapterMatchingRe = /(?:ch|chapter|episode|ep)\.?\s*([\d\.]+)/i;
  const last = current + offset;
  const $select = $('select.selectChapter').first();
  const $chapters = $('option', $select);  
  const getCh = el => parseFloat(chapterMatchingRe.exec(el.innerHTML)[1]);
  const nextChapters = $chapters.filter((i, el) => {
      const chapter = chapterMatchingRe.exec(el.innerHTML);
      if(chapter === null) return false;
      const chapterFloat = parseFloat(chapter[1]);
      return  chapterFloat > current && chapterFloat <= last;
    })
    .get()
    .sort((a, b) => getCh(a) - getCh(b))
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
        }, ({last, index}) => {
          openNextChaptersKissmanga({
            offset: 1,
            willClose: true,
            current: last,
            index
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