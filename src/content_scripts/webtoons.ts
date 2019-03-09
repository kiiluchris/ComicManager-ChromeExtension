'use strict';

import 'jquery-ui/ui/widgets/sortable';
import {webtoonDateFormatted} from '../shared';
import { webtoons } from '../../typings/webtoons';


const currentDateEl: HTMLSpanElement | null = document.querySelector('ul#_webtoonList span.update');

function setupOverlays(currentDate: string, {titleOrder, offset = 0}: webtoons.OverlayData) {
  var list = "ul#_webtoonList";
  // let listItems = "li:has(.txt_ico_up)"; 
  // if(offset > 0){
  const listItems = `li:has(span.update:contains("${webtoonDateFormatted(currentDate, offset)}"))`;
  // }
  var listOverlays = `${listItems} div.overlay`;
  if (jQuery(listOverlays).length === 0) {
    var overLaySpans = "overlay-spans";
    var spanButton = (text: string) => `<span>${text}</span>`;
    var webtoonList = jQuery(list);
    var todayComics = webtoonList.find(listItems);
    var input = jQuery(`<input type="checkbox">`);
    var send = jQuery(spanButton("open"));
    var exit = jQuery(spanButton("cancel"));
    var svg = jQuery(`
    <label for="check" class="check">
    <svg width="250" height="180" style="transform:scale(0.3);">
    <circle cx="125" cy="90" r="60" />
    <path d="M125 40V140" class="path1"></path>
    <path d="M75 90H175" class="path2"></path>
    </svg>    
    </label>`);
    var div = jQuery(`
    <div class="overlay">
    <div class="${overLaySpans}">
    </div>
    </div>
    `);
    if (titleOrder.length) {
      let sortedItems = new Array(titleOrder.length);
      let remainingItems: HTMLElement[] = [];
      $.each(todayComics, function() {
        let i = titleOrder.findIndex((el: webtoons.StorageEntry) => el.link === this.querySelector('a').href);
        if (~i) {
          jQuery(this).addClass('overlay-input-selected');
          sortedItems[titleOrder.length - i] = this;
        } else {
          remainingItems.unshift(this);
        }
        jQuery(this).remove();
      })
      $.each(remainingItems.concat(sortedItems), function() {
        if (this){
          jQuery(list).prepend(this);
        }
      })
      todayComics = jQuery(list).find(listItems);
    }
    //  &#10004; tick signx
    //  &#10006; x
    svg.on('click', function(_e){
      jQuery(this).toggleClass('selected');
      jQuery(this).siblings('input')[0].click();
    });
    send.on("click", function(_e) {
      var items = jQuery(`${list} ${listItems}`).filter(":has(input:checked)")
      .map(function() {
        return {
          title: jQuery(this).find(".subj span").text(),
          link: jQuery(this).find("a").attr("href"),
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
      if (jQuery(this).hasClass('overlay-input-selected')) {
        const label: HTMLInputElement = this.querySelector('label.check')
        label.click();
      }
    })
    webtoonList.sortable({
      items: listItems
    });
    
    chrome.runtime.sendMessage({ requestType: "closeWindow" });
    
    function removeOverlay(_e: any) {
      webtoonList.sortable('destroy');
      webtoonList.find(listOverlays).remove();
    }
  }
}

function editOverlayInputs(selectAll: boolean) {
  let selector = ":has(input:checked)";
  if(selectAll){
    selector = ":not("+selector+")";
  }
  jQuery("ul#_webtoonList li:has(.txt_ico_up) div.overlay"+selector+" label.check")
    .trigger("click");
}

function openNextChapters({numOfChapters}: webtoons.NextChapterData) {
  var links = jQuery("div#topEpisodeList .episode_cont ul li:has(a.on)").nextAll()
  .map(function() {
    return jQuery(this).children("a").attr("href");
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
  jQuery('.viewer_lst .viewer_img img')
    .each(function(_i, el: HTMLImageElement) {
      el.src = jQuery(el).data('url');
    });
  window.scroll(0, 0);
}

chrome.runtime.onMessage.addListener(
  function(request, _sender, sendResponse) {
    const currentDate = currentDateEl.innerText.split('\n')[1].trim();
    let res = null;
    switch (request.requestType) {
      case "startPromptDraggable":
      case "startPromptDraggableYesterday":
      setupOverlays(currentDate, request.data);
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
      case "getDateWebtoon":
      res = currentDate;
      break;
    }

    sendResponse(res)

    return true;
  }
);