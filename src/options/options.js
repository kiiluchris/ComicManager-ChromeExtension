import setupOptions from './index';


(() => {
  const res = {};
  for(let i = 0; i < 7; i++){
    res[i] = 'link'
  }
  const cleanupKeys = ['webtoonOrder', 'novels'];
  const filterKeys = {
    ...res
  }
  setupOptions({cleanupKeys, filterKeys});
})();
