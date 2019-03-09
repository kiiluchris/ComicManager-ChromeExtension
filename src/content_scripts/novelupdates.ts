(function () {
  if(/novelupdates\.com\/series\/[a-zA-Z0-9\-]+\//.test(window.location.href)){
    checkBoxMonitor();
  }
}());

function checkBoxMonitor(){
  const checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll("table#myTable td input");
  const elements = [...document.querySelectorAll("table#myTable td a.chp-release")];
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click", function(e: MouseEvent){
      const wayback =  e.shiftKey;
      e.preventDefault();
      checkboxes[i].click();
      chrome.runtime.sendMessage({
        data: {
          url: (<HTMLAnchorElement>e.target).href,
          save: !e.ctrlKey,
          wayback
        },
        requestType: wayback ? "novelUpdatesOpenPageWayback" : "novelUpdatesOpenPage"
      });
      const $unclickedLinks = $('table#myTable tbody tr[style].newcolorme a.chp-release');
      if(!document.querySelector('.sttitle a')){
        setTimeout(() => window.location.reload(), 1000);
      } else if($unclickedLinks.length === 0){
        openNextPage();
      }
    });
  }
}

function openNextPage(){
  const $currentPage = $("div.digg_pagination em.current:not(:first-child)");
  if($currentPage.length !== 0){
    setTimeout(() => {
      $currentPage.prev()[0].click();
    }, 2500)
  }
}

function monitorNovelUpdates(options: novelupdates.ReqData, extensionName: string) {
  const pageURL = window.location.href.replace(/#.*/, '');
  for(const el of document.querySelectorAll('a')) {
    if(el.href.replace(/#.*/, '') !== pageURL){
      el.addEventListener('click', function(e){
        e.preventDefault();
        chrome.runtime.sendMessage({
          requestType: "replaceMonitorNovelUpdatesUrl",
          data: {...options, url: this.href}
        });
      })
    }
  }
  window.addEventListener("keyup", function(e){
    if(e.ctrlKey){
      if(e.key === "ArrowRight"){
        chrome.runtime.sendMessage({
          requestType: options.parent.id ? "novelUpdatesBGNext" : "novelUpdatesRemoveFromStore",
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
  window.postMessage({
    extension: extensionName,
    status: "complete" 
  }, window.location.href);
  window.addEventListener("message", ({data:{extension, url, message}} : UserScriptReq) => {
    const messageHandlerArgsObj: UserScriptHandlerObj = {
      novelUpdatesSaveUrl: [{
        data: {
          url,
          save: true,
          wayback: options.wayback,
          parent: options.parent
        },
        requestType: "novelUpdatesOpenPageNext"
      }, () => {
        window.postMessage({
          extensionName,
          message: `Saved: ${url}`
        }, window.location.href);
      }],
      replaceMonitorNovelUpdatesUrl: [{
        requestType: "replaceMonitorNovelUpdatesUrl",
        data: {...options, url }
      }]
    };
    const messageHandlerArgs = messageHandlerArgsObj[message]
    if(extension === extensionName && messageHandlerArgs){
      chrome.runtime.sendMessage.apply(null, messageHandlerArgs);
    }
  });
}

function novelUpdatesUINext(options: novelupdates.StorageEntry, sendResponse: (...args: any) => any) {
  const $nextChapterLink = $('table#myTable tbody tr[style].newcolorme a.chp-release').last();
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
      monitorNovelUpdates(request.data, request.extensionName);
      break;
      case "novelUpdatesUINext":
      novelUpdatesUINext(request.data, sendResponse);
      return true;
    }
  }
);
