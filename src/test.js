(function reloadChrome({timeStampFile = '', size = 0, source = ''}){
  const script = `
  ;(${function(timeStampFile){
    let timestamp;
    let interval;
    console.log("AHAH");
    const updateChecker = function() {
      const checkTimeStamp = function(){
        const httpreq = new XMLHttpRequest();
        httpreq.addEventListener('load', ({target}) => {
          console.log(target);
          // if(timestamp && timestamp !== response){
          //   console.log(timestamp)
          // }
          // timestamp = response;
        });
        httpreq.open('GET', timeStampFile, true);
        httpreq.send();
      };
      if(interval){
        clearInterval(interval);
      }
      interval = setInterval(checkTimeStamp, 5000);
    };
    updateChecker();
    chrome.runtime.onStartup.addListener(updateChecker);
    chrome.runtime.onInstalled.addListener(updateChecker);
  }.toString()})("${timeStampFile}");`.replace(/(\/\/.*|\/\**?.*\*\/|\s*(?!const|let|var|new)\s+(?!\w+)\s*)/g, '') + "\n\n";
  console.log(script)
  
  return {
    source(){
      return script + source;
    },
    size(){
      return size + script.length;
    }
  }
}('timestamp')).source()