var contextTitles = {
  nextWebtoons: "openNextChaptersWebtoons",
  clearInputs: "clearWebtoonOverlayInputs",
  fillInputs: "fillWebtoonOverlayInputs",
};

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        title: "Open next 10 chapters",
        id: contextTitles.nextWebtoons,
        documentUrlPatterns: [
          "*://*.webtoons.com/en/*/viewer*",
        ]
    });
    chrome.contextMenus.create({
      title: "Select all comics",
      id: contextTitles.fillInputs,
      documentUrlPatterns: [
        "*://*.webtoons.com/favorite"
      ]
    });
    chrome.contextMenus.create({
      title: "Unselect all comics",
      id: contextTitles.clearInputs,
      documentUrlPatterns: [
        "*://*.webtoons.com/favorite"
      ]
    });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        case contextTitles.nextWebtoons:
          chrome.tabs.sendMessage(tab.id, { requestType: "openNextChapters"});
          break;
        case contextTitles.fillInputs:
          chrome.tabs.sendMessage(tab.id, { requestType: contextTitles.fillInputs });
          break;
        case contextTitles.clearInputs:
          chrome.tabs.sendMessage(tab.id, { requestType: contextTitles.clearInputs });
          break;
    }
});
