import { mergeJSONObjects } from "./merge-json";

function getStorage(key=''){
  return new Promise(res => {
    const args = key === '' ? [res] : [key, res];
    chrome.storage.local.get(...args);
  })
}

function setStorage(data){
  return new Promise(res => {
    chrome.storage.local.set(data, res);
  })
}

export async function exportData(key=''){
  return new Promise(async resolve => {
    const data = await getStorage(key);
    const blob = new Blob(
      [JSON.stringify(data, null, '\t')],
      {type: 'application/json'}
    );
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.setAttribute('href', url);
    el.setAttribute('download', 'data.json');
    el.addEventListener('click', resolve);
    el.click();
  }).then(window.close);
}

function cleanData(fileContents, keys = []){
  const src = JSON.parse(fileContents);
  let parsedData = {};
  for(const k of keys){
    if(src.hasOwnProperty(k)){
      parsedData[k] = src[k];
    }
  }

  return parsedData;
}

export async function importData({cleanupKeys=[], filterKeys={}}, isReplacingData = true){
  return new Promise(async resolve => {
    const el = document.createElement('input');
    el.setAttribute('type', 'file');
    el.setAttribute('accept', '.json');
    el.click();
    el.addEventListener('change', function(){
      if(this.files.length){
        const reader = new FileReader();
        reader.addEventListener('load', function(){
          return (async (res) => {
            const data = cleanData(res, cleanupKeys);
            if(isReplacingData){
              await setStorage(data);
            } else {
              const dataInStorage = await getStorage();
              await setStorage(mergeJSONObjects(filterKeys)(data, dataInStorage));
            }
          })(this.result).then(resolve).catch(console.error);
        });
        reader.readAsText(this.files[0]);
      }
    });
  }).then(window.close);
}