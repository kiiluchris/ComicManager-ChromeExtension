(function(){
	window.addEventListener('keyup', function(e){
		if(e.key === "E" && e.ctrlKey && e.shiftKey && window.location.href !== "chrome://extensions"){
			chrome.runtime.sendMessage({requestType: "extensionTab"});
		}
	});
}())