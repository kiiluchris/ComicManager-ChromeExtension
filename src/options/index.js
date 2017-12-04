import {importData, exportData} from './extension';

const setupOptionsListeners = ({cleanupKeys, filterKeys}) => {
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
};

export default setupOptionsListeners;