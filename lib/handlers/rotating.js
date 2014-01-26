/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var util = require('util');

var Promise = require('bluebird');

var rename = Promise.promisify(fs.rename);
var stat = Promise.promisify(fs.stat);
var unlink = Promise.promisify(fs.unlink);

var BaseRotatingFileHandler = require('./base-rotating');

function bytes(n) {
  var b = 0;

  var map = {
    b: 1,
    kb: 1 << 10,
    mb: 1 << 20,
    gb: 1 << 30
  };

  n.replace(/(\d+)(gb|mb|kb|b)/g, function(_, size, unit) {
    b += map[unit] * parseInt(size, 10);
    return _;
  });
  return b;
}

function RotatingFileHandler(options) {
  BaseRotatingFileHandler.call(this, options);
  if(typeof options.maxSize === 'string') {
    options.maxSize = bytes(options.maxSize);
  }
  this._maxSize = options.maxSize;
  this._maxFiles = options.maxFiles;
}
util.inherits(RotatingFileHandler, BaseRotatingFileHandler);

RotatingFileHandler.prototype.shouldRotate = function (record) {
  var that = this;
  return this._getSize().then(function (size) {
    return size + Buffer.byteLength(that.format(record)) > that._maxSize;
  });
};


RotatingFileHandler.prototype._getSize = function () {
  if (this._size === undefined) {
    var that = this;
    return stat(this._file).then(function (stat) {
      return that._size = stat.size;
    });
  } else {
    return Promise.fulfilled(this._size);
  }
};


RotatingFileHandler.prototype.rotate = function _rotate() {
  var that = this;
  // rufus.log
  // rufus.log.1
  // rufus.log.2
  this._stream.end();
  return this._rename().then(function () {
    return that._opened().then(function () {
      that._size = 0;
    });
  });
};

RotatingFileHandler.prototype._fileFormat = function(file) {
  return file + '.%i';
};

RotatingFileHandler.prototype._write = function write(record, callback) {
  this._size += Buffer.byteLength(this.format(record));
  BaseRotatingFileHandler.prototype._write.apply(this, arguments);
};

RotatingFileHandler.prototype._rename = function _rename(num) {
  var name = this._file;
  num = num || 0;
  var newName = this.fileNameFormat({ i: num + 1 });
  if (num) {
    name += '.' + num;
  }
  if (this._maxFiles && num + 1 >= this._maxFiles) {
    return unlink(name);
  }
  var that = this;
  var def = Promise.pending();
  fs.exists(newName, def.fulfill.bind(def));
  return def.promise.then(function (exists) {
    if (exists) {
      return that._rename(num + 1);
    }
  }).then(function () {
    return rename(name, newName);
  });
};

module.exports = RotatingFileHandler;
