var pages = {
  anime: [
  'http://kissanime.ru/',
  'http://www.masterani.me/'
  ],
  manga: [
  'http://www.readmanga.today/',
  'http://bato.to/',
  'https://gameofscanlation.moe/',
  'http://kissmanga.com/'
  ]
};

function generateLink(i, t, f){
    var w = document.createElement('span');
    w.setAttribute('id', i);
    w.setAttribute('class', 'links');
    w.appendChild(document.createTextNode(t));
    document.getElementById('linksBox').appendChild(w);
    w.addEventListener("click", f);
}
function destroyLink(i){
    var w = document.getElementById(i);
    if(w){
      w.parentNode.removeChild(w);
    }
}


function checkIfKissAnime(v){
	if(v){
      generateLink("kissmangaOpenAllLink", "Kissmanga Open All", function(e){
        chrome.tabs.executeScript({
          code:`
          (function(){
            const links = Array.from(document.querySelectorAll("table.listing tr td a"))
              .reverse().map((el) => el.href)
            chrome.runtime.sendMessage({pages: links,requestType: "openPages"});
          }());
          `
        },function(){
          window.close();
        });
      });
  } else {
    destroyLink("kissmangaOpenAllLink");
  }
}


function openPages(pages){
  alert(pages);
  chrome.runtime.sendMessage({pages: pages,requestType: "openPages"}, function(res){
    window.close();
  });
}


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("animeLink").addEventListener("click", function(e){
      openPages(pages.anime);
    });
    document.getElementById("mangaLink").addEventListener("click", function(e){
      openPages(pages.manga);
    });
    document.getElementById("IDM").addEventListener("click", function(e){
      chrome.management.setEnabled("ngpampappnmepgilojfohadhhmbhlaek", false, function(){
        chrome.management.setEnabled("ngpampappnmepgilojfohadhhmbhlaek", true, function () {
          chrome.tabs.reload(function(){
            window.close();
          });
        });
      });
    });
    document.getElementById("getUrlsLink").addEventListener("click", function(e){
      chrome.tabs.query({'windowId': chrome.windows.WINDOW_ID_CURRENT},
         function(tabs){
            const urls = tabs.map((el)=>el.url);
            chrome.storage.local.set({urls: urls});
         }
      );
    });
    document.getElementById("openUrlsLink").addEventListener("click", function(e){
      chrome.storage.local.get("urls", function(data){
        openPages(data.urls);
      })
    });
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
       function(tabs){
          checkIfKissAnime(/http:\/\/kissmanga.com/.test(tabs[0].url));
       }
    );
});

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
            case "closeWindow":
              window.close();
              break;
        }
    }
);
