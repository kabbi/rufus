/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');
const chalk = require('chalk');

const Handler = require('./handler');
const StreamHandler = require('./stream');
const LEVELS = require('../levels');

chalk.enabled = true;

const COLORS = {
  'VERBOSE': 'cyan',
  'DEBUG': 'blue',
  'INFO': 'green',
  'WARN': 'yellow',
  'ERROR': 'red',
  'CRITICAL': 'magenta'
};

function ConsoleHandler(options) {
  options = options || {};

  if('colorize' in options) {
    this._colorize = options.colorize;
  }
  options.stream = process.stdout;
  this._out = new StreamHandler(options);
  options.stream = process.stderr;
  this._err = new StreamHandler(options);
  Handler.apply(this, arguments);
}

util.inherits(ConsoleHandler, Handler);

ConsoleHandler.prototype._colorize = true;

ConsoleHandler.prototype.emit = function consoleEmit(record, callback) {
  var handler = (record.level >= LEVELS.WARN) ? this._err : this._out;
  handler.emit(record, callback);
};

ConsoleHandler.prototype.setFormatter = function setFormatter(formatter) {
  Handler.prototype.setFormatter.call(this, formatter);
  this._out.setFormatter(formatter);
  this._err.setFormatter(formatter);
};

const HandlerFormat = Handler.prototype.format;

ConsoleHandler.prototype.format = function format(record) {
  var formatted = HandlerFormat.call(this, record);
  if (this._colorize){
    formatted = chalk[COLORS[record.levelname]](formatted);
  }
  return formatted;
};

module.exports = ConsoleHandler;
