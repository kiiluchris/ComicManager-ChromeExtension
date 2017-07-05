chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "novelUpdatesOpenPage":
                novelUpdatesOpenPage(request.data, sender, sendResponse);
                break;
            case "novelUpdatesBGNext":
              novelUpdatesBGNext(Object.assign(request.data, {current:sender.tab}));
              break;
            case "novelUpdatesRemoveFromStore":
              novelUpdatesRemoveFromStore(Object.assign(request.data, {current:sender.tab}));
              break;
        }
    }
);

function novelUpdatesOpenPage(options, sender, sendResponse) {
  chrome.tabs.create({
    url: options.url,
    active: false
  }, function (tab) {
    waitForTabLoadThenMonitor(tab.id, sender, options);
  })
}

function novelUpdatesBGNext(options) {
  chrome.tabs.sendMessage(options.parent.id, {
    requestType: "novelUpdatesUINext"
  });
  novelUpdatesRemoveFromStore(options);
}

function novelUpdatesRemoveFromStore(options) {
  chrome.tabs.remove(options.current.id, function () {
    deleteCurrentNovelTab(options.parent, options.current);
  });
}

function waitForTabLoadThenMonitor(mTabId, sender, options) {
  chrome.tabs.onUpdated.addListener(
    function updateListener(tabId, changeInfo, tab){
      if(changeInfo.status === "complete" && mTabId === tabId){
        if(options.save){
          saveCurrentNovelTab(sender.tab, tab);
        }
        chrome.tabs.sendMessage(tabId, {
          requestType: "monitorNovelUpdates",
          data: {
            parent: sender.tab,
          }
        });

        return chrome.tabs.onUpdated.removeListener(updateListener);
      }
    }
  );
}



function saveCurrentNovelTab(parent, current) {
  chrome.storage.local.get("novels", function (data) {
    let novels = data.novels || {};
    let key = parent.url.match(/.*\//)[0] + "*";
    if(novels[key]){
      novels[key].push(current.url);
    } else {
      novels[key] = [current.url];
    }
    chrome.storage.local.set({novels: novels});
  });
}

function deleteCurrentNovelTab(parent, current) {
  chrome.storage.local.get("novels", function (data) {
    let novels = data.novels || {};
    let key = parent.url.match(/.*\//)[0] + "*";
    if(novels[key]){
      novels[key] = novels[key].filter(url => url !== current.url);
    }
    chrome.storage.local.set({novels: novels});
  });
}

chrome.tabs.onUpdated.addListener(
  function check(tabId, changeInfo, tab) {
    if(changeInfo.status === "complete"){
      chrome.storage.local.get("novels", function (data) {
        let novels = data.novels;
        for (let key in novels) {
          if (novels.hasOwnProperty(key)) {
            chrome.tabs.query({url: key}, function (tabs) {
              if (tabs.length === 0) {
                return;
              }
              let parent = tabs[0];
              for (var i = 0; i < novels[key].length; i++) {
                let url = novels[key][i];
                if(tab.url === url){
                  chrome.tabs.query({ url: url}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      requestType: "monitorNovelUpdates",
                      data: {
                        parent: parent,
                      }
                    });
                  });

                  return;
                }
              }
            })
          }
        }
      });
    }
  }
);
