(function () {
  if(/novelupdates\.com\/series\/[a-zA-Z0-9\-]+\//.test(window.location.href)){
  checkBoxMonitor();
}
}());

function checkBoxMonitor(){
  const checkboxes = document.querySelectorAll("table#myTable td input");
  const elements = [...document.querySelectorAll("table#myTable td a.chp-release")];
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", function(e){
      const wayback =  e.shiftKey;
      e.preventDefault();
      checkboxes[i].click();
      chrome.runtime.sendMessage({
        data: {
          url: e.target.href,
          save: !e.ctrlKey,
          wayback
        },
        requestType: wayback ? "novelUpdatesOpenPageWayback" : "novelUpdatesOpenPage"
      });
      const $unclickedLinks = $('table#myTable tbody tr[style].newcolorme a.chp-release');
      if(!document.querySelector('.sttitle a')){
        window.location.reload();
      } else if($unclickedLinks.length === 0){
        openNextPage();
      }
    });
  }
}

function openNextPage(){
  const $currentPage = $("div.digg_pagination em.current:not(:first-child)");
  if($currentPage.length !== 0){
    $currentPage.prev()[0].click();
  }
}

function monitorNovelUpdates(options) {
  for(const el of document.querySelectorAll('a')) {
    el.addEventListener('click', function(e){
      e.preventDefault();
      chrome.runtime.sendMessage({
        requestType: "replaceMonitorNovelUpdatesUrl",
        data: {...options, url: this.href}
      });
    })
  }
  window.addEventListener("keyup", function(e){
    if(e.ctrlKey){
      if(e.key === "ArrowRight"){
        chrome.runtime.sendMessage({
          requestType: "novelUpdatesBGNext",
          data: options
        });
      } else if (e.key === "ArrowLeft") {
        chrome.runtime.sendMessage({
          requestType: "novelUpdatesRemoveFromStore",
          data: options
        });
      } else if (e.key === "ArrowUp") {
        chrome.runtime.sendMessage({
          requestType: "novelUpdatesOpenParent",
          data: options
        });
      }
    }
  });
}

function novelUpdatesUINext(options, sendResponse) {
  let $nextChapterLink = $('table#myTable tbody tr[style].newcolorme a.chp-release').last();
  
  if($nextChapterLink.length === 0) {
    openNextPage();
  } else {
    $nextChapterLink[0].dispatchEvent(new MouseEvent('click', {
      shiftKey: !!options.wayback, 
      ctrlKey: false,
      cancelable: true
    }));
  }
  
  sendResponse();
}

chrome.runtime.onMessage.addListener(
  function(request,sender,sendResponse){
    switch(request.requestType){
      case "monitorNovelUpdates":
      monitorNovelUpdates(request.data);
      break;
      case "novelUpdatesUINext":
      novelUpdatesUINext(request.data, sendResponse);
      return true;
    }
  }
);
