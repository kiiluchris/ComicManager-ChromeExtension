import {importData, exportData} from './file';

(() => {
  const res = {};
  for(let i = 0; i < 7; i++){
    res[i] = 'link'
  }
  const cleanupKeys = ['webtoonOrder', 'novels'];
  const filterKeys = {
    ...res
  }
  document.querySelector('main button#import')
    .addEventListener('click', () => {
      importData({cleanupKeys, filterKeys}).catch(console.error);
    });
  document.querySelector('main button#export')
    .addEventListener('click', () => {
      exportData().catch(console.error);
    });
  document.querySelector('main button#merge')
    .addEventListener('click', () => {
      importData({cleanupKeys, filterKeys}, false).catch(console.error);
    });
})();