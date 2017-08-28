function setupOverlays(titleOrder) {
    var list = "ul#_webtoonList";
    var listItems = "li:has(.txt_ico_up)";
    var listOverlays = `${listItems} div.overlay`;
    if ($(listOverlays).length === 0) {
        var overLaySpans = "overlay-spans";
        var spanButton = (text) => `<span>${text}</span>`;
        var webtoonList = $(list);
        var todayComics = webtoonList.find(listItems);
        var input = $(`<input type="checkbox">`);
        var send = $(spanButton("open"));
        var exit = $(spanButton("cancel"));
        var svg = $(`
        <label for="check" class="check">
          <svg width="250" height="180" style="transform:scale(0.3);">
            <circle cx="125" cy="90" r="60" />
            <path d="M125 40V140" class="path1"></path>
            <path d="M75 90H175" class="path2"></path>
          </svg>    
        </label>`);
        var div = $(`
        <div class="overlay">
            <div class="${overLaySpans}">
            </div>
        </div>
        `);
        if (titleOrder.length) {
            let sortedItems = new Array(titleOrder.length);
            $.each(todayComics, function() {
                let i = titleOrder.findIndex((el) => el.link === this.querySelector('a').href);
                if (~i) {
                    $(this).addClass('overlay-input-selected');
                    sortedItems[i] = this;
                    $(this).remove();
                }
            })
            sortedItems.reverse();
            $.each(sortedItems, function() {
                if (this)
                    $(list).prepend(this);
            })
            todayComics = $(list).find(listItems);
        }
        //  &#10004; tick signx
        //  &#10006; x
        svg.on('click', function(e){
            $(this).toggleClass('selected');
            $(this).siblings('input')[0].click();
        });
        send.on("click", function(e) {
            var items = $(`${list} ${listItems}`).filter(":has(input:checked)")
                .map(function() {
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
        div.append(input, svg);
        div.find("." + overLaySpans).append(send, exit);
        todayComics.append(div);
        $.each(todayComics, function() {
            if ($(this).hasClass('overlay-input-selected')) {
                console.log(this)
                this.querySelector('label.check').click();
            }
        })
        webtoonList.sortable({
            items: listItems
        });
        webtoonList.disableSelection();

        chrome.runtime.sendMessage({ requestType: "closeWindow" });

        function removeOverlay(e) {
            webtoonList.sortable('disable');
            webtoonList.find(listOverlays).remove();
        }
    }
}

function editOverlayInputs(bool) {
    $("ul#_webtoonList li:has(.txt_ico_up) div.overlay input")
        .prop("checked", bool);
}

function getTodaysComics(order, l) {
    var webtoonList = document.querySelectorAll('#_webtoonList li');
    var todayComics = {};
    for (var i = 0; i < l; i++) {
        var title = webtoonList[i].querySelector('.subj span').innerText;
        var link = webtoonList[i].querySelector('a').href;
        todayComics[title] = link;
    }
    return { todayComics: todayComics, titleOrder: order, requestType: "hasWebtoon" };
}


function runPrompt() {
    var d = document.getElementById("myprompt");
    if (d) {
        d.parentNode.removeChild(d);
    }
    var mPrompt, mInput, mTextDiv, v;
    var text = document.createTextNode("Set the order of comics.");
    var d = document.createElement("div");
    var t = document.createElement("input");
    var y = document.createElement("button");
    var d0 = d.cloneNode();
    var d1 = d.cloneNode();
    var d2 = d.cloneNode();

    d.setAttribute("id", "myprompt");
    d.setAttribute("style", "color: #fff; position:fixed; width: 90%; left: 5%; top: 50px; z-index: 10000; background-color: rgba(0,0,0,0.3);  box-shadow: 0 0 10px 10px rgba(0,0,0,0.2); text-align: center;");
    y.setAttribute("style", "padding: 5px;margin: 10px;z-index: 20;box-shadow: 0 0 4px 3px rgba(255,255,255,0.2);width: 40%;color: #000; background-color: rgba(255,255,255,0.9);font-weight: 900")
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
        .map((e) => ({ value: e.innerText, text: e.innerText }));
    $("#myInput").selectize({
        delimiter: ',',
        create: false,
        options: titles
    });

    chrome.runtime.sendMessage({ requestType: "closeWindow" }, function() {
        mInput.focus();
    });

    function hideP() {
        mPrompt.parentNode.removeChild(mPrompt);
    }

    function getData(e) {
        var r = getTodaysComics(mInput.value.split(","), titles.length);
        chrome.runtime.sendMessage(r);
        hideP();
    }
}

function openNext10Chapters() {
    var links = $("div#topEpisodeList .episode_cont ul li:has(a.on)").nextAll()
        .map(function() {
            return $(this).children("a").attr("href");
        }).get();
    chrome.runtime.sendMessage({ pages: links, requestType: "openWebtoonsReading" });
}

function scrollWebtoon() {
    $('.viewer_lst .viewer_img img')
        .each(function() {
            this.src = $(this).data('url');
        });
}
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch (request.requestType) {
            case "startPrompt":
                runPrompt();
                break;
            case "startPromptDraggable":
                setupOverlays(request.titleOrder);
                break;
            case "openNextChapters":
                openNext10Chapters();
                break;
            case "fillWebtoonOverlayInputs":
                editOverlayInputs(true);
                break;
            case "clearWebtoonOverlayInputs":
                editOverlayInputs(false);
                break;
            case "scrollWebtoon":
                scrollWebtoon();
                break;
        }
    }
);