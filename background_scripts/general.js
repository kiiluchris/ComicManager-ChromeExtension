chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "extensionTab":
                extensionTab();
                break;
        }
    }
);

function extensionTab(){
    chrome.tabs.create({
        url: "chrome://extensions",
        active: true
    })
}