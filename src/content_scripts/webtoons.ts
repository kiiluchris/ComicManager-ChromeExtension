'use strict';

import Sortable from 'sortablejs'
// import 'jquery-ui/ui/widgets/sortable';
import { webtoonDateFormatted, noOp } from '../shared';
import { webtoons } from '../../typings/webtoons';
import { browser } from 'webextension-polyfill-ts'



interface OverlayElements {
    exit: JQuery<HTMLSpanElement>;
    send: JQuery<HTMLSpanElement>;
    svg: JQuery<HTMLLabelElement>;
    div: JQuery<HTMLDivElement>;
}


function setupOverlaysElements(overLaySpans: string): OverlayElements {
    const spanButton = (text: string) => `<span>${text}</span>`;
    const input = jQuery(`<input type="checkbox">`);
    const send: JQuery<HTMLSpanElement> = jQuery(spanButton("open"));
    const exit: JQuery<HTMLSpanElement> = jQuery(spanButton("cancel"));
    const svg: JQuery<HTMLLabelElement> = jQuery(`
  <label for="check" class="check">
    <svg width="250" height="180" style="transform:scale(0.3);">
      <circle cx="125" cy="90" r="60" />
      <path d="M125 40V140" class="path1"></path>
      <path d="M75 90H175" class="path2"></path>
    </svg>    
  </label>
  `);
    const div: JQuery<HTMLDivElement> = jQuery(`
  <div class="overlay">
    <div class="${overLaySpans}">
    </div>
  </div>
  `);

    div.append(input, svg);
    div.find("." + overLaySpans).append(send, exit);

    return {
        div,
        exit,
        svg,
        send
    }
}

interface Destroyable {
    destroy(): void;
}

function removeOverlay(
    listParent: string,
    getWebtoonList: (selector: string) => JQuery<HTMLElement>,
    sortable: Destroyable
) {
    return (_e?: Event) => {
        const webtoonList = getWebtoonList(listParent);
        sortable.destroy();
        const sortClass = 'a-sortable';
        webtoonList.find('li.' + sortClass).removeClass(sortClass);
        webtoonList.find('div.overlay').remove();
    }
}

function setupOverlaysEvents(
    comicSelector: string,
    listParent: string,
    offset: number, { exit, svg, send }: OverlayElements,
    sortable: Destroyable
) {
    const getWebtoonList = (selector: string) => jQuery(selector)
    exit.on("click", removeOverlay(listParent, getWebtoonList, sortable));
    //  &#10004; tick signx
    //  &#10006; x
    svg.on('click', function(_e) {
        this.classList.toggle('selected');
        jQuery(this).siblings('input')[0].click();
    });
    send.on("click", function(_e) {
        const items = getWebtoonList(comicSelector).filter(":has(input:checked)")
            .map((i, el) => ({
                title: el.querySelector<HTMLSpanElement>(".subj span")!!.innerText,
                link: el.querySelector("a")!!.href,
            })).get();
        browser.runtime
            .sendMessage({
                data: {
                    todayComics: items,
                    offset
                },
                requestType: "hasWebtoonDraggable"
            })
            .then((isOrderSaved) => {
                removeOverlay(listParent, getWebtoonList, sortable)()
                if (!isOrderSaved) {
                    alert('Webtoon Order has not been persisted')
                }
            })
            .catch(console.error);
    });
}

function setupOverlaySelectLabel(comicEl: HTMLElement) {
    comicEl.classList.toggle('overlay-input-selected')
    const label = comicEl.querySelector<HTMLElement>('label.check')
    label?.click();
}

function setupOverlaysAutoSort(comicSelector: string, titleOrder: webtoons.StorageEntry[]) {
    const todayComics = jQuery(comicSelector)
    let unsortedIndex = Math.min(titleOrder.length, todayComics.length)
    let sortedComics = [...todayComics]
    if (titleOrder.length > 0) {
        sortedComics = sortedComics.reduce((acc, comicEl) => {
            const comicLink = comicEl.querySelector('a')!!.href
            const i = titleOrder.findIndex((el) => el.link === comicLink);
            const forwardI = ~i ? i : unsortedIndex++
            ~i && setupOverlaySelectLabel(comicEl)
            // const reverseI = todayComics.length - forwardI
            acc[forwardI] = comicEl
            comicEl.remove()
            return acc
        }, new Array(todayComics.length))
    }

    const listContainer = document.querySelector("ul#_webtoonList")
    listContainer?.prepend(...sortedComics.filter(c => c))
}

async function setupOverlays(currentDate: string, { titleOrder = [], offset = 0 }: webtoons.OverlayData) {
    const dateFormatted = webtoonDateFormatted(currentDate, offset)
    const list = "ul#_webtoonList";
    const listItems = `li:has(span.update:contains("${dateFormatted}"))`;
    const listItemsAll = 'li.a-sortable'
    const comicSelector = [
        list,
        listItems
    ].join(' ')
    const listOverlays = `${listItems} div.overlay`;
    const overLaySpans = "overlay-spans";

    if (jQuery(listOverlays).length !== 0) return

    const webtoonList = jQuery(list);

    const sortable = Sortable.create(webtoonList[0], {
        draggable: listItemsAll,
    })
    const { div, exit, send, svg } = setupOverlaysElements(overLaySpans)
    setupOverlaysEvents(comicSelector, list, offset, {
        div,
        send,
        exit,
        svg
    }, sortable)
    let todayComics = webtoonList.find(listItems);
    todayComics.append(div);
    todayComics.addClass('a-sortable');

    setupOverlaysAutoSort(comicSelector, titleOrder);
    todayComics = jQuery(list).find(listItems);

    await browser.runtime.sendMessage({ requestType: "closeWindow" });
}

function editOverlayInputs(selectAll: boolean) {
    let selector = ":has(input:checked)";
    if (selectAll) {
        selector = ":not(" + selector + ")";
    }
    jQuery("ul#_webtoonList li div.overlay" + selector + " label.check")
        .trigger("click");
}

async function openNextChapters({ numOfChapters }: webtoons.NextChapterData) {
    const links = jQuery("div#topEpisodeList .episode_cont ul li:has(a.on)").nextAll()
        .map(function() {
            return jQuery(this).children("a").attr("href");
        }).get();
    await browser.runtime.sendMessage({
        requestType: "openWebtoonsReading",
        data: {
            urls: links,
            numOfChapters
        }
    });
}

function scrollWebtoon() {
    document.querySelectorAll<HTMLImageElement>('.viewer_lst .viewer_img img')
        .forEach((el) => {
            el.src = el.dataset.url!!;
        });
    window.scroll(0, 0);
}

function getComicOffset() {
    const nStr = prompt('Give the comic offset')
    const n = parseInt(nStr || '', 10)
    const offset = isNaN(n) ? 0 : n
    return offset
}


function mkRunIfDateElementExists() {
    const currentDateEl: HTMLSpanElement | null = document.querySelector('ul#_webtoonList span.update');
    return <T>(fn: (el: string) => T) => {
        const currentDate = currentDateEl?.innerText.split('\n')[1].trim();
        return currentDate ? fn(currentDate) : undefined;
    };
}
const runIfDateElementExists = mkRunIfDateElementExists();

browser.runtime.onMessage.addListener(
    function(request, _sender) {
        switch (request.requestType) {
            case "startPromptDraggable":
            case "startPromptDraggableYesterday":
                return runIfDateElementExists((currentDate) =>
                    setupOverlays(currentDate, request.data)
                        .then(noOp)
                );
            case "openNextChaptersWebtoons":
                return openNextChapters(request.data)
                    .then(noOp);
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
                return runIfDateElementExists((currentDate) =>
                    Promise.resolve(currentDate)
                );
            case "startPromptDraggableNOffset":
                return Promise.resolve(getComicOffset());
        }
    }
);
