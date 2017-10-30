import {get as httpGet} from 'axios';

chrome.runtime.onMessage.addListener(
  function(request,sender,sendResponse){
    switch(request.requestType){
      case "novelUpdatesOpenPage":
      novelUpdatesOpenPage(request.data, sender);
      break;
      case "novelUpdatesOpenPageWayback":
      novelUpdatesOpenPageWayback(request.data, sender);
      break;
      case "novelUpdatesBGNext":
      novelUpdatesBGNext({...request.data, current:sender.tab});
      break;
      case "novelUpdatesRemoveFromStore":
      novelUpdatesRemoveFromStore({...request.data, current:sender.tab});
      break;
      case "replaceMonitorNovelUpdatesUrl":
      replaceMonitorNovelUpdatesUrl({...request.data, current: sender.tab});
      break;
    }
  }
);

function replaceMonitorNovelUpdatesUrl({current, parent, url}){
  deleteCurrentNovelTab(parent, current);
  chrome.tabs.update(current.id, {url}, function(tab){
    waitForTabLoadThenMonitor(tab.id, parent, {save: true});
  })
}

function novelUpdatesOpenPage(options, sender) {
  chrome.tabs.create({
    url: options.url,
    active: false
  }, function (tab) {
    waitForTabLoadThenMonitor(tab.id, sender.tab, options);
  })
}

function novelUpdatesOpenPageWayback(options, sender){  
  httpGet(`https://comic-manager.herokuapp.com?url=${options.url}`).then(({data}) => {
    const {closest} = data;
    if(closest){
      novelUpdatesOpenPage({...options, url: closest.url}, sender);
    } else {
      alert('Url not available on wayback machine');
    }
  }).catch(e => console.error(e.response.data));
}

function novelUpdatesBGNext(options) {
  chrome.tabs.sendMessage(options.parent.id, {
    requestType: "novelUpdatesUINext",
    data: {
      wayback: options.wayback,
      tabId: options.tabId,
      save: options.save
    }
  });
  novelUpdatesRemoveFromStore(options);
}

function novelUpdatesRemoveFromStore(options) {
  chrome.tabs.remove(options.current.id, function () {
    deleteCurrentNovelTab(options.parent, options.current);
  });
}

function waitForTabLoadThenMonitor(mTabId, sender, options ={}) {
  chrome.tabs.onUpdated.addListener(
    function updateListener(tabId, changeInfo, tab){
      if(changeInfo.status === "complete" && mTabId === tabId){
        if(options.save){
          saveCurrentNovelTab(sender, tab, options.wayback);
        }
        chrome.tabs.sendMessage(tabId, {
          requestType: "monitorNovelUpdates",
          data: {
            parent: sender,
            tabId,
            ...options
          }
        });
        
        return chrome.tabs.onUpdated.removeListener(updateListener);
      }
    }
  );
}



function saveCurrentNovelTab(parent, current, wayback) {
  chrome.storage.local.get("novels", function (data) {
    let novels = data.novels || {};
    let key = parent.url.match(/.*\//)[0] + "*";
    let val = {
      url: current.url,
      time: Date.now(),
      wayback: !!wayback
    };
    if(novels[key]){
      novels[key].push(val);
    } else {
      novels[key] = [val];
    }
    chrome.storage.local.set({novels: novels});
  });
}

function deleteCurrentNovelTab(parent, current) {
  chrome.storage.local.get("novels", function (data) {
    let novels = data.novels || {};
    let key = parent.url.match(/.*\//)[0] + "*";
    if(novels[key]){
      novels[key] = novels[key].filter(n => n.url !== current.url);
      if(novels[key].length === 0){
        delete novels[key];
      }
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
            if(novels[key].length === 0){
              delete novels[key];
              chrome.storage.local.set({novels});
              return;
            }
            chrome.tabs.query({url: key}, function (tabs) {
              if (tabs.length === 0) {
                return;
              }
              let parent = tabs[0];
              for (let i = 0; i < novels[key].length; i++) {
                let novel = novels[key][i];
                if(Date.now() - novel.time > 604800000){
                  // One week has passed since item was added to the monitor
                  let val = novels[key].splice(i, 1)[0];
                  chrome.storage.local.set({novels});
                  return;
                }
                if(tab.url === novel.url){
                  chrome.tabs.query({ url: novel.url}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      requestType: "monitorNovelUpdates",
                      data: {
                        parent,
                        tabId,
                        ...novel
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

chrome.runtime.onInstalled.addListener(
  function(details){
    chrome.tabs.query({url:'http://www.novelupdates.com/series/*'}, function(tabs){
    for (let i = 0; i < tabs.length; i++) {
      chrome.tabs.reload(tabs[i].id)
    }
  });
  
  chrome.storage.local.get("novels", function (data) {
    let novels = data.novels;
    for (let key in novels) {
      if (novels.hasOwnProperty(key)) {
        for (let i = 0; i < novels[key].length; i++) {
          let novel = novels[key][i];
          chrome.tabs.query({ url: novel.url}, function (tabs) {
            if(tabs.length)
              chrome.tabs.reload(tabs[0].id)
          });
        }
      }
    }
  });
}
)