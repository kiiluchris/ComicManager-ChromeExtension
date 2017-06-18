var contextTitles = {
  nextWebtoons: "openNextChaptersWebtoons",
  clearInputs: "clearWebtoonOverlayInputs",
  fillInputs: "fillWebtoonOverlayInputs",
};

let data;

chrome.runtime.onInstalled.addListener(function() {
    let xmlreq = new XMLHttpRequest();
    xmlreq.open("GET", "background_scripts/context_menu.json", false);
    xmlreq.onreadystatechange = function () {
      if(this.readyState === 4 && this.status === 200){
        data = JSON.parse(this.response);
        for (var i = 0; i < data.menu_items.length; i++) {
          let item = data.menu_items[i];
          let r = item.request;
          delete item.request;
          chrome.contextMenus.create(item);
          item.request = r;
        }
      }
    };
    xmlreq.send(null);
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if(data){
      for (var i = 0; i < data.menu_items.length; i++) {
        let item = data.menu_items[i];
        if(item.id === info.menuItemId){
          chrome.tabs.sendMessage(tab.id, Object.assign({ requestType: item.id}, item.request));
          break;
        }
      }
    }
});
