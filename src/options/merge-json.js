function haveSameType(obj, obj2){
  return typeof obj === typeof obj2;
}

export function mergeJSONObjects(filterKeys={}){
  return (data, old) => {
    const result = {...old};
    const keys = Object.keys(data);
    for(const key of keys){
      const currentNew = data[key];
      const currentOld = result[key];
      if(!haveSameType(currentNew, currentOld)){
        result[key] = currentNew;
      } else if(result.hasOwnProperty(key) && typeof currentNew === 'object' && typeof currentOld === 'object'){
        const appendFunc = (Array.isArray(currentNew) && Array.isArray(currentOld)) ? 
          mergeArrays(key, filterKeys) : mergeJSONObjects(filterKeys);
        result[key] = appendFunc(currentNew, currentOld);
      } else {
        result[key] = currentNew;
      }
    }

    return result;
  }
}

function checkItemInArray({_key, key, item, arr}){
  let index;
  for(const subItem of item[_key]){
    for(let subIndex = 0; subIndex < arr.length; subIndex++){
      const subArr = arr[subIndex];                
      if(
        Array.isArray(subArr[_key]) &&
        ~(index = subArr[_key].findIndex(_r => _r[key] === subItem[key]))
      ){
        return {
          isInArray: true,
          subArr,
          subIndex
        };
      }
    }
  }

  return {
    isInArray: false,
  };
}


export function mergeArrays(_key = '', filterKeys ={}){
  const key = filterKeys[_key];

  return (arr, old) => {
    const result = old.slice();
    for(let i = 0; i < arr.length; i++){
      const item = arr[i];
      let hasChanged = false;
      if(
        typeof item === 'object' && 
        key !== undefined
      ){
        let index;
        if(!Array.isArray(item)){
          if(
            item[_key] !== undefined &&
            item[_key][key] !== undefined &&
            ~(index = result.findIndex(r => r[_key][key] === item[_key][key]))
          ){
            result[index] = mergeJSONObjects(filterKeys)(item, result[index]);
            hasChanged = true;         
          }  else if(
            item[key] !== undefined &&
            ~(index = result.findIndex(r => r[key] === item[key]))
          ){
            result[index] = mergeJSONObjects(filterKeys)(item, result[index]);
            hasChanged = true;
          } else if(item[_key] !== undefined && Array.isArray(item[_key])){
            const {isInArray, subArr, subIndex} = checkItemInArray({_key, key, item, arr: result});
            if(isInArray){
              const itemVal = item[_key].slice();
              delete item[_key];
              const subResVal = subArr[_key].slice();
              delete subArr[_key];
              const obj = mergeJSONObjects(filterKeys)(
                item, subArr
              );
              obj[_key] = mergeArrays(key, {[key]:key, ...filterKeys})(
                subResVal, itemVal
              ) 
              result[subIndex] = obj;
              hasChanged = true;
            }
          }
        } 
      }

      if(!hasChanged && !result.includes(item)){
        result.push(item);
      }
    }

    return result;
  };
}