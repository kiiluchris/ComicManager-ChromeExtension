chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch (request.requestType) {
            case "hasWebtoon":
                openWebtoons(request.todayComics, request.titleOrder);
                break;
            case "openPages":
                openPages(request.pages, request.tabId)
                sendResponse();
                break;
            case "openWebtoonsReading":
                openWebtoonsReading(request.pages);
                break;
            case "hasWebtoonDraggable":
                openWebtoonsDraggable(request.todayComics);
                break;
        }
    }
);


function saveTitleOrder(order) {
    let time = new Date();
    let todayI = time.getDay();
    let dayI = time.getUTCHours() >= 4 ? todayI :
        todayI === 0 ? 6 : todayI - 1;
    chrome.storage.local.get('webtoonOrder', function(data) {
        let oldOrder = data.webtoonOrder || {};
        oldOrder[todayI] = order;
        chrome.storage.local.set({ webtoonOrder: oldOrder });
    });
}

function openWebtoonsReading(urls) {
    chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT },
        function(tabs) {
            var tabUrls = tabs.map(function(t) {
                return t.url;
            });
            urls = urls.filter(function(u) {
                return tabUrls.indexOf(u) === -1;
            }).slice(0, 10);
            openPages(urls);
        })
}

function openPages(urls, tabId) {
    urls.forEach((url) => {
        chrome.tabs.create({
            active: false,
            url: url
        });
    });
    if (tabId) {
        chrome.tabs.remove(tabId);
    }
}

function openWebtoons(pages, titleOrder, i = 0, tabIds = []) {
    chrome.tabs.create({
            active: false,
            url: pages[titleOrder[i]]
        },
        function openFirstComic(tab) {
            tabIds.push({
                tab: tab.id,
                val: 0
            });
        }
    );
    if (++i < titleOrder.length) {
        return openWebtoons(pages, titleOrder, i, tabIds);
    }
    monitorWebtoonTabs(tabIds);
}

function openWebtoonsDraggable(pages) {
    saveTitleOrder(pages);
    var tabIds = [];
    for (var i = 0; i < pages.length; i++) {
        chrome.tabs.create({
                active: false,
                url: pages[i].link
            },
            function openFirstComic(tab) {
                tabIds.push({
                    tab: tab.id,
                    val: 0
                });
            }
        );
    }
    monitorWebtoonTabs(tabIds);
}

function monitorWebtoonTabs(tabIds) {
    chrome.tabs.onUpdated.addListener(
        function updateListener(tabId, changeInfo, tab) {
            if (changeInfo.status === "complete") {
                var tabI = tabIds.findIndex((el) => el.tab === tabId);
                if (tabI !== -1) {
                    let t = tabIds[tabI];
                    if (t.val === 0) {
                        chrome.tabs.executeScript(tabId, { code: 'document.querySelector(".detail_body .detail_lst a").click();' });
                        tabIds[tabI].val++;
                    } else {
                        chrome.tabs.sendMessage(tabId, { requestType: "scrollWebtoon" });
                        tabIds.splice(tabI, 1);
                    }
                }
                if (tabIds.length === 0) {
                    chrome.tabs.onUpdated.removeListener(updateListener);
                    return;
                }
            }
        }
    );
}