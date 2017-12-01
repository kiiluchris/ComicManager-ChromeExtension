export function createTab(options = {}){
  return new Promise(res => {
    chrome.tabs.create({
        active: false,
        ...options
    }, res);
  });
}

export function monitorTabs(tabIds = [], cb) {
  if(typeof cb !== "function"){
    throw new Error('No Callback Provided')
  }

  chrome.tabs.onUpdated.addListener(
    function updateListener(tabId, changeInfo, tab) {
      if (changeInfo.status === "complete") {
        var tabI = tabIds.findIndex(id => id === tabId);
        if (tabI !== -1) {
          cb(tab);
          tabIds.splice(tabI, 1);
        }
      }
      if (tabIds.length === 0) {
        chrome.tabs.onUpdated.removeListener(updateListener);
      }
    }
  );
}

/**
 * 
 * 
 * @export
 * @param {(string|HTMLElement)} [el] The element or string being parsed
 * @returns {(number|null)}
 */
export function kissmangaMatchChapter(el){
  let text = el.innerHTML !== undefined ? el.innerHTML : el;
  let chapterMatchingRe = /(?:(?:ch|chapter|episode|ep)\.?\s*([\d\.]+)|([\d\.]+))/i;
  const chapter = chapterMatchingRe.exec(text);
  if(chapter === null){
    return null;
  }

  return parseFloat(chapter[1] || chapter[2]);
}
