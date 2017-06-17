function createNextButton() {
	let button = $(`
	<div id="mNextChapter" style="
		width: 50px;
		height: 50px;
		position: fixed;
		text-align: center;
		font-weight: bolder;
		bottom: 10%;
		background: rgba(255,255,255,1);
		line-height: 50px;
		right: 5%;
		cursor: pointer;
		box-shadow: 0px 0px 12px 6px rgba(0, 0, 0, 0.2);
		">
	  &gt;
	</div>
	`);
  button.on("click", function (e) {
    chrome.runtime.sendMessage({requestType: "tseirpFindLatestOpenChapter", tab: window.location.href});
  });
  $("body").append(button);
}

function getNextPageHref() {
	let nextPage = document.querySelectorAll("div div p span a")[1].href;
	chrome.runtime.sendMessage({requestType:"openPages", pages: [nextPage]});
}

(function () {
	if(/tseirptranslations.com\/20[\d]{2}\/[\d]{2}\/is-b[\d]c([\d]+).html/.test(window.location.href)){
	  createNextButton();
	}
}())

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "getTseirpNextChapter":
                getNextPageHref();
                break;
        }
    }
);
