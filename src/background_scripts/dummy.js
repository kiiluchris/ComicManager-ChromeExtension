module.exports = {
  storage: {
    local: {
      get(key, fn){
        fn({
          novels: {
            lol: [{
              url: "url",
              time: 345,
              wayback: true,
              page: "page"
            }]
          }
        })
      }
    }
  }
}