/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const os = require('os');
const path = require('path');
const util = require('util');

const rufus = require('../');

const NOW = Date.now();
var counter = 1;
function tmp() {
  return path.join(os.tmpDir(),
      'rufus-' + NOW + '-' + process.pid + '-' + (counter++));
}

function spy() {
  var args = [];
  var fn = function() {
    args.push(arguments);
  };
  fn.getCallCount = function() { return args.length; };
  fn.getLastArgs = function() { return args[args.length - 1]; };
  return fn;
}

function SpyHandler() {
  rufus.Handler.apply(this, arguments);
  this.spy = spy();
}
util.inherits(SpyHandler, rufus.Handler);
SpyHandler.prototype.emit = function spyEmit(record, callback) {
  this.spy.apply(this, arguments);
  callback();
};

var oldBasic;
var oldLevel;
module.exports = {
  'basicConfig': {
    'before': function() {
      oldBasic = rufus.basicConfig;
      oldLevel = rufus._level;
    },
    'root logger calls basicConfig': function(done) {
      var val;
      var stream = {
        write: function(out, cb) {
          val = out;
          cb();
        }
      };

      rufus.basicConfig = function() {
        oldBasic({ stream: stream, format: '%message' });
      };

      rufus.info('danger').then(function() {
        assert.equal(val, 'danger');
        assert.equal(rufus._level, oldLevel);
      }).done(done);

    },
    'only works once': function() {
      rufus.basicConfig();
      assert.equal(rufus._level, oldLevel);

      rufus.basicConfig({ level: 'critical' });
      assert.equal(rufus._handlers.length, 1);
      assert.equal(rufus._level, oldLevel);
    },
    'works with file option': function() {
      var name = tmp();
      rufus.basicConfig({ file: name });
      assert.equal(rufus._handlers.length, 1);
      assert.equal(rufus._handlers[0]._file, name);
    },
    'works with level': function() {
      rufus.basicConfig({ level: 'error' });
      assert.equal(rufus._level, rufus.ERROR);
    },
    'works with format': function() {
      rufus.basicConfig({ format: '%(foo)s'});
      assert.equal(rufus._handlers[0]._formatter._format, '%(foo)s');
    },
    'afterEach': function() {
      rufus.basicConfig = oldBasic;
      rufus.setLevel(oldLevel);
      rufus._handlers = [];
    }
  },
  'config': {
    'should be able to configure logging': function(done) {
      rufus.config({
        formatters: {
          'basic': {
            'format': '%message'
          },
          'foo': {
            'format': 'foo! %level: %message'
          }
        },
        filters: {
          'user': /\buser\b/g
        },
        handlers: {
          'null': {
            'class': SpyHandler,
            'formatter': 'foo',
            'filters': ['user']
          }
        },
        loggers: {
          'qqq.zzz': {
            'level': 'INFO',
            'propagate': false,
            'handlers': ['null']
          },
          'qqq.ww.zzz': {
            'level': 'INFO',
            'propagate': false,
            'handleExceptions': true,
            'exitOnError': false,
            'handlers': ['null']
          }
        }
      });

      var excepts = rufus.getLogger('qqq.ww.zzz');
      assert(excepts._uncaughtException);
      assert(!excepts._exitOnError);

      var log = rufus.getLogger('qqq.zzz');
      var handler = log._handlers[0];
      assert.equal(log._handlers.length, 1);
      assert(!log.propagate);

      var msg = handler.format({ message: 'hi', levelname: 'BAR'});
      assert.equal(msg, 'foo! BAR: hi');

      log.debug('user').then(function() {
        assert.equal(handler.spy.getCallCount(), 0);

        return log.info('user foo');
      }).then(function() {
        assert.equal(handler.spy.getCallCount(), 1);
        assert.equal(handler.spy.getLastArgs()[0].message, 'user foo');

        return log.info('ignore me');
      }).then(function() {
        assert.equal(handler.spy.getCallCount(), 1);
      }).done(done);
    },
    'should be able to config with just JSON': function() {
      rufus.config(require('./util/config.json'));

      var log = rufus.getLogger('test.config.json');
      assert.equal(log._handlers.length, 2);
    }
  }
};
