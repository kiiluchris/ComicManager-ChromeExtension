const fs = require('fs');
const path = require('path');

module.exports = class WebpackChromeReloader {
  constructor({bgScript, timeStampFile = 'timestamp.txt', deleteTimestamp = false}){
    this.bgScript = bgScript;
    this.timeStampFile = timeStampFile;
    this.deleteTimestamp = deleteTimestamp;
  }

  apply(compiler){
    if(this.deleteTimestamp){
      const tPath = path.join(compiler.options.output.path, this.timeStampFile);
      return fs.existsSync(tPath) && fs.unlinkSync(tPath);
    }

    compiler.plugin('emit', (compilation, cb) => {
      const date = new Date().toString();
      compilation.assets[this.timeStampFile] = {
        source(){
          return date;
        },
        size(){
          return date.length;
        }
      };
      const bgAsset = compilation.assets[this.bgScript];
      if(bgAsset){
        Object.assign(compilation.assets[this.bgScript], reloadChrome({
          timeStampFile: this.timeStampFile, 
          size: bgAsset.size(), 
          source: bgAsset.source()
        }));
      }
      cb();
    });
  }
};

function reloadChrome({timeStampFile = '', size = 0, source = ''}){
  const script = `
  ;(${function(timeStampFile){
    let timestamp;
    let interval;
    const updateChecker = function() {
      const checkTimeStamp = function(){
        const httpreq = new XMLHttpRequest();
        httpreq.addEventListener('load', (e) => {
          const {response} = e.target;
          if(timestamp && timestamp !== response){
            chrome.runtime.reload();
          }
          timestamp = response;
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
}
// compiler.plugin('emit', function(compilation, callback) {
//   // Create a header string for the generated file:
//   var filelist = 'In this build:\n\n';

//   // Loop through all compiled assets,
//   // adding a new line item for each filename.
//   for (var filename in compilation.assets) {
//     filelist += ('- '+ filename +'\n');
//   }

  
//   // Insert this list into the Webpack build as a new file asset:
//   compilation.assets['filelist.md'] = {
//     source: function() {
//       return filelist;
//     },
//     size: function() {
//       return filelist.length;
//     }
//   };

//   callback();
// });