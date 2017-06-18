let data;

chrome.runtime.onInstalled.addListener(function() {
    let xmlreq = new XMLHttpRequest();
    xmlreq.open("GET", "background_scripts/context_menu.json", true);
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
          let val = Object.assign({ requestType: item.id}, item.request);
          if(val.kissmanga){
            openKissanimeChapter(val.offset);
          } else {
            chrome.tabs.sendMessage(tab.id, val);
          }
          break;
        }
      }
    }
});

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
