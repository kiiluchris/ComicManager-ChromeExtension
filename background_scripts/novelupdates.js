chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "novelUpdatesOpenPage":
                novelUpdatesOpenPage(request.data, sendResponse);
                return true;
        }
    }
);

function novelUpdatesOpenPage(options, sendResponse) {
  chrome.tabs.create({
    url: options.url,
    active: false
  }, function (tab) {
    waitForTabLoadThenMonitor(tab.id, sendResponse);
  })
}



function waitForTabLoadThenMonitor(mTabId, sendResponse) {
  chrome.tabs.onUpdated.addListener(
    function updateListener(tabId, changeInfo, tab){
      if(changeInfo.status === "complete" && mTabId === tabId){
        chrome.tabs.sendMessage(tabId, {
          requestType: "monitorNovelUpdates"
        }, function (options) {
          sendResponse(options);
          if(options){
            chrome.tabs.remove(tabId);
          }
        });

        return chrome.tabs.onUpdated.removeListener(updateListener);
      }
    }
  );
}
