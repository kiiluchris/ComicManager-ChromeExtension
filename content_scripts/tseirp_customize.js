function createNextButton() {
	let style = `
	<style>
		div#mNextChapter{
				width: 50px;
				height: 50px;
				position: fixed;
				text-align: center;
				font-weight: bolder;
				bottom: 10%;
				background: rgba(255,255,255,1);
				line-height: 50px;
				cursor: pointer;
				box-shadow: 0px 0px 12px 6px rgba(0, 0, 0, 0.2);
				right: 5%;
		}
		div#mNextChapter:hover {
			background-color: #ccc;
		}
		@media screen and (min-width: 1000px) {
		    div#mNextChapter {
						right: 34%;
		    }
		}
		@media screen and (min-width: 1280px){
			div#mNextChapter {
				right: auto;
				transform: translateX(720px);
			}
		}
	</style>
`;
	let button = $(`
	<div id="mNextChapter">
	  &gt;<div></div>
	</div>
	`);
  button.on("click", function (e) {
    chrome.runtime.sendMessage({requestType: "tseirpFindLatestOpenChapter", tab: window.location.href});
  });
  let container = $("body div.content");
	container.append(style, button);
	container[0].scrollIntoView();

}

function getNextPageHref() {
	let nextPage = document.querySelectorAll("div div p span a")[1].href;
	chrome.runtime.sendMessage({requestType:"openPages", pages: [nextPage]});
}

function updateSelectedChapter(chapter) {
	let current  = $(`table#myTable tbody tr td:nth-child(3) a:contains(v${chapter.volume}c${chapter.chapter}${chapter.part ? " part"+chapter.part : ""})`);
	current
		.next("td input[type=checkbox]")[0]
		.click();
	let parentIndex = current.closest("tr").index();
	let currentPage = $("div.digg_pagination em.current");
	if(parentIndex === 0 && currentPage.index() !== 0){
		currentPage.prev()[0].click();
	}
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
							case "updateISTseirp":
								updateSelectedChapter(request.finishedChapter);
								break;
        }
    }
);
