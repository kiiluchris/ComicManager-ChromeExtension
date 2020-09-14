import '../css/app.css';
import './novelupdates';
import './webtoons';
import { checkBoxMonitor } from './novelupdates'
import { browser } from 'webextension-polyfill-ts'

window.addEventListener('load', _e => {
  const urlMatch: [RegExp, () => any][] = [
    [/novelupdates\.com\/series\/[^\/]+\//, checkBoxMonitor],
  ]
  const match = urlMatch.find(([re]) => re.test(window.location.href))
  match && match[1]()
})

