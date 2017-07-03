chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "novelUpdatesOpenPage":
                novelUpdatesOpenPage(request.data, sender, sendResponse);
                break;
            case "novelUpdatesBGNext":
              novelUpdatesBGNext(Object.assign(request.data, {current:sender.tab.id}));
              break;
        }
    }
);

function novelUpdatesOpenPage(options, sender, sendResponse) {
  chrome.tabs.create({
    url: options.url,
    active: false
  }, function (tab) {
    waitForTabLoadThenMonitor(tab.id, sender, sendResponse, options.url);
  })
}

function novelUpdatesBGNext(options) {
  chrome.tabs.sendMessage(options.parent, {
    requestType: "novelUpdatesUINext"
  })
  chrome.tabs.remove(options.current);
}


function waitForTabLoadThenMonitor(mTabId, sender, sendResponse, url) {
  chrome.tabs.onUpdated.addListener(
    function updateListener(tabId, changeInfo, tab){
      if(changeInfo.status === "complete" && mTabId === tabId){
        chrome.tabs.sendMessage(tabId, {
          requestType: "monitorNovelUpdates",
          data: {
            parent: sender.tab.id,
            link: url
          }
        });

        return chrome.tabs.onUpdated.removeListener(updateListener);
      }
    }
  );
}
