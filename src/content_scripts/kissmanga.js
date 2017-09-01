'use strict';

function openURLsOnDay({id,offset}){
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
    if(urls.length > 5){
      sendResponse(true);
    }
    chrome.runtime.sendMessage({ requestType: "openPages", pages: urls, tabId: id });
    sendResponse(false);
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      switch (request.requestType) {
          case "kissmangaOpenDay":
              openURLsOnDay(request.data, sendResponse);
              break;
      }
      return true;
  }
);