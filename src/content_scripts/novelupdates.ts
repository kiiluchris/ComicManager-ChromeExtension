import { browser } from 'webextension-polyfill-ts'

function openNextPage() {
  const $currentPage = $("div.digg_pagination em.current:not(:first-child)");
  if ($currentPage.length !== 0) {
    setTimeout(() => {
      $currentPage.prev()[0].click();
    }, 2500)
  }
}


function monitorNovelUpdatesControls(options: novelupdates.ReqData) {
  let finishedMonitoring = false;
  enum MonitorKeysEnum {
    ArrowUp = 'ArrowUp',
    ArrowRight = 'ArrowRight',
    ArrowLeft = 'ArrowLeft'
  };
  type MonitorKeys = keyof typeof MonitorKeysEnum
  type MonitorKeyActions = {
    [key in MonitorKeys]: () => {
      requestType: string;
      data: any;
    }
  };
  const monitorKeyVals = [MonitorKeysEnum.ArrowLeft, MonitorKeysEnum.ArrowRight, MonitorKeysEnum.ArrowUp]
  const isMonitorKey = (key: string): boolean =>
    monitorKeyVals.includes(key as MonitorKeysEnum);

  window.addEventListener("keyup", function (e: KeyboardEvent) {
    if (!e.ctrlKey || finishedMonitoring || !isMonitorKey(e.key)) return
    const key = MonitorKeysEnum[e.key as MonitorKeys]
    const actions: MonitorKeyActions = {
      ArrowUp: () => ({
        requestType: "novelUpdatesOpenParent",
        data: options
      }),
      ArrowLeft: () => {
        finishedMonitoring = true
        return ({
          requestType: "novelUpdatesRemoveFromStore",
          data: options
        })
      },
      ArrowRight: () => {
        finishedMonitoring = true
        return ({
          requestType: options.parent.id ? "novelUpdatesBGNext" : "novelUpdatesRemoveFromStore",
          data: options
        })
      }
    }
    browser.runtime
      .sendMessage(actions[key]())
      .catch(console.error)
  });
}


function monitorNovelUpdatesUserscriptListener(options: novelupdates.ReqData, extensionName: string) {
  window.postMessage({
    extension: extensionName,
    status: "complete"
  }, window.location.href);
  window.addEventListener("message", ({ data: { extension, url, message } }: UserScriptReq) => {
    const messageHandlerArgsObj: UserScriptHandlerObj = {
      novelUpdatesSaveUrl: [{
        data: {
          url,
          save: true,
          wayback: options.wayback,
          parent: options.parent
        },
        requestType: "novelUpdatesOpenPageNext"
      }, () => {
        window.postMessage({
          extensionName,
          message: `Saved: ${url}`
        }, window.location.href);
      }],
      replaceMonitorNovelUpdatesUrl: [{
        requestType: "replaceMonitorNovelUpdatesUrl",
        data: { ...options, url }
      }, () => void 0]
    };
    const messageHandlerArgs = messageHandlerArgsObj[message]
    if (extension === extensionName && messageHandlerArgs) {
      browser.runtime.sendMessage(messageHandlerArgs[0])
        .then(messageHandlerArgs[1])
        .catch(console.error);
    }
  });
}

function monitorNovelUpdates(options: novelupdates.ReqData, extensionName: string) {
  const pageURL = window.location.href.replace(/#.*/, '');
  const linksToMonitor = [...document.querySelectorAll('a')]
    .filter(el =>
      el.href
      && el.href.startsWith('http')
      && el.href.replace(/#.*/, '') !== pageURL
    );
  linksToMonitor.forEach(el => {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      browser.runtime
        .sendMessage({
          requestType: "replaceMonitorNovelUpdatesUrl",
          data: { ...options, url: this.href }
        })
        .catch(console.error);
    })
  })

  monitorNovelUpdatesControls(options)
  monitorNovelUpdatesUserscriptListener(options, extensionName)
}

function novelUpdatesUINext(options: novelupdates.StorageEntry) {
  const nextChapterLink = nextUnclickedLink();
  if (noUnclickedLink(nextChapterLink)) {
    openNextPage();
  } else {
    nextChapterLink!!.link?.dispatchEvent(new MouseEvent('click', {
      shiftKey: !!options.wayback,
      ctrlKey: false,
      cancelable: true
    }));
  }
}

browser.runtime.onMessage.addListener(
  function (request, _sender) {
    switch (request.requestType) {
      case "monitorNovelUpdates":
        monitorNovelUpdates(request.data, request.extensionName);
        break;
      case "novelUpdatesUINext":
        return Promise.resolve(novelUpdatesUINext(request.data));
    }
  }
);


function checkBoxMonitorEvent(element: HTMLAnchorElement, checkbox: HTMLInputElement) {
  return (e: MouseEvent) => {
    e.preventDefault();
    checkbox.click();
    const wayback = e.shiftKey;
    const requestType = wayback ? "novelUpdatesOpenPageWayback" : "novelUpdatesOpenPage"
    browser.runtime
      .sendMessage({
        data: {
          url: element.href,
          save: !e.ctrlKey,
          wayback
        },
        requestType
      })
      .catch(console.error)
    const unclickedLink = nextUnclickedLink();
    if (!document.querySelector('.sttitle a')) {
      setTimeout(() => {
        novelListTableCells().length > 1
          ? window.location.reload()
          : openNextPage()
      }, 1000);
    } else if (noUnclickedLink(unclickedLink)) {
      openNextPage();
    }
  };
}

interface LinkAndCheckbox {
  checkbox?: HTMLInputElement;
  link?: HTMLAnchorElement;
}

function columnLinkAndCheckBox(column: HTMLTableDataCellElement): LinkAndCheckbox {
  const checkbox = column.querySelector<HTMLInputElement>("input")
  const result: LinkAndCheckbox = {};
  if(!checkbox) return result;
  result.checkbox = checkbox;
  const chapterId = checkbox.id.match(/(\d+)$/)
  if(!chapterId) return result;
  const link = column.querySelector<HTMLAnchorElement>(`a.chp-release[href*="${chapterId[1]}"]`)
  if(!link) return result
  result.link = link;
  return result;
}

function nextUnclickedLink(): LinkAndCheckbox | null {
  const column = [...document.querySelectorAll<HTMLTableDataCellElement>('table#myTable tbody tr[style].newcolorme td:nth-child(3)')]
    .slice(-1)
  return column.length ? columnLinkAndCheckBox(column[0]) : null;
}

function noUnclickedLink(link: LinkAndCheckbox | null){
  return link ? false : nextUnclickedLink() === null
}

function novelListTableCells(){
  return document.querySelectorAll<HTMLTableDataCellElement>(
    "table#myTable tr td:nth-child(3)"
  )
}

export function checkBoxMonitor() {
  novelListTableCells()
    .forEach(el => {
      const { checkbox, link } = columnLinkAndCheckBox(el)
      if (!link || !checkbox) return
      link.addEventListener("click", checkBoxMonitorEvent(link, checkbox));
    })
}
