/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Console = require('console').Console;
const EE = require('events').EventEmitter;

const winston = require('winston');
const rufus = require('../');

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
//console.log = _console.log.bind(_console); //it is for log4js

const log4js = require('log4js');


rufus.addHandler(new rufus.handlers.Stream(stdout));

winston.add(winston.transports.File, { stream: stdout });
winston.remove(winston.transports.Console);

log4js = log4js.getLogger();

var Benchmark = require('benchmark');

var suite = new Benchmark.Suite('logging.info()');

suite
  .add('console.info', function() {
    _console.info('asdf');
  })
  .add('rufus.info', function() {
    rufus.log(rufus.INFO, 'asdf');
  })
  .add('winston.info', function() {
    winston.info('asdf');
  })
  .add('log4js.info', function() {
    log4js.info('asdf');
  })

suite
// add listeners
  .on('cycle', function (event) {
    console.warn(String(event.target));
  })
  .on('complete', function () {
    console.warn('Fastest is ' + this.filter('fastest').pluck('name'));
  })
// run async
  .run({ 'async': true });
