import { browser } from 'webextension-polyfill-ts'

function checkBoxMonitorEvent(element: HTMLAnchorElement, checkbox: HTMLInputElement) {
  return async (e: MouseEvent) => {
    e.preventDefault();
    checkbox.click();

    const wayback = e.shiftKey;
    const requestType = wayback ? "novelUpdatesOpenPageWayback" : "novelUpdatesOpenPage"
    await browser.runtime.sendMessage({
      data: {
        url: element.href,
        save: !e.ctrlKey,
        wayback
      },
      requestType
    });

    const $unclickedLinks = $('table#myTable tbody tr[style].newcolorme a.chp-release');
    if (!document.querySelector('.sttitle a')) {
      setTimeout(() => window.location.reload(), 1000);
    } else if ($unclickedLinks.length === 0) {
      openNextPage();
    }
  }
}

export function checkBoxMonitor() {
  const checkboxes: NodeListOf<HTMLInputElement> = document.querySelectorAll("table#myTable td input");
  const elements: NodeListOf<HTMLAnchorElement> = document.querySelectorAll("table#myTable td a.chp-release");
  elements.forEach((element, i) => {
    element.addEventListener("click", checkBoxMonitorEvent(element, checkboxes[i]));
  })
}

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
  window.addEventListener("keyup", async function (e) {
    if (!e.ctrlKey || finishedMonitoring) return
    if (e.key === "ArrowUp") {
      await browser.runtime.sendMessage({
        requestType: "novelUpdatesOpenParent",
        data: options
      });
      return
    }
    finishedMonitoring = true
    if (e.key === "ArrowRight") {
      await browser.runtime.sendMessage({
        requestType: options.parent.id ? "novelUpdatesBGNext" : "novelUpdatesRemoveFromStore",
        data: options
      });
    } else if (e.key === "ArrowLeft") {
      await browser.runtime.sendMessage({
        requestType: "novelUpdatesRemoveFromStore",
        data: options
      });
    }
  });
}


function monitorNovelUpdatesUserscriptListener(options: novelupdates.ReqData, extensionName: string) {
  window.postMessage({
    extension: extensionName,
    status: "complete"
  }, window.location.href);
  window.addEventListener("message", async ({ data: { extension, url, message } }: UserScriptReq) => {
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
      }, () => { }]
    };
    const messageHandlerArgs = messageHandlerArgsObj[message]
    if (extension === extensionName && messageHandlerArgs) {
      await browser.runtime.sendMessage(messageHandlerArgs[0])
        .then(messageHandlerArgs[1]);
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
    el.addEventListener('click', async function (e) {
      e.preventDefault();
      await browser.runtime.sendMessage({
        requestType: "replaceMonitorNovelUpdatesUrl",
        data: { ...options, url: this.href }
      });
    })
  })

  monitorNovelUpdatesControls(options)
  monitorNovelUpdatesUserscriptListener(options, extensionName)
}

async function novelUpdatesUINext(options: novelupdates.StorageEntry) {
  const $nextChapterLink = $('table#myTable tbody tr[style].newcolorme a.chp-release').last();
  if ($nextChapterLink.length === 0) {
    openNextPage();
  } else {
    $nextChapterLink[0].dispatchEvent(new MouseEvent('click', {
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
        return novelUpdatesUINext(request.data);
    }
  }
);
