chrome.runtime.onInstalled.addListener(function() {
    getConfig(function(data) {
        for (var i = 0; i < data.menu_items.length; i++) {
            let item = data.menu_items[i];
            delete item.request;
            chrome.contextMenus.create(item);
        }
    });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    getConfig(function(data) {
        for (var i = 0; i < data.menu_items.length; i++) {
            let item = data.menu_items[i];
            if (item.id === info.menuItemId) {
                let val = Object.assign({ requestType: item.id }, item.request);

                if (val.kissmanga) {
                    openKissanimeChapter(val.offset);
                } else if (val.requestType === 'startPromptDraggable') {
                    getTitleOrder((order) => {
                        chrome.tabs.sendMessage(tab.id, Object.assign({}, val, { titleOrder: order }));
                    });
                } else {
                    chrome.tabs.sendMessage(tab.id, val);
                }
                break;
            }
        }
    });
});

function getConfig(cb) {
    let xmlreq = new XMLHttpRequest();
    xmlreq.open("GET", "background_scripts/context_menu.json", true);
    xmlreq.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            cb(JSON.parse(this.response));
        }
    };
    xmlreq.send(null);
}

function getTitleOrder(cb) {
    let time = new Date();
    let todayI = time.getDay();
    let dayI = time.getUTCHours() >= 4 ? todayI :
        todayI === 0 ? 6 : todayI - 1;
    chrome.storage.local.get('webtoonOrder', function(data) {
        let order = data.webtoonOrder;
        cb(order && order[dayI] || []);
    })
}

function openKissanimeChapter(offset) {
    chrome.tabs.query({
        'windowId': chrome.windows.WINDOW_ID_CURRENT
    }, function(tabs) {
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