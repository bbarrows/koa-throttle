# koa-throttle
===============
Using the Koa framework, throttle the body of a response by specifying the rate or delay and chunk size. 

## Install



## Usage

```js
var koa = require('koa');
var Throttler = require('koa-throttle');

var app = koa();

app
  .use(Throttler({rate: 100, chunk: 2, debug: 1}))
  .use(function *test(next){
    this.body = 'This is a big test string that will be throttled';
  });
  

app.listen(3000);
```

## Options

* **rate**: the delay in milliseconds to wait before writing to the response
* **chunk**: the number of bytes to write to the response stream every rate number of milliseconds
* **debug**: If evalutes to true then a new line will be sent after each chunk of data written to the response so that you can see the data coming in if testing with curl. Default is false

## Testing
Run:
```cd test; node test.js```
Then to see the data throttled flow in:
```
curl http://localhost:3000/string
curl http://localhost:3000/buffer
curl http://localhost:3000/stream 
```

