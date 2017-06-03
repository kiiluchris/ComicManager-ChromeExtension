
/*
Get titles from storage
Check store for old records and delete
Check if today's record is equivalent to stored record
If difference, open link to new record and store it
*/


function manageComics(key,items){
    chrome.storage.sync.get(function(orig_items){
        old_items = orig_items[key];
        var datestr = dateFormat(new Date());
        if(old_items){
	        if(old_items[datestr]){
	            old_items[datestr].forEach((e) => {
	            	var i = items.indexOf(e);
	            	if(i !== -1){
	            		items.splice(i,1);
	            	}
	            });
	            [].push.apply(old_items[datestr], items);
	        }
	        for(var k in old_items){
	        	if(k !== datestr){
	        		delete old_items[k];
	        	}
	        }
	        orig_items[key] = old_items;
	        chrome.storage.sync.set(orig_items);
	    } else {
	    	orig_items[key] = {}
	    	orig_items[key][datestr] = items
	        chrome.storage.sync.set(orig_items);	    	
	    }
    });

    return items;
}

function getDifferenceCount(key,items){
    chrome.storage.sync.get(function(orig_items){
        old_items = orig_items[key];
        var datestr = dateFormat(new Date());
        if(old_items && old_items[datestr]){
        	items = items.filter((e) => old_items[datestr].indexOf(e) === -1);
        }
	    chrome.runtime.sendMessage({ key: key, len: items.length, requestType: "settingCount"});
    });
}

function dateFormat(d){
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[d.getMonth()] +" "+d.getDate()+" "+d.getFullYear();
}

chrome.runtime.onMessage.addListener(
	function(request,sender,sendResponse){
		switch(request.requestType){
			case "manageData":
				// manageComics(request.itemKey, request.items);
				break;
			case "gettingCount":
				requestData(
					"post", 
					"http://localhost:8080/webtoons", 
					{
						email:"cndeti@gmail.com", 
						password: "Ichi1Go5"
					},
					function(res){
						getDifferenceCount(res.itemKey, res.items);
					}
				);	
				break;
		}
	}
);
	

function requestData(type, url, data, cb){
	var httpreq = new XMLHttpRequest();
	httpreq.open(type, url);
	httpreq.setRequestHeader("Content-Type", "application/json");
	httpreq.onreadystatechange = function(){
		if(this.status === 200 && this.readyState === XMLHttpRequest.DONE){
			cb(JSON.parse(this.responseText));
		}
	};
	httpreq.send(JSON.stringify(data));
}