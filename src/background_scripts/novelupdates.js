import {get as httpGet} from 'axios';

chrome.runtime.onMessage.addListener(
  async function(request,sender,sendResponse){
    switch(request.requestType){
      case "novelUpdatesOpenPage":
      await novelUpdatesOpenPage(request.data, sender);
      break;
      case "novelUpdatesOpenPageWayback":
      await novelUpdatesOpenPageWayback(request.data, sender);
      break;
      case "novelUpdatesBGNext":
      await novelUpdatesBGNext({...request.data, current:sender.tab});
      break;
      case "novelUpdatesRemoveFromStore":
      await novelUpdatesRemoveFromStore({...request.data, current:sender.tab});
      break;
      case "replaceMonitorNovelUpdatesUrl":
      await replaceMonitorNovelUpdatesUrl({...request.data, current: sender.tab});
      break;
    }
  }
);

function replaceMonitorNovelUpdatesUrl({current, parent, url, wayback}){
  return deleteCurrentNovelTab(parent, current)
    .then(_ => (new Promise(res => {
        chrome.tabs.update(current.id, {url}, res);
      }).then(tab => waitForTabLoadThenMonitor(tab.id, parent, {save: true, wayback}))
    ));
}

function novelUpdatesOpenPage(options, sender) {
  return new Promise(res => {
    chrome.tabs.create({
      url: options.url,
      active: false
    },res);
  }).then(tab => waitForTabLoadThenMonitor(tab.id, sender.tab, options)).catch(console.error);
}

function novelUpdatesOpenPageWayback(options, sender){  
  return httpGet(`https://comic-manager.herokuapp.com?url=${options.url}`).then(({data}) => {
    const {closest} = data;
    if(closest){
      return novelUpdatesOpenPage({...options, url: closest.url}, sender);
    } else {
      throw new Error('Url not available on wayback machine');
    }
  }).catch(e => {
    console.error(e);
    if(e.response){
      console.error(e.response.data);
    }
  });
}

function novelUpdatesBGNext(options) {
  return new Promise(res => {
    chrome.tabs.sendMessage(options.parent.id, {
      requestType: "novelUpdatesUINext",
      data: {
        wayback: options.wayback,
        tabId: options.tabId,
        save: options.save
      }
    });
    res(options);
  }).then(novelUpdatesRemoveFromStore);
}

function novelUpdatesRemoveFromStore(options) {
  return new Promise(res => {
    chrome.tabs.remove(options.current.id, res);
  }).then(_ => deleteCurrentNovelTab(options.parent, options.current))
}

function waitForTabLoadThenMonitor(mTabId, sender, options ={}) {
  return new Promise(res => {
    chrome.tabs.onUpdated.addListener(
      async function updateListener(tabId, changeInfo, tab){
        if(changeInfo.status === "complete" && mTabId === tabId){
          if(options.save){
            await saveCurrentNovelTab(sender, tab, options.wayback);
          }
          const data = {
            parent: sender,
            tabId,
            ...options
          };
          chrome.tabs.sendMessage(tabId, {
            requestType: "monitorNovelUpdates",
            data,
          });
          
          chrome.tabs.onUpdated.removeListener(updateListener);
          return res(data);
        }
      }
    );
  })
}



function saveCurrentNovelTab(parent, current, wayback) {
  return new Promise(res => {
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
      res();
    });
  })
}

function deleteCurrentNovelTab(parent, current) {
  return new Promise(res => {
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
      res();
    });
  })
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
    chrome.tabs.query({url:'https://www.novelupdates.com/series/*'}, function(tabs){
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