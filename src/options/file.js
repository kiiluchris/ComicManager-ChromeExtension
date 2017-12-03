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
  const data = await getStorage(key);
  const blob = new Blob(
    [JSON.stringify(data, null, '\t')],
    {type: 'application/json'}
  );
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.setAttribute('href', url);
  el.setAttribute('download', 'data.json');
  el.click();
}


export async function importData(replaceData = true){
  const el = document.createElement('input');
  el.setAttribute('type', 'file');
  el.setAttribute('accept', '.json');
  el.click();
  el.addEventListener('change', function(){
    if(this.files.length){
      const reader = new FileReader();
      reader.addEventListener('load', function(){
        return (async (res) => {
          const data = cleanData(res, ['webtoonOrder', 'novels']);
          if(replaceData){
            await setStorage(data);
          } else {
            const dataInStorage = await getStorage();
            
            await setStorage(appendDataToObject(data, dataInStorage));
          }
        })(this.result).catch(console.error);
      });
      reader.readAsText(this.files[0]);
    }
  })
}
function appendDataToArray(arr, old){
  const result = old.slice();
  for(let i = 0; i < arr.length; i++){
    const item = arr[i];
    const oldItem = result[i];
    if(!haveSameType(item, oldItem)){
      result.push(item);
    } else if(typeof item === 'object' && typeof oldItem === 'object'){
      const appendFunc = (Array.isArray(item) && Array.isArray(oldItem)) ? 
        appendDataToArray : appendDataToObject;
      result[key] = appendFunc(item, oldItem);
    } else if(!result.includes(item)){
      result.push(item);
    }
  }

  return result;
}

function haveSameType(obj, obj2){
  return typeof obj === typeof obj2;
}

function appendDataToObject(data, old){
  const result = {...old};
  const keys = Object.keys(data);
  for(const key of keys){
    const currentNew = data[key];
    const currentOld = result[key];
    if(!haveSameType(currentNew, currentOld)){
      result[key] = currentNew;
    } else if(result.hasOwnProperty(key) && typeof currentNew === 'object' && typeof currentOld === 'object'){
      const appendFunc = (Array.isArray(currentNew) && Array.isArray(currentOld)) ? 
        appendDataToArray : appendDataToObject;
      result[key] = appendFunc(currentNew, currentOld);
    } else {
      result[key] = currentNew;
    }
  }

  return result;
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