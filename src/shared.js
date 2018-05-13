import moment from 'moment-timezone';

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
  const text = el.title || el.innerHTML || el;
  if(!text) {
    throw new Error("Invalid match type given");
  }
  const volumeMatch = /vol\.?\s*(\d+)/i.exec(text);
  let chapter = /(?:ch|chapter|episode|ep)\.?\s*([\d\.]+)/i.exec(text);
  if(chapter === null){
    chapter = /([\d\.]+)/.exec(text)
  }
  if(chapter === null){
    return {};
  }

  return {
  	chapter: parseFloat(chapter[1]),
  	volume: volumeMatch ? parseInt(volumeMatch[1]) : null
  };
}

export function kissmangaChapterDifference(el1,el2){
  const a = kissmangaMatchChapter(el1);
  const b = kissmangaMatchChapter(el2);
  if(!a.chapter || !b.chapter){
    return 0;
  }
  let diff = a.chapter - b.chapter;
  if(a.volume && b.volume){
	  diff += (a.volume - b.volume) * 10000;
  }

  return diff;
}

export function kissmangaNextChapterFilterElements(currentChapter, currentVolume){
  return (i, el) => {
    const {chapter, volume} = kissmangaMatchChapter(el);
    if(!chapter) return false;
    if(volume && currentVolume && !(volume === currentVolume)) return volume > currentVolume;
    
    return chapter > currentChapter;
  }
}

export function getWebtoonDate(offset = 0){
  return moment(new Date().toISOString())
    .tz('America/New_york')
    .subtract(offset, 'days');
}