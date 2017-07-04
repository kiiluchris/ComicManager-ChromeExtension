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
         },
         requestType: "novelUpdatesOpenPage"
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

function monitorNovelUpdates(options) {
  document.body.addEventListener("keydown", function(e){
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
      }
    }
  })
}

function novelUpdatesUINext(options) {
  let nextChapter = $("tr.newcolorme:not([style])").first().prev()
  if(nextChapter.length === 0){
    nextChapter = $("tr.newcolorme").last();
  }
  nextChapter.find("td a.chp-release")[0].click();
}

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "monitorNovelUpdates":
                monitorNovelUpdates(request.data);
                break;
            case "novelUpdatesUINext":
              novelUpdatesUINext(request.data);
              break;
        }
    }
);
