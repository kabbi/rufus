/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const chalk = require('chalk');
const printf = require('./utils/printf');

const compileFormat = require('./utils/compileFormat');

chalk.enabled = true;

function Formatter(options) {
  if (typeof options === 'object') {
    if ('format' in options) {
      this._format = options.format;
    }
    if ('colorize' in options) {
      this._colorize = options.colorize;
    }
  } else if (typeof options === 'string') {
    this._format = options;
  }

  this._compiledFormat = compileFormat(this._format);
}


const COLORS = {
  'VERBOSE': 'cyan',
  'DEBUG': 'blue',
  'INFO': 'green',
  'WARN': 'yellow',
  'ERROR': 'red',
  'CRITICAL': 'magenta'
};

Formatter.prototype = {

  _format: '[%date] %-5level %logger - %message%n%er',

  _colorize: false,

  format: function format(record) {
    var message = record.message,
      formatted = printf(message, record);

    record.message = formatted;
    formatted = this._compiledFormat(record);

    if (this._colorize) {
      formatted = chalk[COLORS[record.levelname]](formatted);
    }

    record.message = message;
    return formatted;
  }

};

module.exports = Formatter;
