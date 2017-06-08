function setupOverlays() {
  var list = "ul#_webtoonList";
  var listItems = "li:has(.txt_ico_up)";
  var listOverlays = `${listItems} div.overlay`;
  var webtoonList = $(list);
  var todayComics = webtoonList.find(listItems);
  var input = $(`<input type="checkbox" style="top:5%;right: 5%;position: absolute;width: 20px;height: 20px;">`);
  var send = $(`<button style="background-color:rgba(255,255,255,0.9);font-size:24px;top: 75%;position: absolute;margin: 0 auto;left: 24%;width: 50%;">Send</button>`);
  var exit = $(`<span style="font-size: 25px;background: rgba(255, 255, 255, 0.7);width: 35px;height: 35px;position: absolute;left: 5%;top: 2%;border-radius: 50%;">X</span>`);
  var div = $(`<div class="overlay" style="position:absolute;background-color:rgba(40,220,24,0.4);width: 100%;height: 100%;z-index: 10000;top: 0;text-align: center;"></div>`);
  send.on("click", function(e){
    var items =  $(`${list} ${listItems}`).filter(":has(input:checked)")
      .map(function () {
        return {
          title: $(this).find(".subj span").text(),
          link: $(this).find("a").attr("href"),
        };
      }).get();
    chrome.runtime.sendMessage({
      todayComics: items,
      requestType: "hasWebtoonDraggable"
    }, removeOverlay);
  });
  exit.on("click", removeOverlay);
  div.append(exit,send,input);
  todayComics.append(div);
  webtoonList.sortable({
    items: listItems
  });
  webtoonList.disableSelection();

  chrome.runtime.sendMessage({requestType:"closeWindow"});

  function removeOverlay(e){
    webtoonList.sortable('disable');
    webtoonList.find(listOverlays).remove();
  }
}
function getTodaysComics(order,l){
    var webtoonList = document.querySelectorAll('#_webtoonList li');
    var todayComics = {};
    for(var i = 0; i < l; i++){
        var title = webtoonList[i].querySelector('.subj span').innerText;
        var link = webtoonList[i].querySelector('a').href;
        todayComics[title] = link;
    }
    return {todayComics: todayComics, titleOrder: order, requestType: "hasWebtoon"};
}


function runPrompt(){
    var d = document.getElementById("myprompt");
    if(d){
        d.parentNode.removeChild(d);
    }
    var mPrompt, mInput, mTextDiv,v;
    var text = document.createTextNode("Set the order of comics.");
    var d = document.createElement("div");
    var t = document.createElement("input");
    var y = document.createElement("button");
    var d0 = d.cloneNode();
    var d1 = d.cloneNode();
    var d2 = d.cloneNode();

    d.setAttribute("id", "myprompt");
    d.setAttribute("style", "color: #fff; position:fixed; width: 90%; left: 5%; top: 50px; z-index: 10000; background-color: rgba(0,0,0,0.3);  box-shadow: 0 0 10px 10px rgba(0,0,0,0.2); text-align: center;");
    y.setAttribute("style", "padding: 5px;margin: 10px;z-index: 20;box-shadow: 0 0 4px 3px rgba(255,255,255,0.2);width: 60px;color: #000; background-color: rgba(255,255,255,0.9);font-weight: 900")
    t.setAttribute("id", "myInput");
    t.setAttribute("type", "text");
    t.setAttribute("style", "border-radius: 5px; width: 90%;margin: 0 auto;text-align: left;");
    d0.setAttribute("style", "font-size:25px");

    var n = y.cloneNode();

    y.innerText = "YES";
    n.innerText = "NO";

    y.addEventListener("click", getData);
    n.addEventListener("click", hideP);

    d.appendChild(d0);
    d.appendChild(d1);
    d.appendChild(d2);
    d0.appendChild(text);
    d1.appendChild(t);
    d2.appendChild(y);
    d2.appendChild(n);

    document.querySelector("body").appendChild(d);

    mPrompt = d;
    mInput = t;
    mTextDiv = d0;

    var titles = Array.from(document.querySelectorAll('#_webtoonList li .subj span'))
                .filter((e) => e.parentNode.parentNode.querySelector('.txt_ico_up'))
                .map((e) => ({ value: e.innerText, text: e.innerText}));
    $("#myInput").selectize({
        delimiter: ',',
        create: false,
        options: titles
    });

    chrome.runtime.sendMessage({requestType:"closeWindow"}, function(){
        mInput.focus();
    });

    function hideP(){
        mPrompt.parentNode.removeChild(mPrompt);
    }
    function getData(e){
        var r = getTodaysComics(mInput.value.split(","),titles.length);
        chrome.runtime.sendMessage(r);
        hideP();
    }
}

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        switch(request.requestType){
          case "startPrompt":
            runPrompt();
            break;
          case "startPromptDraggable":
            setupOverlays();
            break;
        }
    }
);
