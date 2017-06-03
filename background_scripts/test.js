(function getWebtoonsCount(){
	var httpreq = new XMLHttpRequest();
	var data = {};
	httpreq.open("GET", chrome.runtime.getURL("background_scripts/test.py"), true);
	httpreq.onreadystatechange = function(){
		console.log(this);
		if(this.status == 200 && this.readyState === XMLHttpRequest.DONE){
			console.log("DONE");
		}
	};
	httpreq.send(data);
	// var iframe = document.createElement("iframe");
	// iframe.setAttribute("src", "http://www.webtoons.com/favorite");
	// document.body.appendChild(iframe);
	// iframe.addEventListener("load", function(e){
	// 	// console.log(this.contentDocument, this.contentWindow);
	//  //    var titles = Array.from(this.contentDocument.querySelectorAll('#_webtoonList li .subj span'))
	//  //                .filter((e) => e.parentNode.parentNode.querySelector('.txt_ico_up'))
	//  //                .map((e) => e.innerText);
	//  //    getDifferenceCount("webtoons", titles)
	// });

})();