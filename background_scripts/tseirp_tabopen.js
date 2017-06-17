chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "tseirpFindLatestOpenChapter":
                findLatestOpenChapter(request.tab);
                break;
        }
    }
);

function findLatestOpenChapter(url) {
  chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT},
  function (tabs) {
    let latestChapter = {chapter: -1};
    for (var i = 0; i < tabs.length; i++) {
      let tab = tabs[i];
      let m = /tseirptranslations.com\/20[\d]{2}\/[\d]{2}\/is-b[\d]c([\d]+).html/.exec(tab.url);
      if(tab.url === url){
        chrome.tabs.remove(tab.id);
      }
      if(m && m[1] > latestChapter.chapter){
       latestChapter = {chapter: m[1], tab: tab.id};
      }
    }
    chrome.tabs.sendMessage(latestChapter.tab, {requestType: "getTseirpNextChapter"});
  })
}
