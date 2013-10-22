/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Console = require('console').Console;
const EE = require('events').EventEmitter;

const winston = require('winston');
const intel = require('../');
var log4js = require('log4js');

var stdout = new EE();
stdout.write = function (out, encoding, cb) {
  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }
  cb && cb();
  return true;
};

var _console = new Console(stdout, stdout);
intel.addHandler(new intel.handlers.Stream(stdout));

winston.add(winston.transports.File, { stream: stdout });
winston.remove(winston.transports.Console);

log4js.configure({
  appenders: [
    { type: 'file', filename: '/tmp/cheese.log', category: '[default]' }
  ]
});

log4js = log4js.getLogger();

module.exports = {
  'logging.info()': {
    'bench': {
      'console.info': function() {
        _console.info('asdf');
      },
      'intel.info': function() {
        intel.log(intel.INFO, 'asdf');
      },
      'winston.info': function() {
        winston.info('asdf');
      },
      'log4js.info': function() {
        log4js.info('asdf');
      }
    }
  }
};
