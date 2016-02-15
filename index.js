var Readable = require('stream').Readable
var Stream = require('stream');
var delay = require('koa-delay');
var co = require('co');

module.exports = function (options) {
  options || (options = {});

  if (options.rate === undefined || !options.chunk === undefined) {
    throw new Error('missed rate and chunk option for Throttle');
  } else if (!options.rate || !options.chunk) {
    return function* throttler(next) {
      yield* next;
    };
  }

  return function* throttler(next) {
    yield* next;
    
    var that = this;
    var originalBody = that.body;

    function* throttleBody(originalBody) {
      // Create a new readable stream which I will slowly write the existing
      // body to. Throttling the response
      var s = new Readable();
      s._read = () => { };

      that.body = s;

      var start = 0;
      co(function* () {
        do {
          var part = originalBody.slice(start, start + options.chunk);
          s.push(part);
          // For debugging sending a new line will help as curl will show
          // the data coming over line by line
          if (options.debug) {
            s.push("\n");
          }
          start += options.chunk;
          yield delay(options.rate);
        } while (part.length);
        s.push(null);
      });
    }

    if (originalBody instanceof Stream) {
      console.log("Is Stream");
      originalBody = originalBody.toString();
      yield* throttleBody(originalBody);
    } else if (Buffer.isBuffer(originalBody)) {
      console.log("Is Buffer");
      originalBody = originalBody.toString();
      yield* throttleBody(originalBody);
    } else if ('string' == typeof originalBody) {
      console.log("Is String");
      yield* throttleBody(originalBody);
    } else {
      return;
    }

  };
};
