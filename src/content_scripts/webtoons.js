'use strict';

import 'jquery-ui/ui/widgets/sortable';
import {getWebtoonDate} from '../shared';

function getWebtoonDateByOffset(offset = 0){
  return getWebtoonDate(offset)
    .format('MMM D, YYYY');
}

function setupOverlays({titleOrder, offset = 0}) {
  var list = "ul#_webtoonList";
  let listItems = "li:has(.txt_ico_up)"; 
  if(offset > 0){
    listItems = `li:has(span.update:contains("${getWebtoonDateByOffset(offset)}"))`;
  }
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
      let remainingItems = [];
      $.each(todayComics, function() {
        let i = titleOrder.findIndex((el) => el.link === this.querySelector('a').href);
        if (~i) {
          $(this).addClass('overlay-input-selected');
          sortedItems[titleOrder.length - i] = this;
        } else {
          remainingItems.unshift(this);
        }
        $(this).remove();
      })
      $.each(remainingItems.concat(sortedItems), function() {
        if (this){
          $(list).prepend(this);
        }
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
        data: {
          todayComics: items,
          offset
        },
        requestType: "hasWebtoonDraggable"
      }, removeOverlay);
    });
    exit.on("click", removeOverlay);
    div.append(input, svg);
    div.find("." + overLaySpans).append(send, exit);
    todayComics.append(div);
    $.each(todayComics, function() {
      if ($(this).hasClass('overlay-input-selected')) {
        this.querySelector('label.check').click();
      }
    })
    webtoonList.sortable({
      items: listItems
    });
    
    chrome.runtime.sendMessage({ requestType: "closeWindow" });
    
    function removeOverlay(e) {
      webtoonList.sortable('destroy');
      webtoonList.find(listOverlays).remove();
    }
  }
}

function editOverlayInputs(selectAll) {
  let selector = ":has(input:checked)";
  if(selectAll){
    selector = ":not("+selector+")";
  }
  $("ul#_webtoonList li:has(.txt_ico_up) div.overlay"+selector+" label.check")
    .trigger("click");
}

function openNextChapters({numOfChapters}) {
  var links = $("div#topEpisodeList .episode_cont ul li:has(a.on)").nextAll()
  .map(function() {
    return $(this).children("a").attr("href");
  }).get();
  chrome.runtime.sendMessage({  
    requestType: "openWebtoonsReading",
    data: {
      urls: links, 
      numOfChapters
    }
  });
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
      case "startPromptDraggable":
      case "startPromptDraggableYesterday":
      setupOverlays(request.data);
      break;
      case "openNextChaptersWebtoons":
      openNextChapters(request.data);
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