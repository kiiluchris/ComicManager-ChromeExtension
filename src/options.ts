import { setupOptionsListeners } from 'extension-kitchen-sink/import-export-storage';

(() => {
  const res: {[key: string]: string} = {};
  for(let i = 0; i < 7; i++){
    res[i] = 'link'
  }
  const cleanupKeys = ['webtoonOrder', 'novels'];
  const filterKeys = {
    ...res
  }

  setupOptionsListeners({cleanupKeys, filterKeys});
})();