var nextWebtoons = "openNextChaptersWebtoons";

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        title: "Open next 10 chapters",
        id: nextWebtoons,
        documentUrlPatterns: [
          "*://*.webtoons.com/en/*/viewer*",
        ]
    });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        case nextWebtoons:
          chrome.tabs.sendMessage(tab.id, { requestType: "openNextChapters"});
          break;
    }
});
