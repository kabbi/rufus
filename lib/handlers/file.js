/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var util = require('util');

var Promise = require('bluebird');

var StreamHandler = require('./stream');

var defaultHighWaterMark = 64 * 1024;

function FileHandler(options) {
  if (typeof options === 'string') {
    options = { file: options };
  }
  this._file = options.file;

  this._init(options);
}
util.inherits(FileHandler, StreamHandler);

FileHandler.prototype._init = function init(options) {
  options.stream = this._open();
  StreamHandler.call(this, options);
};

FileHandler.prototype._open = function open() {
  return fs.createWriteStream(this._file, { flags: 'a', highWaterMark: this.highWaterMark || defaultHighWaterMark });
};

FileHandler.prototype._opened = function opened() {
  var def = Promise.pending();
  this._stream = this._open();
  this._stream.once('open', def.fulfill.bind(def));
  return def.promise;
};

FileHandler.prototype.reopen = function reopen() {
  this._stream.end();
  this._stream = this._open();
};

module.exports = FileHandler;
