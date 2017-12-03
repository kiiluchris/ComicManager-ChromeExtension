import {importData, exportData} from './file';

(() => {
  document.querySelector('button#import')
    .addEventListener('click', () => {
      importData().catch(console.error);
    });
  document.querySelector('button#export')
    .addEventListener('click', () => {
      exportData().catch(console.error);
    });
})();