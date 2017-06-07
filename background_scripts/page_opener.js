chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "hasWebtoon":
                openWebtoons(request.todayComics, request.titleOrder);
                break;
            case "openPages":
                openPages(request.pages, request.tabId)
                sendResponse();
                break;
            case "openKissanimeChapter":
                openKissanimeChapter(request.offset);
                break;
            case "hasWebtoonDraggable":
                openWebtoonsDraggable(request.todayComics);
                break;
        }
    }
);

function openPages(urls, tabId) {
  urls.forEach((url) => {
    chrome.tabs.create({
        active: false,
        url: url
    });
  });
  if(tabId){
    chrome.tabs.remove(tabId);
  }
}

function openWebtoons(pages, titleOrder, i=0, tabIds=[]){
    chrome.tabs.create({
			active: false,
			url: pages[titleOrder[i]]
        },
        function openFirstComic(tab){
            tabIds.push(tab.id);
        }
    );
    if(++i < titleOrder.length){
        return openWebtoons(pages, titleOrder, i, tabIds);
    }
    monitorWebtoonTabs(tabIds);
}
function openWebtoonsDraggable(pages) {
  var tabIds = [];
  for (var i = 0; i < pages.length; i++) {
    chrome.tabs.create({
			active: false,
			url: pages[i].link
        },
        function openFirstComic(tab){
            tabIds.push(tab.id);
        }
    );
  }
  monitorWebtoonTabs(tabIds);
}
function monitorWebtoonTabs(tabIds) {
  chrome.tabs.onUpdated.addListener(
      function updateListener(tabId, changeInfo, tab){
          if(changeInfo.status === "complete"){
              var tabI = tabIds.indexOf(tabId);
              if( tabI !== -1){
                  chrome.tabs.executeScript(tabId, { code : 'document.querySelector(".detail_body .detail_lst a").click();'});
                  tabIds.splice(tabI, 1);
              }
              if(tabIds.length===0){
                  chrome.tabs.onUpdated.removeListener(updateListener);
                  return;
              }
          }
      }
  );
}

function openKissanimeChapter(offset){
    chrome.tabs.query({
        'windowId': chrome.windows.WINDOW_ID_CURRENT
    }, function(tabs){
        tabs
          .filter((t) => t.url && /.*kissmanga.com\/Manga\/[^\/]+$/.test(t.url))
          .forEach((t) => {
              let id = t.id;
              chrome.tabs.executeScript(id, {
                code: `
                var d = new Date();
                d.setDate(d.getDate()-${offset});
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
                  chrome.runtime.sendMessage({ requestType: "openPages", pages: urls, tabId: ${id} });
                }
                `
              });
          })
    });
}
