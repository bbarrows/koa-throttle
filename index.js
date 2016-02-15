var Readable = require('stream').Readable
var Stream = require('stream');
var delay = require('koa-delay');
var co = require('co');

function streamToString(stream, cb) {
  var all = [];
  stream.on('data', (c) => {
    all.push(c);
  });
  stream.on('end', () => {
    cb(all.join(''));
  });
}

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
      // Create a new readable stream which I will write the existing
      // body to. Throttling the response at the specified rate
      var r = new Readable();
      r._read = () => {
      };

      that.body = r;

      var start = 0;
      co(function* () {
        do {
          var part = originalBody.slice(start, start + options.chunk);
          r.push(part);
          // For debugging sending a new line will help as curl will show
          // the data coming over line by line
          if (options.debug) {
            r.push("\n");
          }
          start += options.chunk;
          yield delay(options.rate);
        } while (part.length);
        r.push(null);
      });
    }

    if (originalBody instanceof Stream) {
      streamToString(originalBody, (s) => {
        co(function *() {
          yield throttleBody(s);
        });
      });
    } else if (Buffer.isBuffer(originalBody)) {
      originalBody = originalBody.toString();
      yield throttleBody(originalBody);
    } else if ('string' == typeof originalBody) {
      yield throttleBody(originalBody);
    } else {
      // This should never happen as Koa's this.body should be either a string,
      // Buffer, or Stream
      // https://github.com/koajs/koa/blob/master/lib/application.js#L218
      return;
    }

  };
};
