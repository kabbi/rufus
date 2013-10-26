/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const printf = require('./utils/printf');

const compileFormat = require('./utils/compileFormat');

//stay it still with options, in case i will add something
function Formatter(options) {
  if (typeof options === 'object') {
    if ('format' in options) {
      this._format = options.format;
    }
  } else if (typeof options === 'string') {
    this._format = options;
  }

  this._compiledFormat = compileFormat(this._format);
}


Formatter.prototype = {

  _format: '[%date] %-5level %logger - %message%n%er',


  format: function format(record) {
    var message = record.message,
      formatted = printf(message, record);

    record.message = formatted;
    formatted = this._compiledFormat(record);

    record.message = message;
    return formatted;
  }

};

module.exports = Formatter;
