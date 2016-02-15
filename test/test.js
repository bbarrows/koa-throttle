var Readable = require('stream').Readable
var koa = require('koa');
var route = require('koa-route');
var Throttler = require('../index');

var app = koa();

app
  .use(Throttler({rate: 100, chunk: 2, debug: 1}))
  .use(route.get('/string', function *list() {
    this.body = 'This is a big test string that will be throttled';
  }))
  .use(route.get('/buffer', function *list() {
    this.body = new Buffer('This is a big test string that will be throttled');
  }))
  .use(route.get('/stream', function *list() {
    var r = new Readable();
    r._read = () => { };
    r.push("Start ");
    this.body = r;
    r.push(" BEFORE ");
    r.push(null);
  }));
  

app.listen(3000);