chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "tseirpFindLatestOpenChapter":
                findLatestOpenChapter(request.tab);
                break;
        }
    }
);
function getChapterValues(match, tab) {
  let val = {chapter: match[2], tab: tab.id, volume: match[1]};
   if(match[3]){
     val.part = match[3];
   }

   return val;
}
function findLatestOpenChapter(url) {
  chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT},
  function (tabs) {
    let latestChapter = {chapter: -1};
    let finishedChapter, novelUpdatesTab;
    for (var i = 0; i < tabs.length; i++) {
      let tab = tabs[i];
      let m = /tseirptranslations.com\/20[\d]{2}\/[\d]{2}\/is-b([\d])c([\d]+)(p[\d])?.html/.exec(tab.url);
      if(tab.url === url){
        finishedChapter = getChapterValues(m, tab);
        chrome.tabs.remove(tab.id);
      }
      if(/novelupdates.com\/series\/invincible-saint-salaryman-the-path-i-walk-to-survive-in-this-other-world\/.*/.test(tab.url)){
        novelUpdatesTab = tab.id;
      }
      if(m && m[2] > latestChapter.chapter){
        latestChapter = getChapterValues(m, tab);
      }
    }
    chrome.tabs.sendMessage(latestChapter.tab, {requestType: "getTseirpNextChapter"});
    if(novelUpdatesTab){
      chrome.tabs.sendMessage(novelUpdatesTab, {requestType: "updateISTseirp", finishedChapter: finishedChapter});
    }
  })
}
