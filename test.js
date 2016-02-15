var koa = require('koa');
var Throttler = require('./index');

var app = koa();

app
  .use(Throttler({rate: 100, chunk: 2, debug: 1}))
  .use(function *test(next){
    this.body = 'This is a big test string that will be throttled';
  });
  

app.listen(3000);