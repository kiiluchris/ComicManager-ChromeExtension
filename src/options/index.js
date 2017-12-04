import {importData, exportData, mergeJSONObjects} from './file';

(() => {
  const cleanupKeys = ['webtoonOrder', 'novels'];
  const filterKeys = {
    webtoonOrder: 'link'
  }
  const seededKeys = ['webtoonOrder'];
  document.querySelector('main button#import')
    .addEventListener('click', () => {
      importData({cleanupKeys, filterKeys, seededKeys}).catch(console.error);
    });
  document.querySelector('main button#export')
    .addEventListener('click', () => {
      exportData().catch(console.error);
    });
  document.querySelector('main button#merge')
    .addEventListener('click', () => {
      importData({cleanupKeys, filterKeys, seededKeys}, false).catch(console.error);
    });
})();