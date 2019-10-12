import '../css/app.css';
import './novelupdates';
import './webtoons';
import { checkBoxMonitor } from './novelupdates'
import { browser } from 'webextension-polyfill-ts'

window.addEventListener('keyup', async function (e) {
  if (e.key === "E" && e.ctrlKey && e.shiftKey && window.location.href !== "chrome://extensions") {
    await browser.runtime.sendMessage({ requestType: "extensionTab" });
  }
});

const urlMatch: [RegExp, () => any][] = [
  [/novelupdates\.com\/series\/[^\/]+\//, checkBoxMonitor],
]
const match = urlMatch.find(([re]) => re.test(window.location.href))
match && match[1]()