var Readable = require('stream').Readable;
var Stream = require('stream');
var delay = require('koa-delay');
var co = require('co');

module.exports = function(options) {
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

    var originalBody = this.body;
    var destination = null;

    function newReadable() {
      // Create a new readable stream which I will write the existing
      // body to. Throttling the response at the specified rate
      var r = new Readable();
      r._read = function() { };
      return r;
    }

    function* throttleString(str) {
      co(function* () {
        var start = 0;
        do {
          var part = str.slice(start, start + options.chunk);
          destination.push(part);
          // For debugging sending a new line will help as curl will show
          // the data coming over line by line
          if (options.debug) {
            destination.push("\n");
          }
          start += options.chunk;
          yield delay(options.rate);
        } while (part.length);
        destination.push(null);
      });
    }

    function* throttleBuffer(buffer) {
      var start = 0;
      var len = buffer.length;
      while (start < len) {
        var part = buffer.slice(start, start + options.chunk);
        destination.push(part);
        start += options.chunk;
        yield delay(options.rate);
      }
      destination.push(null);
    }

    function* throttleStream(stream) {
      co(function* () {
        var buf;
        stream.on('data', function(c) {
          buf = buf ? Buffer.concat([buf, c], buf.length + c.length) : c;
        });
        yield function(done) {
          stream.on('end', done);
        };
        if (buf) {
          yield throttleBuffer(buf);
        }
        destination.push(null);
      });
    }

    if (originalBody instanceof Stream) {
      // Only set body if required
      this.body = destination = newReadable();
      yield throttleStream(originalBody);
    } else if (Buffer.isBuffer(originalBody)) {
      // Only set body if required
      this.body = destination = newReadable();
      co(function* () {
        yield throttleBuffer(originalBody);
      });
    } else if ('string' == typeof originalBody) {
      // Only set body if required
      this.body = destination = newReadable();
      yield throttleString(originalBody);
    } else {
      // This should never happen as Koa's this.body should be either a string,
      // Buffer, or Stream
      // https://github.com/koajs/koa/blob/master/lib/application.js#L218
      return;
    }
  };
};
