(function () {
  if(/novelupdates\.com\/series\/[a-zA-Z0-9\-]+\//.test(window.location.href)){
    checkBoxMonitor();
  }
}());

function checkBoxMonitor(){
  const checkboxes = document.querySelectorAll("table#myTable td input");
  const elements = [].slice.apply(document.querySelectorAll("table#myTable td a.chp-release"));
  for (let i = 0; i < elements.length; i++) {
     elements[i].addEventListener("click", function(e){
       e.preventDefault();
       chrome.runtime.sendMessage({
         data: {
           url: e.target.href,
           parent: window.location.href
         },
         requestType: "novelUpdatesOpenPage"
       }, function (options) {
         if(options && options.page){
           let nextChapter = $("tr.newcolorme:not([style])").first().prev() || $("tr.newcolorme").last();
           nextChapter.find("td a.chp-release")[0].click();
         }
       });
       checkboxes[i].click();
       if(i === 0){
        let parentIndex = $(elements[i]).closest("tr").index();
        let currentPage = $("div.digg_pagination em.current");
        if(parentIndex === 0 && currentPage.index() !== 0) {
          currentPage.prev()[0].click();
        }
       }
     });
  }
}

function monitorNovelUpdates(sendResponse) {
  document.body.addEventListener("keydown", function(e){
    if(e.key === "ArrowRight" && e.ctrlKey){
      sendResponse({ page: window.location.href });
    }
  })
}

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "monitorNovelUpdates":
                monitorNovelUpdates(sendResponse);
                return true;
        }
    }
);
